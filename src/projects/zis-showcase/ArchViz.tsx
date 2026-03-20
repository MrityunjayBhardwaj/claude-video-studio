import React, { Suspense } from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Easing,
  Audio,
  staticFile,
} from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useGLTF, Environment, ContactShadows, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";

// ── BEAT DATA (123.05 BPM @ 30fps, synced to showcase-music.mp3) ─────────────
// ArchViz starts at video frame 960 (32s); beat offsets computed accordingly.
const BPM = 123.05;
const SPB = 60 / BPM;          // seconds per beat ≈ 0.488s
const FPB = SPB * 30;          // frames per beat  ≈ 14.63
const BAR = FPB * 4;           // frames per bar   ≈ 58.5

// First beat within this ArchViz section = video beat 66 = ArchViz frame 10
const BEAT0 = 10;

// Cut points — snapped to detected beat frames of showcase-music.mp3
const CUTS = [
  0,
  303,   // beat 86  – S2 tight front
  464,   // beat 97  – S3 side low
  640,   // beat 109 – S4 rear 3/4
  815,   // beat 121 – S5 wheel close
  977,   // beat 132 – S6 overhead
  1152,  // beat 144 – S7 front grill
  1313,  // beat 155 – S8 orbit wide
  1649,  // beat 178 – S9 hero pull-back
  1800,
];

// Beat pulse (1 on beat, fades to 0 over the beat)
function beatPulse(frame: number): number {
  if (frame < BEAT0) return 0;
  const phase = ((frame - BEAT0) % FPB) / FPB;
  return Math.max(0, 1 - phase * 3); // sharp attack, quick decay
}

// ── CAMERA SHOTS ──────────────────────────────────────────────────────────────
type Cam = { px: number; py: number; pz: number; tx: number; ty: number; tz: number; fov: number };

const SHOTS: [number, number, Cam, Cam][] = [
  // [startFrame, endFrame, camFrom, camTo]
  // S1 — Slow pull back, car emerges (0-366)  car ~4.2m wide, pull back to z=14
  [0,    CUTS[1], { px: 0,   py: 2.0, pz: 10,  tx: 0, ty: 0.5, tz: 0, fov: 36 },
                  { px: 0,   py: 1.8, pz: 14,  tx: 0, ty: 0.5, tz: 0, fov: 32 }],
  // S2 — Tight front low (366-534)
  [CUTS[1], CUTS[2], { px: 0,   py: 0.4, pz: 8,   tx: 0, ty: 0.5, tz: 0, fov: 38 },
                     { px: 2.0, py: 0.6, pz: 7.5, tx: 0, ty: 0.5, tz: 0, fov: 35 }],
  // S3 — Side sweep low (534-702)
  [CUTS[2], CUTS[3], { px:-9,   py: 0.8, pz: 2,   tx: 0, ty: 0.5, tz: 0, fov: 42 },
                     { px:-8,   py: 1.2, pz:-3,   tx: 0, ty: 0.5, tz: 0, fov: 40 }],
  // S4 — Rear 3/4 dramatic (702-870)
  [CUTS[3], CUTS[4], { px:-6,   py: 2.0, pz:-7,   tx: 0, ty: 0.5, tz: 0, fov: 38 },
                     { px:-4,   py: 1.5, pz:-8,   tx: 0, ty: 0.5, tz: 0, fov: 36 }],
  // S5 — Wheel macro (870-1038)
  [CUTS[4], CUTS[5], { px: 3.5, py: 0.3, pz: 5,   tx: 3.0, ty: 0.2, tz: 3.5, fov: 24 },
                     { px: 4.0, py: 0.4, pz: 5.5, tx: 3.0, ty: 0.2, tz: 3.5, fov: 22 }],
  // S6 — Overhead bird's eye (1038-1206)
  [CUTS[5], CUTS[6], { px: 0,   py: 12,  pz: 1,   tx: 0, ty: 0,   tz: 0,   fov: 55 },
                     { px: 2,   py: 10,  pz: 1,   tx: 0, ty: 0,   tz: 0,   fov: 52 }],
  // S7 — Grill nose ultra tight (1206-1374)
  [CUTS[6], CUTS[7], { px: 0,   py: 0.6, pz: 7,   tx: 0, ty: 0.5, tz: 0, fov: 18 },
                     { px: 0.5, py: 0.6, pz: 6.5, tx: 0, ty: 0.5, tz: 0, fov: 16 }],
  // S8 — Orbit wide full pass (1374-1710)
  [CUTS[7], CUTS[8], { px:-14,  py: 3,   pz: 7,   tx: 0, ty: 0.5, tz: 0, fov: 44 },
                     { px: 14,  py: 2.5, pz: 7,   tx: 0, ty: 0.5, tz: 0, fov: 42 }],
  // S9 — Hero pull-back final (1710-1800)
  [CUTS[8], CUTS[9], { px: 6,   py: 2.5, pz: 12,  tx: 0, ty: 0.5, tz: 0, fov: 40 },
                     { px: 16,  py: 5,   pz: 24,  tx: 0, ty: 0.5, tz: 0, fov: 34 }],
];

