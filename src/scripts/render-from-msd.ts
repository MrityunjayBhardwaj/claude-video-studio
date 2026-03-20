/**
 * MSD → Remotion Composition → Rendered Video
 *
 * Takes a Motion Specification Document (from the Motion Intelligence
 * Extraction Engine) and generates a complete Remotion composition
 * via Claude, then renders it to MP4.
 *
 * Usage:
 *   ts-node --esm src/scripts/render-from-msd.ts <msd_path> [--name <comp_name>] [--preview]
 *
 * Examples:
 *   ts-node --esm src/scripts/render-from-msd.ts ./input/final_msd.md
 *   ts-node --esm src/scripts/render-from-msd.ts ./input/final_msd.md --name BrandReveal
 *   ts-node --esm src/scripts/render-from-msd.ts ./input/final_msd.md --preview
 */

import Anthropic from "@anthropic-ai/sdk";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, "../..");
const SRC_DIR = path.join(ROOT_DIR, "src");
const COMPOSITIONS_DIR = path.join(SRC_DIR, "compositions");
const OUTPUT_DIR = path.join(ROOT_DIR, "output");

const client = new Anthropic();

// ── Load CLAUDE.md as system prompt ─────────────────────────

function loadSystemPrompt(): string {
  const claudeMdPath = path.join(ROOT_DIR, "CLAUDE.md");
  if (!fs.existsSync(claudeMdPath)) {
    throw new Error(`CLAUDE.md not found at ${claudeMdPath}`);
  }
  return fs.readFileSync(claudeMdPath, "utf-8");
}

// ── Parse MSD for metadata ──────────────────────────────────

interface MsdMeta {
  fps: number;
  width: number;
  height: number;
  durationMs: number;
  durationFrames: number;
  sceneCount: number;
}

function parseMsdMeta(msd: string): MsdMeta {
  // Extract fps
  const fpsMatch = msd.match(/(?:frame_rate|fps)\s*[:=]\s*(\d+)/i);
  const fps = fpsMatch ? parseInt(fpsMatch[1]) : 30;

  // Extract resolution
  const resMatch = msd.match(/(?:resolution|format)\s*[:=]?\s*(\d{3,4})\s*[x×]\s*(\d{3,4})/i);
  const width = resMatch ? parseInt(resMatch[1]) : 1920;
  const height = resMatch ? parseInt(resMatch[2]) : 1080;

  // Extract duration
  const durMatch = msd.match(/(?:total_duration_ms|duration_ms|duration)\s*[:=]\s*(\d+)/i);
  const durationMs = durMatch ? parseInt(durMatch[1]) : 30000;
  const durationFrames = Math.round(durationMs * fps / 1000);

  // Count scenes
  const sceneMatches = msd.match(/(?:^|\n)#+\s*(?:Scene|SCENE)\s*\d+/gi);
  const sceneCount = sceneMatches ? sceneMatches.length : 1;

  return { fps, width, height, durationMs, durationFrames, sceneCount };
}

// ── Generate composition via Claude ─────────────────────────

async function generateComposition(
  msd: string,
  compName: string,
  meta: MsdMeta,
): Promise<string> {
  const systemPrompt = loadSystemPrompt();

  console.log(`Sending MSD to Claude (${msd.length} chars, ${meta.sceneCount} scenes)...`);
  console.log(`  Target: ${meta.width}×${meta.height} @ ${meta.fps}fps, ${meta.durationFrames} frames (${(meta.durationMs / 1000).toFixed(1)}s)`);

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 16384,
    thinking: {
      type: "enabled",
      budget_tokens: 10000,
    },
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: `Generate a complete Remotion composition from this Motion Specification Document.

## Composition Name: ${compName}

## Video Properties
- Width: ${meta.width}
- Height: ${meta.height}
- FPS: ${meta.fps}
- Duration: ${meta.durationFrames} frames (${meta.durationMs}ms)

## IMPORTANT
- Output a SINGLE TypeScript file that exports the composition component.
- The component must be named \`${compName}\`.
- Follow every rule in your system prompt (CLAUDE.md).
- Include ALL scenes, ALL elements, ALL moves from the MSD.
- If the MSD is very complex, prioritize the most important visual elements
  and add \`// TODO: additional elements\` comments for lower-priority ones.

## Motion Specification Document

${msd}`,
      },
    ],
  });

  // Extract the TypeScript code from the response
  let code = "";
  for (const block of message.content) {
    if (block.type === "text") {
      code += block.text;
    }
  }

  // Extract code from markdown code block if wrapped
  const codeMatch = code.match(/```(?:tsx?|typescript)\s*\n([\s\S]*?)```/);
  if (codeMatch) {
    code = codeMatch[1];
  }

  // Validate it looks like a valid composition
  if (!code.includes("useCurrentFrame") && !code.includes("interpolate")) {
    console.warn("Warning: Generated code may not contain Remotion animation primitives.");
  }
  if (!code.includes(`export`) || !code.includes(compName)) {
    console.warn(`Warning: Generated code may not export component '${compName}'.`);
  }

  return code;
}

// ── Write composition and register ──────────────────────────

function writeComposition(compName: string, code: string): string {
  fs.mkdirSync(COMPOSITIONS_DIR, { recursive: true });

  const filePath = path.join(COMPOSITIONS_DIR, `${compName}.tsx`);
  fs.writeFileSync(filePath, code);
  console.log(`  → ${filePath}`);
  return filePath;
}

