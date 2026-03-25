# Motion Graphics Video Creator — End-to-End Build Spec

## What We're Building

A programmatic motion graphics engine that takes product data and outputs high-quality MP4 launch videos. The system is composed of 7 layers:

```
[Product JSON] → [MCP/AI] → [DSL AST] → [Lattice + Monad Refinement] → [Frame Compiler] → [Parallel Renderer] → [MP4]
                                              ↑
                                   [Lottie Import Pipeline]
                                   [Template Library]
```

---

## Layer 1: Lottie Ingestion Pipeline

**Purpose:** Import any Lottie JSON (from Jitter, Cavalry, LottieFiles) as a lossless lattice.

### Data Structure: Lattice
```typescript
interface LottieLattice {
  duration: number;          // total seconds
  fps: number;
  layers: LatticeLayer[];
}

interface LatticeLayer {
  id: string;                // layer name from Lottie
  type: 'shape' | 'text' | 'image' | 'null';
  keyframes: {
    opacity?: KeyframeTrack;
    position?: KeyframeTrack2D;
    scale?: KeyframeTrack2D;
    rotation?: KeyframeTrack;
    path?: PathKeyframe[];    // for shape morphs
  };
}

interface KeyframeTrack {
  frames: number[];           // frame indices
  values: number[];           // corresponding values
  easings: EasingCurve[];     // bezier handles per segment
}
```

### Parser
```typescript
// src/ingestion/lottie-parser.ts
export function parseLottie(json: LottieJSON): LottieLattice { ... }
```

**Handles:** opacity, position, scale, rotation, path, text, image layers.  
**Passes through:** expressions, effects (baked to keyframes).

---

## Layer 2: DSL / Animation IR

**Purpose:** The typed intermediate representation — the single source of truth. Everything compiles to and from this.

### Core Types
```typescript
// src/dsl/types.ts

type AnimCmd =
  | { type: 'sequence';  cmds: AnimCmd[] }
  | { type: 'parallel';  cmds: AnimCmd[] }
  | { type: 'tween';     target: string; to: AnimProps; duration: number; easing?: Easing }
  | { type: 'wait';      duration: number }
  | { type: 'rawLattice'; layer: LatticeLayer }  // passthrough for complex content
  | { type: 'lottieEmbed'; lattice: LottieLattice } // embed full lottie as-is

type AnimProps = {
  opacity?: number;
  x?: number; y?: number;
  scale?: number | [number, number];
  rotation?: number;
  fill?: string;
}

type Easing = 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'spring' | BezierEasing
```

### Lattice → DSL Lifter (optional semantic enrichment)
```typescript
// src/dsl/lifter.ts
export function liftLattice(lattice: LottieLattice): AnimCmd {
  // Pattern match tracks into semantic nodes where possible
  // Falls back to rawLattice for complex content
}
```

> **Key insight:** You never have to lift. The `rawLattice` node is a valid DSL primitive. Lifting is optional semantic enrichment for editability.

---

## Layer 3: Monad Refinement Layer

**Purpose:** Compose refinements on top of any DSL node — additively, losslessly.

### Monad Interface
```typescript
// src/monad/refine.ts

interface AnimMonad {
  value: AnimCmd;
  pipe<T>(fn: (cmd: AnimCmd) => AnimCmd): AnimMonad;
  run(): AnimCmd;
}

const anim = (cmd: AnimCmd): AnimMonad => ({
  value: cmd,
  pipe(fn) { return anim(fn(this.value)); },
  run() { return this.value; }
});
```

### Built-in Refinements
```typescript
// Retime a layer with a different easing
addSpringPhysics(target: string, opts: SpringOpts): (cmd: AnimCmd) => AnimCmd

// Add overshoot to any scale/position tween
addOvershoot(target: string, amount: number): (cmd: AnimCmd) => AnimCmd

// Stagger parallel children
addStagger(delayPerChild: number): (cmd: AnimCmd) => AnimCmd

// Retime entire duration
retime(factor: number): (cmd: AnimCmd) => AnimCmd

// Replace a target's properties with new values (data injection)
inject(target: string, newProps: Partial<AnimProps>): (cmd: AnimCmd) => AnimCmd
```

### Usage
```typescript
const base = parseLottie(jitterExport);   // lossless lattice
const spec = anim({ type: 'lottieEmbed', lattice: base })
  .pipe(inject('headline', { text: 'AirPods Pro' }))
  .pipe(addSpringPhysics('logo', { stiffness: 200, damping: 12 }))
  .pipe(addStagger(0.08))
  .run();
```