function getCamera(frame: number): Cam {
  for (const [start, end, from, to] of SHOTS) {
    if (frame >= start && frame < end) {
      const t = Easing.out(Easing.cubic)((frame - start) / (end - start));
      return {
        px: from.px + (to.px - from.px) * t,
        py: from.py + (to.py - from.py) * t,
        pz: from.pz + (to.pz - from.pz) * t,
        tx: from.tx + (to.tx - from.tx) * t,
        ty: from.ty + (to.ty - from.ty) * t,
        tz: from.tz + (to.tz - from.tz) * t,
        fov: from.fov + (to.fov - from.fov) * t,
      };
    }
  }
  return SHOTS[SHOTS.length - 1][3];
}

// Motion blur at cuts
function cutBlur(frame: number): number {
  for (const c of CUTS.slice(1, -1)) {
    const d = Math.abs(frame - c);
    if (d < 5) return ((5 - d) / 5) * 30;
  }
  return 0;
}

// ── CAR MODEL ─────────────────────────────────────────────────────────────────
const CarModel: React.FC = () => {
  const { scene } = useGLTF(staticFile("zis/scene.glb")) as { scene: THREE.Group };
  // Root Sketchfab_model matrix has Y translation of -57.17 baked in (FBX export artifact).
  // scale=0.6 → car bottom ends up at 0.6 * -57.784 = -34.67, add 34.67 to sit on floor.
  // scale=1.2 → position offset = 1.2 * [0.14, 57.784, 0], pulled down 1.2 units
  return <primitive object={scene} scale={1.2} position={[0.168, 68.14, 0]} />;
};

// ── CAMERA RIG ────────────────────────────────────────────────────────────────
const CameraRig: React.FC<{ frame: number }> = ({ frame }) => {
  const cam = getCamera(frame);
  const target = new THREE.Vector3(cam.tx, cam.ty, cam.tz);
  return (
    <PerspectiveCamera
      makeDefault
      position={[cam.px, cam.py, cam.pz]}
      fov={cam.fov}
      near={0.01}
      far={500}
      onUpdate={(c) => { c.lookAt(target); c.updateProjectionMatrix(); }}
    />
  );
};

// ── STUDIO LIGHTING ───────────────────────────────────────────────────────────
const StudioLights: React.FC<{ frame: number }> = ({ frame }) => {
  // Animated key light orbit — full sweep over 60s
  const angle = (frame / 1800) * Math.PI * 2;
  const kx = Math.cos(angle) * 6;
  const kz = Math.sin(angle) * 4;

  // Beat-reactive fill intensity
  const bp = beatPulse(frame);
  const fillInt = 0.5 + bp * 0.3;

  return (
    <>
      <ambientLight intensity={0.5} color="#FFD8A0" />
      {/* Key light — warm sunset from upper-right */}
      <spotLight
        position={[kx, 5, kz]}
        intensity={60}
        color="#FFAA44"
        angle={0.5}
        penumbra={0.9}
        castShadow
        shadow-mapSize={[2048, 2048]}
        target-position={[0, 0, 0]}
      />
      {/* Cool sky fill from opposite side */}
      <pointLight position={[-4, 3, 2]} intensity={fillInt * 12} color="#A0C8E8" />
      {/* Soft ground bounce */}
      <pointLight position={[0, -0.2, 0]} intensity={6} color="#FFB060" />
    </>
  );
};

