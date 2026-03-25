# ZIS-101A Sport Showcase — Build Learnings & Prompt Enhancement Guide

## 1. Project Summary

A 97-second cinematic showcase for the ZIS-101A Sport (1938) Soviet prototype car, built entirely in code using Remotion + React Three Fiber + Three.js. The video combines two distinct aesthetic registers:

- **0–32s**: Archival/legacy intro — 2D mograph with film grain, sepia, scratches, countdown leader, typography scenes, and real archive photos/footage
- **32–92s**: 3D visualization — beat-synced camera choreography around a Sketchfab model rendered in WebGL
- **92–97s**: Credits card with attribution and tools used

Output: `output/zis-showcase-final.mp4` — 2910 frames @ 30fps, 1920×1080, H.264

---

## 2. Full Build Process

### Phase 1 — Stack Setup

**What was done:**
- Started with a flat Remotion project (`src/compositions/`)
- Added `@remotion/three`, `@react-three/fiber`, `@react-three/drei`, `three`, `@types/three`
- Established the critical render option: `chromiumOptions: { gl: "angle" }` — required for WebGL in headless Chromium

**Key insight:**
`<ThreeCanvas>` from `@remotion/three` is not optional — it overrides Three.js's internal render loop to `frameloop: "never"` so Remotion drives each frame on demand. Raw `useEffect` + `renderer.render()` approaches produce undefined behavior during scrubbing and export.

---

### Phase 2 — 3D Section (ArchViz)

**What was done:**
- Loaded a `.glb` model via `useGLTF()` from `@react-three/drei`
- Set up HDRI environment lighting, contact shadows, `PerspectiveCamera`
- Defined 9 camera shots with explicit position/target keyframes
- Drove all camera animation via `useCurrentFrame()` — no `useFrame()`, no `useEffect()`

**Key pattern — frame-driven camera:**
```ts
const t = (frame - CUTS[shotIdx]) / shotDur;
const eased = Easing.inOut(Easing.cubic)(t);
camera.position.lerpVectors(shotA.pos, shotB.pos, eased);
```

**Pain points:**
- `useGLTF` suspends — wrap the entire `<ThreeCanvas>` subtree in `<React.Suspense>` with a fallback
- `drei` components like `<Environment>` and `<ContactShadows>` are not aware of Remotion's frame clock — they are purely static/reactive and work fine
- Model needed manual scale/rotation tuning; no way around it without inspecting the GLB

---

### Phase 3 — 2D Legacy Intro

**What was done:**
- 8 scenes, each a named React component: `CountdownLeader`, `SceneEra`, `SceneCarName`, `SceneStory`, `SceneSpecs`, `SceneArchive`, `SceneLegacy`, `SceneResurrection`
- All animations via `interpolate()` with `extrapolateLeft/Right: "clamp"`
- Archival film effects as pure CSS/SVG: grain, scratches, vignette, flicker, horizontal tear

**Key pattern — film effect fade:**
```ts
function sepiaFade(frame: number) {
  return interpolate(frame, [0, 480], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
}
// Applied multiplicatively to each filter value:
filter: `grayscale(1) sepia(${(0.35 * sepiaFade(frame)).toFixed(3)}) contrast(1.2)`
```
This fades ALL archival effects (sepia, scan lines, flicker, jitter) smoothly to zero by 16s — the point where the footage transitions from archive to modern.

---

### Phase 4 — Beat Synchronization

**What was done:**
- Used Python `librosa` to detect BPM (123.05) and per-beat timestamps from `showcase-music.mp3`
- Converted beat timestamps to frame numbers at 30fps
- Snapped all 2D scene boundaries and sub-cuts to exact detected beat frames
- Computed ArchViz camera cut positions relative to section start frame (960)

**Beat detection script:**
```python
import librosa, numpy as np
y, sr = librosa.load("public/showcase-music.mp3")
tempo, beats = librosa.beat.beat_track(y=y, sr=sr)
beat_times = librosa.frames_to_time(beats, sr=sr)
beat_frames = np.round(beat_times * 30).astype(int)
```