---

## Layer 4: Frame Compiler

**Purpose:** Convert DSL AST into a pure `renderFrame(n) → SceneState` function. This enables parallelization.

```typescript
// src/compiler/compile.ts

interface FrameLayout {
  tracks: {
    target: string;
    property: string;
    frames: number[];
    values: number[];
    easings: EasingCurve[];
  }[];
  totalFrames: number;
}

export function compile(cmd: AnimCmd, fps: number): FrameLayout { ... }

export function renderFrame(layout: FrameLayout, frame: number): SceneState {
  // Pure function — no side effects, no shared state
  // Binary search frame index, interpolate values
  return evalAllTracks(layout, frame);
}
```

### SceneState
```typescript
interface SceneState {
  targets: Record<string, {
    opacity: number;
    x: number; y: number;
    scale: [number, number];
    rotation: number;
    fill: string;
  }>;
}
```

---

## Layer 5: Parallel Renderer

**Purpose:** Use the pure `renderFrame` function to render chunks in parallel workers, then stitch with ffmpeg.

```typescript
// src/renderer/render.ts

export async function renderVideo(
  spec: AnimCmd,
  outputPath: string,
  opts: { fps: number; width: number; height: number; workers?: number }
) {
  const layout = compile(spec, opts.fps);
  const chunks = splitIntoChunks(layout.totalFrames, opts.workers ?? 8);

  // Spawn worker threads, each renders its chunk to PNG frames
  await Promise.all(chunks.map(chunk =>
    renderChunk(layout, chunk, opts)
  ));

  // Stitch with ffmpeg
  await ffmpegStitch(outputPath, opts.fps);
}
```

### Motion Canvas Integration
Each chunk's renderer uses Motion Canvas's canvas API for the actual drawing:
```typescript
// src/renderer/canvas-renderer.ts
// Given a SceneState, draws it onto an OffscreenCanvas
function drawState(canvas: OffscreenCanvas, state: SceneState, template: MCTemplate) { ... }
```

Templates are Motion Canvas scene files that accept `SceneState` as their data source.

---

## Layer 6: MCP / AI Composition

**Purpose:** Take product JSON and compose a valid DSL spec via constrained LLM output.

### MCP Tool Definition
```typescript
// src/mcp/compose-animation.ts

export const composeAnimation = {
  name: 'compose_animation',
  description: 'Compose a product launch animation spec from product data',
  inputSchema: {
    product: ProductSchema,
    style: z.enum(['bold', 'minimal', 'luxury', 'playful']),
    duration: z.number().min(10).max(60),
    aspectRatio: z.enum(['16:9', '9:16', '1:1']),
  },
  execute: async (input) => {
    // LLM outputs DSL JSON — constrained by AnimCmd schema
    const spec = await llm.generate({
      schema: AnimCmdSchema,   // Zod schema used as JSON Schema for LLM
      prompt: buildPrompt(input),
    });
    return spec;
  }
}
```

### LLM Output (constrained JSON, not code)
```json
{
  "type": "sequence",
  "cmds": [
    { "type": "tween", "target": "logo",     "to": { "opacity": 1, "scale": 1 }, "duration": 0.5, "easing": "spring" },
    { "type": "tween", "target": "headline", "to": { "opacity": 1, "y": 0 },     "duration": 0.6 },
    { "type": "parallel", "cmds": [
      { "type": "tween", "target": "feature1", "to": { "opacity": 1 }, "duration": 0.3 },
      { "type": "tween", "target": "feature2", "to": { "opacity": 1 }, "duration": 0.3 }
    ]},
    { "type": "tween", "target": "cta", "to": { "scale": 1, "opacity": 1 }, "duration": 0.4 }
  ]
}
```

**Fine-tuning:** Collect `(product_data, style) → AnimCmd` pairs from every render. After 500+ examples, fine-tune a small model (Llama 3 8B) on your specific vocabulary.

---

## Layer 7: Template Library

**Purpose:** Pre-built Motion Canvas scene files that accept `SceneState` as input.

### Template Interface
```typescript
// src/templates/types.ts
interface MCTemplate {
  name: string;
  aspectRatios: AspectRatio[];
  targets: string[];          // what layer IDs this template expects
  defaultDuration: number;
  scene: (state: SceneState) => Promise<void>;  // Motion Canvas scene function
}
```

