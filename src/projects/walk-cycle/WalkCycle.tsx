/**
 * WalkCycle — Cinematic 9-Shot Walk Cycle
 * 1920×1080 · 30fps · 30s = 900 frames
 *
 * Executed per remotion_build_prompt.md (system_prompts/remotion_build_prompt.md):
 * P1  Motion Register : Cinematic / Dramatic
 * P2  Palette         : Midnight noir · amber key light
 * P3  Narrative Arc   : Impact CU → Side Track → Dutch → Hero →
 *                       Push-In → Overhead → Whip → Moody Close → Grand Pull-Back
 * P6  Primitives      : fadeSlideIn · float · pulse · countUp
 * P8  Code            : frame-accurate, spring/interpolate only, no CSS animations
 */
import React from "react";
import {
  AbsoluteFill, Easing, interpolate, random, useCurrentFrame,
} from "remotion";

// ═══════════════════════════════════════════════════════════
//  PHASE 2 — CONSTANTS
// ═══════════════════════════════════════════════════════════

const W = 1920;
const H = 1080;

const PAL = {
  void:      "#000008",
  skyHigh:   "#01010a",
  skyMid:    "#040412",
  skyLow:    "#0a0a1e",
  fog:       "#0d0d22",
  ground:    "#060610",
  gridLine:  "#0f0f28",
  buildFar:  "#080818",
  buildMid:  "#060612",
  buildNear: "#04040e",
  charMain:  "#0b0b1a",   // primary silhouette
  charBack:  "#060610",   // back-layer limbs
  charFront: "#121224",   // front-layer limbs
  amber:     "#f59e0b",
  amberSoft: "rgba(245,158,11,0.18)",
  amberDim:  "rgba(245,158,11,0.06)",
  dust:      "rgba(210,185,120,0.5)",
  rimLight:  "rgba(245,158,11,0.22)",
  coolRim:   "rgba(100,140,255,0.08)",
};

// Duration tokens (frames @ 30fps)
const DUR = { micro: 3, fast: 6, med: 15, slow: 30, epic: 60 };

// Easing tokens — cinematic register
const EASE = {
  enter:    Easing.bezier(0.2, 0.8, 0.2, 1),
  exit:     Easing.bezier(0.8, 0.0, 0.8, 0.2),
  cinema:   Easing.bezier(0.4, 0.0, 0.2, 1),   // heavy settle
  rush:     Easing.bezier(0.6, 0.0, 1.0, 1),    // accelerate to cut
  snap:     Easing.bezier(0.0, 0.0, 0.2, 1),    // hard decelerate
  dramatic: Easing.bezier(0.5, 0.0, 0.0, 1),    // cinematic gravitas
};

// Walk: 2 full steps/sec = cycle every 30 frames
const STEP = 15; // half-cycle (one foot)

// Character skeleton (px)
const SK = {
  headR:  42,
  neckW:  14, neckH: 24,
  torsoW: 58, torsoH: 132,
  uArmW:  17, uArmL:  76,
  lArmW:  13, lArmL:  68,
  uLegW:  23, uLegL: 108,
  lLegW:  18, lLegL:  96,
  footW:  58, footH:  20,
  cx:     W / 2,  // 960 — always world-center
  feetY:  855,    // ground contact
};
// Derived skeleton positions
const hipY      = SK.feetY - SK.uLegL - SK.lLegL - SK.footH;   // 631
const shoulderY = hipY - SK.torsoH;                              // 499
const headCY    = shoulderY - SK.neckH - SK.headR;              // 433

// ═══════════════════════════════════════════════════════════
//  PHASE 6 — MOTION PRIMITIVES
// ═══════════════════════════════════════════════════════════

/** Multi-keyframe interpolation helper */
const ci = (f: number, keys: number[], vals: number[], ease = EASE.cinema) =>
  interpolate(f, keys, vals, {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease,
  });

// ─── Walk cycle math ───────────────────────────────────────
// Full oscillation every 2*STEP frames (30f = 1s = 2 full steps)
const wp  = (f: number) => (f * Math.PI * 2) / (STEP * 2);

// Body bob — drops 14px at each contact, rises at passing
const walkBob  = (f: number) => Math.abs(Math.cos(wp(f))) * 14;
// Lateral hip sway ±6px
const walkSway = (f: number) => Math.sin(wp(f)) * 6;