**Critical offset mistake (and fix):**
When ArchViz starts at video frame 960, all beat positions *within* ArchViz must be offset:
```ts
// WRONG: used when ArchViz started at frame 900
const CUTS = [0, 363, 524, 700, 875, 1037, 1212, 1373, 1709, 1800];

// CORRECT: after shifting transition to 32s (frame 960)
const CUTS = [0, 303, 464, 640, 815,  977, 1152, 1313, 1649, 1800];
// Each value = video_beat_frame - 960
```
This caused a silent render bug — the output looked correct but used stale bundler cache because the ROOT path in the render script was wrong (see Phase 6).

---

### Phase 5 — Hybrid Composition Pattern

**The key architectural pattern:**

```tsx
export const ZISShowcase: React.FC = () => (
  <AbsoluteFill>
    <Audio src={staticFile("showcase-music.mp3")}
      volume={(f) => interpolate(f, [2700, 2760], [1, 0], { ... })} />

    <Sequence from={0}   durationInFrames={960}  name="Legacy Intro">
      <LegacyIntro />   {/* pure 2D */}
    </Sequence>

    <Sequence from={960} durationInFrames={1800} name="3D B-Roll">
      <ArchViz noAudio />  {/* WebGL — noAudio suppresses internal audio */}
    </Sequence>

    <Sequence from={2760} durationInFrames={150} name="Credits">
      <SceneCredits />
    </Sequence>
  </AbsoluteFill>
);
```

**`noAudio` prop pattern:**
When `ArchViz` is used standalone it plays its own audio. When nested inside `ZISShowcase`, pass `noAudio` to suppress the internal `<Audio>` — the parent composition owns the audio timeline.

---

### Phase 6 — Codebase Organization

**What was done:**
- Moved from flat `src/compositions/` to `src/projects/<name>/`
- Moved render scripts from `scripts/render-<name>.mjs` to `scripts/<name>/render.mjs`
- Fixed all ROOT paths in nested scripts

**The ROOT path bug:**
```js
// BROKE after moving scripts to subdirectory:
const ROOT = path.join(__dirname, "..");      // → scripts/ (wrong)

// FIX:
const ROOT = path.join(__dirname, "../..");   // → project root (correct)
```
This was a silent failure — Remotion would bundle from `scripts/` instead of the project root, resolving public assets and entry points incorrectly, sometimes using a stale cached bundle and producing renders that didn't reflect code changes.

---

### Phase 7 — Working Directory Trap

**What happened:**
A `cd public/zis-video` command in a background bash task persisted the working directory for subsequent shell commands. Running `node scripts/zis-showcase/render.mjs` then resolved to `/public/zis-video/scripts/...` — wrong path.

**Fix:** Always use `cd /absolute/project/root && node ...` for render commands rather than relative paths.

---

### Phase 8 — Credits & Attribution

**Asset sources discovered from conversation history:**

| Asset | Source | Creator | License |
|---|---|---|---|
| 3D Car Model | sketchfab.com/3d-models/zis-101a-sport-1938-a361c0f7b7e041fc8f3437a5cbec681a | Comrade1280 | CC BY 4.0 |
| Archive Footage | britishpathe.com | British Pathé | All Rights Reserved |
| Archive Photos | commons.wikimedia.org/wiki/Category:ZIS-Sport | Wikimedia Commons | Public Domain |
| Music | archive.org/details/ActionCinematicMusic | Serge Quadrado | CC BY 4.0 |

---

## 3. Technical Learnings (Condensed)

### Remotion

| Topic | Learning |
|---|---|
| CSS animations | Forbidden — all motion must use `useCurrentFrame()` + `interpolate()` |
| `extrapolateLeft/Right` | Must always be `"clamp"` — missing clamping causes values to blow up outside keyframe range |
| `<Sequence>` frame reset | Inside a Sequence, `useCurrentFrame()` returns 0 at the Sequence start — never add the parent offset manually |
| Audio volume | `volume` prop accepts `(frame: number) => number` for per-frame control — use `interpolate()` inside it |
| `<Audio>` in nested composition | Use a `noAudio` prop pattern to suppress when parent owns the audio timeline |
| Render scripts | Always `cd` to project root before running; use `__dirname` + `"../.."` for scripts in subdirectories |

