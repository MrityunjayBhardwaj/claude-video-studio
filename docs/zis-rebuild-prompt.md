# ZIS-101A Sport Showcase — Complete Regeneration Prompt

## HOW TO USE THIS DOCUMENT

This is a self-contained build prompt. Feed this file to Claude alongside:
- `docs/zis-showcase-learnings.md` (technical reference + enhanced build rules)
- Sketchfab model URL: `https://sketchfab.com/3d-models/zis-101a-sport-1938-a361c0f7b7e041fc8f3437a5cbec681a`
- Music: `https://archive.org/details/ActionCinematicMusic` (Serge Quadrado — download to `public/showcase-music.mp3`)

Claude should produce every file listed in Section 3 with zero additional questions. All frame numbers, camera positions, text content, easing functions, colors, and architectural decisions are specified below.

---

## 1. WHAT YOU ARE BUILDING

A 97-second cinematic showcase of the ZIS-101A Sport (1938) — a Soviet prototype car — rendered entirely in code using Remotion + React Three Fiber + Three.js.

**Aesthetic:** Archival/documentary in the first 32 seconds (B&W photography, sepia footage, film grain, film leader countdown, typographic scenes), then transitioning to a clean 3D studio visualization for 60 seconds, ending with a 5-second credits card.

**Mood:** Prestige automotive documentary. The ZIS-101A Sport was a one-of-a-kind Soviet prototype built in 1938, never raced, lost to history.

---

## 2. STACK

```
remotion:               4.x
@remotion/three:        4.x
@react-three/fiber:     9.x
@react-three/drei:      10.x
three:                  0.183.x
@types/three:           0.183.x
```

Install: `npm i three @react-three/fiber @remotion/three @types/three @react-three/drei`

---

## 3. FILE STRUCTURE

```
src/
  index.ts                              (Remotion entry — unchanged)
  Root.tsx                              (register ZISShowcase composition)
  projects/
    zis-showcase/
      ZISShowcase.tsx                   (2D legacy intro + full composition root)
      ArchViz.tsx                       (3D section — @remotion/three)

scripts/
  zis-showcase/
    render.mjs                          (render script)

public/
  showcase-music.mp3                    (Serge Quadrado — Action Cinematic Music)
  archviz-audio.mp3                     (unused when nested — noAudio suppresses it)
  zis/
    scene.glb                           (downloaded from Sketchfab — see Section 5)
  hdri/
    venice_sunset_1k.hdr               (HDRI environment — any warm sunset 1k HDR)
  zis-photos/
    zis1.jpg  zis2.jpg  zis3.jpg       (archive photos — from Wikimedia Commons)
    zis4.jpg  zis5.jpg
  zis-video/
    clip-a-factory.mp4                  (Soviet factory footage — British Pathé)
    clip-e-steering.mp4                 (steering wheel footage — British Pathé)

output/
  zis-showcase-final.mp4               (rendered output — gitignored)
```

---

## 4. ROOT.TSX

Register the composition at `2910 frames` (97s @ 30fps), `1920×1080`:

```tsx
import { Composition } from "remotion";
import { ZISShowcase } from "./projects/zis-showcase/ZISShowcase";
// ... other compositions unchanged ...

<Composition
  id="ZISShowcase"
  component={ZISShowcase}
  durationInFrames={2910}
  fps={30}
  width={1920}
  height={1080}
/>
```

---

## 5. ASSET ACQUISITION

### 3D Model

1. Visit: `https://sketchfab.com/3d-models/zis-101a-sport-1938-a361c0f7b7e041fc8f3437a5cbec681a`
2. Creator: Comrade1280 — License: CC BY 4.0
3. Download as `.glb` → save to `public/zis/scene.glb`
4. The GLB has a Y-translation artifact of ~57.784 units baked into the root `Sketchfab_model` matrix (FBX export artifact). Correct it in code:
   ```tsx
   <primitive object={scene} scale={1.2} position={[0.168, 68.14, 0]} />
   ```
   This offsets the model so its wheels sit at Y=0 on the studio floor.

### Music

Download "Action Cinematic Music" by Serge Quadrado from `https://archive.org/details/ActionCinematicMusic` → save as `public/showcase-music.mp3`. Duration should be at least 92 seconds (2760 frames).

### HDRI

Download any warm sunset HDRI at 1k resolution → save as `public/hdri/venice_sunset_1k.hdr`. Used only for environment reflections, not as background.

### Archive Photos (5 images)

Download from Wikimedia Commons `https://commons.wikimedia.org/wiki/Category:ZIS-Sport` → save as `public/zis-photos/zis1.jpg` through `zis5.jpg`. These are B&W archive photographs of the real ZIS-101A Sport.

### Archive Footage (2 clips)

Download Soviet-era footage from British Pathé → save as:
- `public/zis-video/clip-a-factory.mp4` — Soviet factory/manufacturing footage
- `public/zis-video/clip-e-steering.mp4` — Car interior/steering wheel footage

---

## 6. MASTER TIMELINE

```
Frame 0    → 960    (32s)   Legacy 2D intro
Frame 960  → 2760   (60s)   3D ArchViz section
Frame 2760 → 2910   (5s)    Credits card
```

**Transition at frame 960:** The legacy intro fades to black over frames 941–960 (SceneResurrection component). ArchViz begins with a FilmBurn intro effect over frames 0–32 (its own local frame clock).

---

## 7. AUDIO

Single `<Audio>` at the ZISShowcase root level. Music fades out over frames 2700–2760 (last 2 seconds before credits).

```tsx
<Audio
  src={staticFile("showcase-music.mp3")}
  volume={(f) => interpolate(f, [2700, 2760], [1, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp"
  })}
/>
```