### Initial Template Set (build order)
| # | Template | Duration | Key Elements |
|---|----------|----------|-------------|
| 1 | `IntroSlam` | 3s | logo, headline, bg |
| 2 | `FeatureScroll` | 8s | feature1-3, icons |
| 3 | `PriceReveal` | 4s | price, label, badge |
| 4 | `ProductHero` | 6s | productImage, headline, sub |
| 5 | `CTAFinale` | 3s | cta, logo, tagline |
| 6 | `LottieSection` | variable | embed any Lottie as a section |

### Importing Jitter/Cavalry Templates
```typescript
// Any Lottie becomes template 6 automatically
const template = createLottieTemplate('jitter-export.json');
// Then refined via monad layer before rendering
```

---

## End-to-End Flow

### Batch Render (1000 products)
```typescript
import products from './products.json';

for (const product of products) {
  // 1. AI composes spec
  const spec = await composeAnimation({ product, style: 'bold', duration: 30, aspectRatio: '16:9' });

  // 2. Monad refinements
  const refined = anim(spec)
    .pipe(inject('headline', { text: product.name }))
    .pipe(inject('logo', { src: product.logoUrl }))
    .run();

  // 3. Render
  await renderVideo(refined, `./output/${product.id}.mp4`, {
    fps: 30, width: 1920, height: 1080, workers: 8
  });
}
```

### Interactive Preview (Node Graph Editor)
```
User edits node graph
      ↓
Graph serializes to AnimCmd AST
      ↓
compile() → FrameLayout (instant)
      ↓
renderFrame(currentFrame) runs on scrub
      ↓
Canvas preview updates in real-time
```

---

## Folder Structure

```
motion-graphics/
├── src/
│   ├── dsl/
│   │   ├── types.ts           # AnimCmd, AnimProps, Easing
│   │   └── lifter.ts          # Lottie lattice → DSL nodes (optional)
│   ├── ingestion/
│   │   └── lottie-parser.ts   # Lottie JSON → LottieLattice
│   ├── monad/
│   │   ├── refine.ts          # AnimMonad core
│   │   └── refinements.ts     # addSpring, addStagger, inject, retime
│   ├── compiler/
│   │   └── compile.ts         # AnimCmd → FrameLayout → renderFrame()
│   ├── renderer/
│   │   ├── render.ts          # orchestrate parallel workers + ffmpeg
│   │   ├── worker.ts          # worker thread: renders frame chunk
│   │   └── canvas-renderer.ts # SceneState → OffscreenCanvas draw
│   ├── templates/
│   │   ├── types.ts
│   │   ├── IntroSlam.ts
│   │   ├── FeatureScroll.ts
│   │   ├── PriceReveal.ts
│   │   ├── ProductHero.ts
│   │   ├── CTAFinale.ts
│   │   └── LottieSection.ts
│   └── mcp/
│       ├── compose-animation.ts  # MCP tool
│       └── prompts.ts
├── templates/lottie/           # raw Lottie JSON files from Jitter/Cavalry
├── output/                     # rendered MP4s
└── package.json
```

---

## Build Order

```
Phase 1 (Week 1): Foundation
[ ] Define DSL types (types.ts)
[ ] Build Lottie parser (lottie-parser.ts)
[ ] Build frame compiler (compile.ts + renderFrame)
[ ] Single-threaded render to PNG frames + ffmpeg stitch

Phase 2 (Week 2): Templates + Rendering
[ ] Build 3 core templates (IntroSlam, FeatureScroll, CTAFinale)
[ ] Parallel worker renderer
[ ] LottieSection template (embed any Lottie)
[ ] Monad refinement layer

Phase 3 (Week 3): AI + MCP
[ ] MCP tool with schema-constrained LLM output
[ ] Prompt engineering for DSL composition
[ ] Batch render pipeline (products.json → output/*.mp4)

Phase 4 (Week 4+): Node Editor + Fine-tuning
[ ] Node graph visual editor (web UI)
[ ] Collect (product, spec) training pairs
[ ] Fine-tune small model on your DSL vocabulary
```

---

## Key Design Principles

1. **Lossless by default** — Lottie lattice is always the raw truth. Lifting is optional.
2. **Monad refinements are additive** — `anim(x).pipe(identity).run() === x` always.
3. **Frame function is pure** — `renderFrame(layout, n)` has zero side effects. Enables any parallelization strategy.
4. **LLM outputs data, not code** — AnimCmd JSON schema is the grammar. Hallucinations produce invalid JSON (catchable), not broken video.
5. **Templates are thin** — they only know how to *draw* a `SceneState`. All animation logic lives in the DSL + compiler.