### React Three Fiber + @remotion/three

| Topic | Learning |
|---|---|
| `ThreeCanvas` | Required — replaces R3F's `<Canvas>` for Remotion compatibility |
| Animation | Drive everything from `frame` prop derived from `useCurrentFrame()` — never `useFrame()` |
| `useGLTF` | Suspends on load — must wrap in `<React.Suspense>` |
| WebGL render option | `chromiumOptions: { gl: "angle" }` in `renderMedia()` is mandatory for headless export |
| Camera | Manage camera imperatively via `useThree((s) => s.camera)` + lerp between shot keyframes per frame |
| Environment | `<Environment>` from drei works fine — it's static, not time-dependent |

### Beat Sync

| Topic | Learning |
|---|---|
| BPM detection | `librosa.beat.beat_track()` gives BPM and per-beat frame indices — more reliable than manual calculation |
| Frame snapping | Always snap to *detected* beat frames, not BPM-formula frames — detected frames account for drift |
| Section offsets | When a composition starts at frame N, all beat positions within it must be `video_beat_frame - N` |
| Sub-cuts | Scene-internal cuts (word reveals, photo transitions) benefit from beat alignment even if small |

### Film Effects

| Effect | Implementation |
|---|---|
| Film grain | SVG `<feTurbulence>` filter applied as `backgroundImage` data URI — shift `backgroundPosition` per frame |
| Sepia fade | Multiply sepia value by interpolated factor: `sepia(${0.35 * fade})` |
| Scan lines / flicker / jitter | Wrap in a single `<div style={{ opacity: fade }}>` — one fade drives all three |
| Film burn | SVG radial gradient animated opacity — remove if too heavy for the aesthetic |
| Letterbox | Simple absolute positioned top/bottom `<div>` bars — extremely cheap |

---

## 4. What to Do Differently Next Time

1. **Pin the section start frame early** — changing the 2D→3D transition from 30s to 32s required recomputing all ArchViz beat offsets. Finalize timing before beat-syncing.

2. **Parameterize `ARCHVIZ_START`** — define it once in a shared constants file and import it in both `ZISShowcase.tsx` and the beat detection script.

3. **Keep render scripts in one place** — flat `scripts/*.mjs` avoids the ROOT path bug entirely. Only use subdirectories if the project has many compositions.

4. **Beat detect before building scenes** — run librosa first, output a JSON of beat frames, import that JSON in the composition. Don't hardcode BPM math.

5. **Working directory discipline** — never `cd` in a background task that might persist. Always prefix render commands with `cd /project/root &&`.

6. **Asset source logging** — keep a `docs/assets.md` from day one, recording source URL, creator, and license as each asset is downloaded. Don't reconstruct this from chat history later.

---

## 5. Enhanced Build Prompt for 3D + Mograph Use Cases

The following sections should be added to or replace parts of the existing `CLAUDE.md` when building a 3D + mograph Remotion composition.

---

### 5.1 — Stack Declaration Block

Add this at the top of the MSD or as a required preamble:

```
STACK:
  renderer: remotion@4.x
  3d_engine: @remotion/three + @react-three/fiber + @react-three/drei
  audio_sync: librosa (beat detection) | manual (BPM formula)
  assets:
    model: <sketchfab_url_or_local_glb>
    hdri: <hdri_url_or_local_hdr>
    audio: <path_to_mp3>
    footage: <list_of_clips>
    photos: <list_of_images>

TIMELINE:
  total_duration_frames: <N>
  fps: 30
  sections:
    - name: "Legacy Intro"
      from: 0
      duration: <frames>
      type: 2d_mograph
    - name: "3D B-Roll"
      from: <frame>
      duration: <frames>
      type: 3d_webgl
    - name: "Credits"
      from: <frame>
      duration: 150
      type: 2d_mograph
```