**Important:** ArchViz has its own `<Audio>` tags for standalone use. When nested inside ZISShowcase, pass `noAudio` prop to suppress them.

---

## 8. BEAT DATA

Music: 123.05 BPM. Detected using `librosa` at 30fps.

```ts
const BPM = 123.05;
const SPB = 60 / BPM;   // ≈ 0.488s per beat
const FPB = SPB * 30;   // ≈ 14.63 frames per beat
const BAR = FPB * 4;    // ≈ 58.5 frames per bar
```

**Legacy intro 2D cut points (video-absolute frame numbers):**

| Cut | Frame | Scene boundary |
|-----|-------|---------------|
| Beat 4  | 72  | CountdownLeader → SceneEra |
| Beat 12 | 189 | SceneEra → SceneCarName |
| Beat 15 | 233 | CarName word cut: "ZIS" → "101-A" |
| Beat 18 | 277 | CarName word cut: "101-A" → "SPORT" |
| Beat 20 | 306 | SceneCarName → SceneStory |
| Beat 28 | 423 | SceneStory → SceneSpecs |
| Beat 30 | 450 | SceneSpecs card cut 1→2 |
| Beat 32 | 475 | SceneSpecs card cut 2→3 |
| Beat 34 | 503 | SceneSpecs card cut 3→4 |
| Beat 36 | 547 | SceneSpecs → SceneArchive |
| Beat 40 | 591 | SceneArchive photo cut 1→2 |
| Beat 43 | 635 | SceneArchive photo cut 2→3 |
| Beat 44 | 664 | SceneArchive → SceneLegacy |
| Beat 52 | 781 | SceneLegacy → SceneResurrection |
| —       | 960 | Transition to ArchViz |

**LegacyCutFlash frames (white flash on these video frames):**
```ts
const CUTS = [72, 189, 233, 277, 306, 423, 450, 475, 503, 547, 664, 781];
```

**ArchViz camera cut points (ArchViz-local frames = video_beat_frame − 960):**

```ts
const CUTS = [
  0,
  303,   // beat 86  — S2 tight front
  464,   // beat 97  — S3 side low
  640,   // beat 109 — S4 rear 3/4
  815,   // beat 121 — S5 wheel close
  977,   // beat 132 — S6 overhead
  1152,  // beat 144 — S7 front grill
  1313,  // beat 155 — S8 orbit wide
  1649,  // beat 178 — S9 hero pull-back
  1800,
];
const BEAT0 = 10;  // first beat within ArchViz = video beat 66 = video frame 970 − 960
```

---

## 9. ZISShowcase.tsx — COMPLETE SPECIFICATION

### 9.1 Imports

```tsx
import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, Easing, Audio, staticFile, Sequence, Img, OffthreadVideo } from "remotion";
import { ArchViz } from "./ArchViz";
```

### 9.2 Animation Helpers

```ts
/** Sepia/effects multiplier: 1.0 at frame 0, fades to 0 by frame 480 (16s) */
function sepiaFade(frame: number) {
  return interpolate(frame, [0, 480], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
}

function fi(frame: number, start: number, dur = 15) {
  return interpolate(frame, [start, start + dur], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
}

function fo(frame: number, end: number, dur = 12) {
  return interpolate(frame, [end - dur, end], [1, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
    easing: Easing.in(Easing.quad),
  });
}
```

### 9.3 Film Effect Components

All use `frame` (global video frame) as prop. All opacity values are multiplied by `sepiaFade(frame)` except `ArchiveGrain`.

**`ArchiveGrain`** — SVG fractalNoise grain overlay. Animate `backgroundPosition` by `(frame * 31) % 200`. Opacity `0.18 * intensity`. `mixBlendMode: "overlay"`.

**`FilmScratches`** — Three vertical lines that appear and disappear using `Math.sin(frame * speed) > threshold`. Use thresholds `0.7`, `0.85`, `0.9` to make them rare. Positions driven by `(frame * prime) % range`. Wrap the entire component in a div with `opacity: sepiaFade(frame)`.

**`ArchiveVignette`** — Static radial gradient: `transparent 35%, rgba(0,0,0,0.5) 70%, rgba(0,0,0,0.85) 100%`. No fade (keeps through whole intro).

**`Flicker`** — `background: rgba(0,0,0,${flicker})` where `flicker = Math.max(0, Math.sin(frame * 11.3) * 0.08 + Math.sin(frame * 7.7) * 0.06)`. Wrap in a div with `opacity: sepiaFade(frame)`.

**`HorizontalTear`** — Returns null unless `Math.sin(frame * 0.23) > 0.92` (rare). A 4px dark horizontal band at `tearY = ((frame * 7) % 60) + 20`% with `translateX(Math.sin(frame * 3.1) * 8px)`. Wrap in div with `opacity: sepiaFade(frame)`.

**`LegacyCutFlash`** — On each cut frame from the CUTS list, emit a white flash that decays over 3 frames. `flash = Math.max(...cuts.map(c => max(0, (3 - abs(frame-c))/3) * 0.6))`.

**`Letterbox`** — Two absolute `<div>` bars, `height: 88px`, top and bottom, `background: #000`.

> All three fading effects (FilmScratches, Flicker, HorizontalTear) should be wrapped in a **single** `<div style={{ position: "absolute", inset: 0, opacity: sepiaFade(frame) }}>` so one interpolation drives them all.

### 9.4 Scene Components

All scenes are conditionally rendered based on frame range. Each receives `frame` (global video frame) as a prop.

---

#### Scene 1: CountdownLeader (frames 0–72)

**Purpose:** Classic film leader countdown, 6→1. Archival documentary opening.

