import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  spring,
  Easing,
  staticFile,
  Audio,
} from "remotion";

// ── PALETTE ───────────────────────────────────────────────────────────────────
const P = {
  bg: "#08061A",
  orange: "#FF6B35",
  yellow: "#FFD700",
  pink: "#FF3D8B",
  cyan: "#00CFFF",
  purple: "#A855FF",
  green: "#22FF88",
  gold: "#C8A864",
  red: "#FF2244",
};

// ── SPRING CONFIGS ─────────────────────────────────────────────────────────────
const SPb = { stiffness: 280, damping: 12, mass: 0.9 };  // bouncy
const SPs = { stiffness: 420, damping: 30, mass: 0.5 };  // snappy
const SPw = { stiffness: 160, damping: 8,  mass: 1.2 };  // wobbly

// ── HELPERS ───────────────────────────────────────────────────────────────────
const rng = (seed: number, lo = 0, hi = 1) => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return lo + (x - Math.floor(x)) * (hi - lo);
};

const spr = (f: number, from: number, cfg = SPb, fps = 30) =>
  spring({ frame: f - from, fps, config: cfg });

const ip = (f: number, inp: number[], out: number[], ease?: (t: number) => number) =>
  interpolate(f, inp, out, { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });

const osc = (f: number, freq = 0.05, amp = 1) =>
  Math.sin(f * freq * Math.PI * 2) * amp;

// ── PARTICLE BURST ─────────────────────────────────────────────────────────────
const ParticleBurst: React.FC<{
  frame: number; triggerFrame: number; n?: number;
  cx?: number; cy?: number; colors?: string[]; spread?: number; lifetime?: number;
}> = ({ frame, triggerFrame, n = 50, cx = 960, cy = 540,
  colors = [P.orange, P.yellow, P.cyan, P.pink, "#fff"], spread = 400, lifetime = 45 }) => {
  const lf = frame - triggerFrame;
  if (lf < 0 || lf > lifetime + 20) return null;
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {Array.from({ length: n }).map((_, i) => {
        const angle = rng(i * 7 + 1) * Math.PI * 2;
        const speed = rng(i * 7 + 2, 0.3, 1);
        const size  = rng(i * 7 + 3, 4, 16);
        const color = colors[Math.floor(rng(i * 7 + 4) * colors.length)];
        const delay = Math.floor(rng(i * 7 + 5) * 8);
        const t = Math.max(0, Math.min(1, (lf - delay) / lifetime));
        const eased = 1 - Math.pow(1 - t, 2);
        const dist = eased * spread * speed;
        const gravity = t * t * 280;
        const x = cx + Math.cos(angle) * dist;
        const y = cy + Math.sin(angle) * dist + gravity;
        const op = ip(lf, [delay + lifetime - 12, delay + lifetime + 8], [1, 0]);
        const sc = ip(lf, [delay, delay + 8], [0, 1]);
        return (
          <div key={i} style={{
            position: "absolute",
            width: size, height: size,
            borderRadius: rng(i * 7 + 6) > 0.5 ? "50%" : 2,
            background: color,
            left: x - size / 2, top: y - size / 2,
            opacity: Math.max(0, op),
            transform: `scale(${sc})`,
          }} />
        );
      })}
    </div>
  );
};

// ── STAR FIELD ─────────────────────────────────────────────────────────────────
const StarField: React.FC<{ frame: number; n?: number; opacity?: number }> = ({
  frame, n = 120, opacity = 1,
}) => (
  <div style={{ position: "absolute", inset: 0, overflow: "hidden", opacity }}>
    {Array.from({ length: n }).map((_, i) => {
      const x = rng(i * 3) * 1920;
      const y = rng(i * 3 + 1) * 1080;
      const size = rng(i * 3 + 2, 1, 4);
      const tw = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(frame * 0.05 + i * 2.4));
      return (
        <div key={i} style={{
          position: "absolute", width: size, height: size,
          borderRadius: "50%", background: "#fff",
          left: x, top: y, opacity: tw,
        }} />
      );
    })}
  </div>
);