function registerComposition(compName: string, meta: MsdMeta): void {
  const rootPath = path.join(SRC_DIR, "Root.tsx");
  let root = fs.readFileSync(rootPath, "utf-8");

  // Check if already registered
  if (root.includes(`id="${compName}"`)) {
    console.log(`  Composition '${compName}' already registered in Root.tsx`);
    return;
  }

  // Add import
  const importLine = `import { ${compName} } from "./compositions/${compName}";\n`;
  if (!root.includes(importLine.trim())) {
    // Add after last import
    const lastImportIdx = root.lastIndexOf("import ");
    const lineEnd = root.indexOf("\n", lastImportIdx);
    root = root.slice(0, lineEnd + 1) + importLine + root.slice(lineEnd + 1);
  }

  // Add Composition entry before closing </>
  const compositionEntry = `    <Composition
      id="${compName}"
      component={${compName}}
      durationInFrames={${meta.durationFrames}}
      fps={${meta.fps}}
      width={${meta.width}}
      height={${meta.height}}
    />\n`;

  const closingTag = root.lastIndexOf("</>");
  if (closingTag === -1) {
    throw new Error("Could not find </> in Root.tsx to insert composition");
  }
  root = root.slice(0, closingTag) + compositionEntry + "  " + root.slice(closingTag);

  fs.writeFileSync(rootPath, root);
  console.log(`  Registered '${compName}' in Root.tsx`);
}

// ── Render ───────────────────────────────────────────────────

async function renderComposition(
  compName: string,
  meta: MsdMeta,
  outputFile: string,
): Promise<void> {
  console.log(`\nBundling Remotion project...`);
  const entryPoint = path.join(SRC_DIR, "index.ts");
  const bundled = await bundle({
    entryPoint,
    publicDir: path.join(ROOT_DIR, "public"),
  });

  console.log(`Selecting composition '${compName}'...`);
  const composition = await selectComposition({
    serveUrl: bundled,
    id: compName,
  });

  console.log(`Rendering ${meta.durationFrames} frames (${(meta.durationMs / 1000).toFixed(1)}s at ${meta.fps}fps)...`);
  await renderMedia({
    composition,
    serveUrl: bundled,
    codec: "h264",
    outputLocation: outputFile,
    onProgress: ({ progress }) => {
      process.stdout.write(`\rProgress: ${Math.round(progress * 100)}%   `);
    },
  });

  console.log(`\n✓ Video saved: ${outputFile}`);
}

// ── Main ─────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes("--help")) {
    console.log(`Usage: ts-node --esm src/scripts/render-from-msd.ts <msd_path> [options]

Options:
  --name <name>    Composition name (default: derived from filename)
  --preview        Only generate composition, don't render (use 'npm run studio' to preview)
  --output <path>  Output video path (default: output/<name>.mp4)`);
    process.exit(0);
  }

  const msdPath = args[0];
  if (!fs.existsSync(msdPath)) {
    console.error(`Error: MSD file not found: ${msdPath}`);
    process.exit(1);
  }

  // Parse options
  const nameIdx = args.indexOf("--name");
  const outputIdx = args.indexOf("--output");
  const previewOnly = args.includes("--preview");

  // Derive composition name from filename
  let compName = nameIdx !== -1 && args[nameIdx + 1]
    ? args[nameIdx + 1]
    : path.basename(msdPath, path.extname(msdPath))
        .replace(/[^a-zA-Z0-9]/g, "_")
        .replace(/_+/g, "_")
        .replace(/^_|_$/g, "")
        .split("_")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join("");

  // Ensure PascalCase and valid identifier
  if (!/^[A-Z]/.test(compName)) {
    compName = "Msd" + compName;
  }

  const msd = fs.readFileSync(msdPath, "utf-8");
  const meta = parseMsdMeta(msd);

  console.log(`\n═══ MSD → Remotion: ${compName} ═══\n`);
  console.log(`  Source: ${msdPath}`);
  console.log(`  Format: ${meta.width}×${meta.height} @ ${meta.fps}fps`);
  console.log(`  Duration: ${(meta.durationMs / 1000).toFixed(1)}s (${meta.durationFrames} frames)`);
  console.log(`  Scenes: ${meta.sceneCount}\n`);

  // Step 1: Generate composition via Claude
  console.log("═══ Step 1: Generating Remotion composition via Claude ═══");
  const code = await generateComposition(msd, compName, meta);

  // Step 2: Write composition file
  console.log("\n═══ Step 2: Writing composition ═══");
  const compFile = writeComposition(compName, code);

  // Step 3: Register in Root.tsx
  console.log("\n═══ Step 3: Registering composition ═══");
  registerComposition(compName, meta);

  // Save the generated code for reference
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const codePath = path.join(OUTPUT_DIR, `${compName}-composition-${timestamp}.tsx`);
  fs.writeFileSync(codePath, code);
  console.log(`  Saved code copy: ${codePath}`);

  if (previewOnly) {
    console.log(`\n✓ Composition generated. Preview with:`);
    console.log(`  npm run studio`);
    console.log(`  → Select '${compName}' in the composition picker`);
    return;
  }

  // Step 4: Render
  console.log("\n═══ Step 4: Rendering video ═══");
  const outputFile = outputIdx !== -1 && args[outputIdx + 1]
    ? args[outputIdx + 1]
    : path.join(OUTPUT_DIR, `${compName}-${timestamp}.mp4`);

  await renderComposition(compName, meta, outputFile);

  console.log(`\n${"═".repeat(50)}`);
  console.log(`✓ Complete.`);
  console.log(`  Composition: ${compFile}`);
  console.log(`  Video: ${outputFile}`);
  console.log(`  Preview: npm run studio → ${compName}`);
}

main().catch((err) => {
  console.error("Error:", err.message || err);
  process.exit(1);
});