**Background:** `#0A0A0A`

**Elements:**
- Large countdown number centered: `6 - Math.floor((frame / 72) * 6)`, min 1. Font: `'Courier New', monospace`, size 120, weight 900, color white.
- Rotating crosshair lines (two `<div>` inside a 220×220 circle border): `transform: rotate(${phase * 360}deg)` and `rotate(${phase * 180}deg)` where `phase = (frame % 12) / 12`.
- Horizontal registration line: full width, 1px, `rgba(255,255,255,0.06)`.
- Bottom-right metadata: `MOSFILM ARCHIVE · {frame.padStart(4, "0")}` — `fontSize: 10, opacity: 0.35, letterSpacing: 2`.
- Top-left metadata: `ZIS-101A SPORT · 1938` — `fontSize: 10, opacity: 0.3`.

**Fade:** Overall opacity: `fi(frame, 0, 6) * fo(frame, 72, 8)`.

---

#### Scene 2: SceneEra (frames 72–189, local frame = lf = frame − 72, dur = 117)

**Purpose:** Title card — city and year. МОСКВА / 1938.

**Background:** `#0C0A07`

**Background photo (zis1.jpg):** Ken Burns scale `1.06→1.0` over dur. Opacity `fi(lf, 4, 20) * fo(lf, dur, 16) * 0.28`. Filter: `grayscale(1) sepia(${0.35 * sepiaFade(frame)}) contrast(1.1)`.

**Elements (all centered vertically):**
- `МОСКВА` — font: `'Times New Roman', serif`, size 118, weight 900, color `#E8D5A8`, letterSpacing 8. Opacity: `fi(lf,6,20) * fo(lf,dur,14)`. translateY from `+32px` to 0.
- Golden divider line — width animates `0→380px` over frames 12–36 (lf). Fades with scene. `background: linear-gradient(90deg, transparent, #C8A864, transparent)`, height 2.
- `1 9 3 8` — size 44, weight 300, color `#C8A864`, letterSpacing 18. Opacity: `fi(lf,18,14) * fo(lf,dur,14)`. translateY from `+22px`.
- Subtitle: `ГОСУДАРСТВЕННЫЙ АВТОМОБИЛЬНЫЙ ЗАВОД` — size 11, opacity `subOp * 0.7`, color `rgba(200,170,100,0.6)`, letterSpacing 4, `fi(lf,30,12) * fo(lf,dur,12)`.

**Overlay:** `radial-gradient(ellipse at center, rgba(20,14,5,0.6) 0%, rgba(0,0,0,0.85) 100%)` over the photo.

---

#### Scene 3: SceneCarName (frames 189–306, lf = frame − 189)

**Purpose:** Three rapid word-reveal cuts: ZIS / 101-A / SPORT.

**Background:** `#040404`

**Beat-aligned word cuts:**
```
Word 0 "ZIS":   lf 0–44   (frames 189–233)
Word 1 "101-A": lf 44–88  (frames 233–277)
Word 2 "SPORT": lf 88–117 (frames 277–306)
```

**Per word:**
- `idx = lf < 44 ? 0 : lf < 88 ? 1 : 2`
- `sf = lf - WORD_STARTS[idx]`
- Opacity: `fi(sf, 0, 7) * fo(sf, WORD_DURS[idx], 7)`
- Scale: `0.88 + fi(sf, 0, 10) * 0.12`

**Words, sizes, colors:**
- "ZIS" — size 180, weight 900, color white
- "101-A" — size 134, weight 900, color `#C8A864`, textShadow `0 0 80px rgba(200,168,100,0.4)`
- "SPORT" — size 104, weight 900, color white

**Progress dots:** Three pill indicators bottom-center. Active pill: width 22px. Inactive: 6px. Color `#C8A864` for active/past, `rgba(255,255,255,0.15)` for future.

**Background radial glow:** `rgba(200,168,100,0.04)` for word 1, `rgba(255,255,255,0.04)` for others.

---

#### Scene 4: SceneStory (frames 306–423, lf = frame − 306)

**Purpose:** Narrative text reveal — "In 1938, the Soviet Union built something extraordinary."

**Background:** `#080806`

**Background photo (zis3.jpg):** Scale `1.0→1.05`, opacity `fi(lf, 0, 20) * fo(lf, 117, 20) * 0.2`. Filter: `grayscale(1) sepia(${0.35 * sepiaFade(frame)}) contrast(1.0)`.

**Text lines (left-aligned, paddingLeft 120):**

| Text | size | weight | color | delay |
|------|------|--------|-------|-------|
| "IN 1938, THE SOVIET UNION" | 33 | 700 | `#E8E0D0` | 0 |
| "BUILT SOMETHING EXTRAORDINARY." | 33 | 700 | `#E8E0D0` | 14 |
| _(empty spacer)_ | — | — | — | — |
| "One vehicle." | 26 | 400 | `#A09070` | 30 | italic |
| "One prototype." | 26 | 400 | `#A09070` | 42 | italic |
| "Designed for glory." | 26 | 400 | `#C8A864` | 56 | italic |

Each line: `opacity = fi(lf, delay, 16) * fo(lf, 115 - i*3, 14)`. `translateX` from `+40px` to 0.

Font: `'Times New Roman', serif`, letterSpacing 2, lineHeight 1.65.

**Ornamental corner brackets:** Top-left and bottom-right, 40×40px, 1px gold border, opacity animated.

---

#### Scene 5: SceneSpecs (frames 423–547, lf = frame − 423)

**Purpose:** Four spec cards cycling at beat-aligned intervals.

**Background:** `#020204`

**Spec data:**

