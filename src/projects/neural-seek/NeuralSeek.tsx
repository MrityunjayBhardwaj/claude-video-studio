/**
 * NeuralSeek — Dark Neumorphism · Slow 3D · Void Background · Directional Light
 * 1080×1080 · 30fps · 42s = 1260 frames
 */
import React from "react";
import {
  AbsoluteFill, Audio, Easing, Sequence,
  interpolate, spring, staticFile, useCurrentFrame,
} from "remotion";

// ─── Motion tokens ────────────────────────────────────────────────────────────
const F   = { micro: 5, small: 9, medium: 15, large: 24, xl: 60 };
const SP  = { stiffness: 250, damping: 20, mass: 1 };
const SPS = { stiffness: 400, damping: 28, mass: 0.8 };
const EASE = {
  entrance: Easing.bezier(0.2, 0.8, 0.2, 1),
  exit:     Easing.bezier(0.8, 0.0, 0.8, 0.2),
  emphasis: Easing.bezier(0.34, 1.56, 0.64, 1),
};

// ─── Palette ──────────────────────────────────────────────────────────────────
const BASE    = "#020208";           // pure void
const SURFACE = "linear-gradient(145deg, #161625, #0a0a18)";
const TEXT1   = "rgba(255,255,255,0.90)";
const TEXT2   = "rgba(255,255,255,0.45)";
const INDIGO  = "#6366f1";
const PURPLE  = "#8b5cf6";
const TEAL    = "#14b8a6";
const PINK    = "#ec4899";
const SKY     = "#38bdf8";
const GREEN   = "#22c55e";
const GOLD    = "#f59e0b";
const ORANGE  = "#f97316";

// ─── Directional light animation ─────────────────────────────────────────────
// Returns the shadow cast vector (direction light travels, upper-left → lower-right base)
// Oscillates ±40° over ~17 seconds giving a slowly rotating light source
const lightDir = (frame: number) => {
  const t     = frame * 0.006;
  const base  = Math.PI * 0.75;           // 135° = shadows fall lower-right
  const angle = base + Math.sin(t) * 0.7; // ±40° swing
  return { sx: Math.cos(angle), sy: Math.sin(angle) };
};

// ─── Neumorphic style helpers (frame-aware for directional light) ─────────────
const nmCard = (r = 24, accent?: string, frame = 0): React.CSSProperties => {
  const { sx, sy } = lightDir(frame);
  const sm = 20; const lm = 12;
  return {
    background: SURFACE,
    borderRadius: r,
    border: "1px solid rgba(255,255,255,0.055)",
    boxShadow: [
      `${-sx * lm}px ${-sy * lm}px 30px rgba(255,255,255,0.055)`, // light-face highlight
      `${sx * sm}px ${sy * sm}px 60px rgba(0,0,0,0.92)`,          // primary shadow
      `0 55px 110px rgba(0,0,0,0.88)`,                             // deep vertical drop
      `0 110px 180px rgba(0,0,0,0.65)`,                            // far ambient
      "inset 0 1px 0 rgba(255,255,255,0.10)",
      "inset 0 -1px 0 rgba(0,0,0,0.28)",
      "0 0 0 1px rgba(255,255,255,0.04)",
      accent ? `0 0 70px ${accent}22, 0 0 140px ${accent}10` : "",
    ].filter(Boolean).join(","),
  };
};

const nmInset = (r = 16): React.CSSProperties => ({
  background: "linear-gradient(145deg, #0a0a17, #13131f)",
  borderRadius: r,
  border: "1px solid rgba(0,0,0,0.3)",
  boxShadow: [
    "inset 4px 4px 14px rgba(0,0,0,0.65)",
    "inset -4px -4px 10px rgba(255,255,255,0.03)",
    "inset 0 0 0 1px rgba(0,0,0,0.2)",
  ].join(","),
});

const nmButton = (color: string, frame = 0): React.CSSProperties => {
  const { sx, sy } = lightDir(frame);
  return {
    background: `linear-gradient(145deg, ${color}dd, ${color}99)`,
    borderRadius: 60,
    border: `1px solid ${color}50`,
    boxShadow: [
      `${-sx * 7}px ${-sy * 7}px 18px rgba(255,255,255,0.045)`,
      `${sx * 8}px ${sy * 8}px 28px rgba(0,0,0,0.80)`,
      `0 32px 64px rgba(0,0,0,0.70)`,
      `0 0 50px ${color}45`,
      `0 0 100px ${color}18`,
      `inset 0 1px 0 rgba(255,255,255,0.18)`,
      `inset 0 -1px 0 rgba(0,0,0,0.28)`,
    ].join(","),
  };
};

const nmSphereStyle = (color: string, size: number, frame = 0): React.CSSProperties => {
  const { sx, sy } = lightDir(frame);
  // Focal point of the radial gradient shifts with light direction
  const fx = Math.round((0.5 - sx * 0.28) * 100);
  const fy = Math.round((0.5 - sy * 0.28) * 100);
  return {
    width: size, height: size, borderRadius: "50%",
    background: `radial-gradient(circle at ${fx}% ${fy}%, ${color}ee 0%, ${color}88 40%, ${color}33 70%, #040410 100%)`,
    boxShadow: [
      `inset ${sx * size * 0.09}px ${sy * size * 0.09}px ${size * 0.20}px rgba(0,0,0,0.62)`,
      `inset ${-sx * size * 0.05}px ${-sy * size * 0.05}px ${size * 0.12}px rgba(255,255,255,0.16)`,
      `${sx * size * 0.22}px ${sy * size * 0.22}px ${size * 0.55}px rgba(0,0,0,0.88)`,
      `0 ${size * 0.35}px ${size * 0.65}px rgba(0,0,0,0.75)`,
      `0 0 ${size * 0.8}px ${color}55`,
      `0 0 ${size * 1.6}px ${color}18`,
      `0 0 0 1px ${color}30`,
    ].join(","),
    border: `1px solid ${color}25`,
    flexShrink: 0,
  };
};