// Right leg (starts forward on f=0)
const rThighA  = (f: number) => Math.sin(wp(f)) * 40;
const rShinA   = (f: number) => Math.max(0, -Math.sin(wp(f))) * 56 + 5;
const rAnkleA  = (f: number) => Math.max(0, Math.sin(wp(f))) * 20 - 10;

// Left leg (opposite phase)
const lThighA  = (f: number) => Math.sin(wp(f) + Math.PI) * 40;
const lShinA   = (f: number) => Math.max(0, -Math.sin(wp(f) + Math.PI)) * 56 + 5;
const lAnkleA  = (f: number) => Math.max(0, Math.sin(wp(f) + Math.PI)) * 20 - 10;

// Arms (opposite to legs, ±32°)
const rShoulderA = (f: number) => Math.sin(wp(f) + Math.PI) * 34;
const lShoulderA = (f: number) => Math.sin(wp(f)) * 34;
const rElbowA    = (f: number) => Math.abs(Math.sin(wp(f))) * 26 + 10;
const lElbowA    = (f: number) => Math.abs(Math.sin(wp(f) + Math.PI)) * 26 + 10;

// Head micro-motion
const headBob  = (f: number) => Math.abs(Math.cos(wp(f))) * 5;
const headTilt = (f: number) => Math.sin(wp(f)) * 2.5;

// ─── Camera system ─────────────────────────────────────────
// Camera target (tx, ty): world-space point that should appear at screen center.
// CSS transform: translateX(-(tx - W/2)) translateY(-(ty - H/2)) scale(s) rotate(r)
//
// Shot timeline (frame boundaries):
//   S1   0– 90  Impact close-up (feet)       tx=960 ty=858 s=3.5  r=0
//   S2  97–270  Side tracking wide            tx=960 ty=658 s=1.15 r=0
//   S3 280–360  Dutch tilt                    tx=965 ty=635 s=1.5  r=-13
//   S4 372–480  Hero low angle                tx=960 ty=768 s=2.1  r=0
//   S5 492–570  Push-in tight chest           tx=960 ty=525 s=2.9  r=0
//   S6 580–660  High overhead angle           tx=960 ty=465 s=2.0  r=0
//   S7 670–720  Whip landing (side close)     tx=960 ty=568 s=2.6  r=0
//   S8 732–810  Moody close upper body        tx=960 ty=512 s=2.4  r=7
//   S9 825–900  Grand pull-back               tx=960 ty=655 s=0.78 r=0
//
// Transitions (7–12 frames each) — aggressive motion blur

// Shot keyframe timestamps
const KF = [
  0, 85, 97,       // S1 → transition → S2
  270, 280,        // S2 → S3
  360, 372,        // S3 → S4
  480, 492,        // S4 → S5
  570, 580,        // S5 → S6
  660, 670,        // S6 → S7
  720, 732,        // S7 → S8
  810, 825,        // S8 → S9
  900,
];