| idx | label | value | unit |
|-----|-------|-------|------|
| 0 | ENGINE DISPLACEMENT | 6,003 | CC |
| 1 | MAXIMUM POWER | 141 | HP |
| 2 | TOP SPEED | 162 | KM/H |
| 3 | UNITS PRODUCED | 1 | PROTOTYPE |

**Beat-aligned cuts:**
```
Spec 0: lf 0–27   (frames 423–450)
Spec 1: lf 27–52  (frames 450–475)
Spec 2: lf 52–80  (frames 475–503)
Spec 3: lf 80–124 (frames 503–547)
```

**Per spec:**
- Number: size 140 (or 100 for "PROTOTYPE"), weight 900, color white, scale `0.90 + fi(sf, 0, 12) * 0.10`.
- Unit: size 28, weight 300, color `#C8A864`.
- Label: size 11, weight 700, color `#C8A864`, letterSpacing 6, monospace.

**Horizontal accent line:** translateY −70px from center, `rgba(200,168,100,0.12)`.

**Progress dots:** Four pills, same pattern as Scene 3.

---

#### Scene 6: SceneArchive (frames 547–664, lf = frame − 547)

**Purpose:** Three archive photographs with Ken Burns motion, historical captions.

**Photos array (in order):**
```ts
const ARCHIVE_PHOTOS = [
  { src: "zis-photos/zis2.jpg", caption: "ZIS-101A SPORT · FRONT 3/4 VIEW · 1938",           panX: [0, -30],  panY: [0, -10],  scale: [1.05, 1.12] },
  { src: "zis-photos/zis4.jpg", caption: "ZIS-101A SPORT · SIDE PROFILE · МОСКВА 1938",       panX: [20, -20], panY: [-5, 5],   scale: [1.08, 1.02] },
  { src: "zis-photos/zis5.jpg", caption: "ZIS-101A SPORT · THE ONLY PROTOTYPE · 1938",        panX: [-10, 10], panY: [0, -15],  scale: [1.04, 1.10] },
];
```

**Beat-aligned photo cuts:**
```
Photo 0: lf 0–44   (frames 547–591)
Photo 1: lf 44–88  (frames 591–635)
Photo 2: lf 88–117 (frames 635–664)
```

**Ken Burns:** interpolate `panX`, `panY`, `scale` from `[0]` to `[1]` values over `sf/pdur` within each slot.

**Photo filter:** `grayscale(0.8) sepia(${0.45 * sepiaFade(frame)}) contrast(1.15) brightness(0.75)`.

**Vignette, sepia wash (`rgba(40,25,5,0.15)`), 3px border overlay, caption at bottom, photo index dots, four corner brackets** — all standard archival treatment.

---

#### Scene 7: SceneLegacy (frames 664–781, lf = frame − 664)

**Purpose:** Climax declaration — "THERE WAS ONLY ONE."

**Background:** `#060504`

**Background photo (zis1.jpg):** Scale `1.08→1.0`, opacity `fi(lf, 0, 24) * fo(lf, 115, 20) * 0.22`. Filter: `grayscale(1) sepia(${0.4 * sepiaFade(frame)}) contrast(1.1)`.

**Text lines (centered):**

| Text | size | weight | color | delay |
|------|------|--------|-------|-------|
| "THERE WAS ONLY ONE." | 50 | 900 | `#FFFFFF` | 0 |
| "It never raced." | 30 | 300 | `#A09070` | 22 | italic |
| "It never needed to." | 30 | 300 | `#A09070` | 38 | italic |
| "IT WAS ALREADY LEGEND." | 54 | 900 | `#C8A864` | 60 |

Each: `translateX` alternates `+44px`/`−44px` per even/odd index. Font: `'Times New Roman', serif`, letterSpacing 4.

**Ornamental divider:** Bottom-centered, width animates `0→200px` over lf 62–90 with `fo(lf, 115, 10)`. `background: linear-gradient(90deg, transparent, #C8A864, transparent)`.

---

#### Scene 8: SceneResurrection (frames 781–960, lf = frame − 781, dur = 179)

**Purpose:** Transition card — "REBORN IN 3D". Fades to black for clean handoff to ArchViz.

**Background:** `#060504`

**Center glow burst:** `radial-gradient(ellipse at center, rgba(200,168,100,${glow * 0.18}) 0%, transparent 55%)` where `glow = interpolate(lf, [18, 70, 100], [0, 1, 0.6])`.

**Elements (centered):**
- `NOW` — size 12, weight 700, color `#C8A864`, letterSpacing 12, `fi(lf,14,14) * fo(lf,179,14)`, glow textShadow.
- `REBORN` — size 86, weight 900, white, scale `0.82 + fi(lf,18,32) * 0.18`, glow textShadow.
- `IN 3D` — size 26, weight 300, `#C8A864`, letterSpacing 12, same scale.
- Growing divider line — width `0→440px` over lf 50–100.
- `ZIS-101A SPORT · 1938 · DIGITAL RECONSTRUCTION` — size 10, opacity `subOp * 0.7`, color `rgba(255,255,255,0.3)`.

**Fade to black (handoff):**
```ts
const fadeBlack = interpolate(lf, [163, 179], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
// Render: <div style={{ position: "absolute", inset: 0, background: `rgba(0,0,0,${fadeBlack})` }} />
```

---

#### LegacyIntro (root for 2D section)

Renders all 8 scenes in a single `<AbsoluteFill style={{ overflow: "hidden" }}>`, plus global archival overlays in this exact order:

```tsx
<CountdownLeader frame={frame} />
<SceneEra frame={frame} />
<SceneCarName frame={frame} />
<SceneStory frame={frame} />
<SceneSpecs frame={frame} />
<SceneArchive frame={frame} />
<SceneLegacy frame={frame} />
<SceneResurrection frame={frame} />
<ArchiveGrain frame={frame} />
<div style={{ position: "absolute", inset: 0, opacity: sepiaFade(frame) }}>
  <FilmScratches frame={frame} />
  <Flicker frame={frame} />
  <HorizontalTear frame={frame} />
</div>
<ArchiveVignette />
<LegacyCutFlash frame={frame} />
<Letterbox />
```

---

### 9.5 SceneCredits (frames 0–150 within Sequence)

**Purpose:** 5-second attribution card.

**Fade:** `fadeIn = interpolate(frame, [0,30], [0,1])`. `fadeOut = interpolate(frame, [120,150], [1,0])`. `op = fadeIn * fadeOut`. Applied to root `<AbsoluteFill style={{ opacity: op }}>`.

**Background:** `#060504` with subtle `radial-gradient(ellipse at center, rgba(200,168,100,0.07) 0%, transparent 65%)`.

**Title:** `CREDITS & ATTRIBUTION` — size 14, weight 700, color `rgba(200,168,100,0.7)`, letterSpacing 10, monospace. Position: `top: 108, centered`.

**Divider:** width 320, `top: 142`, centered, `linear-gradient(90deg, transparent, rgba(200,168,100,0.4), transparent)`.

**Credit rows — 4-column flex row (top:162, bottom:250):**

| Category | Title | Author | License | URL |
|---|---|---|---|---|
| 3D CAR MODEL | ZIS-101A Sport (1938) | Comrade1280 | CC BY 4.0 | sketchfab.com/3d-models/zis-101a-sport-1938-a361c0f7b7e041fc8f3437a5cbec681a |
| ARCHIVE FOOTAGE | Soviet Moscow Footage | British Pathé | All Rights Reserved | britishpathe.com |
| ARCHIVE PHOTOGRAPHS | ZIS-Sport Photography | Wikimedia Commons | Public Domain | commons.wikimedia.org/wiki/Category:ZIS-Sport |
| MUSIC | Action Cinematic Music | Serge Quadrado | CC BY 4.0 | archive.org/details/ActionCinematicMusic |

Per column: category label (size 11, letterSpacing 4, `rgba(200,168,100,0.55)`, monospace), title (size 22, weight 700, `#EDE5D0`, serif), author (size 15, `rgba(200,168,100,0.9)`, monospace), license (size 12, `rgba(200,168,100,0.5)`, letterSpacing 2), URL (size 11, `rgba(255,255,255,0.22)`, wordBreak: "break-all").

Columns separated by `borderRight: "1px solid rgba(200,168,100,0.12)"` (except last).

**Tools row (bottom:138):**

"MADE WITH" label (size 12, letterSpacing 8, `rgba(200,168,100,0.5)`, monospace), then three pill badges:

```
[ SVG icon ] Claude     — hexagon SVG, stroke #CF6B17
[ SVG icon ] Remotion   — circle + play triangle, stroke/fill #E0425E
[ SVG icon ] Three.js   — nested triangle wireframe, stroke white
```

Badge style: `background: rgba(255,255,255,0.05)`, `border: 1px solid rgba(255,255,255,0.12)`, `borderRadius: 10`, `padding: 10px 20px`. Text size 17, weight 600, color `#EDE5D0`.

**Claude SVG:**
```svg
<path d="M12 2L4 7v10l8 5 8-5V7L12 2z" stroke="#CF6B17" strokeWidth="1.5" fill="none"/>
<path d="M12 6l-4 2.5v5L12 16l4-2.5v-5L12 6z" fill="#CF6B17" opacity="0.7"/>
```

**Remotion SVG:**
```svg
<circle cx="12" cy="12" r="9" stroke="#E0425E" strokeWidth="1.5"/>
<polygon points="10,8 10,16 17,12" fill="#E0425E"/>
```

**Three.js SVG:**
```svg
<polygon points="12,3 21,18 3,18" stroke="#FFFFFF" strokeWidth="1.5" fill="none"/>
<polygon points="12,8 17,17 7,17" stroke="rgba(255,255,255,0.45)" strokeWidth="1" fill="none"/>
```

**Bottom stamp:** `ZIS-101A SPORT · 1938 · DIGITAL RECONSTRUCTION` — size 11, `rgba(255,255,255,0.14)`, monospace, letterSpacing 4, `bottom: 108`.

**Letterbox:** Top and bottom 88px black bars.

---

### 9.6 ZISShowcase Root

```tsx
export const ZISShowcase: React.FC = () => (
  <AbsoluteFill style={{ background: "#000" }}>
    <Audio
      src={staticFile("showcase-music.mp3")}
      volume={(f) => interpolate(f, [2700, 2760], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}
    />
    <Sequence from={0}    durationInFrames={960}  name="Legacy Intro"><LegacyIntro /></Sequence>
    <Sequence from={960}  durationInFrames={1800} name="3D B-Roll"><ArchViz noAudio /></Sequence>
    <Sequence from={2760} durationInFrames={150}  name="Credits"><SceneCredits /></Sequence>
  </AbsoluteFill>
);
```

---

## 10. ArchViz.tsx — COMPLETE SPECIFICATION

### 10.1 Imports

```tsx
import React, { Suspense } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing, Audio, staticFile } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useGLTF, Environment, ContactShadows, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
```

### 10.2 Beat Data

```ts
const BPM = 123.05;
const SPB = 60 / BPM;
const FPB = SPB * 30;
const BAR = FPB * 4;
const BEAT0 = 10;

const CUTS = [0, 303, 464, 640, 815, 977, 1152, 1313, 1649, 1800];

function beatPulse(frame: number): number {
  if (frame < BEAT0) return 0;
  const phase = ((frame - BEAT0) % FPB) / FPB;
  return Math.max(0, 1 - phase * 3);
}
```

