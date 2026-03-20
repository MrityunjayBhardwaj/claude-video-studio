/**
 * BPM detector using energy-based beat tracking.
 * Reads the WAV file, computes short-time energy, finds peaks, estimates BPM.
 */
import fs from 'fs';

const WAV = 'public/source_audio.wav';
const buf = fs.readFileSync(WAV);

// Parse WAV header
const sampleRate = buf.readUInt32LE(24);
const numChannels = buf.readUInt16LE(22);
const bitsPerSample = buf.readUInt16LE(34);
const dataOffset = 44; // standard PCM WAV
const numSamples = (buf.length - dataOffset) / (numChannels * bitsPerSample / 8);

console.log(`Audio: ${sampleRate}Hz, ${numChannels}ch, ${bitsPerSample}bit, ${(numSamples/sampleRate).toFixed(2)}s`);

// Read mono float samples (mix down channels)
const samples = new Float32Array(Math.floor(numSamples));
const bytesPerSample = bitsPerSample / 8;
const frameSize = numChannels * bytesPerSample;

for (let i = 0; i < samples.length; i++) {
  let sum = 0;
  for (let ch = 0; ch < numChannels; ch++) {
    const offset = dataOffset + i * frameSize + ch * bytesPerSample;
    if (bitsPerSample === 16) sum += buf.readInt16LE(offset) / 32768;
    else if (bitsPerSample === 32) sum += buf.readInt32LE(offset) / 2147483648;
  }
  samples[i] = sum / numChannels;
}

// Compute short-time energy in windows
const winSize = Math.round(sampleRate * 0.02); // 20ms windows
const hopSize = Math.round(sampleRate * 0.01); // 10ms hop
const energies = [];

for (let i = 0; i + winSize < samples.length; i += hopSize) {
  let e = 0;
  for (let j = 0; j < winSize; j++) e += samples[i + j] ** 2;
  energies.push(e / winSize);
}

// Onset strength: energy flux (positive differences)
const onset = energies.map((e, i) => i > 0 ? Math.max(0, e - energies[i - 1]) : 0);

// Smooth onsets
const smoothed = onset.map((v, i) => {
  if (i < 4 || i >= onset.length - 4) return v;
  return (onset[i-4] + onset[i-3] + onset[i-2] + onset[i-1] + v + onset[i+1] + onset[i+2] + onset[i+3] + onset[i+4]) / 9;
});

// Find peaks (local maxima above threshold)
const mean = smoothed.reduce((a, b) => a + b) / smoothed.length;
const threshold = mean * 2.5;
const peaks = [];
for (let i = 2; i < smoothed.length - 2; i++) {
  if (smoothed[i] > threshold &&
      smoothed[i] >= smoothed[i-1] && smoothed[i] >= smoothed[i+1] &&
      smoothed[i] >= smoothed[i-2] && smoothed[i] >= smoothed[i+2]) {
    peaks.push(i * hopSize / sampleRate); // time in seconds
  }
}

console.log(`Found ${peaks.length} onset peaks`);

// Compute inter-onset intervals and vote for BPM
const intervals = [];
for (let i = 1; i < peaks.length; i++) {
  const dt = peaks[i] - peaks[i-1];
  if (dt > 0.2 && dt < 2.0) intervals.push(dt); // 30–300 BPM range
}

// Build BPM histogram (1 BPM resolution)
const bpmBins = new Float32Array(400);
for (const dt of intervals) {
  const bpm = 60 / dt;
  // Also vote for musical multiples
  [1, 2, 0.5].forEach(mult => {
    const b = Math.round(bpm * mult);
    if (b >= 60 && b < 400) bpmBins[b]++;
  });
}

// Find peak BPM in typical EDM range 100–180
let bestBpm = 128, bestScore = 0;
for (let b = 100; b <= 180; b++) {
  if (bpmBins[b] > bestScore) { bestScore = bpmBins[b]; bestBpm = b; }
}

// Check half/double
if (bpmBins[Math.round(bestBpm / 2)] > bestScore * 0.8) bestBpm = Math.round(bestBpm / 2);
if (bpmBins[Math.round(bestBpm * 2)] > bestScore * 0.8) bestBpm = Math.round(bestBpm * 2);

// Refine with nearby BPMs
let bestFine = bestBpm;
let bestFineScore = 0;
for (let b = bestBpm - 5; b <= bestBpm + 5; b++) {
  const score = (bpmBins[b] || 0) + (bpmBins[b+1] || 0) * 0.5 + (bpmBins[b-1] || 0) * 0.5;
  if (score > bestFineScore) { bestFineScore = score; bestFine = b; }
}

console.log(`Detected BPM: ${bestFine}`);
console.log(`Frame duration at 30fps: ${(60 / bestFine * 30).toFixed(2)} frames/beat`);

// Output as JSON for the render script to consume
const result = {
  bpm: bestFine,
  framesPerBeat: 60 / bestFine * 30,
  durationSeconds: numSamples / sampleRate,
};
fs.writeFileSync('public/audio-analysis.json', JSON.stringify(result, null, 2));
console.log('Saved → public/audio-analysis.json');