// ─── Slow 3D floating motion ──────────────────────────────────────────────────
const float3D = (frame: number, idx = 0, amp = { rx: 6, ry: 9, tz: 16 }) => {
  const t  = frame * 0.0075;
  const ph = idx * 0.85;
  return {
    rx: Math.sin(t + ph) * amp.rx,
    ry: Math.cos(t * 0.82 + ph) * amp.ry,
    tz: Math.sin(t * 0.55 + ph + 1) * amp.tz,
  };
};

const f3dTransform = (rx: number, ry: number, tz: number, extraScale = 1) =>
  `perspective(950px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(${tz}px) scale(${extraScale})`;

// ─── Interpolation helpers ────────────────────────────────────────────────────
const ei = (f: number, from: number, dur: number, ease = EASE.entrance) =>
  interpolate(f, [from, from + dur], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease,
  });

const sp = (f: number, delay = 0, cfg = SP) =>
  spring({ frame: Math.max(0, f - delay), fps: 30, config: cfg });

// ─── Void background — empty space, no grid ───────────────────────────────────
const NmBg: React.FC<{ accent?: string }> = ({ accent }) => {
  const f = useCurrentFrame();
  const t = f * 0.005;
  return (
    <AbsoluteFill style={{ background: BASE, overflow: "hidden" }}>
      {/* Single slow-moving ambient orb — gives depth without filling the void */}
      {accent && (
        <div style={{
          position: "absolute",
          width: 1000, height: 1000,
          background: `radial-gradient(circle, ${accent}09 0%, transparent 60%)`,
          borderRadius: "50%", filter: "blur(80px)",
          left: `${44 + Math.sin(t) * 14}%`,
          top: `${40 + Math.cos(t * 0.7) * 12}%`,
          transform: "translate(-50%,-50%)",
        }} />
      )}
      {/* Faint secondary orb on opposite side */}
      {accent && (
        <div style={{
          position: "absolute",
          width: 600, height: 600,
          background: `radial-gradient(circle, ${accent}05 0%, transparent 60%)`,
          borderRadius: "50%", filter: "blur(60px)",
          left: `${58 - Math.sin(t) * 10}%`,
          top: `${62 - Math.cos(t * 0.7) * 10}%`,
          transform: "translate(-50%,-50%)",
        }} />
      )}
    </AbsoluteFill>
  );
};

// ─── Floating 3D card wrapper ─────────────────────────────────────────────────
const NmFloat: React.FC<{
  idx?: number;
  amp?: { rx: number; ry: number; tz: number };
  entryScale?: number;
  entryDelay?: number;
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({ idx = 0, amp, entryScale = 1, entryDelay = 0, style, children }) => {
  const f = useCurrentFrame();
  const { rx, ry, tz } = float3D(f, idx, amp ?? { rx: 6, ry: 9, tz: 16 });
  const sc = sp(f, entryDelay, SP);
  const op = ei(f, entryDelay, F.medium);

  return (
    <div style={{
      opacity: op,
      transform: f3dTransform(rx, ry, tz, sc * entryScale),
      ...style,
    }}>
      {children}
    </div>
  );
};

// ─── NeuralSeek Logo ──────────────────────────────────────────────────────────
const NmLogo: React.FC<{ scale?: number }> = ({ scale = 1 }) => {
  const f = useCurrentFrame();
  const t = f * 0.012;
  const glowPulse = 0.7 + Math.sin(t) * 0.3;
  const { sx, sy } = lightDir(f);
  return (
    <div style={{ textAlign: "center", transform: `scale(${scale})` }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 18 }}>
        <div style={{
          ...nmCard(20, INDIGO, f),
          width: 72, height: 72,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 36,
          boxShadow: [
            `${-sx * 10}px ${-sy * 10}px 22px rgba(255,255,255,0.05)`,
            `${sx * 12}px ${sy * 12}px 36px rgba(0,0,0,0.88)`,
            `0 45px 80px rgba(0,0,0,0.85)`,
            `0 0 55px ${INDIGO}${Math.round(glowPulse * 55).toString(16).padStart(2,"0")}`,
            `0 0 110px ${PURPLE}18`,
          ].join(","),
        }}>⚡</div>
        <div style={{
          fontSize: 60, fontWeight: 900, fontFamily: "system-ui,sans-serif", letterSpacing: -2,
          background: `linear-gradient(135deg, rgba(255,255,255,0.95), ${SKY} 50%, ${INDIGO})`,
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
          filter: `drop-shadow(0 0 20px ${INDIGO}50) drop-shadow(0 4px 12px rgba(0,0,0,0.9))`,
        }}>NeuralSeek</div>
      </div>
      <div style={{
        fontSize: 16, color: TEXT2, fontFamily: "system-ui,sans-serif",
        letterSpacing: 5, marginTop: 10, textTransform: "uppercase",
        textShadow: "0 2px 8px rgba(0,0,0,0.9)",
      }}>
        AI Agents for the Enterprise
      </div>
    </div>
  );
};

// ─── Particle field ───────────────────────────────────────────────────────────
const ParticleField: React.FC<{ count?: number; color?: string }> = ({ count = 30, color = INDIGO }) => {
  const f = useCurrentFrame();
  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const t  = f * 0.008 + i * 0.4;
        const x  = ((i * 137.5) % 1080);
        const y  = ((i * 97) % 1080);
        const fy = ((y - f * (0.2 + (i % 5) * 0.08)) % 1080 + 1080) % 1080;
        const op = (Math.sin(t) * 0.5 + 0.5) * 0.35;
        const sz = 1.5 + (i % 4) * 1;
        return (
          <div key={i} style={{
            position: "absolute", left: x, top: fy,
            width: sz, height: sz, borderRadius: "50%",
            background: color, opacity: op,
            boxShadow: `0 0 ${sz * 4}px ${color}`,
          }} />
        );
      })}
    </>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SCENE 1 · 0–90f · "Meet" → Logo reveal