// ── CHARACTER (Kurzgesagt-style flat person) ────────────────────────────────────
const Character: React.FC<{
  frame: number; from: number; x: number; y: number;
  color: string; scale?: number; flip?: boolean;
  mood?: "happy" | "surprised"; waving?: boolean;
}> = ({ frame, from, x, y, color, scale = 1, flip = false, mood = "happy", waving = false }) => {
  const entry = spr(frame, from, SPb);
  const bob = osc(frame, 0.04, 3) * Math.min(1, Math.max(0, frame - from - 10) / 10);
  const waveAng = waving ? osc(frame, 0.08, 28) : 0;
  const H = 60 * scale;   // head size
  const BH = 68 * scale;  // body height
  const BW = 42 * scale;  // body width
  const LH = 26 * scale;  // leg height
  const eyeH = mood === "surprised" ? H * 0.22 : H * 0.14;

  return (
    <div style={{
      position: "absolute",
      left: x, top: y + (1 - entry) * 180 + bob,
      opacity: Math.min(1, entry * 2),
      transform: `scaleX(${flip ? -1 : 1})`,
      width: H, height: H + BH + LH + 8,
    }}>
      {/* Head */}
      <div style={{
        position: "absolute", top: 0, left: 0,
        width: H, height: H, borderRadius: "50%", background: color,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{ display: "flex", gap: H * 0.18, marginTop: -H * 0.04 }}>
          {[0, 1].map(ei => (
            <div key={ei} style={{
              width: H * 0.22, height: eyeH,
              background: "#0A0614", borderRadius: "50%",
              display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: 2,
            }}>
              <div style={{ width: H * 0.08, height: H * 0.08, borderRadius: "50%", background: "#fff" }} />
            </div>
          ))}
        </div>
      </div>
      {/* Body */}
      <div style={{
        position: "absolute",
        top: H * 0.82, left: (H - BW) / 2,
        width: BW, height: BH,
        background: color, borderRadius: "8px 8px 4px 4px", opacity: 0.9,
      }} />
      {/* Legs */}
      <div style={{
        position: "absolute",
        top: H * 0.82 + BH - 4,
        left: (H - BW) / 2 + 4,
        display: "flex", gap: 4,
      }}>
        <div style={{ width: BW * 0.38, height: LH, background: color, borderRadius: "0 0 6px 6px" }} />
        <div style={{ width: BW * 0.38, height: LH, background: color, borderRadius: "0 0 6px 6px" }} />
      </div>
      {/* Right arm (waving) */}
      <div style={{
        position: "absolute",
        top: H * 0.82 + 4, left: (H - BW) / 2 + BW - 2,
        width: BW * 0.28, height: BH * 0.6,
        background: color, borderRadius: 6,
        transformOrigin: "top center",
        transform: `rotate(${waving ? waveAng : 20}deg)`,
      }} />
      {/* Left arm */}
      <div style={{
        position: "absolute",
        top: H * 0.82 + 4, left: (H - BW) / 2 - BW * 0.28 + 2,
        width: BW * 0.28, height: BH * 0.6,
        background: color, borderRadius: 6,
        transformOrigin: "top center",
        transform: "rotate(-20deg)",
      }} />
    </div>
  );
};

// ── FLOATING SHAPE ──────────────────────────────────────────────────────────────
const FloatingShape: React.FC<{
  frame: number; from: number; x: number; y: number;
  shape: "circle" | "square" | "triangle" | "star";
  color: string; size: number; rotSpeed?: number;
}> = ({ frame, from, x, y, shape, color, size, rotSpeed = 0.5 }) => {
  const entry = spr(frame, from, SPw);
  const floatY = osc(frame + from * 17, 0.03, 12);
  const rot = frame * rotSpeed;
  const base: React.CSSProperties = {
    position: "absolute",
    left: x - size / 2, top: y - size / 2 + floatY,
    width: size, height: size,
    opacity: entry * 0.85,
    transform: `scale(${entry}) rotate(${rot}deg)`,
  };
  const clipMap: Record<string, string> = {
    star: "polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)",
    triangle: "polygon(50% 0%,0% 100%,100% 100%)",
  };
  if (shape === "circle") return <div style={{ ...base, borderRadius: "50%", background: color }} />;
  if (shape === "square") return <div style={{ ...base, borderRadius: 4, background: color }} />;
  return (
    <div style={{ ...base }}>
      <div style={{ width: "100%", height: "100%", background: color, clipPath: clipMap[shape] }} />
    </div>
  );
};

// ── KINETIC TEXT ───────────────────────────────────────────────────────────────
const KineticText: React.FC<{
  frame: number; from: number; text: string;
  style?: React.CSSProperties; stagger?: number; dir?: "up" | "down" | "scale" | "left";
}> = ({ frame, from, text, style = {}, stagger = 3, dir = "up" }) => (
  <div style={{ display: "flex", flexWrap: "wrap", ...style }}>
    {text.split("").map((ch, i) => {
      const p = spr(frame, from + i * stagger, SPs);
      let tx = 0, ty = 0, sc = 1;
      if (dir === "up")    ty = (1 - p) * 60;
      if (dir === "down")  ty = (1 - p) * -60;
      if (dir === "left")  tx = (1 - p) * 80;
      if (dir === "scale") sc = p;
      return (
        <span key={i} style={{
          display: "inline-block",
          opacity: Math.min(1, p * 1.5),
          transform: `translateX(${tx}px) translateY(${ty}px) scale(${sc})`,
          whiteSpace: ch === " " ? "pre" : "normal",
        }}>
          {ch}
        </span>
      );
    })}
  </div>
);

// ── SPEED LINES ────────────────────────────────────────────────────────────────
const SpeedLines: React.FC<{
  frame: number; cx?: number; cy?: number; n?: number; color?: string; opacity?: number;
}> = ({ frame, cx = 960, cy = 540, n = 24, color = "#fff", opacity = 0.15 }) => (
  <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
    {Array.from({ length: n }).map((_, i) => {
      const angle = (i / n) * 360 + frame * 0.5;
      const len   = rng(i * 5 + 1, 80, 300);
      const dist  = rng(i * 5 + 2, 100, 400);
      const thick = rng(i * 5 + 3, 1, 3);
      const rad = angle * Math.PI / 180;
      const x1 = cx + Math.cos(rad) * dist;
      const y1 = cy + Math.sin(rad) * dist;
      const x2 = cx + Math.cos(rad) * (dist + len);
      const y2 = cy + Math.sin(rad) * (dist + len);
      const length = Math.sqrt((x2-x1)**2 + (y2-y1)**2);
      const rotDeg = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
      return (
        <div key={i} style={{
          position: "absolute", width: length, height: thick,
          background: `linear-gradient(90deg, transparent, ${color})`,
          left: x1, top: y1,
          transformOrigin: "left center",
          transform: `rotate(${rotDeg}deg)`,
          opacity,
        }} />
      );
    })}
  </div>
);

// ── WARP RINGS ─────────────────────────────────────────────────────────────────
const WarpRings: React.FC<{ frame: number; from: number }> = ({ frame, from }) => {
  const lf = frame - from;
  if (lf < 0) return null;
  const ringColors = [P.purple, P.cyan, P.pink, P.orange, P.yellow, P.green];
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
      {Array.from({ length: 10 }).map((_, i) => {
        const size = 140 + i * 130;
        const pulse = osc(frame + i * 9, 0.03, 0.04);
        const rot = frame * (0.18 + i * 0.04) * (i % 2 === 0 ? 1 : -1);
        const op = ip(lf, [i * 3, i * 3 + 20], [0, 0.55 - i * 0.04]);
        return (
          <div key={i} style={{
            position: "absolute",
            width: size * (1 + pulse), height: size * (1 + pulse),
            borderRadius: "50%",
            border: `${Math.max(1, 3 - i * 0.25)}px solid ${ringColors[i % ringColors.length]}`,
            opacity: Math.max(0, op),
            transform: `rotate(${rot}deg)`,
          }} />
        );
      })}
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// SCENE 1: COSMIC BIRTH (0 – 90)
// ══════════════════════════════════════════════════════════════════════════════
const SceneCosmicBirth: React.FC<{ frame: number }> = ({ frame }) => {
  if (frame >= 90) return null;

  const nebulaOp   = ip(frame, [8, 60],  [0, 1]);
  const bangFlash  = ip(frame, [13, 14, 18, 30], [0, 1, 0.7, 0]);
  const bangR      = ip(frame, [14, 50], [0, 900]);
  const titleScale = spr(frame, 35, SPb);
  const titleOp    = ip(frame, [35, 55], [0, 1]);
  const subOp      = ip(frame, [55, 72], [0, 1]);
  const subSlide   = spr(frame, 55, SPs);

  return (
    <AbsoluteFill style={{ background: P.bg, overflow: "hidden" }}>
      {/* Nebula */}
      <div style={{
        position: "absolute", inset: 0, opacity: nebulaOp,
        background: `radial-gradient(ellipse at 40% 45%, rgba(168,85,255,0.4) 0%, transparent 50%),
                     radial-gradient(ellipse at 65% 60%, rgba(0,207,255,0.28) 0%, transparent 45%),
                     radial-gradient(ellipse at 50% 50%, rgba(255,107,53,0.18) 0%, transparent 60%)`,
      }} />

      <StarField frame={frame} n={160} opacity={nebulaOp} />

      {/* Bang shockwave */}
      {frame >= 14 && (
        <div style={{
          position: "absolute",
          left: 960 - bangR, top: 540 - bangR,
          width: bangR * 2, height: bangR * 2,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(255,255,255,${bangFlash}) 0%, rgba(255,200,50,${bangFlash * 0.4}) 40%, transparent 70%)`,
        }} />
      )}

      <ParticleBurst frame={frame} triggerFrame={15} n={90}
        cx={960} cy={540} colors={[P.orange, P.yellow, P.cyan, P.purple, P.pink, "#fff"]}
        spread={750} lifetime={65} />

      {/* Title */}
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{ transform: `scale(${titleScale})`, opacity: titleOp, textAlign: "center" }}>
          <div style={{
            fontSize: 210, fontWeight: 900,
            fontFamily: "'Helvetica Neue', Arial, sans-serif",
            color: "#fff", letterSpacing: -10, lineHeight: 1,
            textShadow: `0 0 80px rgba(0,207,255,0.9), 0 0 180px rgba(168,85,255,0.6)`,
          }}>
            ZIS
          </div>
          <div style={{
            fontSize: 38, fontWeight: 300, color: P.cyan, letterSpacing: 16,
            fontFamily: "'Helvetica Neue', Arial, sans-serif",
            opacity: subOp,
            transform: `translateY(${(1 - subSlide) * 32}px)`,
            textShadow: `0 0 30px rgba(0,207,255,0.9)`,
          }}>
            1 0 1 - A   S P O R T
          </div>
        </div>
        <div style={{
          marginTop: 34, opacity: subOp,
          transform: `scale(${subSlide})`,
          background: "rgba(200,168,100,0.12)",
          border: "1px solid rgba(200,168,100,0.5)",
          borderRadius: 4, padding: "6px 24px",
          fontSize: 14, fontWeight: 700, color: P.gold, letterSpacing: 10,
          fontFamily: "'Courier New', monospace",
        }}>
          М О С К В А  ·  1 9 3 8
        </div>
      </div>

      <FloatingShape frame={frame} from={42} x={200}  y={250} shape="star"     color={P.yellow} size={32} />
      <FloatingShape frame={frame} from={46} x={1720} y={280} shape="circle"   color={P.cyan}   size={26} />
      <FloatingShape frame={frame} from={44} x={150}  y={800} shape="triangle" color={P.pink}   size={30} />
      <FloatingShape frame={frame} from={50} x={1780} y={760} shape="square"   color={P.purple} size={24} />
    </AbsoluteFill>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// SCENE 2: THE FACTORY (90 – 270)
// ══════════════════════════════════════════════════════════════════════════════
const SceneFactory: React.FC<{ frame: number }> = ({ frame }) => {
  if (frame < 90 || frame >= 270) return null;
  const lf = frame - 90;

  const skyOp    = ip(lf, [0, 60], [0, 1], Easing.out(Easing.cubic));
  const sunY     = ip(lf, [0, 80], [720, 340]);
  const smokeAlpha = Math.min(1, lf / 40);

  const bH = [320, 240, 380, 200, 300, 260, 200, 340, 280, 320, 200];
  const bX = [60, 220, 370, 550, 710, 890, 1090, 1280, 1450, 1620, 1780];
  const bW = [100, 80, 120, 70, 90, 100, 70, 100, 85, 110, 80];
  const bC = [P.purple, P.cyan, P.orange, P.pink, P.purple, P.yellow, P.cyan, P.orange, P.pink, P.purple, P.cyan];

  const chars = [
    { x: 660, color: P.orange, delay: 50 }, { x: 800, color: P.cyan, delay: 58 },
    { x: 960, color: P.pink, delay: 66 },   { x: 1120, color: P.yellow, delay: 72 },
    { x: 1280, color: P.green, delay: 80 },
  ];

  const titleOp    = ip(lf, [28, 50], [0, 1]);
  const titleSlide = spr(lf, 28, SPb);

  return (
    <AbsoluteFill style={{ background: "#0A0818", overflow: "hidden" }}>
      {/* Sky */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 540, opacity: skyOp,
        background: "linear-gradient(180deg, #1A0A2E 0%, #2D1B69 40%, #FF6B35 80%, #FF9A3C 100%)",
      }} />

      <StarField frame={frame} n={90} opacity={1 - skyOp * 0.8} />

      {/* Sun */}
      <div style={{
        position: "absolute", left: 960 - 70, top: sunY - 70, width: 140, height: 140,
        borderRadius: "50%",
        background: "radial-gradient(circle, #FFE135 30%, #FF9A3C 100%)",
        boxShadow: "0 0 80px rgba(255,225,53,0.6), 0 0 180px rgba(255,154,60,0.3)",
        opacity: ip(lf, [0, 60], [0, 1]),
      }} />

      {/* Ground */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: 220,
        background: "linear-gradient(180deg, #1A0A2E 0%, #0D0820 100%)",
      }} />

      {/* Buildings */}
      {bH.map((h, i) => {
        const rise = spr(lf, i * 4 + 8, SPb);
        return (
          <div key={i} style={{
            position: "absolute", left: bX[i], bottom: 200,
            width: bW[i], height: h * rise,
            background: `linear-gradient(180deg, ${bC[i]}40 0%, ${bC[i]}18 100%)`,
            border: `1px solid ${bC[i]}50`,
            borderRadius: "3px 3px 0 0", transformOrigin: "bottom",
          }}>
            {Array.from({ length: Math.floor(h / 52) }).map((_, wi) => (
              <div key={wi} style={{
                position: "absolute", left: "18%", right: "18%",
                top: 10 + wi * 48, height: 22,
                background: rng(i * 20 + wi) > 0.45 ? `${bC[i]}90` : "transparent",
                borderRadius: 2,
              }} />
            ))}
            {i % 3 === 0 && (
              <div style={{ position: "absolute", top: -44, left: "50%", marginLeft: -7, width: 14, height: 44, background: `${bC[i]}70` }} />
            )}
          </div>
        );
      })}

      {/* Smoke from chimneys */}
      {[370, 710, 1090].map((cx2, si) =>
        Array.from({ length: 8 }).map((_, pi) => {
          const t2 = ((lf + pi * 7 + si * 40) % 60) / 60;
          return (
            <div key={`${si}-${pi}`} style={{
              position: "absolute", left: cx2 + Math.sin(t2 * Math.PI * 2 + pi) * 22,
              top: 560 - t2 * 200,
              width: 18 + t2 * 44, height: 18 + t2 * 44,
              borderRadius: "50%",
              background: "rgba(180,160,200,0.12)",
              opacity: smokeAlpha * (0.55 - t2 * 0.55),
              transform: "translate(-50%, -50%)", pointerEvents: "none",
            }} />
          );
        })
      )}

      {/* Characters */}
      {chars.map((c, i) => (
        <Character key={i} frame={lf} from={c.delay}
          x={c.x - 30} y={400} color={c.color} scale={0.9}
          flip={i % 2 === 1} waving={i % 2 === 0} />
      ))}

      {/* Title */}
      <div style={{
        position: "absolute", top: 90, left: 0, right: 0, textAlign: "center",
        opacity: titleOp, transform: `translateY(${(1 - titleSlide) * -44}px)`,
      }}>
        <div style={{
          fontSize: 14, fontWeight: 700, color: P.gold,
          fontFamily: "'Courier New', monospace", letterSpacing: 10, marginBottom: 10,
        }}>
          THE  STORY  OF
        </div>
        <div style={{
          fontSize: 88, fontWeight: 900,
          fontFamily: "'Helvetica Neue', Arial, sans-serif",
          color: "#fff", letterSpacing: -3, lineHeight: 1,
          textShadow: `0 0 60px rgba(255,107,53,0.5)`,
        }}>
          ZIS-101A  SPORT
        </div>
        <div style={{
          fontSize: 20, fontWeight: 300, color: "rgba(255,255,255,0.4)",
          letterSpacing: 7, marginTop: 10, fontFamily: "'Helvetica Neue', Arial, sans-serif",
          opacity: ip(lf, [44, 62], [0, 1]),
        }}>
          СОВЕТСКИЙ  СОЮЗ  ·  1938
        </div>
      </div>

      <FloatingShape frame={frame} from={130} x={440}  y={200} shape="star"     color={P.yellow} size={22} rotSpeed={0.8} />
      <FloatingShape frame={frame} from={140} x={1520} y={180} shape="circle"   color={P.cyan}   size={18} />
      <FloatingShape frame={frame} from={125} x={740}  y={150} shape="triangle" color={P.pink}   size={20} />
      <FloatingShape frame={frame} from={145} x={1200} y={170} shape="square"   color={P.purple} size={16} rotSpeed={0.6} />
    </AbsoluteFill>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// SCENE 3: CAR ASSEMBLY (270 – 480)
// ══════════════════════════════════════════════════════════════════════════════
const SceneAssembly: React.FC<{ frame: number }> = ({ frame }) => {
  if (frame < 270 || frame >= 480) return null;
  const lf = frame - 270;

  const bodyE    = spr(lf, 18, SPb);
  const hoodE    = spr(lf, 22, SPb);
  const windE    = spr(lf, 28, SPb);
  const wheelLE  = spr(lf, 8,  SPb);
  const wheelRE  = spr(lf, 10, SPb);
  const exhaustE = spr(lf, 38, SPb);
  const assembled = Math.min(1, Math.max(0, lf - 55) / 12);
  const pulse     = 1 + osc(lf, 0.04, 0.022) * assembled;

  const ringOp  = ip(lf, [0, 28], [0, 1]);
  const speedOp = ip(lf, [0, 18, 100, 120], [0, 0.22, 0.22, 0]);
  const titleOp = ip(lf, [62, 82], [0, 1]);
  const titleSl = spr(lf, 62, SPs);

  const cx = 960, cy = 500;
  const CW = 700, CH = 260;
  const WS = 110;

  const ringColors = [P.purple, P.cyan, P.orange, P.pink, P.yellow, P.green, P.purple, P.cyan];

  return (
    <AbsoluteFill style={{ background: "#030208", overflow: "hidden" }}>
      {/* Animated rings */}
      <div style={{ opacity: ringOp }}>
        {Array.from({ length: 8 }).map((_, i) => {
          const size = 210 + i * 140;
          const rot  = frame * (0.14 + i * 0.03) * (i % 2 === 0 ? 1 : -1);
          return (
            <div key={i} style={{
              position: "absolute",
              left: cx - size / 2, top: cy - size / 2,
              width: size, height: size, borderRadius: "50%",
              border: `${Math.max(0.5, 2.5 - i * 0.2)}px solid ${ringColors[i]}${(40 - i * 4).toString(16).padStart(2, "0")}`,
              transform: `rotate(${rot}deg)`,
            }} />
          );
        })}
      </div>

      {/* Speed lines */}
      <div style={{ opacity: speedOp }}>
        <SpeedLines frame={lf} cx={cx} cy={cy} n={22} color={P.cyan} opacity={0.28} />
      </div>

      {/* CAR CSS GEOMETRY */}
      <div style={{
        position: "absolute",
        left: cx - CW / 2, top: cy - CH / 2,
        transform: `scale(${bodyE * pulse})`,
        transformOrigin: "center center",
      }}>
        {/* Main body */}
        <div style={{
          position: "absolute", left: 0, top: CH * 0.3,
          width: CW, height: CH * 0.5,
          background: "linear-gradient(180deg, #C8A864 0%, #8B6914 100%)",
          borderRadius: "14px 14px 8px 8px",
        }} />
        {/* Cabin roof */}
        <div style={{
          position: "absolute", left: CW * 0.22, top: 0,
          width: CW * 0.52, height: CH * 0.44,
          background: "linear-gradient(180deg, #E8C878 0%, #C8A864 100%)",
          borderRadius: "44px 44px 0 0",
        }} />
        {/* Hood – flies from left */}
        <div style={{
          position: "absolute", left: -CW * 0.16, top: CH * 0.3,
          width: CW * 0.29, height: CH * 0.34,
          background: "linear-gradient(135deg, #D4B070 0%, #A08020 100%)",
          borderRadius: "8px 0 0 22px",
          opacity: hoodE,
          transform: `translateX(${(1 - hoodE) * -140}px)`,
        }} />
        {/* Front windshield */}
        <div style={{
          position: "absolute", left: CW * 0.22, top: CH * 0.02,
          width: CW * 0.18, height: CH * 0.36,
          background: "rgba(150,220,255,0.38)",
          borderRadius: "32px 8px 0 0",
          border: "2px solid rgba(255,255,255,0.28)",
          opacity: windE,
          transform: `translateX(${(1 - windE) * -60}px)`,
        }} />
        {/* Rear window */}
        <div style={{
          position: "absolute", left: CW * 0.55, top: CH * 0.02,
          width: CW * 0.14, height: CH * 0.3,
          background: "rgba(150,220,255,0.32)",
          borderRadius: "8px 32px 0 0",
          border: "2px solid rgba(255,255,255,0.22)",
          opacity: windE,
          transform: `translateX(${(1 - windE) * 60}px)`,
        }} />
        {/* Running board */}
        <div style={{
          position: "absolute", left: CW * 0.06, top: CH * 0.76,
          width: CW * 0.88, height: 14,
          background: "#8B6914", borderRadius: 4,
        }} />
        {/* Headlights */}
        {[[-CW * 0.15, CH * 0.36], [-CW * 0.15, CH * 0.48]].map(([hx, hy], hi) => (
          <div key={hi} style={{
            position: "absolute", left: hx + CW * 0.01, top: hy,
            width: 28, height: 22,
            background: "radial-gradient(circle, rgba(255,240,180,0.9) 0%, rgba(255,200,80,0.4) 70%, transparent 100%)",
            borderRadius: "50%",
            boxShadow: `0 0 30px rgba(255,220,100,0.6)`,
            opacity: hoodE,
          }} />
        ))}
      </div>

      {/* Left wheel */}
      <div style={{
        position: "absolute",
        left: cx - CW / 2 + 80 - WS / 2,
        top: cy + CH * 0.16 - WS / 2,
        width: WS, height: WS, borderRadius: "50%",
        background: "radial-gradient(circle at 35% 35%, #555 0%, #111 60%, #222 100%)",
        border: "8px solid #888",
        transform: `translateY(${(1 - wheelLE) * 220}px)`,
        boxShadow: "0 8px 28px rgba(0,0,0,0.8)",
      }}>
        {Array.from({ length: 6 }).map((_, si) => (
          <div key={si} style={{
            position: "absolute", left: "50%", top: "50%",
            width: "40%", height: 4, background: "#999",
            transformOrigin: "left center",
            transform: `translateY(-2px) rotate(${si * 60 + frame * 2.2}deg)`,
            marginLeft: -2,
          }} />
        ))}
      </div>

      {/* Right wheel */}
      <div style={{
        position: "absolute",
        left: cx + CW / 2 - 108 - WS / 2,
        top: cy + CH * 0.16 - WS / 2,
        width: WS, height: WS, borderRadius: "50%",
        background: "radial-gradient(circle at 35% 35%, #555 0%, #111 60%, #222 100%)",
        border: "8px solid #888",
        transform: `translateY(${(1 - wheelRE) * 220}px)`,
        boxShadow: "0 8px 28px rgba(0,0,0,0.8)",
      }}>
        {Array.from({ length: 6 }).map((_, si) => (
          <div key={si} style={{
            position: "absolute", left: "50%", top: "50%",
            width: "40%", height: 4, background: "#999",
            transformOrigin: "left center",
            transform: `translateY(-2px) rotate(${si * 60 + frame * 2.2}deg)`,
            marginLeft: -2,
          }} />
        ))}
      </div>

      {/* Exhaust pipes */}
      <div style={{
        position: "absolute",
        left: cx - CW / 2 - 35, top: cy + CH * 0.26,
        opacity: exhaustE,
        transform: `translateX(${(1 - exhaustE) * -90}px)`,
      }}>
        {[0, 1].map(pi => (
          <div key={pi} style={{
            width: 64, height: 14,
            background: "linear-gradient(90deg, #999, #555)",
            borderRadius: "4px 0 0 4px", marginBottom: 7,
          }} />
        ))}
      </div>

      {/* Spark bursts */}
      <ParticleBurst frame={lf} triggerFrame={18} n={55} cx={cx} cy={cy}
        colors={[P.yellow, P.orange, "#fff", P.gold]} spread={340} lifetime={32} />
      <ParticleBurst frame={lf} triggerFrame={28} n={40} cx={cx - 220} cy={cy + 60}
        colors={[P.cyan, "#fff", P.purple]} spread={220} lifetime={28} />
      <ParticleBurst frame={lf} triggerFrame={38} n={38} cx={cx + 220} cy={cy + 60}
        colors={[P.orange, P.yellow, P.pink]} spread={220} lifetime={28} />
      <ParticleBurst frame={lf} triggerFrame={55} n={70} cx={cx} cy={cy}
        colors={[P.gold, P.orange, P.yellow, "#fff", P.cyan]} spread={500} lifetime={40} />

      {/* Title */}
      <div style={{
        position: "absolute", bottom: 118, left: 0, right: 0, textAlign: "center",
        opacity: titleOp, transform: `translateY(${(1 - titleSl) * 44}px)`,
      }}>
        <KineticText frame={lf} from={62} text="THE  MACHINE" stagger={3} dir="up" style={{
          justifyContent: "center",
          fontSize: 70, fontWeight: 900,
          fontFamily: "'Helvetica Neue', Arial, sans-serif",
          color: P.gold, letterSpacing: 10,
        }} />
        <div style={{
          fontSize: 13, color: "rgba(255,255,255,0.35)",
          letterSpacing: 6, marginTop: 10,
          fontFamily: "'Courier New', monospace",
          opacity: ip(lf, [78, 94], [0, 1]),
        }}>
          HAND-BUILT  ·  ONE  OF  A  KIND  ·  1938
        </div>
      </div>

      <FloatingShape frame={frame} from={290} x={170}  y={290} shape="star"     color={P.yellow} size={28} />
      <FloatingShape frame={frame} from={300} x={1770} y={270} shape="circle"   color={P.cyan}   size={22} />
      <FloatingShape frame={frame} from={295} x={1810} y={720} shape="triangle" color={P.pink}   size={24} />
      <FloatingShape frame={frame} from={310} x={110}  y={710} shape="square"   color={P.purple} size={20} rotSpeed={0.7} />
    </AbsoluteFill>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// SCENE 4: SPECS EXPLOSION (480 – 660)
// ══════════════════════════════════════════════════════════════════════════════
const SceneSpecsExplosion: React.FC<{ frame: number }> = ({ frame }) => {
  if (frame < 480 || frame >= 660) return null;
  const lf = frame - 480;

  const specs = [
    { val: "6,003", unit: "CC",    label: "DISPLACEMENT",  color: P.orange, from: 0   },
    { val: "141",   unit: "HP",    label: "HORSEPOWER",    color: P.cyan,   from: 45  },
    { val: "162",   unit: "KM/H",  label: "TOP  SPEED",    color: P.pink,   from: 90  },
    { val: "1",     unit: "ONLY",  label: "PROTOTYPE",     color: P.yellow, from: 135 },
  ];
  const specIdx = lf < 45 ? 0 : lf < 90 ? 1 : lf < 135 ? 2 : 3;
  const spec  = specs[specIdx];
  const sf    = lf - spec.from;

  const numScale = spr(sf, 0, SPb);
  const numOp    = ip(sf, [0, 10], [0, 1]);
  const labelOp  = ip(sf, [6, 20], [0, 1]);
  const labelSl  = spr(sf, 6, SPs);
  const bgFlash  = ip(sf, [0, 1, 6, 18], [0, 0.28, 0.1, 0]);

  const chars = [
    { x: 290, y: 400, color: P.orange, flip: false },
    { x: 1560, y: 390, color: P.cyan,   flip: true  },
  ];

  return (
    <AbsoluteFill style={{ background: "#05030F", overflow: "hidden" }}>
      {/* Background flash */}
      <div style={{
        position: "absolute", inset: 0,
        background: `radial-gradient(circle at center, ${spec.color} 0%, transparent 65%)`,
        opacity: bgFlash,
      }} />

      {/* Orbiting dots */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (frame * (0.9 + i * 0.1) + i * 45) * Math.PI / 180;
        const r = 220 + i * 44;
        const ox = 960 + Math.cos(angle) * r;
        const oy = 460 + Math.sin(angle) * r * 0.38;
        const dotColors = [P.orange, P.cyan, P.pink, P.yellow, P.purple, P.green, P.gold, "#fff"];
        return (
          <div key={i} style={{
            position: "absolute",
            left: ox - 7, top: oy - 7,
            width: 14, height: 14,
            borderRadius: i % 2 === 0 ? "50%" : 2,
            background: dotColors[i], opacity: 0.8,
          }} />
        );
      })}

      {/* Particle burst per spec */}
      <ParticleBurst frame={lf} triggerFrame={spec.from} n={65} cx={960} cy={460}
        colors={[spec.color, "#fff", P.yellow]} spread={520} lifetime={38} />

      {/* HP speed lines */}
      {specIdx === 1 && (
        <div style={{ opacity: ip(sf, [0, 15], [0, 0.32]) }}>
          <SpeedLines frame={sf} cx={960} cy={460} n={28} color={P.cyan} opacity={0.28} />
        </div>
      )}
      {/* Speed blur streaks for km/h */}
      {specIdx === 2 && Array.from({ length: 14 }).map((_, i) => {
        const ty = 200 + i * 48;
        const sx = ((frame * (4 + rng(i) * 4)) % 2400) - 400;
        return (
          <div key={i} style={{
            position: "absolute",
            left: sx, top: ty,
            width: 200 + rng(i + 100) * 300, height: 3,
            background: `linear-gradient(90deg, transparent, ${P.pink}80, transparent)`,
            borderRadius: 2, opacity: ip(sf, [0, 12], [0, 0.6]),
          }} />
        );
      })}

      {/* Main spec display */}
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{
          fontSize: 14, fontWeight: 700, color: spec.color,
          fontFamily: "'Courier New', monospace", letterSpacing: 9, marginBottom: 18,
          opacity: labelOp,
          transform: `translateY(${(1 - labelSl) * -24}px)`,
        }}>
          {spec.label}
        </div>
        <div style={{
          display: "flex", alignItems: "baseline", gap: 18,
          transform: `scale(${numScale})`, opacity: numOp,
        }}>
          <div style={{
            fontSize: specIdx === 3 ? 240 : 190, fontWeight: 900,
            fontFamily: "'Helvetica Neue', Arial, sans-serif",
            color: "#fff", letterSpacing: -10, lineHeight: 1,
            textShadow: `0 0 80px ${spec.color}, 0 0 160px ${spec.color}80`,
          }}>
            {spec.val}
          </div>
          <div style={{
            fontSize: 44, fontWeight: 300, color: spec.color,
            fontFamily: "'Helvetica Neue', Arial, sans-serif", letterSpacing: 2,
          }}>
            {spec.unit}
          </div>
        </div>
        {/* Progress indicator */}
        <div style={{
          marginTop: 46, display: "flex", gap: 12,
          opacity: ip(sf, [14, 24], [0, 1]),
        }}>
          {specs.map((s, i) => (
            <div key={i} style={{
              width: i === specIdx ? 44 : 10, height: 4,
              background: i === specIdx ? s.color : "rgba(255,255,255,0.2)",
              borderRadius: 2,
            }} />
          ))}
        </div>
      </div>

      {/* Reacting characters */}
      {chars.map((c, i) => (
        <Character key={i} frame={lf} from={spec.from + 14}
          x={c.x - 30} y={c.y} color={c.color} scale={0.8}
          flip={c.flip} mood="surprised" waving={specIdx === 2} />
      ))}

      <FloatingShape frame={frame} from={490} x={160}  y={200} shape="star"   color={spec.color} size={26} rotSpeed={1.2} />
      <FloatingShape frame={frame} from={500} x={1790} y={210} shape="circle" color={P.yellow}   size={20} />
    </AbsoluteFill>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// SCENE 5: THE DRIVE (660 – 810)
// ══════════════════════════════════════════════════════════════════════════════
const SceneDrive: React.FC<{ frame: number }> = ({ frame }) => {
  if (frame < 660 || frame >= 810) return null;
  const lf = frame - 660;

  const s0 = lf * 0.35;   // far bg
  const s1 = lf * 1.1;    // mid buildings
  const s2 = lf * 4.8;    // ground markings

  const carEntry = spr(lf, 8,  SPb);
  const carX     = ip(lf, [8, 50], [260, 720]) + osc(lf, 0.06, 2);
  const carY     = 622 + osc(lf, 0.04, 5);
  const titleOp  = ip(lf, [18, 40], [0, 1]);
  const titleSl  = spr(lf, 18, SPb);

  const midBuildH = [160, 220, 180, 260, 140, 200, 240, 160, 220, 190];
  const midBuildC = [P.purple, P.cyan, P.orange, P.pink, P.purple, P.cyan, P.yellow, P.pink, P.purple, P.cyan];

  return (
    <AbsoluteFill style={{ background: "#080618", overflow: "hidden" }}>
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(180deg, #06040E 0%, #180A3E 30%, #2D1060 60%, #0A0818 100%)",
      }} />
      <StarField frame={frame} n={80} opacity={0.55} />

      {/* Far skyline (slowest parallax) */}
      <div style={{ position: "absolute", bottom: 290, left: -(s0 % 1920), display: "flex" }}>
        {[0, 1, 2].map(rep => (
          <div key={rep} style={{ display: "flex", alignItems: "flex-end", flexShrink: 0, width: 1920 }}>
            {[90, 55, 130, 70, 110, 65, 85, 100, 70, 120, 80].map((h, i) => (
              <div key={i} style={{
                width: 140, height: h,
                background: `rgba(60,40,120,0.35)`,
                marginRight: 2, borderRadius: "2px 2px 0 0",
              }} />
            ))}
          </div>
        ))}
      </div>

      {/* Mid buildings (medium parallax) */}
      <div style={{ position: "absolute", bottom: 250, left: -(s1 % 1920), display: "flex" }}>
        {[0, 1, 2].map(rep => (
          <div key={rep} style={{ display: "flex", alignItems: "flex-end", flexShrink: 0, width: 1920 }}>
            {midBuildH.map((h, i) => (
              <div key={i} style={{
                width: 168, height: h,
                background: `linear-gradient(180deg, ${midBuildC[i]}40 0%, ${midBuildC[i]}18 100%)`,
                border: `1px solid ${midBuildC[i]}40`,
                marginRight: 2, borderRadius: "4px 4px 0 0", position: "relative",
              }}>
                {Array.from({ length: Math.floor(h / 42) }).map((_, wi) => (
                  <div key={wi} style={{
                    position: "absolute", left: 18, right: 18, top: 10 + wi * 40, height: 18,
                    background: rng(i * 30 + wi + rep * 100) > 0.48 ? `${midBuildC[i]}90` : "transparent",
                    borderRadius: 2,
                  }} />
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Characters in windows */}
      {[340, 660, 980, 1300, 1620].map((wx, i) => {
        const sx = wx - s1 * 0.5;
        if (sx < -80 || sx > 1980) return null;
        return (
          <div key={i} style={{
            position: "absolute", left: sx,
            top: 230 + Math.floor(rng(i) * 3) * 80,
            opacity: ip(lf, [10, 22], [0, 1]),
          }}>
            <Character frame={lf} from={10 + i * 5} x={0} y={-110}
              color={[P.orange, P.cyan, P.pink, P.yellow, P.green][i]}
              scale={0.55} waving />
          </div>
        );
      })}

      {/* Ground */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: 290,
        background: "linear-gradient(180deg, #1A0A2E 0%, #0D0818 100%)",
      }} />
      {/* Road */}
      <div style={{
        position: "absolute", bottom: 100, left: 0, right: 0, height: 110,
        background: "#22183A", borderTop: "2px solid rgba(255,255,255,0.08)",
      }}>
        {Array.from({ length: 14 }).map((_, i) => {
          const mx = ((i * 200 - s2) % 2800) - 200;
          return (
            <div key={i} style={{
              position: "absolute", left: mx, top: "40%",
              width: 120, height: 6, background: "rgba(255,255,255,0.28)", borderRadius: 3,
            }} />
          );
        })}
      </div>

      {/* Car (CSS, parallax fastest) */}
      <div style={{
        position: "absolute", left: carX, top: carY - 80,
        opacity: carEntry,
      }}>
        <div style={{ width: 320, height: 96, background: "linear-gradient(180deg, #C8A864 0%, #8B6914 100%)", borderRadius: "18px 18px 8px 8px", position: "relative" }}>
          <div style={{ position: "absolute", left: "22%", top: -52, width: "50%", height: 58, background: "linear-gradient(180deg, #E8C878 0%, #C8A864 100%)", borderRadius: "26px 26px 0 0" }} />
          <div style={{ position: "absolute", left: "22%", top: -48, width: "18%", height: 48, background: "rgba(150,220,255,0.38)", borderRadius: "20px 6px 0 0" }} />
          {/* Headlight glow */}
          <div style={{ position: "absolute", left: 2, top: "30%", width: 22, height: 22, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,240,150,0.9) 0%, transparent 70%)", boxShadow: "0 0 24px rgba(255,230,100,0.7)" }} />
        </div>
        {/* Wheels */}
        {[32, 222].map((wx2, wi) => (
          <div key={wi} style={{
            position: "absolute", left: wx2, top: 60, width: 74, height: 74,
            borderRadius: "50%",
            background: "radial-gradient(circle at 35% 35%, #555 0%, #111 60%)",
            border: "5px solid #888",
            transform: `rotate(${frame * 3}deg)`,
          }}>
            {[0, 1, 2, 3].map(si => (
              <div key={si} style={{
                position: "absolute", left: "50%", top: "50%",
                width: "40%", height: 3, background: "#888",
                transformOrigin: "left center",
                transform: `translateY(-1.5px) rotate(${si * 90}deg)`,
              }} />
            ))}
          </div>
        ))}
        {/* Exhaust trail */}
        {Array.from({ length: 7 }).map((_, si) => {
          const t2 = ((si * 10 + lf) % 60) / 60;
          return (
            <div key={si} style={{
              position: "absolute",
              left: -20 - t2 * 90, top: 30 + osc(lf + si * 20, 0.1, 10),
              width: 10 + t2 * 32, height: 10 + t2 * 32,
              borderRadius: "50%",
              background: "rgba(200,180,160,0.14)",
              opacity: 0.45 - t2 * 0.45,
              transform: "translate(-50%, -50%)",
            }} />
          );
        })}
      </div>

      {/* Confetti */}
      {Array.from({ length: 35 }).map((_, i) => {
        const cx2 = ((rng(i * 3) * 1920 + lf * rng(i * 3 + 1, 0.5, 2.2)) % 1920);
        const cy2 = ((rng(i * 3 + 2) * 500 + 180 + lf * 0.9) % 900);
        const confC = [P.orange, P.cyan, P.pink, P.yellow, P.green, P.purple][i % 6];
        return (
          <div key={i} style={{
            position: "absolute", left: cx2, top: cy2,
            width: 8, height: 14, background: confC, opacity: 0.75,
            borderRadius: 2, transform: `rotate(${frame * rng(i, 2, 5)}deg)`,
          }} />
        );
      })}

      {/* Title */}
      <div style={{
        position: "absolute", top: 78, left: 0, right: 0, textAlign: "center",
        opacity: titleOp, transform: `translateY(${(1 - titleSl) * -34}px)`,
      }}>
        <div style={{
          fontSize: 78, fontWeight: 900,
          fontFamily: "'Helvetica Neue', Arial, sans-serif",
          color: "#fff", letterSpacing: -2,
          textShadow: `0 0 60px rgba(255,107,53,0.6)`,
        }}>
          BORN  TO  RUN
        </div>
        <div style={{
          fontSize: 14, color: P.cyan, letterSpacing: 9, marginTop: 8,
          fontFamily: "'Courier New', monospace",
          opacity: ip(lf, [32, 52], [0, 1]),
        }}>
          1 6 2  K M / H  ·  O P E N  R O A D
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// SCENE 6: THE LEGEND (810 – 900)
// ══════════════════════════════════════════════════════════════════════════════
const SceneLegend: React.FC<{ frame: number }> = ({ frame }) => {
  if (frame < 810 || frame >= 900) return null;
  const lf = frame - 810;

  const flash1 = ip(lf, [4, 5, 11, 22], [0, 0.35, 0.12, 0]);
  const flash4 = ip(lf, [53, 54, 61, 74], [0, 0.45, 0.14, 0]);

  const l1Scale = spr(lf, 5,  SPb);
  const l2Scale = spr(lf, 22, SPb);
  const l3Scale = spr(lf, 38, SPw);  // wobbly for dramatic "1"
  const l4Scale = spr(lf, 54, SPb);

  const chars = [
    { x: 200, y: 380, color: P.orange, from: 28 },
    { x: 400, y: 410, color: P.cyan,   from: 36 },
    { x: 1460, y: 390, color: P.pink,  from: 32 },
    { x: 1660, y: 375, color: P.yellow, from: 40 },
  ];

  return (
    <AbsoluteFill style={{ background: "#030208", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: `rgba(255,255,255,${flash1})` }} />
      <div style={{ position: "absolute", inset: 0, background: `rgba(200,168,100,${flash4})` }} />

      <ParticleBurst frame={lf} triggerFrame={5} n={65} cx={960} cy={300}
        colors={["#fff", P.yellow, P.gold]} spread={640} lifetime={45} />
      <ParticleBurst frame={lf} triggerFrame={54} n={90} cx={960} cy={590}
        colors={[P.gold, P.orange, P.yellow, "#fff", P.cyan]} spread={720} lifetime={45} />

      {/* Orbiting ring of dots */}
      {Array.from({ length: 10 }).map((_, i) => {
        const angle = (frame * (0.65 + i * 0.07) + i * 36) * Math.PI / 180;
        const r = 280 + i * 28;
        const ox = 960 + Math.cos(angle) * r;
        const oy = 490 + Math.sin(angle) * r * 0.34;
        const sz = 7 + i * 1.5;
        const dotColors = [P.orange, P.yellow, P.cyan, P.pink, P.purple, P.green, P.gold, "#fff", P.orange, P.cyan];
        return (
          <div key={i} style={{
            position: "absolute", left: ox - sz / 2, top: oy - sz / 2,
            width: sz, height: sz, borderRadius: "50%",
            background: dotColors[i],
            opacity: ip(lf, [i * 3, i * 3 + 16], [0, 0.9]),
          }} />
        );
      })}

      {/* Text */}
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        gap: 10,
      }}>
        <div style={{
          opacity: Math.min(1, l1Scale),
          transform: `scale(${0.5 + l1Scale * 0.5})`,
          fontSize: 20, fontWeight: 700, color: P.cyan,
          fontFamily: "'Courier New', monospace", letterSpacing: 12,
        }}>
          THERE  WAS
        </div>
        <div style={{
          opacity: Math.min(1, l2Scale * 1.4),
          transform: `scale(${0.4 + l2Scale * 0.6})`,
          fontSize: 140, fontWeight: 900,
          fontFamily: "'Helvetica Neue', Arial, sans-serif",
          color: "#fff", letterSpacing: -6, lineHeight: 1,
          textShadow: `0 0 80px rgba(200,168,100,0.4)`,
        }}>
          ONLY
        </div>
        <div style={{
          opacity: Math.min(1, l3Scale * 1.4),
          transform: `scale(${0.3 + l3Scale * 0.7}) rotate(${(1 - l3Scale) * -6}deg)`,
          fontSize: 340, fontWeight: 900,
          fontFamily: "'Helvetica Neue', Arial, sans-serif",
          color: P.gold, letterSpacing: -20, lineHeight: 0.85,
          textShadow: `0 0 120px rgba(200,168,100,0.8), 0 0 60px rgba(255,107,53,0.5)`,
        }}>
          1
        </div>
        <div style={{
          opacity: Math.min(1, l4Scale * 1.5),
          transform: `scale(${0.5 + l4Scale * 0.5}) translateY(${(1 - l4Scale) * 36}px)`,
          fontSize: 28, fontWeight: 300, color: "rgba(255,255,255,0.55)",
          fontFamily: "'Times New Roman', serif", letterSpacing: 8, fontStyle: "italic",
        }}>
          prototype.  ever  built.
        </div>
      </div>

      {chars.map((c, i) => (
        <Character key={i} frame={lf} from={c.from}
          x={c.x - 30} y={c.y} color={c.color} scale={0.82} mood="surprised" />
      ))}

      <FloatingShape frame={frame} from={815} x={960} y={100} shape="star" color={P.gold} size={44} rotSpeed={0.9} />
      <FloatingShape frame={frame} from={820} x={140} y={250} shape="circle" color={P.purple} size={30} />
      <FloatingShape frame={frame} from={816} x={1800} y={240} shape="triangle" color={P.pink} size={26} />
    </AbsoluteFill>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// SCENE 7: PORTAL / TRANSITION (900 – 960)
// ══════════════════════════════════════════════════════════════════════════════
const ScenePortal: React.FC<{ frame: number }> = ({ frame }) => {
  if (frame < 900 || frame >= 960) return null;
  const lf = frame - 900;

  const portalR  = ip(lf, [0, 50], [0, 1400], Easing.in(Easing.cubic));
  const portalOp = spr(lf, 0, SPb);
  const suck     = ip(lf, [10, 56], [0, 1], Easing.in(Easing.cubic));
  const whiteOut = ip(lf, [46, 60], [0, 1]);
  const textOp   = ip(lf, [14, 30, 42, 56], [0, 1, 1, 0]);
  const textScale = spr(lf, 14, SPb);

  return (
    <AbsoluteFill style={{ background: "#030208", overflow: "hidden" }}>
      <WarpRings frame={lf} from={0} />

      {/* Portal glow */}
      <div style={{
        position: "absolute",
        left: 960 - portalR, top: 540 - portalR,
        width: portalR * 2, height: portalR * 2, borderRadius: "50%",
        background: "radial-gradient(circle at center, rgba(168,85,255,0.95) 0%, rgba(0,207,255,0.7) 40%, transparent 70%)",
        boxShadow: `0 0 100px rgba(168,85,255,0.8), 0 0 200px rgba(0,207,255,0.4)`,
        opacity: portalOp,
      }} />

      {/* Text */}
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        opacity: textOp,
      }}>
        <div style={{
          transform: `scale(${textScale})`,
          textAlign: "center",
        }}>
          <div style={{
            fontSize: 100, fontWeight: 900,
            fontFamily: "'Helvetica Neue', Arial, sans-serif",
            color: "#fff", letterSpacing: -4,
            textShadow: "0 0 40px rgba(168,85,255,1), 0 0 80px rgba(0,207,255,0.8)",
          }}>
            NEXT  LEVEL
          </div>
          <div style={{
            fontSize: 18, color: P.cyan, letterSpacing: 10, marginTop: 12,
            fontFamily: "'Courier New', monospace",
          }}>
            DIGITAL  RESURRECTION
          </div>
        </div>
      </div>

      {/* Particles sucked to center */}
      {Array.from({ length: 50 }).map((_, i) => {
        const startAngle = rng(i * 3) * Math.PI * 2;
        const startDist  = 200 + rng(i * 3 + 1) * 650;
        const speed      = rng(i * 3 + 2, 0.5, 1.5);
        const dist = startDist * (1 - Math.min(1, suck * speed));
        const px = 960 + Math.cos(startAngle) * dist;
        const py = 540 + Math.sin(startAngle) * dist;
        const color = [P.purple, P.cyan, P.pink, P.orange, P.yellow, "#fff"][i % 6];
        const size  = rng(i * 3 + 3, 4, 14);
        return (
          <div key={i} style={{
            position: "absolute",
            left: px - size / 2, top: py - size / 2,
            width: size, height: size, borderRadius: "50%",
            background: color,
            opacity: 0.85 * (1 - suck * 0.6),
          }} />
        );
      })}

      {/* White flash */}
      <div style={{ position: "absolute", inset: 0, background: `rgba(255,255,255,${whiteOut})` }} />
    </AbsoluteFill>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// SCENE TRANSITION FLASH (between scenes)
// ══════════════════════════════════════════════════════════════════════════════
const SceneCutFlash: React.FC<{ frame: number }> = ({ frame }) => {
  const CUTS = [90, 270, 480, 660, 810, 900];
  let flash = 0;
  for (const c of CUTS) {
    const d = Math.abs(frame - c);
    if (d < 4) flash = Math.max(flash, ((4 - d) / 4) * 0.7);
  }
  if (flash < 0.01) return null;
  return (
    <div style={{ position: "absolute", inset: 0, background: `rgba(255,255,255,${flash})`, pointerEvents: "none", zIndex: 20 }} />
  );
};

// ── LETTERBOX ──────────────────────────────────────────────────────────────────
const Letterbox: React.FC = () => (
  <>
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 64, background: "#000", zIndex: 30 }} />
    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 64, background: "#000", zIndex: 30 }} />
  </>
);

// ── VIGNETTE ──────────────────────────────────────────────────────────────────
const Vignette: React.FC = () => (
  <div style={{
    position: "absolute", inset: 0,
    background: "radial-gradient(ellipse at center, transparent 42%, rgba(0,0,0,0.55) 85%, rgba(0,0,0,0.85) 100%)",
    pointerEvents: "none", zIndex: 15,
  }} />
);

// ══════════════════════════════════════════════════════════════════════════════
// ROOT: ZIS KURZGESAGT (960 frames = 32s @ 30fps)
// ══════════════════════════════════════════════════════════════════════════════
export const ZISKurzgesagt: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Audio
        src={staticFile("showcase-music.mp3")}
        volume={(f) => interpolate(f, [900, 960], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}
      />

      <SceneCosmicBirth     frame={frame} />
      <SceneFactory         frame={frame} />
      <SceneAssembly        frame={frame} />
      <SceneSpecsExplosion  frame={frame} />
      <SceneDrive           frame={frame} />
      <SceneLegend          frame={frame} />
      <ScenePortal          frame={frame} />

      <SceneCutFlash frame={frame} />
      <Vignette />
      <Letterbox />
    </AbsoluteFill>
  );
};
