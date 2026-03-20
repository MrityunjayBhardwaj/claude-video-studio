import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUTPUT_DIR = path.join(ROOT, "output");
const RAW  = path.join(OUTPUT_DIR, "neuralseek-raw.mp4");
const FINAL = path.join(OUTPUT_DIR, "neuralseek-final.mp4");
const AUDIO = path.join(ROOT, "public/neuralseek-audio.wav");

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

console.log("📦 Bundling...");
const bundled = await bundle({
  entryPoint: path.join(ROOT, "src/index.ts"),
  publicDir: path.join(ROOT, "public"),
});

const composition = await selectComposition({
  serveUrl: bundled,
  id: "NeuralSeek",
  inputProps: {},
});

const { durationInFrames: d, fps } = composition;
console.log(`🎬 Rendering ${d} frames @ ${fps}fps (${d / fps}s) — 1080×1080...`);

await renderMedia({
  composition,
  serveUrl: bundled,
  codec: "h264",
  outputLocation: RAW,
  inputProps: {},
  concurrency: 4,
  onProgress: ({ progress, renderedFrames }) => {
    const pct = Math.round(progress * 100);
    const bar = "█".repeat(Math.floor(pct / 5)) + "░".repeat(20 - Math.floor(pct / 5));
    process.stdout.write(`\r  [${bar}] ${pct}%  (${renderedFrames}/${d} frames)`);
  },
});

console.log(`\n✅ Video rendered`);
console.log("🔊 Muxing audio at 48kHz...");

execSync(
  `ffmpeg -y -i "${RAW}" -i "${AUDIO}" -c:v copy -c:a aac -ar 48000 -ac 2 -b:a 192k -map 0:v -map 1:a -shortest "${FINAL}"`,
  { stdio: "inherit" }
);

console.log(`✅ Done → ${FINAL}`);