// ─────────────────────────────────────────────────────────────────────────────
const Scene1: React.FC = () => {
  const f = useCurrentFrame();

  const meetOp  = ei(f, 0, F.large);
  const meetSc  = sp(f, 0, SP);
  const { rx: mx, ry: my, tz: mz } = float3D(f, 0, { rx: 5, ry: 8, tz: 12 });

  const exitProg  = ei(f, 45, F.medium, EASE.exit);
  const meetBlur  = exitProg * 22;
  const meetFade  = 1 - exitProg;
  const meetXSc   = 1 + exitProg * 0.45;

  const logoSc = sp(f, 51, { stiffness: 200, damping: 22, mass: 1 });
  const logoOp = ei(f, 51, F.large);
  const { rx: lx, ry: ly, tz: lz } = float3D(f, 1, { rx: 4, ry: 7, tz: 14 });

  const sweepProg = ei(f, 55, F.large * 1.5, EASE.entrance);
  const sweepX    = interpolate(sweepProg, [0, 1], [-300, 1400]);

  const flash = interpolate(f, [0, 2, 10], [1, 1, 0], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
      <NmBg accent={INDIGO} />
      <ParticleField count={24} color={INDIGO} />
      <AbsoluteFill style={{ background: "white", opacity: flash, zIndex: 200 }} />

      {f < 60 && (
        <div style={{
          position: "absolute", zIndex: 10,
          opacity: meetOp * meetFade,
          transform: f3dTransform(mx, my, mz, meetSc * meetXSc),
          filter: `blur(${meetBlur}px)`,
        }}>
          <div style={{ ...nmCard(28, undefined, f), padding: "40px 80px", textAlign: "center" }}>
            <div style={{
              fontSize: 130, fontWeight: 900, fontFamily: "system-ui,sans-serif",
              color: TEXT1, letterSpacing: -4,
              textShadow: [
                "-3px -3px 8px rgba(255,255,255,0.06)",
                "3px 3px 14px rgba(0,0,0,0.9)",
                `0 0 60px ${INDIGO}40`,
              ].join(","),
            }}>Meet</div>
          </div>
        </div>
      )}

      {f >= 49 && (
        <div style={{
          position: "absolute", zIndex: 10,
          opacity: logoOp,
          transform: f3dTransform(lx, ly, lz, logoSc),
        }}>
          <div style={{ ...nmCard(32, INDIGO, f), padding: "56px 80px 48px", textAlign: "center" }}>
            <NmLogo />
          </div>
          <div style={{
            position: "absolute", top: "50%", left: sweepX, width: 280, height: 2,
            background: `linear-gradient(90deg, transparent, ${INDIGO}cc, ${PURPLE}88, transparent)`,
            filter: "blur(2px)",
            transform: "translateY(-50%)",
          }} />
        </div>
      )}
    </AbsoluteFill>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SCENE 2 · 90–210f · AI Agents headline + floating stat cards
// ─────────────────────────────────────────────────────────────────────────────
const Scene2: React.FC = () => {
  const f = useCurrentFrame();
  const { rx: hx, ry: hy, tz: hz } = float3D(f, 0, { rx: 3, ry: 6, tz: 10 });
  const hSc = sp(f, 0, SP); const hOp = ei(f, 0, F.medium);

  const stats = [
    { val: "10M+",  label: "Daily API Calls",  color: INDIGO,  idx: 1 },
    { val: "99.9%", label: "Uptime SLA",        color: TEAL,    idx: 2 },
    { val: "1000+", label: "Integrations",      color: PURPLE,  idx: 3 },
  ];

  return (
    <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 52 }}>
      <NmBg accent={PURPLE} />
      <ParticleField count={20} color={PURPLE} />

      <div style={{ opacity: hOp, zIndex: 10, transform: f3dTransform(hx, hy, hz, hSc) }}>
        <div style={{ ...nmCard(28, INDIGO, f), padding: "44px 64px", textAlign: "center" }}>
          <div style={{ fontSize: 15, color: INDIGO, letterSpacing: 6, fontWeight: 700, fontFamily: "system-ui,sans-serif", marginBottom: 12, textTransform: "uppercase" }}>
            Introducing
          </div>
          <div style={{ fontSize: 72, fontWeight: 900, fontFamily: "system-ui,sans-serif", letterSpacing: -2, lineHeight: 1.05, color: TEXT1, textShadow: `0 4px 20px rgba(0,0,0,0.9), 0 0 40px ${INDIGO}30` }}>
            Intelligent AI Agents
          </div>
          <div style={{ fontSize: 28, color: TEXT2, fontFamily: "system-ui,sans-serif", fontWeight: 400, marginTop: 10, textShadow: "0 2px 8px rgba(0,0,0,0.8)" }}>
            for the modern enterprise.
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 24, zIndex: 10 }}>
        {stats.map((s, i) => {
          const delay = F.large + i * F.medium;
          const { rx, ry, tz } = float3D(f, s.idx, { rx: 7, ry: 10, tz: 20 });
          const sc = sp(f, delay, SPS); const op = ei(f, delay, F.medium, EASE.emphasis);
          return (
            <div key={i} style={{ opacity: op, transform: f3dTransform(rx, ry, tz, sc) }}>
              <div style={{ ...nmCard(20, s.color, f), padding: "28px 36px", textAlign: "center", minWidth: 220 }}>
                <div style={{ fontSize: 52, fontWeight: 900, fontFamily: "system-ui,sans-serif", color: s.color, textShadow: `0 0 30px ${s.color}60, 0 4px 12px rgba(0,0,0,0.8)`, lineHeight: 1 }}>
                  {s.val}
                </div>
                <div style={{ fontSize: 12, color: TEXT2, fontFamily: "system-ui,sans-serif", letterSpacing: 2, marginTop: 8 }}>
                  {s.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SCENE 3 · 210–360f · "Just vibe it" + floating search bar
// ─────────────────────────────────────────────────────────────────────────────
const Scene3: React.FC = () => {
  const f = useCurrentFrame();
  const { rx: hx, ry: hy, tz: hz } = float3D(f, 0, { rx: 4, ry: 6, tz: 10 });
  const { rx: bx, ry: by, tz: bz } = float3D(f, 2, { rx: 5, ry: 8, tz: 18 });
  const { rx: tx, ry: ty, tz: tz2 } = float3D(f, 3, { rx: 6, ry: 9, tz: 22 });

  const hOp = ei(f, 0, F.medium); const hSc = sp(f, 0, SP);
  const bOp = ei(f, 60, F.medium, EASE.emphasis); const bSc = sp(f, 60, SP);
  const tipOp = ei(f, 84, F.small, EASE.emphasis); const tipSc = sp(f, 84, SPS);
  const tipY  = interpolate(f - 84, [0, F.small], [36, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE.emphasis });

  const prompt = "Prompt your agent into existence...";
  const typed  = Math.floor(interpolate(f, [70, 130], [0, prompt.length], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));

  return (
    <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 40 }}>
      <NmBg accent={PINK} />
      <ParticleField count={16} color={PURPLE} />

      <div style={{ opacity: hOp, transform: f3dTransform(hx, hy, hz, hSc), zIndex: 10 }}>
        <div style={{ ...nmCard(28, undefined, f), padding: "36px 60px", textAlign: "center" }}>
          <div style={{ fontSize: 16, color: PINK, letterSpacing: 5, fontWeight: 700, fontFamily: "system-ui,sans-serif", marginBottom: 10, textTransform: "uppercase" }}>
            No YAML · No Flowcharts
          </div>
          <div style={{ fontSize: 66, fontWeight: 900, fontFamily: "system-ui,sans-serif", color: TEXT1, letterSpacing: -2, textShadow: `0 4px 20px rgba(0,0,0,0.9), 0 0 50px ${PINK}20` }}>
            Or.... just vibe it.
          </div>
        </div>
      </div>

      <div style={{ opacity: bOp, transform: f3dTransform(bx, by, bz, bSc), zIndex: 10 }}>
        <div style={{ ...nmCard(60, INDIGO, f), padding: "20px 24px 20px 32px", width: 680, display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ fontSize: 24 }}>✨</div>
          <div style={{ ...nmInset(14), flex: 1, padding: "12px 20px" }}>
            <span style={{ fontSize: 17, color: INDIGO, fontFamily: "monospace", letterSpacing: 0.3 }}>
              {prompt.slice(0, typed)}{typed < prompt.length ? "▊" : ""}
            </span>
          </div>
          <div style={{ ...nmButton(INDIGO, f), padding: "12px 28px", fontSize: 16, fontWeight: 700, color: "white", fontFamily: "system-ui,sans-serif", whiteSpace: "nowrap", cursor: "default" }}>
            Generate →
          </div>
        </div>
      </div>

      <div style={{ opacity: tipOp, transform: `translateY(${tipY}px) ${f3dTransform(tx, ty, tz2, tipSc)}`, zIndex: 10 }}>
        <div style={{ ...nmCard(16, GREEN, f), padding: "16px 28px", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: GREEN, flexShrink: 0, boxShadow: `0 0 12px ${GREEN}cc, 0 0 24px ${GREEN}66` }} />
          <span style={{ fontSize: 15, color: TEXT1, fontWeight: 600, fontFamily: "system-ui,sans-serif" }}>
            ⚡ Agent generated in 2.3s — ready to deploy
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SCENE 4 · 360–510f · 3D Node Sphere Graph
// ─────────────────────────────────────────────────────────────────────────────
type NodeDef = { x: number; y: number; label: string; color: string; size: number; main?: boolean };

const NODES: NodeDef[] = [
  { x: 0,    y: 0,    label: "NeuralSeek",    color: INDIGO,  size: 58, main: true },
  { x: 220,  y:-200,  label: "Intent Engine", color: PURPLE,  size: 38 },
  { x: 280,  y: 30,   label: "Knowledge",     color: TEAL,    size: 38 },
  { x: 150,  y: 240,  label: "Response Gen",  color: PINK,    size: 38 },
  { x:-150,  y: 240,  label: "Enterprise",    color: SKY,     size: 38 },
  { x:-280,  y: 30,   label: "Security",      color: GOLD,    size: 38 },
  { x:-220,  y:-200,  label: "Analytics",     color: GREEN,   size: 38 },
  { x: 0,    y:-280,  label: "Integrations",  color: ORANGE,  size: 38 },
];

const Scene4: React.FC = () => {
  const f = useCurrentFrame();
  const graphRotY = f * 0.18;
  const graphRotX = Math.sin(f * 0.006) * 12;

  const titleOp = ei(f, 0, F.medium);
  const { rx: tx, ry: ty, tz: tz_ } = float3D(f, 0, { rx: 3, ry: 4, tz: 8 });
  const titleSc = sp(f, 0, SP);

  return (
    <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
      <NmBg accent={TEAL} />
      <ParticleField count={18} color={TEAL} />

      <div style={{
        position: "absolute", top: 68, left: 0, right: 0, zIndex: 20,
        opacity: titleOp, transform: f3dTransform(tx, ty, tz_, titleSc),
        textAlign: "center",
      }}>
        <div style={{ ...nmCard(20, undefined, f), display: "inline-block", padding: "16px 48px" }}>
          <span style={{ fontSize: 14, color: TEAL, letterSpacing: 5, fontWeight: 700, fontFamily: "system-ui,sans-serif", textTransform: "uppercase" }}>
            Architecture · Built to think. Wired to scale.
          </span>
        </div>
      </div>

      <div style={{
        position: "relative",
        transform: `perspective(1100px) rotateX(${graphRotX}deg) rotateY(${graphRotY}deg)`,
        width: 600, height: 600,
        transformStyle: "preserve-3d",
      }}>
        <svg style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", overflow: "visible" }}
          width="600" height="600" viewBox="-300 -300 600 600">
          {NODES.slice(1).map((n, i) => {
            const center = NODES[0];
            const edgeDelay = i * 6 + F.medium;
            const dx = n.x - center.x; const dy = n.y - center.y;
            const len = Math.sqrt(dx*dx + dy*dy);
            const prog = Math.min(1, Math.max(0, (f - edgeDelay) / F.medium));
            const dash = len * (1 - prog);
            const pulse = ((f * 0.018 + i * 0.28) % 1);
            const px = center.x + dx * pulse;
            const py = center.y + dy * pulse;
            return (
              <g key={i}>
                <line x1={center.x} y1={center.y} x2={n.x} y2={n.y}
                  stroke={n.color} strokeWidth={1.5} opacity={0.4}
                  strokeDasharray={len} strokeDashoffset={dash} />
                {prog > 0 && <circle cx={px} cy={py} r={3} fill={n.color} opacity={0.9} />}
              </g>
            );
          })}
        </svg>

        {NODES.map((n, i) => {
          const delay = i * 6;
          const sc  = sp(f, delay, SP);
          const op  = ei(f, delay, F.small);
          const bob = Math.sin(f * 0.01 + i * 0.7) * 8;
          return (
            <div key={i} style={{
              position: "absolute",
              left: `calc(50% + ${n.x}px - ${n.size/2}px)`,
              top: `calc(50% + ${n.y}px - ${n.size/2}px + ${bob}px)`,
              opacity: op,
              transform: `scale(${sc})`,
              zIndex: n.main ? 10 : 5,
            }}>
              <div style={nmSphereStyle(n.color, n.size, f)} />
              <div style={{
                position: "absolute",
                top: n.size + 8,
                left: "50%", transform: "translateX(-50%)",
                whiteSpace: "nowrap",
                fontSize: n.main ? 13 : 10,
                fontWeight: n.main ? 800 : 500,
                color: n.color,
                fontFamily: "system-ui,sans-serif",
                textShadow: `0 2px 8px rgba(0,0,0,0.95), 0 0 20px ${n.color}60`,
              }}>
                {n.label}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SCENE 5 · 510–690f · UI card cascade
// ─────────────────────────────────────────────────────────────────────────────
type CardSpec = {
  x: number; y: number; w: number; h: number; delay: number; idx: number; accent?: string;
  content: React.ReactNode;
};

const buildCards = (): CardSpec[] => {
  const dash = (
    <div style={{ padding: "20px 22px" }}>
      <div style={{ fontSize: 10, color: TEXT2, letterSpacing: 2, fontFamily: "system-ui,sans-serif", marginBottom: 4 }}>QUERIES PROCESSED</div>
      <div style={{ fontSize: 36, fontWeight: 900, color: INDIGO, fontFamily: "system-ui,sans-serif", textShadow: `0 0 20px ${INDIGO}60` }}>24,892</div>
      <div style={{ display: "flex", gap: 3, alignItems: "flex-end", height: 44, marginTop: 10 }}>
        {[0.4,0.65,0.5,0.78,0.9,0.68,0.88,1.0,0.93,0.87,0.95,1.0].map((h, i) => (
          <div key={i} style={{ flex: 1, height: `${h*100}%`, background: `linear-gradient(to top,${INDIGO},${PURPLE})`, borderRadius: 2, opacity: 0.75 }} />
        ))}
      </div>
    </div>
  );
  const chat = (
    <div style={{ padding: "16px 18px" }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: TEXT1, fontFamily: "system-ui,sans-serif", marginBottom: 10 }}>Agent Chat</div>
      {[{ me: true, t: "Summarize Q3 data" }, { me: false, t: "Revenue $4.2M, up 23% YoY..." }, { me: true, t: "Generate a report" }].map((m, i) => (
        <div key={i} style={{ display: "flex", justifyContent: m.me ? "flex-end" : "flex-start", marginBottom: 6 }}>
          <div style={{
            padding: "7px 12px", borderRadius: m.me ? "12px 12px 4px 12px" : "12px 12px 12px 4px",
            background: m.me ? `linear-gradient(135deg,${INDIGO}dd,${PURPLE}cc)` : nmInset(8).background,
            boxShadow: m.me ? `0 4px 16px ${INDIGO}50` : "inset 2px 2px 6px rgba(0,0,0,0.4)",
            color: TEXT1, fontSize: 10, maxWidth: "75%", fontFamily: "system-ui,sans-serif",
          }}>{m.t}</div>
        </div>
      ))}
    </div>
  );
  const mkMetric = (label: string, val: string, color: string, icon: string) => (
    <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}18`, border: `1px solid ${color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, boxShadow: `0 0 20px ${color}30` }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 9, color: TEXT2, fontFamily: "system-ui,sans-serif", letterSpacing: 1 }}>{label}</div>
        <div style={{ fontSize: 24, fontWeight: 900, color, fontFamily: "system-ui,sans-serif", textShadow: `0 0 16px ${color}60` }}>{val}</div>
      </div>
    </div>
  );
  const mkSmall = (t: string, s: string, c: string) => (
    <div style={{ padding: "12px 16px" }}>
      <div style={{ width: 28, height: 4, background: c, borderRadius: 2, marginBottom: 8, boxShadow: `0 0 10px ${c}80` }} />
      <div style={{ fontSize: 15, fontWeight: 800, color: TEXT1, fontFamily: "system-ui,sans-serif" }}>{t}</div>
      <div style={{ fontSize: 9, color: TEXT2, fontFamily: "system-ui,sans-serif", marginTop: 2 }}>{s}</div>
    </div>
  );

  return [
    { x:  40, y: 60,  w: 340, h: 130, delay: 21, idx: 0, accent: INDIGO,  content: dash },
    { x: 400, y: 60,  w: 280, h: 130, delay: 23, idx: 1, accent: PURPLE,  content: chat },
    { x: 700, y: 60,  w: 200, h: 100, delay: 25, idx: 2, accent: TEAL,    content: mkSmall("No Code","Zero YAML required",TEAL) },
    { x:  40, y: 210, w: 190, h: 84,  delay: 27, idx: 3, accent: PURPLE,  content: mkMetric("Agents","1,284",PURPLE,"🤖") },
    { x: 250, y: 210, w: 280, h: 130, delay: 29, idx: 4,                  content: chat },
    { x: 550, y: 210, w: 190, h: 84,  delay: 31, idx: 5, accent: TEAL,    content: mkMetric("Avg Resp","1.2s",TEAL,"⚡") },
    { x: 760, y: 210, w: 190, h: 84,  delay: 33, idx: 6, accent: GREEN,   content: mkMetric("Uptime","99.9%",GREEN,"📡") },
    { x:  40, y: 420, w: 200, h: 84,  delay: 35, idx: 7, accent: GOLD,    content: mkMetric("Languages","90+",GOLD,"🌐") },
    { x: 260, y: 420, w: 200, h: 84,  delay: 37, idx: 8, accent: PINK,    content: mkMetric("Queries","82K",PINK,"📊") },
    { x: 480, y: 420, w: 200, h: 84,  delay: 39, idx: 9, accent: SKY,     content: mkMetric("Integrations","1000+",SKY,"🔗") },
    { x: 700, y: 420, w: 200, h: 84,  delay: 41, idx:10, accent: ORANGE,  content: mkSmall("Any LLM","GPT·Claude·Gemini",ORANGE) },
    { x:  40, y: 600, w: 180, h: 80,  delay: 43, idx:11, accent: INDIGO,  content: mkSmall("Self-hosted","On-prem or cloud",INDIGO) },
    { x: 240, y: 600, w: 180, h: 80,  delay: 45, idx:12, accent: TEAL,    content: mkSmall("RAG Native","Knowledge-grounded",TEAL) },
    { x: 440, y: 600, w: 190, h: 80,  delay: 47, idx:13, accent: PURPLE,  content: mkMetric("Cost Save","68%",PURPLE,"💰") },
    { x: 650, y: 600, w: 200, h: 80,  delay: 49, idx:14, accent: GREEN,   content: mkSmall("No Lock-in","Switch anytime",GREEN) },
  ];
};

const CARDS5 = buildCards();

const Scene5: React.FC = () => {
  const f = useCurrentFrame();

  const btnSc = sp(f, 0, SPS); const btnOp = ei(f, 0, F.small);
  const btnClickSc = interpolate(f, [15, 18, 21], [1, 0.92, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const btnFade = 1 - interpolate(f, [18, 24], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const { rx: pbx, ry: pby, tz: pbz } = float3D(f, 0, { rx: 4, ry: 6, tz: 12 });

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <NmBg accent={INDIGO} />

      {f < 26 && (
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 30,
          opacity: btnOp * btnFade,
          transform: f3dTransform(pbx, pby, pbz, btnSc * btnClickSc),
        }}>
          <div style={{ ...nmButton(INDIGO, f), padding: "22px 60px", fontSize: 24, fontWeight: 700, color: "white", fontFamily: "system-ui,sans-serif", display: "flex", alignItems: "center", gap: 12 }}>
            <span>🚀</span> Publish Agent
          </div>
        </div>
      )}

      {CARDS5.map((card, i) => {
        const lf  = Math.max(0, f - card.delay);
        const sc  = spring({ frame: lf, fps: 30, config: SP });
        const ty  = interpolate(lf, [0, 1], [50, 0], { extrapolateRight: "clamp" });
        const op  = interpolate(lf, [0, F.small], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE.entrance });
        const { rx, ry, tz } = float3D(f, card.idx, { rx: 4, ry: 6, tz: 10 });

        return (
          <div key={i} style={{
            position: "absolute",
            left: card.x, top: card.y,
            width: card.w, height: card.h,
            opacity: op, zIndex: i,
            transform: `translateY(${ty}px) ${f3dTransform(rx, ry, tz, sc)}`,
          }}>
            <div style={{ ...nmCard(16, card.accent, f), width: "100%", height: "100%", overflow: "hidden" }}>
              {card.content}
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SCENE 6 · 690–810f · Feature pillars
// ─────────────────────────────────────────────────────────────────────────────
const Scene6: React.FC = () => {
  const f = useCurrentFrame();
  const headSc = sp(f, 0, SP); const headOp = ei(f, 0, F.medium);
  const { rx: hx, ry: hy, tz: hz } = float3D(f, 0, { rx: 3, ry: 5, tz: 8 });

  const features = [
    { icon: "🎯", title: "True No Code", sub: "Build, train & deploy AI agents with natural language.\nNo YAML. No flowcharts.", color: INDIGO, idx: 1 },
    { icon: "🔓", title: "Zero Lock-in", sub: "Any LLM, any cloud, any infra.\nSwap providers in seconds.", color: TEAL, idx: 2 },
    { icon: "🏢", title: "Enterprise", sub: "SOC2 · HIPAA · GDPR.\nSSO, RBAC, audit logs.", color: PURPLE, idx: 3 },
  ];

  return (
    <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 48 }}>
      <NmBg accent={INDIGO} />
      <ParticleField count={20} color={INDIGO} />

      <div style={{ opacity: headOp, transform: f3dTransform(hx, hy, hz, headSc), zIndex: 10 }}>
        <div style={{ ...nmCard(22, undefined, f), padding: "22px 56px", textAlign: "center" }}>
          <div style={{ fontSize: 48, fontWeight: 900, color: TEXT1, fontFamily: "system-ui,sans-serif", letterSpacing: -1, textShadow: `0 4px 16px rgba(0,0,0,0.9)` }}>
            Purpose-built for scale.
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 24, zIndex: 10 }}>
        {features.map((feat, i) => {
          const delay = 6 * i + F.large;
          const sc = sp(f, delay, SP); const op = ei(f, delay, F.medium);
          const { rx, ry, tz } = float3D(f, feat.idx, { rx: 7, ry: 10, tz: 22 });
          const rotY = interpolate(Math.max(0, f - delay), [0, F.large], [i === 0 ? -28 : i === 2 ? 28 : 0, 0], { extrapolateRight: "clamp", easing: EASE.entrance });
          return (
            <div key={i} style={{ opacity: op, transform: `${f3dTransform(rx, ry + rotY, tz, sc)}` }}>
              <div style={{ ...nmCard(22, feat.color, f), padding: "36px 28px", width: 280, textAlign: "center" }}>
                <div style={{
                  ...nmSphereStyle(feat.color, 72, f),
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 34, margin: "0 auto 22px",
                }}>{feat.icon}</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: feat.color, fontFamily: "system-ui,sans-serif", marginBottom: 10, textShadow: `0 0 20px ${feat.color}60` }}>
                  {feat.title}
                </div>
                <div style={{ fontSize: 13, color: TEXT2, fontFamily: "system-ui,sans-serif", lineHeight: 1.7, whiteSpace: "pre-line" }}>
                  {feat.sub}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SCENE 7 · 810–930f · Integrations orbit
// ─────────────────────────────────────────────────────────────────────────────
const INTEG = [
  { name: "Salesforce", icon: "☁️",  color: "#00a1e0" },
  { name: "ServiceNow", icon: "🔧",  color: "#62d84e" },
  { name: "SAP",        icon: "📊",  color: "#0073e6" },
  { name: "Workday",    icon: "👥",  color: "#f5821f" },
  { name: "Zendesk",    icon: "💬",  color: "#03363d" },
  { name: "Slack",      icon: "💬",  color: "#4a154b" },
  { name: "Jira",       icon: "📋",  color: "#0052cc" },
  { name: "HubSpot",    icon: "📈",  color: "#ff7a59" },
];

const STAGGER_DEFAULT = 2;

const Scene7: React.FC = () => {
  const f = useCurrentFrame();
  const headOp = ei(f, 0, F.medium); const headSc = sp(f, 0, SP);
  const { rx: hx, ry: hy, tz: hz } = float3D(f, 0, { rx: 3, ry: 4, tz: 8 });

  const hubBob = Math.sin(f * 0.012) * 12;
  const hubRot = f * 0.25;

  return (
    <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
      <NmBg accent={SKY} />
      <ParticleField count={16} color={SKY} />

      <div style={{ position: "absolute", top: 68, opacity: headOp, transform: f3dTransform(hx, hy, hz, headSc), zIndex: 20 }}>
        <div style={{ ...nmCard(20, undefined, f), padding: "14px 44px" }}>
          <span style={{ fontSize: 13, color: SKY, letterSpacing: 5, fontWeight: 700, fontFamily: "system-ui,sans-serif", textTransform: "uppercase" }}>
            Works with everything you use
          </span>
        </div>
      </div>

      <div style={{
        position: "absolute",
        transform: `translateY(${hubBob}px) perspective(900px) rotateX(${Math.sin(f*0.007)*5}deg) rotateY(${Math.cos(f*0.007)*6}deg)`,
        zIndex: 10,
      }}>
        <div style={{ ...nmCard(28, INDIGO, f), width: 110, height: 110, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 52 }}>
          ⚡
        </div>
        {[200, 280].map((r, i) => (
          <div key={i} style={{
            position: "absolute",
            width: r * 2, height: r * 2,
            border: `1px ${i === 0 ? "solid" : "dashed"} ${INDIGO}${i === 0 ? "25" : "15"}`,
            borderRadius: "50%",
            top: "50%", left: "50%",
            transform: `translate(-50%,-50%) rotateX(60deg) rotateZ(${(i===0?1:-1)*hubRot}deg)`,
          }} />
        ))}
      </div>

      {INTEG.map((intg, i) => {
        const angle = (i / INTEG.length) * Math.PI * 2 + f * 0.008;
        const radius = 300;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius * 0.55;
        const depth = Math.cos(angle);
        const delay = i * STAGGER_DEFAULT + F.small;
        const sc  = sp(f, delay, SPS); const op = ei(f, delay, F.small);
        const { rx, ry, tz } = float3D(f, i + 1, { rx: 5, ry: 7, tz: 14 });
        const scaleFactor = 0.72 + depth * 0.28;

        return (
          <div key={i} style={{
            position: "absolute",
            transform: `translate(${x}px, ${y}px) ${f3dTransform(rx, ry, tz, sc * scaleFactor)}`,
            opacity: op * (0.5 + depth * 0.5),
            zIndex: Math.round(depth * 10 + 5),
          }}>
            <div style={{ ...nmCard(16, intg.color, f), width: 78, height: 78, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3 }}>
              <span style={{ fontSize: 28 }}>{intg.icon}</span>
              <span style={{ fontSize: 8, color: TEXT2, fontFamily: "system-ui,sans-serif", fontWeight: 600 }}>{intg.name}</span>
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SCENE 8 · 930–1050f · "Built for" rapid cycle
// ─────────────────────────────────────────────────────────────────────────────
const CYCLE = [
  { text: "True No Code", color: INDIGO },
  { text: "Zero Lock-in", color: TEAL   },
  { text: "Sales",        color: PINK   },
  { text: "Marketing",    color: GOLD   },
  { text: "HR",           color: GREEN  },
  { text: "Support",      color: SKY    },
  { text: "You.",         color: "rgba(255,255,255,0.92)" },
];
const CYCLE_AT = [15, 36, 48, 60, 66, 72, 78];

const Scene8: React.FC = () => {
  const f = useCurrentFrame();
  const { rx: hx, ry: hy, tz: hz } = float3D(f, 0, { rx: 4, ry: 6, tz: 12 });
  const { rx: cx, ry: cy, tz: cz } = float3D(f, 1, { rx: 3, ry: 8, tz: 16 });
  const headOp = ei(f, 0, F.small); const headSc = sp(f, 0, SP);

  let active = 0;
  for (let i = 0; i < CYCLE_AT.length; i++) { if (f >= CYCLE_AT[i]) active = i; }

  return (
    <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 28 }}>
      <NmBg accent={PURPLE} />
      <ParticleField count={22} color={PURPLE} />

      <div style={{ opacity: headOp, transform: f3dTransform(hx, hy, hz, headSc), zIndex: 10 }}>
        <div style={{ ...nmCard(22, undefined, f), padding: "22px 60px" }}>
          <div style={{ fontSize: 52, fontWeight: 700, color: TEXT2, fontFamily: "system-ui,sans-serif", letterSpacing: -1, textShadow: "0 2px 10px rgba(0,0,0,0.8)" }}>
            Built for
          </div>
        </div>
      </div>

      <div style={{ position: "relative", zIndex: 10, transform: f3dTransform(cx, cy, cz, 1) }}>
        <div style={{ ...nmCard(24, CYCLE[active].color, f), padding: "16px 64px", minWidth: 520, height: 120, overflow: "hidden", position: "relative" }}>
          {CYCLE.map((word, i) => {
            const enterAt = CYCLE_AT[i];
            const exitAt  = i < CYCLE.length - 1 ? CYCLE_AT[i + 1] : 99999;
            const isOn    = f >= enterAt && f < exitAt + F.micro;
            if (!isOn) return null;
            const isExiting = f >= exitAt;
            const enterProg = ei(f, enterAt, F.micro, EASE.entrance);
            const exitProg  = isExiting ? ei(f, exitAt, F.micro, EASE.exit) : 0;
            const y  = isExiting ? exitProg * -30 : (1 - enterProg) * 30;
            const op = isExiting ? 1 - exitProg : enterProg;
            return (
              <div key={i} style={{
                position: "absolute", inset: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                opacity: op, transform: `translateY(${y}px)`,
              }}>
                <div style={{
                  fontSize: 86, fontWeight: 900, fontFamily: "system-ui,sans-serif",
                  letterSpacing: -3, color: word.color,
                  textShadow: `0 0 40px ${word.color}70, 0 4px 16px rgba(0,0,0,0.9)`,
                  filter: `drop-shadow(0 0 20px ${word.color}50)`,
                }}>
                  {word.text}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SCENE 9 · 1050–1260f · CTA outro
// ─────────────────────────────────────────────────────────────────────────────
const Scene9: React.FC = () => {
  const f = useCurrentFrame();
  const { rx: lx, ry: ly, tz: lz } = float3D(f, 0, { rx: 4, ry: 6, tz: 14 });
  const { rx: bx, ry: by, tz: bz } = float3D(f, 2, { rx: 5, ry: 7, tz: 18 });

  const logoSc = sp(f, 0, { stiffness: 200, damping: 22, mass: 1 }); const logoOp = ei(f, 0, F.large);
  const ctaOp  = ei(f, F.large, F.medium); const ctaSc = sp(f, F.large, SPS);
  const ctaY   = interpolate(f - F.large, [0, F.medium], [24, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE.entrance });
  const btnOp  = ei(f, F.large + F.medium, F.small, EASE.emphasis); const btnSc = sp(f, F.large + F.medium, SPS);
  const urlOp  = ei(f, F.large + F.medium + F.small, F.medium);

  const rings = [0, 30, 60].map((off) => {
    const rf = (f + off) % 90;
    return { sc: interpolate(rf, [0, 90], [0.15, 2.4]), op: interpolate(rf, [0, 14, 80, 90], [0, 0.5, 0.12, 0]) };
  });

  return (
    <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
      <NmBg accent={INDIGO} />
      <ParticleField count={30} color={INDIGO} />

      {rings.map((r, i) => (
        <div key={i} style={{
          position: "absolute", width: 800, height: 800, borderRadius: "50%",
          border: `1.5px solid ${INDIGO}`,
          transform: `scale(${r.sc})`, opacity: r.op,
          boxShadow: `0 0 30px ${INDIGO}30`,
        }} />
      ))}

      <div style={{ opacity: logoOp, transform: f3dTransform(lx, ly, lz, logoSc), zIndex: 10, marginBottom: 40 }}>
        <div style={{ ...nmCard(32, INDIGO, f), padding: "52px 72px 44px", textAlign: "center" }}>
          <NmLogo scale={1.15} />
        </div>
      </div>

      <div style={{ opacity: ctaOp, transform: `translateY(${ctaY}px) scale(${ctaSc})`, zIndex: 10, textAlign: "center", marginBottom: 28 }}>
        <div style={{ ...nmCard(20, undefined, f), display: "inline-block", padding: "18px 56px" }}>
          <div style={{ fontSize: 36, fontWeight: 900, color: TEXT1, fontFamily: "system-ui,sans-serif", letterSpacing: -1, textShadow: `0 4px 16px rgba(0,0,0,0.9)` }}>
            Start building today.
          </div>
          <div style={{ fontSize: 16, color: TEXT2, fontFamily: "system-ui,sans-serif", marginTop: 6 }}>
            No credit card. No YAML. No excuses.
          </div>
        </div>
      </div>

      <div style={{ opacity: btnOp, transform: f3dTransform(bx, by, bz, btnSc), zIndex: 10, marginBottom: 24 }}>
        <div style={{ ...nmButton(INDIGO, f), padding: "22px 72px", fontSize: 24, fontWeight: 700, color: "white", fontFamily: "system-ui,sans-serif", letterSpacing: 0.5, cursor: "default" }}>
          Get Started Free →
        </div>
      </div>

      <div style={{ opacity: urlOp, zIndex: 10 }}>
        <div style={{ ...nmCard(14, undefined, f), display: "inline-block", padding: "10px 32px" }}>
          <span style={{ fontSize: 16, color: TEXT2, fontFamily: "system-ui,sans-serif", letterSpacing: 3 }}>
            neuralseek.com
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── Root ─────────────────────────────────────────────────────────────────────
export const NeuralSeek: React.FC = () => (
  <AbsoluteFill>
    <Audio src={staticFile("neuralseek-audio.wav")} />
    <Sequence from={0}    durationInFrames={90}> <Scene1 /></Sequence>
    <Sequence from={90}   durationInFrames={120}><Scene2 /></Sequence>
    <Sequence from={210}  durationInFrames={150}><Scene3 /></Sequence>
    <Sequence from={360}  durationInFrames={150}><Scene4 /></Sequence>
    <Sequence from={510}  durationInFrames={180}><Scene5 /></Sequence>
    <Sequence from={690}  durationInFrames={120}><Scene6 /></Sequence>
    <Sequence from={810}  durationInFrames={120}><Scene7 /></Sequence>
    <Sequence from={930}  durationInFrames={120}><Scene8 /></Sequence>
    <Sequence from={1050} durationInFrames={210}><Scene9 /></Sequence>
  </AbsoluteFill>
);