---

### 5.2 — Beat Sync Specification

```
AUDIO_SYNC:
  bpm: <detected_or_specified>
  beat_frames: [<list_of_frame_numbers>]  # output of librosa, at 30fps
  section_beat_offset: <start_frame_of_3d_section>
  cut_points:
    legacy_intro:
      - frame: <N>   # scene boundary
      - frame: <N>   # sub-cut (word reveal, photo swap)
    archviz:
      - archviz_frame: <N>   # = video_frame - section_start
      - archviz_frame: <N>
```

**Rule:** All `archviz_frame` values must equal `video_beat_frame - ARCHVIZ_START`. Validate this before coding.

---

### 5.3 — Camera Shot Specification (3D Section)

```
CAMERA_SHOTS:
  - id: S1
    name: "Hero wide"
    archviz_frames: [0, 303]
    position: [x, y, z]
    target: [x, y, z]
    easing: inOutCubic
  - id: S2
    name: "Tight front"
    archviz_frames: [303, 464]
    position: [x, y, z]
    target: [x, y, z]
    easing: inOutCubic
  # ... one entry per beat-aligned cut
```

**Rule:** Position/target are always lerped linearly between frames `[CUTS[i], CUTS[i+1]]` using the specified easing. Do not use spring for camera — it causes overshoot that looks wrong on cars.

---

### 5.4 — Film Effects Specification

```
FILM_EFFECTS:
  section: legacy_intro   # which section(s) to apply to
  effects:
    grain:
      type: svg_turbulence
      opacity: 0.18
      fade_out_by_frame: 480   # 0 = no fade
    sepia:
      initial_value: 0.35
      fade_out_by_frame: 480
    scan_lines: true
    flicker: true
    horizontal_jitter: true
    vignette: true
    letterbox:
      height_px: 88
    cut_flash:
      frames: [<list_of_cut_frames>]
      peak_opacity: 0.6
      duration_frames: 6
```

**Rule:** `fade_out_by_frame` uses `interpolate(frame, [0, N], [1, 0])` as a multiplier on the effect's opacity/value. All "archival" effects should share the same fade-out frame so they disappear together.

---

### 5.5 — Hybrid Composition Rules

```
COMPOSITION_RULES:
  audio_ownership: parent_composition_only
    # nested 3D composition must accept noAudio?: boolean prop
    # parent passes noAudio when nested, plays audio standalone
  sequence_pattern:
    root: ZISShowcase (or project name)
      audio: <Audio> at root level with volume fade
      sequences:
        - Legacy2D: Sequence from=0
        - ThreeD: Sequence from=<N> with noAudio
        - Credits: Sequence from=<M>
  credits_required: true
    assets: [model, footage, photos, music]
    tools: [Claude, Remotion, Three.js]
    duration_frames: 150
```

---

### 5.6 — Render Script Requirements

```
RENDER_SCRIPT:
  location: scripts/<project-name>/render.mjs
  root_path: path.join(__dirname, "../..")   # always two levels up from scripts/<name>/
  chromium_options:
    gl: "angle"   # required for WebGL/Three.js
  concurrency: 4
  codec: h264
  output: output/<project-name>-final.mp4
```

---

### 5.7 — Asset Attribution Template

```
CREDITS:
  - category: "3D MODEL"
    title: "<model name>"
    author: "<creator username>"
    url: "<sketchfab or source url>"
    license: "CC BY 4.0"
  - category: "FOOTAGE"
    title: "<footage name>"
    author: "<source>"
    url: "<url>"
    license: "<license>"
  - category: "MUSIC"
    title: "<track name>"
    author: "<artist>"
    url: "<url>"
    license: "<license>"
  tools_used: [Claude, Remotion, Three.js]
```

---

### 5.8 — Quality Checklist (3D + Mograph)

