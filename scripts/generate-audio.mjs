import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '../public/beat.wav');

const SR = 44100;       // sample rate
const DURATION = 31;    // seconds (slight buffer)
const BPM = 128;
const BEAT = 60 / BPM; // 0.46875s per beat
const TOTAL = SR * DURATION;

const buf = new Float32Array(TOTAL);

const add = (start, len, fn) => {
  for (let i = 0; i < len; i++) {
    const idx = Math.floor(start) + i;
    if (idx >= 0 && idx < TOTAL) buf[idx] += fn(i / SR);
  }
};

// --- Kick drum: pitch-swept sine + sub boom ---
function kick(startSample, vol = 0.9) {
  add(startSample, SR * 0.22, (t) => {
    const freq = 160 * Math.exp(-t * 18) + 45;
    const env = Math.exp(-t * 12);
    const sub = Math.sin(2 * Math.PI * 45 * t) * Math.exp(-t * 5);
    return vol * (Math.sin(2 * Math.PI * freq * t) * env + sub * 0.4);
  });
}

// --- Snare: tonal + filtered noise ---
function snare(startSample, vol = 0.55) {
  add(startSample, SR * 0.18, (t) => {
    const env = Math.exp(-t * 22);
    const tone = Math.sin(2 * Math.PI * 185 * t) * 0.3;
    // Pseudo-noise via high-freq oscillator mix
    const noise = (Math.sin(2 * Math.PI * 3700 * t) + Math.sin(2 * Math.PI * 5300 * t + 1.4) + Math.sin(2 * Math.PI * 8100 * t + 2.8)) / 3;
    return vol * (tone + noise * 0.7) * env;
  });
}

// --- Open hi-hat: high sine mix ---
function openHat(startSample, vol = 0.18, decay = 0.06) {
  add(startSample, SR * decay * 3, (t) => {
    const env = Math.exp(-t / decay);
    const n = Math.sin(2 * Math.PI * 7200 * t + 0.3) + Math.sin(2 * Math.PI * 9800 * t + 1.1) + Math.sin(2 * Math.PI * 12300 * t);
    return vol * (n / 3) * env;
  });
}

// --- Closed hi-hat ---
function closedHat(startSample, vol = 0.14) {
  openHat(startSample, vol, 0.012);
}

// --- Synth bass: saw-ish ---
function bass(startSample, durSec, freq = 80, vol = 0.35) {
  add(startSample, SR * durSec, (t) => {
    const attack = Math.min(1, t * 40);
    const release = Math.max(0, 1 - (t - durSec + 0.06) * 25);
    const env = attack * release;
    const wave = Math.sin(2 * Math.PI * freq * t) + 0.5 * Math.sin(2 * Math.PI * freq * 2 * t) + 0.25 * Math.sin(2 * Math.PI * freq * 3 * t);
    return vol * (wave / 1.75) * env;
  });
}

// --- Stab synth: bright chord hit ---
function stab(startSample, vol = 0.28) {
  const freqs = [220, 277, 330, 415]; // Am chord
  add(startSample, SR * 0.12, (t) => {
    const env = Math.exp(-t * 18);
    const wave = freqs.reduce((s, f) => s + Math.sin(2 * Math.PI * f * t), 0) / freqs.length;
    return vol * wave * env;
  });
}

// --- Pad: soft atmospheric ---
function pad(startSample, durSec, vol = 0.12) {
  const freqs = [110, 165, 220, 277];
  add(startSample, SR * durSec, (t) => {
    const attack = Math.min(1, t * 2);
    const release = Math.max(0, 1 - (t - durSec + 0.5) * 2);
    const env = attack * release;
    const wave = freqs.reduce((s, f) => s + Math.sin(2 * Math.PI * f * t + Math.sin(2 * Math.PI * 0.3 * t) * 0.3), 0) / freqs.length;
    return vol * wave * env;
  });
}

// ============================================================
// PATTERN: 128 BPM, 4/4, 8-bar loop
// ============================================================
const totalBeats = Math.floor(DURATION / BEAT);
const sixteenth = BEAT / 4;

// Bass note pattern (per bar = 4 beats)
const bassNotes = [80, 80, 90, 80, 75, 80, 85, 80]; // cycling root notes

for (let beat = 0; beat < totalBeats; beat++) {
  const t = beat * BEAT * SR;
  const barPos = beat % 4;  // position within 4/4 bar
  const bar = Math.floor(beat / 4);

  // === KICK === 4-on-the-floor with extra 16th kicks for energy
  kick(t);
  if (barPos === 1 || barPos === 3) {
    // Extra off-beat kick on the e of 2 and 4 (16th note before snare) - for extra energy
    kick(t + sixteenth * SR, 0.5);
  }

  // === SNARE === on beats 2 and 4
  if (barPos === 1 || barPos === 3) snare(t);

  // === HI-HATS === 8th notes + 16th note fill on every other beat
  closedHat(t);
  closedHat(t + sixteenth * 2 * SR); // off-beat 8th
  if (barPos % 2 === 1) {
    // 16th note flurry for energy
    closedHat(t + sixteenth * SR * 1, 0.10);
    closedHat(t + sixteenth * SR * 3, 0.10);
  }
  // Open hat on off-beats of bar pos 0 and 2
  if (barPos === 0 || barPos === 2) openHat(t + sixteenth * 2 * SR, 0.16);

  // === BASS === groove pattern
  const noteIdx = (beat) % bassNotes.length;
  bass(t, BEAT * 0.9, bassNotes[noteIdx]);

  // === STABS === synth hits on beats 1 of bars, and scattered
  if (barPos === 0 && bar % 2 === 0) stab(t);
  if (barPos === 2 && bar % 4 === 1) stab(t, 0.2);
  if (barPos === 0 && bar % 8 === 4) {
    stab(t);
    stab(t + sixteenth * SR, 0.15);
    stab(t + sixteenth * SR * 2, 0.1);
  }
}

// Continuous atmospheric pad
pad(0, DURATION, 0.10);
pad(BEAT * 8 * SR, DURATION - BEAT * 8, 0.08); // layer 2 slightly delayed

// === NORMALIZE ===
let peak = 0;
for (let i = 0; i < TOTAL; i++) peak = Math.max(peak, Math.abs(buf[i]));
const gain = 0.88 / peak;
for (let i = 0; i < TOTAL; i++) buf[i] *= gain;

// === WRITE WAV ===
const DATA_SIZE = TOTAL * 2; // 16-bit mono
const out = Buffer.alloc(44 + DATA_SIZE);

out.write('RIFF', 0);
out.writeUInt32LE(36 + DATA_SIZE, 4);
out.write('WAVE', 8);
out.write('fmt ', 12);
out.writeUInt32LE(16, 16);
out.writeUInt16LE(1, 20);  // PCM
out.writeUInt16LE(1, 22);  // mono
out.writeUInt32LE(SR, 24);
out.writeUInt32LE(SR * 2, 28); // byte rate
out.writeUInt16LE(2, 32);  // block align
out.writeUInt16LE(16, 34); // bits
out.write('data', 36);
out.writeUInt32LE(DATA_SIZE, 40);

for (let i = 0; i < TOTAL; i++) {
  const s = Math.max(-1, Math.min(1, buf[i]));
  out.writeInt16LE(Math.round(s * 32767), 44 + i * 2);
}

fs.writeFileSync(OUT, out);
console.log(`✓ Beat generated → ${OUT}`);
console.log(`  ${DURATION}s · ${BPM} BPM · 44100Hz · 16-bit mono`);
