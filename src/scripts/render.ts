import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import path from "path";
import { fileURLToPath } from "url";
import { generateScript } from "./generate-script.js";
import { VideoScript } from "../types.js";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, "../..");
const OUTPUT_DIR = path.join(ROOT_DIR, "output");

async function render(script: VideoScript, outputFile: string): Promise<void> {
  console.log("Bundling Remotion project...");

  const entryPoint = path.join(ROOT_DIR, "src/index.ts");
  const bundled = await bundle({ entryPoint });

  const totalFrames = script.slides.reduce((sum, s) => sum + s.duration, 0);

  const composition = await selectComposition({
    serveUrl: bundled,
    id: "TextVideo",
    inputProps: { script },
  });

  console.log(`Rendering ${totalFrames} frames (${(totalFrames / 30).toFixed(1)}s at 30fps)...`);

  await renderMedia({
    composition: {
      ...composition,
      durationInFrames: totalFrames,
    },
    serveUrl: bundled,
    codec: "h264",
    outputLocation: outputFile,
    inputProps: { script },
    onProgress: ({ progress }) => {
      process.stdout.write(`\rProgress: ${Math.round(progress * 100)}%   `);
    },
  });

  console.log(`\nVideo saved: ${outputFile}`);
}

async function main() {
  const topic = process.argv[2];
  if (!topic) {
    console.error("Usage: npm run generate -- \"<topic>\"");
    process.exit(1);
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // Generate script with Claude
  const script = await generateScript(topic);

  // Save script JSON for reference
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const scriptPath = path.join(OUTPUT_DIR, `script-${timestamp}.json`);
  fs.writeFileSync(scriptPath, JSON.stringify(script, null, 2));
  console.log(`Script saved: ${scriptPath}`);

  // Render video
  const outputFile = path.join(OUTPUT_DIR, `video-${timestamp}.mp4`);
  await render(script, outputFile);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