### 10.3 Camera Shots

```ts
type Cam = { px: number; py: number; pz: number; tx: number; ty: number; tz: number; fov: number };

const SHOTS: [number, number, Cam, Cam][] = [
  [0,       CUTS[1], { px: 0,   py: 2.0, pz: 10,  tx: 0, ty: 0.5, tz: 0, fov: 36 },
                     { px: 0,   py: 1.8, pz: 14,  tx: 0, ty: 0.5, tz: 0, fov: 32 }],
  [CUTS[1], CUTS[2], { px: 0,   py: 0.4, pz: 8,   tx: 0, ty: 0.5, tz: 0, fov: 38 },
                     { px: 2.0, py: 0.6, pz: 7.5, tx: 0, ty: 0.5, tz: 0, fov: 35 }],
  [CUTS[2], CUTS[3], { px:-9,   py: 0.8, pz: 2,   tx: 0, ty: 0.5, tz: 0, fov: 42 },
                     { px:-8,   py: 1.2, pz:-3,   tx: 0, ty: 0.5, tz: 0, fov: 40 }],
  [CUTS[3], CUTS[4], { px:-6,   py: 2.0, pz:-7,   tx: 0, ty: 0.5, tz: 0, fov: 38 },
                     { px:-4,   py: 1.5, pz:-8,   tx: 0, ty: 0.5, tz: 0, fov: 36 }],
  [CUTS[4], CUTS[5], { px: 3.5, py: 0.3, pz: 5,   tx: 3.0, ty: 0.2, tz: 3.5, fov: 24 },
                     { px: 4.0, py: 0.4, pz: 5.5, tx: 3.0, ty: 0.2, tz: 3.5, fov: 22 }],
  [CUTS[5], CUTS[6], { px: 0,   py: 12,  pz: 1,   tx: 0, ty: 0,   tz: 0,   fov: 55 },
                     { px: 2,   py: 10,  pz: 1,   tx: 0, ty: 0,   tz: 0,   fov: 52 }],
  [CUTS[6], CUTS[7], { px: 0,   py: 0.6, pz: 7,   tx: 0, ty: 0.5, tz: 0, fov: 18 },
                     { px: 0.5, py: 0.6, pz: 6.5, tx: 0, ty: 0.5, tz: 0, fov: 16 }],
  [CUTS[7], CUTS[8], { px:-14,  py: 3,   pz: 7,   tx: 0, ty: 0.5, tz: 0, fov: 44 },
                     { px: 14,  py: 2.5, pz: 7,   tx: 0, ty: 0.5, tz: 0, fov: 42 }],
  [CUTS[8], CUTS[9], { px: 6,   py: 2.5, pz: 12,  tx: 0, ty: 0.5, tz: 0, fov: 40 },
                     { px: 16,  py: 5,   pz: 24,  tx: 0, ty: 0.5, tz: 0, fov: 34 }],
];
```

**Camera interpolation:** `Easing.out(Easing.cubic)` on `t = (frame - start) / (end - start)`. Lerp all 7 values linearly after easing.

**`CameraRig` component:** `<PerspectiveCamera makeDefault>` with `onUpdate={(c) => { c.lookAt(target); c.updateProjectionMatrix(); }}`.

### 10.4 3D Scene Components

**`CarModel`:**
```tsx
const { scene } = useGLTF(staticFile("zis/scene.glb")) as { scene: THREE.Group };
return <primitive object={scene} scale={1.2} position={[0.168, 68.14, 0]} />;
```
Wrap in `<React.Suspense fallback={null}>`.

**`StudioLights`:**
- `<ambientLight intensity={0.5} color="#FFD8A0" />`
- Key spotLight: orbits `(cos(angle)*6, 5, sin(angle)*4)` where `angle = (frame/1800) * Math.PI * 2`. Intensity 60, color `#FFAA44`, castShadow.
- Cool fill pointLight: `(-4, 3, 2)`, intensity `(0.5 + beatPulse * 0.3) * 12`, color `#A0C8E8`.
- Ground bounce pointLight: `(0, -0.2, 0)`, intensity 6, color `#FFB060`.

**`StudioFloor`:**
- Circle geometry radius 18, material color `#C0BFBE`, roughness 0.4, metalness 0.05. receiveShadow.
- Reflection puddle: circle radius 4, material color `#AAAAAA`, roughness 0.02, metalness 0.6, transparent, opacity `reflectAlpha * 0.4` (fades in over 0→60 frames).

**`StudioBg`:**
- `<fog args={["#C8C6C4", 20, 60]} />`
- Back wall plane `(50×24)` at `(0, 4, -14)`, material color `#BEBCBA`, emissive `#E0DDD8`, emissiveIntensity `0.12 + (0.08 + beatPulse * 0.06) * 0.06`.

**`Environment`:** `files={staticFile("hdri/venice_sunset_1k.hdr")}` `background={false}`.

**`CarScene` (full 3D scene):**
```tsx
<>
  <color attach="background" args={["#000000"]} />
  <CameraRig frame={frame} />
  <StudioLights frame={frame} />
  <StudioBg frame={frame} />
  <StudioFloor frame={frame} />
  <Environment files={staticFile("hdri/venice_sunset_1k.hdr")} background={false} />
  <Suspense fallback={null}><CarModel /></Suspense>
</>
```

### 10.5 2D Overlay Components

Font base: `'Inter', 'Helvetica Neue', sans-serif`, color white, position absolute.

