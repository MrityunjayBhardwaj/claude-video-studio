import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUTPUT_DIR = path.join(ROOT, "output");
const OUT_FILE = path.join(OUTPUT_DIR, "artflow-promo.mp4");

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

console.log("📦 Bundling...");
const bundled = await bundle({
  entryPoint: path.join(ROOT, "src/index.ts"),
  publicDir: path.join(ROOT, "public"),
});

const composition = await selectComposition({
  serveUrl: bundled,
  id: "MidjourneyPromo",
  inputProps: {},
});

console.log(`🎬 Rendering ${composition.durationInFrames} frames @ ${composition.fps}fps (${composition.durationInFrames / composition.fps}s)...`);

await renderMedia({
  composition,
  serveUrl: bundled,
  codec: "h264",
  outputLocation: OUT_FILE,
  inputProps: {},
  concurrency: 4,
  onProgress: ({ progress, renderedFrames, totalFrames }) => {
    const pct = Math.round(progress * 100);
    const bar = "█".repeat(Math.floor(pct / 5)) + "░".repeat(20 - Math.floor(pct / 5));
    process.stdout.write(`\r  [${bar}] ${pct}%  (${renderedFrames}/${totalFrames} frames)`);
  },
});

console.log(`\n✅ Video frames rendered`);

// Remotion outputs audio at 96kHz which breaks QuickTime/most players.
// Fix: mux public/beat.wav directly at 48kHz using FFmpeg.
const AUDIO = path.join(ROOT, "public/beat.wav");
const FINAL = path.join(OUTPUT_DIR, "artflow-promo-final.mp4");
console.log("🔊 Muxing audio at 48kHz...");
execSync(
  `ffmpeg -y -i "${OUT_FILE}" -i "${AUDIO}" -c:v copy -c:a aac -ar 48000 -ac 2 -b:a 192k -map 0:v -map 1:a -shortest "${FINAL}"`,
  { stdio: "inherit" }
);
console.log(`✅ Done → ${FINAL}`);