// ── STUDIO FLOOR ─────────────────────────────────────────────────────────────
const StudioFloor: React.FC<{ frame: number }> = ({ frame }) => {
  const reflectAlpha = interpolate(frame, [0, 60], [0, 0.6], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  return (
    <>
      {/* Main floor — neutral gray to match Sketchfab studio */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <circleGeometry args={[18, 64]} />
        <meshStandardMaterial color="#C0BFBE" roughness={0.4} metalness={0.05} />
      </mesh>
      {/* Reflection puddle */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
        <circleGeometry args={[4, 64]} />
        <meshStandardMaterial
          color="#AAAAAA"
          roughness={0.02}
          metalness={0.6}
          transparent
          opacity={reflectAlpha * 0.4}
        />
      </mesh>
    </>
  );
};

// ── BACKGROUND ENV ────────────────────────────────────────────────────────────
const StudioBg: React.FC<{ frame: number }> = ({ frame }) => {
  // Subtle beat-reactive background glow
  const bp = beatPulse(frame);
  const glow = 0.08 + bp * 0.06;
  return (
    <>
      <fog attach="fog" args={["#C8C6C4", 20, 60]} />
      {/* Back wall — neutral gray studio sweep */}
      <mesh position={[0, 4, -14]}>
        <planeGeometry args={[50, 24]} />
        <meshStandardMaterial color="#BEBCBA" roughness={1} metalness={0} emissive="#E0DDD8" emissiveIntensity={0.12 + glow * 0.06} />
      </mesh>
    </>
  );
};

// ── FULL 3D SCENE ─────────────────────────────────────────────────────────────
const CarScene: React.FC<{ frame: number }> = ({ frame }) => (
  <>
    <color attach="background" args={["#000000"]} />
    <CameraRig frame={frame} />
    <StudioLights frame={frame} />
    <Environment files={staticFile("hdri/venice_sunset_1k.hdr")} background={false} />
    <Suspense fallback={null}>
      <CarModel />
    </Suspense>
  </>
);

// ── KINETIC TEXT ──────────────────────────────────────────────────────────────
function useIn(frame: number, inF: number, dur = 16) {
  return interpolate(frame, [inF, inF + dur], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
}
function useOut(frame: number, outF: number, dur = 10) {
  return interpolate(frame, [outF - dur, outF], [1, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
    easing: Easing.in(Easing.quad),
  });
}

const SlideText: React.FC<{
  text: string; frame: number; inF: number; outF: number;
  style?: React.CSSProperties; dir?: "up" | "right" | "left";
}> = ({ text, frame, inF, outF, style = {}, dir = "up" }) => {
  if (frame < inF - 4 || frame > outF + 4) return null;
  const t = useIn(frame, inF) * useOut(frame, outF);
  const slide = dir === "up" ? `translateY(${(1 - useIn(frame, inF)) * 24}px)`
    : dir === "right" ? `translateX(${(1 - useIn(frame, inF)) * -32}px)`
    : `translateX(${(1 - useIn(frame, inF)) * 32}px)`;
  return (
    <div style={{ opacity: t, transform: slide, willChange: "transform, opacity", ...style }}>
      {text}
    </div>
  );
};

const StaggerLine: React.FC<{
  text: string; frame: number; inF: number; outF: number; style?: React.CSSProperties;
}> = ({ text, frame, inF, outF, style = {} }) => {
  if (frame < inF - 4 || frame > outF + 4) return null;
  const fadeOut = useOut(frame, outF);
  return (
    <div style={{ display: "flex", opacity: fadeOut, ...style }}>
      {text.split("").map((ch, i) => {
        const p = interpolate(frame, [inF + i * 1.8, inF + i * 1.8 + 12], [0, 1], {
          extrapolateLeft: "clamp", extrapolateRight: "clamp",
          easing: Easing.out(Easing.quad),
        });
        return (
          <span key={i} style={{ opacity: p, transform: `translateY(${(1 - p) * 14}px)`, display: "inline-block", whiteSpace: "pre" }}>
            {ch}
          </span>
        );
      })}
    </div>
  );
};

const Metric: React.FC<{
  label: string; value: string; unit: string;
  frame: number; inF: number; outF: number;
  style?: React.CSSProperties;
}> = ({ label, value, unit, frame, inF, outF, style = {} }) => {
  if (frame < inF - 4 || frame > outF + 4) return null;
  const t = useIn(frame, inF, 20) * useOut(frame, outF);
  return (
    <div style={{ opacity: t, transform: `translateY(${(1 - useIn(frame, inF, 20)) * 18}px)`, ...style }}>
      <div style={{ fontSize: 10, letterSpacing: 3, color: "#FFB830", fontWeight: 700, textTransform: "uppercase", marginBottom: 2 }}>
        {label}
      </div>
      <div style={{ fontSize: 46, fontWeight: 900, color: "white", lineHeight: 1, letterSpacing: -1 }}>
        {value}<span style={{ fontSize: 16, fontWeight: 400, color: "#778899", marginLeft: 5 }}>{unit}</span>
      </div>
    </div>
  );
};

const KineticLine: React.FC<{ frame: number; inF: number; outF: number; w: number; style?: React.CSSProperties }> = ({
  frame, inF, outF, w, style = {},
}) => {
  if (frame < inF - 2 || frame > outF + 4) return null;
  const scX = interpolate(frame, [inF, inF + 20], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic),
  });
  const fade = useOut(frame, outF, 8);
  return (
    <div style={{ width: w, height: 1.5, background: "#FFB830", transformOrigin: "left", transform: `scaleX(${scX})`, opacity: fade, ...style }} />
  );
};

// Shot label top-right
const ShotLabel: React.FC<{ frame: number; n: number; label: string; inF: number }> = ({ frame, n, label, inF }) => {
  const op = interpolate(frame, [inF, inF + 8, inF + 50, inF + 70], [0, 1, 1, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  if (op < 0.01) return null;
  return (
    <div style={{ position: "absolute", top: 52, right: 68, opacity: op, display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ fontSize: 10, color: "#FFB830", letterSpacing: 4, fontWeight: 700 }}>{String(n).padStart(2, "0")}</span>
      <div style={{ width: 1, height: 14, background: "#FFB830", opacity: 0.5 }} />
      <span style={{ fontSize: 10, color: "#8899AA", letterSpacing: 3 }}>{label.toUpperCase()}</span>
    </div>
  );
};

// Spec tag (small badge)
const SpecTag: React.FC<{ text: string; frame: number; inF: number; outF: number; style?: React.CSSProperties }> = ({
  text, frame, inF, outF, style = {},
}) => {
  if (frame < inF - 4 || frame > outF + 4) return null;
  const t = useIn(frame, inF, 12) * useOut(frame, outF, 8);
  return (
    <div style={{
      opacity: t,
      transform: `scale(${0.85 + useIn(frame, inF, 12) * 0.15})`,
      display: "inline-block",
      border: "1px solid rgba(255,184,48,0.5)",
      padding: "4px 12px",
      fontSize: 10,
      letterSpacing: 3,
      color: "#FFB830",
      fontWeight: 600,
      ...style,
    }}>
      {text}
    </div>
  );
};

// ── ALL 2D OVERLAYS ───────────────────────────────────────────────────────────
const Overlays: React.FC<{ frame: number }> = ({ frame }) => {
  const bp = beatPulse(frame);
  const font: React.CSSProperties = {
    fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
    position: "absolute",
    color: "white",
  };

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>

      {/* ── SHOT LABELS ── */}
      <ShotLabel frame={frame} n={1} label="Title Roll" inF={0} />
      <ShotLabel frame={frame} n={2} label="Front Low" inF={CUTS[1]} />
      <ShotLabel frame={frame} n={3} label="Side Sweep" inF={CUTS[2]} />
      <ShotLabel frame={frame} n={4} label="Rear 3/4" inF={CUTS[3]} />
      <ShotLabel frame={frame} n={5} label="Wheel Close" inF={CUTS[4]} />
      <ShotLabel frame={frame} n={6} label="Overhead" inF={CUTS[5]} />
      <ShotLabel frame={frame} n={7} label="Grill Close" inF={CUTS[6]} />
      <ShotLabel frame={frame} n={8} label="Full Orbit" inF={CUTS[7]} />
      <ShotLabel frame={frame} n={9} label="Grand Exit" inF={CUTS[8]} />

      {/* ── S1: Opening title (0-350) ── */}
      <SlideText text="ZIS-101A" frame={frame} inF={40} outF={290}
        style={{ ...font, bottom: 330, left: 72, fontSize: 100, fontWeight: 900, letterSpacing: -4, lineHeight: 1 }} />
      <SlideText text="SPORT  ·  1938" frame={frame} inF={62} outF={290} dir="right"
        style={{ ...font, bottom: 266, left: 76, fontSize: 28, fontWeight: 300, letterSpacing: 9, color: "#AABBCC" }} />
      <KineticLine frame={frame} inF={72} outF={290} w={520}
        style={{ position: "absolute", bottom: 258, left: 72 }} />
      <SlideText text="SOVIET UNION  ·  ZAVOD IMENI STALINA  ·  OPEN ROADSTER" frame={frame} inF={90} outF={290} dir="right"
        style={{ ...font, bottom: 218, left: 72, fontSize: 11, letterSpacing: 3, color: "#FFB830", fontWeight: 500 }} />

      {/* ── S2: Front low – build year (366-520) ── */}
      <Metric label="Year" value="1938" unit="AD" frame={frame} inF={CUTS[1] + 10} outF={CUTS[2] - 10}
        style={{ ...font, bottom: 250, left: 72 }} />
      <Metric label="Engine" value="6.0" unit="L" frame={frame} inF={CUTS[1] + 28} outF={CUTS[2] - 10}
        style={{ ...font, bottom: 250, left: 260 }} />

      {/* ── S3: Side sweep – body stat (534-690) ── */}
      <StaggerLine text="SOVIET SPORT" frame={frame} inF={CUTS[2] + 10} outF={CUTS[3] - 10}
        style={{ ...font, bottom: 300, left: 72, fontSize: 36, fontWeight: 800, letterSpacing: 6 }} />
      <SlideText text="ROADSTER" frame={frame} inF={CUTS[2] + 22} outF={CUTS[3] - 10}
        style={{ ...font, bottom: 252, left: 72, fontSize: 68, fontWeight: 900, letterSpacing: -2, color: "#FFB830" }} />

      {/* ── S4: Rear 3/4 – tagline (702-860) ── */}
      <SlideText text="CRAFTED FOR THE ELITE" frame={frame} inF={CUTS[3] + 12} outF={CUTS[4] - 10}
        style={{ ...font, top: "50%", left: "50%", transform: "translate(-50%,-52%)", fontSize: 30, fontWeight: 800, letterSpacing: 4, textAlign: "center", textShadow: "0 2px 40px rgba(0,0,0,0.8)", width: "80%" }} />

      {/* ── S5: Wheel detail – spec tag (870-1025) ── */}
      <SpecTag text="WHITE WALL TYRES" frame={frame} inF={CUTS[4] + 8} outF={CUTS[5] - 10}
        style={{ position: "absolute", bottom: 220, left: 72 }} />
      <SpecTag text="CHROME WIRE WHEELS" frame={frame} inF={CUTS[4] + 24} outF={CUTS[5] - 10}
        style={{ position: "absolute", bottom: 180, left: 72 }} />

      {/* ── S6: Overhead – spec grid (1038-1195) ── */}
      <Metric label="Power" value="141" unit="hp" frame={frame} inF={CUTS[5] + 10} outF={CUTS[6] - 10}
        style={{ ...font, bottom: 260, left: 72 }} />
      <Metric label="Top Speed" value="162" unit="km/h" frame={frame} inF={CUTS[5] + 28} outF={CUTS[6] - 10}
        style={{ ...font, bottom: 260, left: 280 }} />

      {/* ── S7: Grill close – engine callout (1206-1360) ── */}
      <SlideText text="INLINE SIX" frame={frame} inF={CUTS[6] + 10} outF={CUTS[7] - 10}
        style={{ ...font, top: 180, left: 72, fontSize: 58, fontWeight: 900, letterSpacing: -1 }} />
      <KineticLine frame={frame} inF={CUTS[6] + 14} outF={CUTS[7] - 10} w={340}
        style={{ position: "absolute", top: 248, left: 72 }} />
      <SlideText text="6,003cc  ·  141 BHP  ·  3-SPEED GEARBOX" frame={frame} inF={CUTS[6] + 24} outF={CUTS[7] - 10} dir="right"
        style={{ ...font, top: 264, left: 72, fontSize: 11, letterSpacing: 3, color: "#FFB830", fontWeight: 500 }} />

      {/* ── S8: Full orbit – clean / minimal (1374-1700) ── */}
      <KineticLine frame={frame} inF={CUTS[7] + 20} outF={CUTS[8] - 20} w={180}
        style={{ position: "absolute", bottom: 240, left: 72 }} />
      <SlideText text="ZIS-101A SPORT" frame={frame} inF={CUTS[7] + 28} outF={CUTS[8] - 20} dir="right"
        style={{ ...font, bottom: 200, left: 72, fontSize: 13, letterSpacing: 5, color: "#AABBCC", fontWeight: 400 }} />

      {/* ── S9: Grand exit (1710-end) ── */}
      <SlideText text="ZIS-101A" frame={frame} inF={CUTS[8] + 16} outF={1795}
        style={{ ...font, bottom: 340, left: 72, fontSize: 110, fontWeight: 900, letterSpacing: -5, lineHeight: 1 }} dir="up" />
      <SlideText text="THE PRIDE OF THE SOVIET UNION" frame={frame} inF={CUTS[8] + 36} outF={1795} dir="right"
        style={{ ...font, bottom: 270, left: 76, fontSize: 22, fontWeight: 300, letterSpacing: 8, color: "#AABBCC" }} />
      <KineticLine frame={frame} inF={CUTS[8] + 42} outF={1795} w={560}
        style={{ position: "absolute", bottom: 262, left: 72 }} />

      {/* ── Beat-reactive corner accent ── */}
      {frame >= BEAT0 && (
        <div style={{
          position: "absolute", bottom: 116, right: 68,
          width: 32, height: 32,
          borderRight: "1.5px solid #FFB830",
          borderBottom: "1.5px solid #FFB830",
          opacity: 0.3 + bp * 0.7,
          transform: `scale(${1 + bp * 0.15})`,
        }} />
      )}
      {frame >= BEAT0 && (
        <div style={{
          position: "absolute", top: 116, left: 68,
          width: 32, height: 32,
          borderLeft: "1.5px solid #FFB830",
          borderTop: "1.5px solid #FFB830",
          opacity: 0.3 + bp * 0.7,
          transform: `scale(${1 + bp * 0.15})`,
        }} />
      )}
    </div>
  );
};

// ── FILM FX ───────────────────────────────────────────────────────────────────
const Letterbox: React.FC = () => (
  <>
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 88, background: "#000" }} />
    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 88, background: "#000" }} />
  </>
);