**`SlideText`:** Text sliding in from direction (up/right/left), opacity `useIn * useOut`. `useIn` uses `Easing.out(Easing.cubic)`, dur=16. `useOut` uses `Easing.in(Easing.quad)`, dur=10.

**`StaggerLine`:** Characters stagger in one by one with 1.8 frame offset each, translateY from +14px. Overall `useOut` fade.

**`Metric`:** Label (size 10, letterSpacing 3, `#FFB830`, weight 700) + value (size 46, weight 900, white, letterSpacing -1) + unit (size 16, weight 400, `#778899`). Fades in with translateY from +18px over 20 frames.

**`KineticLine`:** Horizontal golden line, `background: #FFB830`, height 1.5px, `scaleX` animates 0→1 from left over 20 frames. `transformOrigin: "left"`.

**`ShotLabel`:** Top-right corner, shows shot number and name for ~70 frames after cut. Fades in 0→1 over 8 frames, out over 20 frames. Size 10, gold number, separator bar, gray label.

**`SpecTag`:** Small bordered badge: `border: "1px solid rgba(255,184,48,0.5)"`, padding "4px 12px", size 10, color `#FFB830`, scale from 0.85→1.

### 10.6 Overlays per Camera Shot

All overlay text uses `staticFile`-free components (pure CSS/React). Text anchored bottom-left (left: 72, bottom: N) or as specified.

**S1 (0–290):** "ZIS-101A" (size 100, bottom 330), "SPORT · 1938" (size 28, bottom 266, `#AABBCC`), kinetic line (bottom 258, width 520), "SOVIET UNION · ZAVOD IMENI STALINA · OPEN ROADSTER" (size 11, `#FFB830`, bottom 218). All outF=290.

**S2 (CUTS[1]+10 → CUTS[2]-10):** Metric "Year / 1938 / AD" at bottom 250, left 72. Metric "Engine / 6.0 / L" at bottom 250, left 260.

**S3 (CUTS[2]+10 → CUTS[3]-10):** StaggerLine "SOVIET SPORT" (size 36, weight 800, bottom 300). SlideText "ROADSTER" (size 68, weight 900, `#FFB830`, bottom 252).

**S4 (CUTS[3]+12 → CUTS[4]-10):** "CRAFTED FOR THE ELITE" centered in frame, size 30, weight 800, letterSpacing 4, textShadow.

**S5 (CUTS[4]+8 → CUTS[5]-10):** Two SpecTags: "WHITE WALL TYRES" (bottom 220) and "CHROME WIRE WHEELS" (bottom 180), delayed by 16 frames.

**S6 (CUTS[5]+10 → CUTS[6]-10):** Metric "Power / 141 / hp" (bottom 260, left 72), Metric "Top Speed / 162 / km/h" (bottom 260, left 280), delayed 18 frames.

**S7 (CUTS[6]+10 → CUTS[7]-10):** "INLINE SIX" (size 58, weight 900, top 180), kinetic line (top 248, width 340), "6,003cc · 141 BHP · 3-SPEED GEARBOX" (size 11, `#FFB830`, top 264).

**S8 (CUTS[7]+20 → CUTS[8]-20):** Minimal. KineticLine (bottom 240, width 180), SlideText "ZIS-101A SPORT" (size 13, `#AABBCC`, letterSpacing 5, bottom 200).

**S9 (CUTS[8]+16 → 1795):** "ZIS-101A" (size 110, weight 900, bottom 340), "THE PRIDE OF THE SOVIET UNION" (size 22, weight 300, `#AABBCC`, letterSpacing 8, bottom 270), kinetic line (bottom 262, width 560).

**Beat-reactive corner accents (always on after BEAT0):**
- Top-left: `borderLeft + borderTop`, gold, 32×32, opacity `0.3 + bp * 0.7`, scale `1 + bp * 0.15`.
- Bottom-right: `borderRight + borderBottom`, same.

### 10.7 Film Effects (ArchViz section)

**`Letterbox`:** 88px top/bottom black bars.

**`Vignette`:** `radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.7) 100%)`.

**`CutFlash`:** White flash at each cut in CUTS (except first/last). Decay over 3 frames, peak 0.45.

**`FilmGrain`:** SVG fractalNoise, `baseFrequency='0.8'`, `numOctaves='4'`. Shift position: `(frame * 19) % 220`. Opacity **0.4** (fixed, no beat pulse). `mixBlendMode: "overlay"`.

**`ScanLines`:** `repeating-linear-gradient(0deg, transparent 3px, rgba(0,0,0,0.025) 3px, rgba(0,0,0,0.025) 4px)`.

**`FilmBurn`** (frames 0–32 only, for standalone ArchViz use): Animating amber/orange burn blob sweeping from top-left, white-hot overexposure peak at frames 14–22, black leader at frames 0–3. **NOT rendered when `noAudio=true`** (i.e. when nested in ZISShowcase). The fade-to-black at the end of SceneResurrection serves as the transition instead.

**Motion blur at cuts:** `blur = max(0, (5-d)/5 * 30)` for d < 5 frames from any cut. Applied as CSS `filter: blur(${blur}px)` on the ThreeCanvas wrapper div.

### 10.8 ArchViz Root

```tsx
export const ArchViz: React.FC<{ noAudio?: boolean }> = ({ noAudio = false }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const blur = cutBlur(frame);
  return (
    <AbsoluteFill style={{ background: "#000000", overflow: "hidden" }}>
      {!noAudio && <Audio src={staticFile("archviz-audio.mp3")} />}
      {!noAudio && <Audio src={staticFile("cassette-sound.mp3")} startFrom={0} endAt={30} />}
      <div style={{ position: "absolute", inset: 0, filter: blur > 1 ? `blur(${blur}px)` : undefined }}>
        <ThreeCanvas width={width} height={height} style={{ background: "#000000" }}>
          <CarScene frame={frame} />
        </ThreeCanvas>
      </div>
      <Vignette />
      <ScanLines />
      <FilmGrain frame={frame} />
      <Overlays frame={frame} />
      <CutFlash frame={frame} />
      <Letterbox />
    </AbsoluteFill>
  );
};
```