In addition to the existing MSD quality checklist, verify:

- [ ] `ThreeCanvas` used (not raw R3F `Canvas`)
- [ ] No `useFrame()` anywhere — all animation driven by `useCurrentFrame()` prop
- [ ] `<React.Suspense>` wrapping any `useGLTF` / `useTexture` usage
- [ ] `chromiumOptions: { gl: "angle" }` in render script
- [ ] All ArchViz beat offsets validated against formula: `archviz_frame = video_beat_frame - ARCHVIZ_START`
- [ ] Nested composition accepts `noAudio?: boolean` and suppresses `<Audio>` when true
- [ ] ROOT path in render script uses correct number of `../` levels
- [ ] Render command prefixed with `cd /absolute/project/root &&`
- [ ] Film effects share a single `sepiaFade(frame)` multiplier
- [ ] Credits card includes all asset sources and tool attributions
- [ ] Music `volume` prop fades out over last 60–90 frames before credits start

---

## 6. Build Prompt Template (Complete)

The following is a drop-in replacement for the MSD header when creating a 3D + mograph piece:

```
# Motion Specification: <PROJECT NAME>

## Overview
<One paragraph describing the piece: subject, mood, duration, key sections>

## Stack
renderer: remotion 4.x
3d: @remotion/three + react-three-fiber + drei
audio: <source>
model: <sketchfab URL or local GLB path>
hdri: <HDRI source>

## Timeline
fps: 30
total: <N> frames (<M> seconds)
sections:
  2d_intro:   frames 0–<A>     (archival / mograph)
  3d_section: frames <A>–<B>   (WebGL car visualization)
  credits:    frames <B>–<B+150>

## Aesthetic
2d_section:
  color_palette: [<hex list>]
  typography: serif for titles, monospace for metadata
  film_effects: grain / sepia / scratches / flicker / vignette
  film_effect_fade_complete_by: frame <N>

3d_section:
  background: <hdri name or color>
  lighting: environment + contact shadows
  grain_opacity: 0.4
  camera_easing: inOutCubic per shot

## Audio Sync
bpm: <detected>
beat_frames: [<list>]    # 30fps frame indices
3d_section_beat_offset: <ARCHVIZ_START frame>
cut_points:
  2d: [<list of video frames>]
  3d: [<list of archviz frames = video_beat_frame - ARCHVIZ_START>]

## Camera Shots (3D section)
# One block per beat-aligned cut:
S1 [0–303]:     position [x,y,z] → target [x,y,z]   "Hero wide"
S2 [303–464]:   position [x,y,z] → target [x,y,z]   "Tight front"
...

## Scenes (2D section)
# One block per scene:
S1 CountdownLeader [0–72]:   film leader countdown 6→1
S2 Era Title [72–189]:       city/year title card with Ken Burns photo
...

## Credits
model:   <title> by <author> — <url> — <license>
footage: <title> by <author> — <url> — <license>
photos:  <title> by <author> — <url> — <license>
music:   <title> by <author> — <url> — <license>
tools:   Claude, Remotion, Three.js

## Output
file: output/<name>-final.mp4
codec: h264
resolution: 1920x1080
```

---

## 7. Summary of Highest-Impact Improvements

| Priority | Change | Why |
|---|---|---|
| 1 | Add beat_frames JSON as input | Eliminates entire class of offset bugs |
| 2 | Parameterize ARCHVIZ_START | Changing transition timing won't break beat sync |
| 3 | Declare noAudio pattern in prompt | Prevents duplicate audio in nested compositions |
| 4 | Mandate ROOT path formula in prompt | Eliminates silent bundler cache bugs |
| 5 | Add camera shot spec format | Claude can generate correct lerp code directly |
| 6 | Add film_effect_fade_by_frame spec | Sepia/grain/jitter all fade in sync without extra requests |
| 7 | Include credits template | Attribution handled in first pass, not retrofitted at end |
| 8 | Add `cd /root &&` render rule | Prevents working directory trap in background tasks |