const getCam = (f: number) => {
  const tx = ci(f, KF,
    [960, 960,  960,  960,  965,  965,  960,  960,  960,  960,  960,  960,  960,  960,  960,  960,  960,  960]);

  const ty = ci(f, KF,
    [858, 858,  658,  658,  635,  635,  768,  768,  525,  525,  465,  465,  568,  568,  512,  512,  655,  655]);

  const scale = ci(f, KF,
    [3.5, 3.5, 1.15, 1.15,  1.5,  1.5,  2.1,  2.1,  2.9,  2.9,  2.0,  2.0,  2.6,  2.6,  2.4,  2.4, 0.78, 0.78]);

  const rot = ci(f, KF,
    [0,   0,    0,    0,   -13,  -13,    0,    0,    0,    0,    0,    0,    0,    0,    7,    7,    0,    0]);

  // Motion blur — spikes during rapid camera transitions
  const blurKeys = [
    83, 87,  94,  97,
   268, 273, 278, 280,
   358, 364, 370, 372,
   478, 485, 490, 492,
   568, 574, 578, 580,
   658, 665, 668, 670,
   718, 726, 730, 732,
   808, 817, 823, 825,
  ];
  const blurVals = [
    0,  18,  22,   0,
    0,  16,  24,   0,
    0,  14,  20,   0,
    0,  18,  26,   0,
    0,  14,  18,   0,
    0,  32,  20,   0,   // whip pan — biggest blur
    0,  12,  16,   0,
    0,  10,  14,   0,
  ];
  const blur = interpolate(f, blurKeys, blurVals, {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  // Per-scale camera shake (bigger shake on tighter shots)
  const shakeMag = interpolate(scale, [0.78, 1.15, 2.0, 3.5], [0.5, 1.0, 2.2, 5.5], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const sx = (Math.sin(f * 1.73) * 0.6 + Math.cos(f * 2.37) * 0.4) * shakeMag;
  const sy = (Math.cos(f * 2.11) * 0.6 + Math.sin(f * 1.41) * 0.4) * shakeMag;

  // Micro-impact shake on each foot strike
  const impactPhase = f % (STEP * 2);
  const impact = Math.max(0, 1 - impactPhase / 3) * 3 * Math.min(1, scale - 1);

  return {
    tx:    tx + sx,
    ty:    ty + sy + impact,
    scale,
    rot,
    blur,
  };
};

// ═══════════════════════════════════════════════════════════
//  PHASE 5 — ASSETS / ENVIRONMENT
// ═══════════════════════════════════════════════════════════

// Deterministic building generator
const genBuildings = (tag: string, count: number, xSpan: number,
  minW: number, maxW: number, minH: number, maxH: number, groundY: number) =>
  Array.from({ length: count }, (_, i) => ({
    x:   random(`${tag}x${i}`) * xSpan - xSpan * 0.1,
    w:   random(`${tag}w${i}`) * (maxW - minW) + minW,
    h:   random(`${tag}h${i}`) * (maxH - minH) + minH,
    ant: random(`${tag}a${i}`) > 0.72,
    gy:  groundY,
  }));

const B_FAR  = genBuildings("f", 30, 8000,  55, 210,  80, 300, 770);
const B_MID  = genBuildings("m", 24, 8000,  70, 280,  55, 210, 810);
const B_NEAR = genBuildings("n", 16, 6000,  18,  55, 220, 400, 855);

const Sky: React.FC = () => (
  <AbsoluteFill style={{
    background: `linear-gradient(180deg, ${PAL.skyHigh} 0%, ${PAL.skyMid} 45%, ${PAL.skyLow} 80%, ${PAL.fog} 100%)`,
  }} />
);

const Stars: React.FC<{ f: number }> = ({ f }) => (
  <>
    {Array.from({ length: 70 }, (_, i) => {
      const x  = random(`sx${i}`) * W;
      const y  = random(`sy${i}`) * H * 0.62;
      const sz = random(`ss${i}`) * 2.2 + 0.4;
      const op = (Math.sin(f * 0.038 + i * 1.3) * 0.28 + 0.55) * 0.75;
      return (
        <div key={i} style={{
          position: "absolute", left: x, top: y,
          width: sz, height: sz, borderRadius: "50%",
          background: i % 7 === 0 ? "#b0c4f0" : "#ffffff",
          opacity: op,
          boxShadow: sz > 2 ? `0 0 ${sz * 4}px rgba(255,255,255,0.55)` : "none",
        }} />
      );
    })}
    {/* Moon */}
    <div style={{
      position: "absolute", right: 260, top: 80,
      width: 56, height: 56, borderRadius: "50%",
      background: "radial-gradient(circle at 38% 36%, #f0e8d2, #c4ad84)",
      boxShadow: "0 0 50px 16px rgba(240,230,200,0.12), 0 0 120px 40px rgba(240,230,200,0.06)",
    }} />
  </>
);

const Buildings: React.FC<{
  data: ReturnType<typeof genBuildings>;
  scrollX: number; color: string; opacity?: number;
}> = ({ data, scrollX, color, opacity = 1 }) => (
  <>
    {data.map((b, i) => {
      const bx = ((b.x - scrollX) % 8000 + 8000) % 8000 - 400;
      return (
        <React.Fragment key={i}>
          <div style={{
            position: "absolute",
            left: bx, top: b.gy - b.h,
            width: b.w, height: b.h,
            background: color, opacity,
          }}>
            {/* Window grid */}
            {Array.from({ length: Math.floor(b.h / 24) }, (_, r) =>
              Array.from({ length: Math.floor(b.w / 20) }, (_, c) => {
                if (!random(`w${i}${r}${c}`) || random(`w${i}${r}${c}`) < 0.58) return null;
                return (
                  <div key={`${r}-${c}`} style={{
                    position: "absolute",
                    left: c * 20 + 5, top: r * 24 + 5,
                    width: 8, height: 10,
                    background: `rgba(245,158,11,${random(`wo${i}${r}${c}`) * 0.2 + 0.06})`,
                  }} />
                );
              })
            )}
          </div>
          {b.ant && (
            <div style={{
              position: "absolute", opacity: opacity * 0.7,
              left: bx + b.w * 0.44, top: b.gy - b.h - 28,
              width: 3, height: 30, background: color,
            }} />
          )}
        </React.Fragment>
      );
    })}
  </>
);

const GroundPlane: React.FC<{ f: number }> = ({ f }) => {
  const sx = f * 3;
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {/* Ground fill */}
      <div style={{
        position: "absolute",
        left: 0, top: SK.feetY - 6, right: 0, bottom: 0,
        background: `linear-gradient(180deg, ${PAL.ground} 0%, ${PAL.void} 100%)`,
      }} />
      {/* Perspective grid */}
      <svg style={{ position: "absolute", inset: 0 }} width={W} height={H}>
        <defs>
          <radialGradient id="kl" cx="50%" cy="0%" r="70%">
            <stop offset="0%" stopColor={PAL.amber} stopOpacity="0.14" />
            <stop offset="100%" stopColor={PAL.amber} stopOpacity="0" />
          </radialGradient>
        </defs>
        {/* Horizontal depth lines */}
        {Array.from({ length: 14 }, (_, i) => {
          const t = (i + 1) / 14;
          const y = SK.feetY + t * (H - SK.feetY) * 0.96;
          return (
            <line key={`h${i}`} x1={0} y1={y} x2={W} y2={y}
              stroke={PAL.gridLine} strokeWidth={0.6}
              opacity={0.55 - t * 0.42} />
          );
        })}
        {/* Converging vertical lines */}
        {Array.from({ length: 20 }, (_, i) => {
          const sp   = W / 19;
          const base = i * sp - (sx % sp);
          const vp   = W / 2;
          return (
            <line key={`v${i}`}
              x1={vp + (base - vp) * 0.04} y1={SK.feetY}
              x2={base} y2={H}
              stroke={PAL.gridLine} strokeWidth={0.5} opacity={0.3} />
          );
        })}
        {/* Key light pool under character */}
        <ellipse cx={SK.cx} cy={SK.feetY + 6} rx={250} ry={36}
          fill="url(#kl)" opacity={0.9} />
      </svg>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
//  CHARACTER — hierarchical CSS limbs
// ═══════════════════════════════════════════════════════════

/** Single limb segment — positions itself relative to parent joint */
const Seg: React.FC<{
  x: number; y: number; w: number; h: number;
  color: string; rot: number; r?: number;
  zIndex?: number; children?: React.ReactNode;
}> = ({ x, y, w, h, color, rot, r = 6, zIndex = 1, children }) => (
  <div style={{
    position: "absolute", left: x, top: y,
    width: w, height: h,
    background: color, borderRadius: r,
    transformOrigin: "top center",
    transform: `rotate(${rot}deg)`,
    overflow: "visible",
    zIndex,
  }}>
    {children}
  </div>
);

const Leg: React.FC<{ f: number; side: "L" | "R"; z: number }> = ({ f, side, z }) => {
  const thigh = side === "R" ? rThighA(f) : lThighA(f);
  const shin  = side === "R" ? rShinA(f)  : lShinA(f);
  const ankle = side === "R" ? rAnkleA(f) : lAnkleA(f);
  const col   = z === 1 ? PAL.charBack : PAL.charFront;
  const hx    = SK.cx + (side === "R" ? 10 : -10) - SK.uLegW / 2;

  return (
    <Seg x={hx} y={hipY + walkBob(f)} w={SK.uLegW} h={SK.uLegL}
      color={col} rot={thigh} r={SK.uLegW / 2} zIndex={z}>
      <Seg x={(SK.uLegW - SK.lLegW) / 2} y={SK.uLegL - 10}
        w={SK.lLegW} h={SK.lLegL}
        color={col} rot={shin} r={SK.lLegW / 2} zIndex={z}>
        {/* Foot */}
        <div style={{
          position: "absolute",
          left: -(SK.footW / 2 - SK.lLegW / 2),
          top: SK.lLegL - 7,
          width: SK.footW, height: SK.footH,
          background: col,
          borderRadius: `${SK.footH / 2}px ${SK.footH}px ${SK.footH * 0.4}px ${SK.footH * 0.4}px`,
          transformOrigin: "left center",
          transform: `rotate(${ankle - 12}deg)`,
        }} />
      </Seg>
    </Seg>
  );
};

const Arm: React.FC<{ f: number; side: "L" | "R"; z: number }> = ({ f, side, z }) => {
  const shoulder = side === "R" ? rShoulderA(f) : lShoulderA(f);
  const elbow    = side === "R" ? rElbowA(f)    : lElbowA(f);
  const col      = z === 1 ? PAL.charBack : PAL.charFront;
  const ax       = SK.cx + (side === "R" ? SK.torsoW / 2 - 5 : -SK.torsoW / 2 + 5) - SK.uArmW / 2;

  return (
    <Seg x={ax} y={shoulderY + walkBob(f)} w={SK.uArmW} h={SK.uArmL}
      color={col} rot={shoulder} r={SK.uArmW / 2} zIndex={z}>
      <Seg x={(SK.uArmW - SK.lArmW) / 2} y={SK.uArmL - 8}
        w={SK.lArmW} h={SK.lArmL}
        color={col} rot={elbow} r={SK.lArmW / 2} zIndex={z} />
    </Seg>
  );
};

const Character: React.FC<{ f: number }> = ({ f }) => {
  const bob  = walkBob(f);
  const sway = walkSway(f);
  const hb   = headBob(f);
  const ht   = headTilt(f);

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      {/* Back limbs (behind torso) */}
      <Leg f={f} side="L" z={1} />
      <Arm f={f} side="L" z={1} />

      {/* Ground shadow */}
      <div style={{
        position: "absolute",
        left: SK.cx - 70 + sway * 0.4,
        top: SK.feetY + 3,
        width: 140, height: 22,
        background: "radial-gradient(ellipse, rgba(0,0,0,0.7) 0%, transparent 72%)",
        borderRadius: "50%",
        transform: `scaleX(${0.75 + Math.abs(Math.sin(wp(f))) * 0.45})`,
      }} />

      {/* Torso */}
      <div style={{
        position: "absolute",
        left: SK.cx - SK.torsoW / 2 + sway,
        top: shoulderY + bob,
        width: SK.torsoW,
        height: SK.torsoH,
        background: `linear-gradient(162deg, ${PAL.charFront} 0%, ${PAL.charMain} 55%, ${PAL.charBack} 100%)`,
        borderRadius: `${SK.torsoW * 0.38}px ${SK.torsoW * 0.38}px ${SK.torsoW * 0.28}px ${SK.torsoW * 0.28}px`,
        transform: `rotate(${-5 + sway * 0.28}deg)`,
        zIndex: 2,
        boxShadow: [
          "4px 8px 24px rgba(0,0,0,0.8)",
          "-2px -3px 10px rgba(255,255,255,0.018)",
          `8px 0 30px ${PAL.rimLight}`,    // amber rim right
          `-6px 0 18px ${PAL.coolRim}`,    // cool rim left
        ].join(", "),
      }} />

      {/* Neck */}
      <div style={{
        position: "absolute",
        left: SK.cx - SK.neckW / 2 + sway,
        top: shoulderY + bob - SK.neckH + 4,
        width: SK.neckW, height: SK.neckH,
        background: PAL.charMain,
        borderRadius: SK.neckW / 2,
        zIndex: 3,
      }} />

      {/* Head */}
      <div style={{
        position: "absolute",
        left: SK.cx - SK.headR + sway,
        top: headCY + bob - hb,
        width: SK.headR * 2, height: SK.headR * 2,
        background: `radial-gradient(circle at 38% 34%, ${PAL.charFront} 0%, ${PAL.charMain} 52%, ${PAL.charBack} 100%)`,
        borderRadius: "50%",
        transform: `rotate(${ht - 5}deg)`,
        zIndex: 4,
        boxShadow: [
          "3px 6px 22px rgba(0,0,0,0.85)",
          "-1px -2px 8px rgba(255,255,255,0.02)",
          `7px 0 24px ${PAL.rimLight}`,
          `-5px 0 14px ${PAL.coolRim}`,
        ].join(", "),
      }} />

      {/* Front limbs */}
      <Leg f={f} side="R" z={3} />
      <Arm f={f} side="R" z={3} />

      {/* Amber rim-light volume */}
      <div style={{
        position: "absolute",
        left: SK.cx + 10 + sway,
        top: headCY + bob - 10,
        width: 55,
        height: SK.feetY - (headCY + bob),
        background: `linear-gradient(90deg, transparent 0%, ${PAL.rimLight} 60%, transparent 100%)`,
        borderRadius: "50%",
        filter: "blur(14px)",
        opacity: 0.55,
        zIndex: 5, pointerEvents: "none",
      }} />
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
//  STEP DUST — impact particles on foot contact
// ═══════════════════════════════════════════════════════════

const StepDust: React.FC<{ f: number }> = ({ f }) => {
  // R contacts: 0, 30, 60... (f%30 ≈ 8)
  // L contacts: 15, 45, 75... (f%30 ≈ 23)
  const contacts: { cf: number; side: number }[] = [];
  for (let c = 0; c < 900; c += STEP * 2) {
    contacts.push({ cf: c + 7,  side:  1 });  // R foot
    contacts.push({ cf: c + 22, side: -1 });  // L foot
  }
  return (
    <>
      {contacts.map((ct, i) => {
        const lf = f - ct.cf;
        if (lf < 0 || lf > 22) return null;
        const op = ci(lf, [0, 2, 7, 22], [0, 0.8, 0.45, 0]);
        const r  = ci(lf, [0, 22], [6, 44]);
        return (
          <div key={i} style={{
            position: "absolute",
            left: SK.cx + ct.side * 16 - r,
            top:  SK.feetY - r * 0.28,
            width: r * 2, height: r * 0.5,
            background: PAL.dust,
            borderRadius: "50%",
            opacity: op,
            filter: "blur(5px)",
            zIndex: 10,
          }} />
        );
      })}
    </>
  );
};

// ═══════════════════════════════════════════════════════════
//  CINEMATIC OVERLAYS
// ═══════════════════════════════════════════════════════════

const AtmoFog: React.FC<{ f: number }> = ({ f }) => {
  const drift = Math.sin(f * 0.004) * 0.08 + 0.5;
  return (
    <>
      {/* Ground mist */}
      <div style={{
        position: "absolute",
        left: 0, right: 0,
        top: SK.feetY - 70, height: 130,
        background: `linear-gradient(180deg, transparent 0%, rgba(10,10,30,0.5) ${drift * 100}%, transparent 100%)`,
        filter: "blur(22px)",
        opacity: 0.55,
      }} />
      {/* Mid-air depth haze */}
      <div style={{
        position: "absolute", inset: 0,
        background: `radial-gradient(ellipse at ${50}% 85%, ${PAL.amberSoft} 0%, transparent 50%)`,
        opacity: 0.5,
      }} />
      {/* Top-down vignette */}
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(ellipse at 50% 50%, transparent 35%, rgba(0,0,5,0.78) 100%)",
      }} />
    </>
  );
};

/** Cinematic letterbox — 2.35:1 within 1080px = 210px bars */
const Letterbox: React.FC = () => (
  <>
    <div style={{
      position: "absolute", inset: "0 0 auto",
      height: 210, background: "#000",
      boxShadow: "0 16px 48px rgba(0,0,0,0.9)",
      zIndex: 90,
    }} />
    <div style={{
      position: "absolute", inset: "auto 0 0",
      height: 210, background: "#000",
      boxShadow: "0 -16px 48px rgba(0,0,0,0.9)",
      zIndex: 90,
    }} />
  </>
);

/** Per-frame pseudo-noise film grain */
const FilmGrain: React.FC<{ f: number }> = ({ f }) => {
  const a = f * 0.072;
  const b = f * 0.059;
  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 95, pointerEvents: "none",
      opacity: 0.04,
      background: `
        repeating-linear-gradient(
          ${(a * 137.5) % 360}deg,
          transparent, transparent 1px,
          rgba(255,255,255,0.07) 1px, rgba(255,255,255,0.07) 2px
        ),
        repeating-linear-gradient(
          ${(b * 97.3) % 360}deg,
          transparent, transparent 2px,
          rgba(255,255,255,0.04) 2px, rgba(255,255,255,0.04) 3.5px
        )
      `,
    }} />
  );
};

