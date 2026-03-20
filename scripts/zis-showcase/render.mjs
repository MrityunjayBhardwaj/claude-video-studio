import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "../..");
const OUTPUT_DIR = path.join(ROOT, "output");
const OUT = path.join(OUTPUT_DIR, "zis-showcase-final.mp4");

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

console.log("Bundling...");
const bundled = await bundle({
  entryPoint: path.join(ROOT, "src/index.ts"),
  publicDir:  path.join(ROOT, "public"),
});

const composition = await selectComposition({
  serveUrl: bundled,
  id: "ZISShowcase",
  inputProps: {},
});

const { durationInFrames: d, fps } = composition;
console.log(`Rendering ${d} frames @ ${fps}fps (${d / fps}s) — 1920x1080...`);

await renderMedia({
  composition,
  serveUrl: bundled,
  codec: "h264",
  outputLocation: OUT,
  inputProps: {},
  concurrency: 4,
  chromiumOptions: { gl: "angle" },
  onProgress: ({ progress, renderedFrames }) => {
    const pct = Math.round(progress * 100);
    const bar = "█".repeat(Math.floor(pct / 5)) + "░".repeat(20 - Math.floor(pct / 5));
    process.stdout.write(`\r  [${bar}] ${pct}%  (${renderedFrames}/${d} frames)`);
  },
});

console.log(`\nDone -> ${OUT}`);