const Vignette: React.FC = () => (
  <div style={{
    position: "absolute", inset: 0,
    background: "radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.7) 100%)",
    pointerEvents: "none",
  }} />
);

const CutFlash: React.FC<{ frame: number }> = ({ frame }) => {
  let flash = 0;
  for (const c of CUTS.slice(1, -1)) {
    const d = Math.abs(frame - c);
    if (d < 3) flash = Math.max(flash, ((3 - d) / 3) * 0.45);
  }
  if (flash < 0.01) return null;
  return <div style={{ position: "absolute", inset: 0, background: `rgba(255,255,255,${flash})`, pointerEvents: "none" }} />;
};

const FilmGrain: React.FC<{ frame: number }> = ({ frame }) => {
  const shift = (frame * 19) % 220;
  return (
    <div style={{
      position: "absolute", inset: 0,
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)'/%3E%3C/svg%3E")`,
      backgroundPosition: `${shift}px ${(shift * 1.4) % 220}px`,
      opacity: 0.4,
      mixBlendMode: "overlay",
      pointerEvents: "none",
    }} />
  );
};

// ── FILM BURN TRANSITION (frames 0-90) ────────────────────────────────────────
const FilmBurn: React.FC<{ frame: number }> = ({ frame }) => {
  if (frame > 32) return null;

  // Phase 1 (0-3):  black leader with flicker
  // Phase 2 (3-16): burn spreads from top-left — orange/amber blob
  // Phase 3 (16-22): full white-hot overexposure wash
  // Phase 4 (22-30): burn decays, video emerges

  const flicker = frame < 3 ? (Math.sin(frame * 7.3) * 0.5 + 0.5) * 0.15 : 0;

  const burnIn = interpolate(frame, [2, 16], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });
  const burnOut = interpolate(frame, [22, 30], [1, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
    easing: Easing.in(Easing.cubic),
  });
  const burnAlpha = Math.min(burnIn, burnOut);

  // Overexposure white-hot flash peak
  const whiteFlash = interpolate(frame, [14, 18, 22, 26], [0, 0.9, 0.9, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  // Pulsing brightness noise on the burn blob
  const noise = (Math.sin(frame * 3.7) * 0.12 + Math.sin(frame * 11.1) * 0.06);

  // Black leader at start
  const blackLeader = interpolate(frame, [0, 3], [1, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  const blobX = interpolate(frame, [2, 26], [-10, 60], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const blobSize = interpolate(frame, [2, 22], [30, 180], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
      {/* Black leader */}
      {blackLeader > 0.01 && (
        <div style={{ position: "absolute", inset: 0, background: "#000", opacity: blackLeader }} />
      )}

      {/* Film burn blob — sweeps from top-left */}
      {burnAlpha > 0.01 && (
        <>
          {/* Outer amber glow */}
          <div style={{
            position: "absolute",
            left: `${blobX - blobSize * 0.5}%`,
            top: `${-blobSize * 0.3}%`,
            width: `${blobSize * 2.2}%`,
            height: `${blobSize * 2.0}%`,
            background: `radial-gradient(ellipse at 30% 20%, rgba(255,180,40,${(0.85 + noise) * burnAlpha}) 0%, rgba(255,80,10,${(0.5 + noise) * burnAlpha}) 40%, transparent 75%)`,
            mixBlendMode: "screen",
          }} />
          {/* Inner hot core */}
          <div style={{
            position: "absolute",
            left: `${blobX - blobSize * 0.2}%`,
            top: `${-blobSize * 0.15}%`,
            width: `${blobSize * 1.0}%`,
            height: `${blobSize * 0.9}%`,
            background: `radial-gradient(ellipse at 40% 30%, rgba(255,255,200,${(0.95 + noise) * burnAlpha}) 0%, rgba(255,200,60,${(0.6 + noise) * burnAlpha}) 50%, transparent 80%)`,
            mixBlendMode: "screen",
          }} />
          {/* Burn streak horizontal */}
          <div style={{
            position: "absolute",
            top: `${4 + noise * 3}%`,
            left: 0,
            right: 0,
            height: `${8 + blobSize * 0.05}%`,
            background: `linear-gradient(90deg, rgba(255,160,20,${0.3 * burnAlpha}) 0%, rgba(255,220,80,${(0.6 + noise) * burnAlpha}) ${blobX}%, rgba(255,100,0,${0.15 * burnAlpha}) ${blobX + 20}%, transparent 100%)`,
            mixBlendMode: "screen",
          }} />
        </>
      )}

      {/* White-hot overexposure flash */}
      {whiteFlash > 0.01 && (
        <div style={{ position: "absolute", inset: 0, background: `rgba(255,250,230,${whiteFlash})` }} />
      )}

      {/* Flicker at start */}
      {flicker > 0.01 && (
        <div style={{ position: "absolute", inset: 0, background: `rgba(200,160,60,${flicker})` }} />
      )}
    </div>
  );
};

const ScanLines: React.FC = () => (
  <div style={{
    position: "absolute", inset: 0,
    backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.025) 3px, rgba(0,0,0,0.025) 4px)",
    pointerEvents: "none",
  }} />
);

// ── ROOT COMPOSITION ──────────────────────────────────────────────────────────
export const ArchViz: React.FC<{ noAudio?: boolean }> = ({ noAudio = false }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const blur = cutBlur(frame);

  return (
    <AbsoluteFill style={{ background: "#000000", overflow: "hidden" }}>
      {!noAudio && <Audio src={staticFile("archviz-audio.mp3")} />}
      {!noAudio && <Audio src={staticFile("cassette-sound.mp3")} startFrom={0} endAt={30} />}

      {/* 3D scene */}
      <div style={{ position: "absolute", inset: 0, filter: blur > 1 ? `blur(${blur}px)` : undefined }}>
        <ThreeCanvas width={width} height={height} style={{ background: "#000000" }}>
          <CarScene frame={frame} />
        </ThreeCanvas>
      </div>

      {/* Film effects */}
      <Vignette />
      <ScanLines />
      <FilmGrain frame={frame} />

      {/* 2D overlays */}
      <Overlays frame={frame} />


      {/* Cut flash + letterbox on top */}
      <CutFlash frame={frame} />
      <Letterbox />
    </AbsoluteFill>
  );
};