/** Subtle amber chromatic aberration / lens flare at shot cuts */
const LensFlare: React.FC<{ f: number }> = ({ f }) => {
  const cutFrames = [90, 280, 360, 480, 570, 660, 720, 810];
  let maxFlare = 0;
  for (const cf of cutFrames) {
    const lf = f - cf;
    if (lf >= 0 && lf < 8) {
      maxFlare = Math.max(maxFlare, ci(lf, [0, 2, 8], [0, 0.55, 0]));
    }
  }
  if (maxFlare < 0.01) return null;
  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 88, pointerEvents: "none",
      opacity: maxFlare,
      background: `radial-gradient(ellipse at 55% 45%, rgba(245,158,11,0.3) 0%, transparent 60%)`,
      mixBlendMode: "screen" as const,
    }} />
  );
};

/** Shot label — minimal amber UI */
const ShotLabel: React.FC<{ f: number }> = ({ f }) => {
  const shots = [
    { from:   0, to:  97, label: "IMPACT C.U." },
    { from:  97, to: 280, label: "SIDE TRACK" },
    { from: 280, to: 372, label: "DUTCH" },
    { from: 372, to: 492, label: "HERO ANGLE" },
    { from: 492, to: 580, label: "PUSH IN" },
    { from: 580, to: 670, label: "OVERHEAD" },
    { from: 670, to: 732, label: "WHIP" },
    { from: 732, to: 825, label: "CLOSE" },
    { from: 825, to: 900, label: "PULL BACK" },
  ];
  const shot = shots.find(s => f >= s.from && f < s.to);
  if (!shot) return null;

  const lf  = f - shot.from;
  const dur = shot.to - shot.from;
  const op  = ci(lf, [0, 7, dur - 10, dur], [0, 0.5, 0.5, 0]);

  return (
    <div style={{
      position: "absolute", left: 56, bottom: 230, zIndex: 96,
      display: "flex", alignItems: "center", gap: 12, opacity: op,
    }}>
      <div style={{ width: 28, height: 1.5, background: PAL.amber, opacity: 0.85 }} />
      <span style={{
        fontFamily: "system-ui, sans-serif", fontSize: 11,
        fontWeight: 700, color: PAL.amber, letterSpacing: 4.5,
        textTransform: "uppercase" as const, opacity: 0.85,
      }}>{shot.label}</span>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
//  ROOT — assembles camera + world + overlays
// ═══════════════════════════════════════════════════════════

export const WalkCycle: React.FC = () => {
  const f = useCurrentFrame();

  const { tx, ty, scale, rot, blur } = getCam(f);
  const scrollX = f * 3; // environment parallax

  const worldTransform = `
    translateX(${-(tx - W / 2)}px)
    translateY(${-(ty - H / 2)}px)
    scale(${scale})
    rotate(${rot}deg)
  `;

  return (
    <AbsoluteFill style={{ background: PAL.void, overflow: "hidden" }}>

      {/* ── Camera-transformed world ── */}
      <div style={{
        position: "absolute",
        width: W, height: H,
        transformOrigin: "center center",
        transform: worldTransform,
        filter: blur > 0.5 ? `blur(${blur}px)` : undefined,
      }}>
        <Sky />
        <Stars f={f} />

        {/* Parallax buildings — three depth layers */}
        <Buildings data={B_FAR}  scrollX={scrollX * 0.10} color={PAL.buildFar}  opacity={0.88} />
        <Buildings data={B_MID}  scrollX={scrollX * 0.30} color={PAL.buildMid}  opacity={0.92} />

        <GroundPlane f={f} />

        <Buildings data={B_NEAR} scrollX={scrollX * 0.70} color={PAL.buildNear} opacity={1.0} />

        <StepDust f={f} />
        <Character f={f} />
        <AtmoFog f={f} />
      </div>

      {/* ── Non-camera overlays ── */}
      <LensFlare f={f} />
      <FilmGrain f={f} />
      <Letterbox />
      <ShotLabel f={f} />

    </AbsoluteFill>
  );
};