Note: `FilmBurn` is intentionally omitted from the render tree (removed for aesthetic reasons — the legacy intro's fade-to-black handles the transition).

---

## 11. RENDER SCRIPT

`scripts/zis-showcase/render.mjs`:

```js
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "../..");   // ← two levels up (scripts/zis-showcase/ → project root)
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
  chromiumOptions: { gl: "angle" },   // ← required for WebGL/Three.js
  onProgress: ({ progress, renderedFrames }) => {
    const pct = Math.round(progress * 100);
    const bar = "█".repeat(Math.floor(pct / 5)) + "░".repeat(20 - Math.floor(pct / 5));
    process.stdout.write(`\r  [${bar}] ${pct}%  (${renderedFrames}/${d} frames)`);
  },
});

console.log(`\nDone -> ${OUT}`);
```

**Run with:** `cd /absolute/path/to/project && node scripts/zis-showcase/render.mjs`

Never run with a relative path or from a subdirectory — the working directory must be the project root.

---

## 12. GITIGNORE ADDITIONS

```
output/
public/zis/
public/hdri/
public/zis-photos/
public/zis-video/
public/*.mp3
public/*.hdr
*.tsbuildinfo
.DS_Store
```

---

## 13. BUILD ORDER

Execute in this sequence:

1. `npm install` (ensure all packages in Section 2 are present)
2. Download assets (Section 5): GLB model, HDRI, archive photos, footage, music
3. Write `src/Root.tsx` (Section 4)
4. Write `src/projects/zis-showcase/ArchViz.tsx` (Section 10)
5. Write `src/projects/zis-showcase/ZISShowcase.tsx` (Section 9)
6. Write `scripts/zis-showcase/render.mjs` (Section 11)
7. Verify TypeScript: `npx tsc --noEmit`
8. Preview in Remotion Studio: `npm run studio` — navigate to ZISShowcase, scrub through timeline
9. Render: `cd /project/root && node scripts/zis-showcase/render.mjs`
10. Open output: `open output/zis-showcase-final.mp4`

---

## 14. VERIFICATION CHECKLIST

Before declaring done, verify every item:

**Architecture:**
- [ ] `ThreeCanvas` used (not raw R3F `Canvas`)
- [ ] No `useFrame()` anywhere — all animation from `useCurrentFrame()`
- [ ] `<React.Suspense fallback={null}>` wraps `CarModel` (uses `useGLTF`)
- [ ] `chromiumOptions: { gl: "angle" }` in render script
- [ ] ROOT path in render script uses `"../.."` (not `".."`)
- [ ] `ArchViz` accepts `noAudio?: boolean` — `<Audio>` suppressed when true
- [ ] ZISShowcase passes `<ArchViz noAudio />` inside the Sequence

**Timeline:**
- [ ] Total frames: 2910 (97s @ 30fps)
- [ ] Legacy Intro Sequence: from=0, durationInFrames=960
- [ ] 3D Sequence: from=960, durationInFrames=1800
- [ ] Credits Sequence: from=2760, durationInFrames=150
- [ ] Root.tsx registers ZISShowcase with durationInFrames=2910

**Beat sync:**
- [ ] Legacy CUTS array has 12 entries matching table in Section 8
- [ ] ArchViz CUTS array values = video_beat_frame − 960 (verified against Section 8 table)
- [ ] BEAT0 = 10

**Effects:**
- [ ] `sepiaFade(frame)` fades 1→0 from frame 0→480
- [ ] All 5 sepia filter values multiplied by `sepiaFade(frame)`
- [ ] FilmScratches, Flicker, HorizontalTear wrapped in single `opacity: sepiaFade(frame)` div
- [ ] FilmGrain opacity = 0.4 (fixed) in ArchViz
- [ ] FilmBurn removed from ArchViz render tree
- [ ] Music volume fades 1→0 over frames 2700–2760

**Visuals:**
- [ ] Letterbox (88px bars) present in both Legacy and ArchViz
- [ ] Car model sits on floor (Y=0) — `position={[0.168, 68.14, 0]} scale={1.2}`
- [ ] SceneResurrection fades to black over lf 163–179
- [ ] Credits card has all 4 attribution rows + 3 tool badges

---

## 15. KNOWN QUIRKS AND FIXES

| Issue | Cause | Fix |
|---|---|---|
| Render uses wrong bundle / stale output | Working directory is not project root | Always prefix: `cd /abs/path &&` |
| Car floats above floor | GLB has baked Y-translation of 57.784 in root node | `position={[0.168, 68.14, 0]}` with `scale={1.2}` |
| WebGL fails in headless render | Chromium default GL mode | `chromiumOptions: { gl: "angle" }` |
| Audio plays twice in nested use | Both parent and ArchViz have `<Audio>` | Pass `noAudio` prop to ArchViz when nested |
| Beat cuts feel early/late | Using BPM formula instead of librosa-detected frames | Use exact frame values from Section 8 table — do not recalculate |
| TypeScript errors on `useGLTF` return | Missing cast | `const { scene } = useGLTF(...) as { scene: THREE.Group }` |
| Film effects present after 16s | Not using `sepiaFade` wrapper | Wrap FilmScratches/Flicker/HorizontalTear div with `opacity: sepiaFade(frame)` |
