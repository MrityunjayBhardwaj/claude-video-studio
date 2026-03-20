import React from "react";
import {
  AbsoluteFill,
  Audio,
  Sequence,
  interpolate,
  random,
  spring,
  staticFile,
  useCurrentFrame,
} from "remotion";

// ─── Palette: White / Glass theme ────────────────────────────────────────────
const INDIGO  = "#6366f1";
const PURPLE  = "#8b5cf6";
const PINK    = "#ec4899";
const SKY     = "#0ea5e9";
const EMERALD = "#10b981";
const TEXT    = "#1e1b4b";
const MUTED   = "#64748b";

// ─── 120 BPM @ 30fps = 15 frames/beat ────────────────────────────────────────
const BEAT = 15;

const beatPulse = (frame: number, amp = 0.07): number => {
  const t = frame % BEAT;
  return 1 + amp * Math.max(0, 1 - t / 3.5);
};

// ─── Glassmorphism helper ─────────────────────────────────────────────────────
const glassStyle = (
  tint = "rgba(255,255,255,0.68)",
  blur = 28,
  r = 28
): React.CSSProperties => ({
  background: tint,
  backdropFilter: `blur(${blur}px) saturate(200%)`,
  WebkitBackdropFilter: `blur(${blur}px) saturate(200%)`,
  border: "1px solid rgba(255,255,255,0.88)",
  boxShadow: [
    "0 8px 48px rgba(99,102,241,0.10)",
    "0 2px 16px rgba(0,0,0,0.05)",
    "inset 0 1px 0 rgba(255,255,255,0.9)",
  ].join(","),
  borderRadius: r,
});

// ─── Animated gradient background with floating blobs ────────────────────────
const BgGradient: React.FC = () => {
  const f = useCurrentFrame();
  const t = f * 0.014;
  const blobs = [
    { w: 900, c: "rgba(99,102,241,0.13)", x: 18 + Math.sin(t) * 9, y: -8 + Math.cos(t * 0.8) * 7 },
    { w: 700, c: "rgba(139,92,246,0.10)", x: 62 + Math.sin(t + 2) * 8, y: 50 + Math.cos(t + 1) * 6 },
    { w: 560, c: "rgba(236,72,153,0.08)", x: 40 + Math.sin(t + 4) * 7, y: 80 + Math.cos(t * 1.3) * 5 },
    { w: 460, c: "rgba(14,165,233,0.07)", x: 80 + Math.sin(t + 6) * 6, y: 20 + Math.cos(t * 0.7) * 8 },
  ];
  return (
    <AbsoluteFill style={{ background: "linear-gradient(150deg, #ffffff 0%, #f0f4ff 45%, #faf0ff 100%)" }}>
      {blobs.map((b, i) => (
        <div key={i} style={{
          position: "absolute",
          width: b.w, height: b.w,
          background: `radial-gradient(circle, ${b.c} 0%, transparent 70%)`,
          borderRadius: "50%",
          left: `${b.x}%`, top: `${b.y}%`,
          filter: "blur(50px)",
          transform: "translate(-50%, -50%)",
        }} />
      ))}
    </AbsoluteFill>
  );
};

// ─── Flying icons in pseudo-3D space ─────────────────────────────────────────
const ICONS = ["🎨","✨","🚀","💎","🎯","⚡","🌟","🦋","🔮","🌈","💫","🎭","🏆","🎪"];

const FlyingIcons: React.FC<{ delay?: number; count?: number; origin?: [number, number] }> = ({
  delay = 0, count = 16, origin = [960, 540],
}) => {
  const frame = useCurrentFrame();
  const lf = Math.max(0, frame - delay);

  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const angle  = (i / count) * Math.PI * 2 + random(`a${i}`) * 0.6;
        const radius = 180 + random(`r${i}`) * 560;
        const depth  = 0.35 + random(`d${i}`) * 0.75;
        const speed  = 0.4 + random(`sp${i}`) * 0.9;
        const iconDelay = i * 3;
        const iconF  = Math.max(0, lf - iconDelay);

        const prog = spring({ frame: iconF, fps: 30, config: { damping: 11, stiffness: 70, mass: depth } });
        const x = origin[0] + Math.cos(angle) * radius * prog;
        const y = origin[1] + Math.sin(angle) * radius * prog;
        const floatX = Math.cos(frame * 0.022 * speed + i) * 12;
        const floatY = Math.sin(frame * 0.028 * speed + i) * 16;
        const rot    = frame * speed * 0.9 + i * 51;
        const op     = interpolate(iconF, [0, 12, 90, 110], [0, 1, 1, 0.5]);
        const sz     = 34 + depth * 22;

        return (
          <div key={i} style={{
            position: "absolute",
            left: x - sz / 2 + floatX, top: y - sz / 2 + floatY,
            fontSize: sz, opacity: op,
            transform: `scale(${depth * prog}) rotate(${rot}deg)`,
            filter: depth < 0.5 ? `blur(${(0.6 - depth) * 5}px)` : "none",
            zIndex: Math.round(depth * 10),
            pointerEvents: "none",
          }}>
            {ICONS[i % ICONS.length]}
          </div>
        );
      })}
    </>
  );
};

// ─── Laptop screen content ────────────────────────────────────────────────────
const LaptopScreen: React.FC = () => {
  const frame = useCurrentFrame();
  const prompt = "a cinematic sunset over a neon-lit futuristic city, 8k, detailed";
  const typed = Math.floor(interpolate(frame, [20, 85], [0, prompt.length], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  }));
  const cursor = typed < prompt.length ? "▊" : "";

  const thumbs = [
    "linear-gradient(135deg,#667eea,#764ba2)",
    "linear-gradient(135deg,#f093fb,#f5576c)",
    "linear-gradient(135deg,#4facfe,#00f2fe)",
    "linear-gradient(135deg,#43e97b,#38f9d7)",
    "linear-gradient(135deg,#fa709a,#fee140)",
    "linear-gradient(135deg,#a18cd1,#fbc2eb)",
    "linear-gradient(135deg,#ffecd2,#fcb69f)",
    "linear-gradient(135deg,#a1c4fd,#c2e9fb)",
    "linear-gradient(135deg,#d4fc79,#96e6a1)",
  ];

  return (
    <div style={{ width: "100%", height: "100%", background: "#0d0d1e", display: "flex", overflow: "hidden" }}>
      {/* Sidebar */}
      <div style={{ width: 130, flexShrink: 0, background: "#13132a", padding: "14px 8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 20, padding: "0 4px" }}>
          <div style={{
            width: 26, height: 26,
            background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
            borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13,
          }}>🎨</div>
          <span style={{ color: "#fff", fontSize: 11, fontWeight: 700, fontFamily: "system-ui,sans-serif" }}>ArtFlow</span>
        </div>
        {["✨ Generate","🖼️ Gallery","🎨 Styles","📋 History","⚙️ Settings"].map((item, i) => (
          <div key={i} style={{
            padding: "7px 8px", borderRadius: 7, marginBottom: 2,
            background: i === 0 ? "rgba(99,102,241,0.25)" : "transparent",
            color: i === 0 ? "#a5b4fc" : "#4b5563",
            fontSize: 10, fontFamily: "system-ui,sans-serif",
          }}>{item}</div>
        ))}
      </div>

      {/* Main */}
      <div style={{ flex: 1, padding: 14, overflow: "hidden" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span style={{ color: "#e2e8f0", fontSize: 13, fontWeight: 700, fontFamily: "system-ui,sans-serif" }}>Generate</span>
          <div style={{
            padding: "3px 10px",
            background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
            borderRadius: 20, color: "#fff", fontSize: 9, fontFamily: "system-ui,sans-serif",
          }}>♾️ Unlimited</div>
        </div>

        {/* Prompt bar */}
        <div style={{
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(99,102,241,0.35)",
          borderRadius: 10, padding: "9px 12px",
          display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12,
        }}>
          <span style={{ color: "#a5b4fc", fontSize: 9.5, fontFamily: "monospace", flex: 1 }}>
            {prompt.slice(0, typed)}{cursor}
          </span>
          <div style={{
            width: 24, height: 24, flexShrink: 0,
            background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
            borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11,
          }}>⚡</div>
        </div>

        {/* Style chips */}
        <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
          {["Cinematic","Neon","Detailed","4K"].map((s, i) => (
            <div key={i} style={{
              padding: "3px 10px",
              background: i === 0 ? "rgba(99,102,241,0.3)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${i === 0 ? "rgba(99,102,241,0.5)" : "rgba(255,255,255,0.08)"}`,
              borderRadius: 20, color: i === 0 ? "#a5b4fc" : "#6b7280",
              fontSize: 9, fontFamily: "system-ui,sans-serif",
            }}>{s}</div>
          ))}
        </div>

        {/* Image grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
          {thumbs.map((g, i) => {
            const revF = i * 7;
            const op = interpolate(frame, [revF, revF + 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            const sc = interpolate(frame, [revF, revF + 18], [0.88, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            const generating = i === 8 && frame > 60;
            return (
              <div key={i} style={{
                height: 72, background: g, borderRadius: 7,
                opacity: op, transform: `scale(${sc})`,
                position: "relative", overflow: "hidden",
              }}>
                <div style={{
                  position: "absolute", inset: 0,
                  background: "linear-gradient(135deg,rgba(255,255,255,0.18) 0%,transparent 60%)",
                }} />
                {generating && (
                  <div style={{
                    position: "absolute", inset: 0,
                    background: "rgba(13,13,30,0.6)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <div style={{
                      width: 24, height: 24,
                      border: "2px solid #6366f1",
                      borderTopColor: "transparent",
                      borderRadius: "50%",
                      animation: "spin 1s linear infinite",
                    }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ─── MacBook CSS mockup ───────────────────────────────────────────────────────
const Laptop: React.FC<{ rotateY?: number; rotateX?: number; scale?: number }> = ({
  rotateY = -15, rotateX = -4, scale = 1,
}) => {
  const SW = 600; const SH = 376; const BEZEL = 11;
  const BW = SW + 64; const BH = 22;

  return (
    <div style={{
      transform: `perspective(1600px) rotateY(${rotateY}deg) rotateX(${rotateX}deg) scale(${scale})`,
      display: "inline-block", position: "relative",
    }}>
      {/* Lid / screen */}
      <div style={{
        width: SW, height: SH + BEZEL * 2,
        background: "linear-gradient(165deg,#e9eaec 0%,#d8dadd 60%,#bbbec3 100%)",
        borderRadius: "14px 14px 3px 3px", padding: BEZEL,
        boxShadow: "0 0 0 1px rgba(0,0,0,0.08), -6px 0 18px rgba(0,0,0,0.1), 0 -3px 10px rgba(0,0,0,0.08)",
        position: "relative",
      }}>
        <div style={{ width: SW - BEZEL * 2, height: SH, borderRadius: 5, overflow: "hidden" }}>
          <LaptopScreen />
        </div>
        {/* Camera */}
        <div style={{
          position: "absolute", top: 5, left: "50%", transform: "translateX(-50%)",
          width: 7, height: 7, background: "#2d3748", borderRadius: "50%",
          boxShadow: "0 0 0 1px rgba(0,0,0,0.2)",
        }} />
      </div>

      {/* Hinge line */}
      <div style={{ width: SW, height: 3, background: "linear-gradient(90deg,#a0a4ab,#c8cacd,#a0a4ab)" }} />

      {/* Base / keyboard */}
      <div style={{
        width: BW, height: BH,
        marginLeft: -(BW - SW) / 2,
        background: "linear-gradient(180deg,#e9eaec 0%,#d4d7db 50%,#b8bcC2 100%)",
        borderRadius: "2px 2px 14px 14px",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 14px 44px rgba(0,0,0,0.22), 0 3px 10px rgba(0,0,0,0.12), -6px 0 16px rgba(0,0,0,0.08)",
      }}>
        <div style={{ width: 130, height: 11, background: "rgba(0,0,0,0.07)", borderRadius: 5 }} />
      </div>

      {/* Surface shadow */}
      <div style={{
        position: "absolute", bottom: -28, left: -30, right: -30, height: 28,
        background: "radial-gradient(ellipse,rgba(0,0,0,0.18) 0%,transparent 75%)",
        filter: "blur(10px)",
      }} />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SCENE 1 · 0–210 · 14 beats · Hero Explosion
// ─────────────────────────────────────────────────────────────────────────────
const Scene1: React.FC = () => {
  const f = useCurrentFrame();
  const pulse = beatPulse(f, 0.07);

  const flash   = interpolate(f, [0, 2, 12], [1, 1, 0], { extrapolateRight: "clamp" });
  const cardSc  = spring({ frame: f - BEAT, fps: 30, config: { damping: 17, stiffness: 120, mass: 0.8 } });
  const rotY    = interpolate(f, [BEAT, BEAT + 28], [-30, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const rotX    = interpolate(f, [BEAT, BEAT + 28], [18, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const tagOp   = interpolate(f, [18, 34], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const subOp   = interpolate(f, [44, 62], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const glassOp = interpolate(f, [BEAT, BEAT + 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const dotsOp  = interpolate(f, [52, 68], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // 3D glitch on very first frames
  const gx = f < 20 ? (random(`gx${f}`) - 0.5) * 16 * Math.max(0, 1 - f / 20) : 0;

  return (
    <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
      <BgGradient />
      <AbsoluteFill style={{ background: "white", opacity: flash, zIndex: 200 }} />
      <FlyingIcons delay={BEAT} count={16} />

      {/* Main glass card */}
      <div style={{
        transform: `perspective(1400px) rotateY(${rotY}deg) rotateX(${rotX}deg) scale(${cardSc * pulse}) translateX(${gx}px)`,
        opacity: glassOp, zIndex: 10,
      }}>
        <div style={{ ...glassStyle("rgba(255,255,255,0.72)", 36, 36), padding: "68px 88px", textAlign: "center", minWidth: 720 }}>

          {/* Eyebrow pill */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 10, opacity: tagOp,
            padding: "9px 24px",
            background: "linear-gradient(135deg,rgba(99,102,241,0.10),rgba(139,92,246,0.10))",
            border: "1px solid rgba(99,102,241,0.22)", borderRadius: 50,
            marginBottom: 30,
          }}>
            <span style={{ fontSize: 20 }}>✨</span>
            <span style={{ fontSize: 16, color: INDIGO, fontWeight: 700, fontFamily: "system-ui,sans-serif", letterSpacing: 3 }}>
              THE FUTURE OF AI ART
            </span>
          </div>

          {/* Title — gradient + glitch layers */}
          <div style={{ position: "relative", lineHeight: 1, marginBottom: 18 }}>
            {[{ x: gx * 2.5, clip: "inset(22% 0 55% 0)", c: PINK },
              { x: -gx * 1.5, clip: "inset(60% 0 12% 0)", c: SKY }].map((g, i) => (
              <div key={i} style={{
                position: "absolute", inset: 0,
                fontSize: 112, fontWeight: 900, fontFamily: "system-ui,sans-serif",
                color: g.c, clipPath: g.clip,
                transform: `translateX(${g.x}px)`,
                opacity: f < 22 ? 0.65 : 0,
              }}>ARTFLOW AI</div>
            ))}
            <div style={{
              fontSize: 112, fontWeight: 900, fontFamily: "system-ui,sans-serif",
              background: `linear-gradient(135deg,${INDIGO} 0%,${PURPLE} 50%,${PINK} 100%)`,
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
              letterSpacing: -3, transform: `scale(${pulse})`,
            }}>ARTFLOW AI</div>
          </div>

          {/* Subtitle */}
          <div style={{ fontSize: 30, color: MUTED, fontFamily: "system-ui,sans-serif", fontWeight: 300, opacity: subOp, letterSpacing: 2 }}>
            Midjourney. But yours.
          </div>
        </div>
      </div>

      {/* Dot indicators */}
      <div style={{ position: "absolute", bottom: 56, display: "flex", gap: 14, opacity: dotsOp, zIndex: 10 }}>
        {[INDIGO, PURPLE, PINK, SKY].map((c, i) => (
          <div key={i} style={{ width: i === 1 ? 32 : 11, height: 11, borderRadius: 6, background: c, opacity: 0.55 }} />
        ))}
      </div>
    </AbsoluteFill>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SCENE 2 · 210–375 · 11 beats · Problem (rapid zoom in)
// ─────────────────────────────────────────────────────────────────────────────
const Scene2: React.FC = () => {
  const f = useCurrentFrame();

  // Card zooms in from depth on beat 1
  const cardSc = spring({ frame: f, fps: 30, config: { damping: 16, stiffness: 200, mass: 0.6 } });
  const cardRotY = interpolate(f, [0, 22], [35, 0], { extrapolateRight: "clamp" });
  const cardRotX = interpolate(f, [0, 22], [-12, 0], { extrapolateRight: "clamp" });
  // Rapid zoom punch on beat 3
  const punchSc  = interpolate(f, [BEAT * 2, BEAT * 2 + 4, BEAT * 2 + 10], [1.08, 1.18, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const lines = [
    { text: "Why pay $30/month", size: 66, color: TEXT, delay: 0 },
    { text: "for someone else's platform?", size: 66, color: TEXT, delay: BEAT },
    { text: "There's a better way.", size: 80, color: INDIGO, delay: BEAT * 2, gradient: true },
  ];

  const badgesOp = interpolate(f - BEAT * 4, [0, 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
      <BgGradient />

      <div style={{
        transform: `perspective(1400px) rotateY(${cardRotY}deg) rotateX(${cardRotX}deg) scale(${cardSc * punchSc})`,
        zIndex: 10,
      }}>
        <div style={{ ...glassStyle("rgba(255,255,255,0.70)", 32, 32), padding: "72px 96px", textAlign: "center", maxWidth: 960 }}>
          {lines.map((line, i) => {
            const lf  = Math.max(0, f - line.delay);
            const op  = interpolate(lf, [0, 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            const ty  = interpolate(lf, [0, 12], [36, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            const sc  = spring({ frame: lf, fps: 30, config: { damping: 20, stiffness: 240, mass: 0.5 } });
            return (
              <div key={i} style={{
                fontSize: line.size, fontWeight: 900, fontFamily: "system-ui,sans-serif",
                opacity: op, transform: `translateY(${ty}px) scale(${sc})`, lineHeight: 1.2,
                marginBottom: i < 2 ? 6 : 0,
                ...(line.gradient ? {
                  background: `linear-gradient(135deg,${INDIGO},${PURPLE})`,
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                } : { color: line.color }),
              }}>{line.text}</div>
            );
          })}

          {/* Crossed-out subscriptions */}
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginTop: 32, opacity: badgesOp }}>
            {["Midjourney $30/mo", "DALL·E $50/mo", "SD Pro $20/mo"].map((s, i) => (
              <div key={i} style={{
                padding: "9px 20px",
                background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)",
                borderRadius: 32, color: "#dc2626", fontSize: 17,
                fontFamily: "system-ui,sans-serif", textDecoration: "line-through", opacity: 0.7,
              }}>{s}</div>
            ))}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SCENE 3 · 375–540 · 11 beats · Laptop reveal with 3D fly-in
// ─────────────────────────────────────────────────────────────────────────────
const Scene3: React.FC = () => {
  const f = useCurrentFrame();
  const pulse = beatPulse(f, 0.06);

  // Laptop: shoots in from far right, rotating in 3D
  const laptopProg = spring({ frame: f, fps: 30, config: { damping: 20, stiffness: 75, mass: 1.3 } });
  const laptopRotY = interpolate(f, [0, 50], [-55, -10], { extrapolateRight: "clamp" });
  const laptopRotX = interpolate(f, [0, 50], [14, -3], { extrapolateRight: "clamp" });
  const laptopTX   = interpolate(laptopProg, [0, 1], [900, 0]);

  // Text panel: slides in from left
  const textProg = spring({ frame: Math.max(0, f - BEAT * 3), fps: 30, config: { damping: 20, stiffness: 140, mass: 0.7 } });
  const textTX   = interpolate(textProg, [0, 1], [-260, 0]);
  const textOp   = interpolate(f - BEAT * 3, [0, 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // ZOOM INTO LAPTOP on beat 9 — rapid zoom punch
  const zoomF  = Math.max(0, f - BEAT * 8);
  const zoomSc = interpolate(zoomF, [0, 8, BEAT * 3], [1, 1.06, 2.8], { extrapolateRight: "clamp" });
  const zoomOp = interpolate(zoomF, [0, BEAT, BEAT * 3], [1, 1, 0], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ display: "flex", alignItems: "center", overflow: "hidden" }}>
      <BgGradient />

      <div style={{ display: "flex", alignItems: "center", width: "100%", padding: "0 80px", gap: 56, opacity: zoomOp }}>

        {/* Left: product info glass card */}
        <div style={{ flex: "0 0 auto", width: 520, transform: `translateX(${textTX}px)`, opacity: textOp }}>
          <div style={{ ...glassStyle("rgba(255,255,255,0.70)", 28, 28), padding: "48px 52px" }}>

            <div style={{ fontSize: 21, color: INDIGO, letterSpacing: 7, fontWeight: 700, fontFamily: "system-ui,sans-serif", marginBottom: 16, textTransform: "uppercase" }}>
              Introducing
            </div>

            <div style={{
              fontSize: 76, fontWeight: 900, fontFamily: "system-ui,sans-serif",
              background: `linear-gradient(135deg,${INDIGO},${PURPLE} 55%,${PINK})`,
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
              lineHeight: 1.05, letterSpacing: -2, marginBottom: 18,
              transform: `scale(${pulse})`, display: "block",
            }}>ArtFlow AI</div>

            <div style={{ fontSize: 21, color: MUTED, fontFamily: "system-ui,sans-serif", lineHeight: 1.6, marginBottom: 32 }}>
              Your own AI art platform.<br />White-labeled. Unlimited.
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {["⚡ Instant", "♾️ Unlimited", "🎯 White-label"].map((feat, i) => {
                const pd = BEAT * 4 + i * 9;
                const pOp = interpolate(f - pd, [0, 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
                const pSc = spring({ frame: Math.max(0, f - pd), fps: 30, config: { damping: 14, stiffness: 220, mass: 0.4 } });
                return (
                  <div key={i} style={{
                    padding: "10px 20px",
                    background: "linear-gradient(135deg,rgba(99,102,241,0.09),rgba(139,92,246,0.09))",
                    border: "1px solid rgba(99,102,241,0.28)", borderRadius: 32,
                    color: INDIGO, fontSize: 16, fontFamily: "system-ui,sans-serif", fontWeight: 600,
                    opacity: pOp, transform: `scale(${pSc})`,
                  }}>{feat}</div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Laptop */}
        <div style={{ flex: 1, display: "flex", justifyContent: "center", transform: `scale(${zoomSc})`, transformOrigin: "center center" }}>
          <div style={{ transform: `translateX(${laptopTX}px)` }}>
            <Laptop rotateY={laptopRotY} rotateX={laptopRotX} scale={pulse * 0.9} />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SCENE 4 · 540–705 · 11 beats · Features — 3D card fly-in
// ─────────────────────────────────────────────────────────────────────────────
const Scene4: React.FC = () => {
  const f = useCurrentFrame();
  const pulse = beatPulse(f, 0.07);

  const headSc = spring({ frame: f, fps: 30, config: { damping: 18, stiffness: 160, mass: 0.7 } });
  const headOp = interpolate(f, [0, 16], [0, 1], { extrapolateRight: "clamp" });

  const features = [
    { icon: "⚡", title: "Instant", sub: "< 3 sec per image\nNo queue. Ever.", color: INDIGO,  fromRotY: -55 },
    { icon: "🎨", title: "White-label", sub: "Your brand & domain.\nYour customers.", color: PURPLE, fromRotY: 0  },
    { icon: "♾️", title: "Unlimited", sub: "No per-image fees.\nFlat monthly only.", color: PINK,   fromRotY:  55 },
  ];

  return (
    <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
      <BgGradient />

      <div style={{ opacity: headOp, transform: `scale(${headSc})`, textAlign: "center", marginBottom: 52, zIndex: 10 }}>
        <div style={{ fontSize: 19, color: INDIGO, letterSpacing: 8, fontWeight: 700, fontFamily: "system-ui,sans-serif", marginBottom: 10, textTransform: "uppercase" }}>
          Everything you need
        </div>
        <div style={{ fontSize: 54, fontWeight: 900, color: TEXT, fontFamily: "system-ui,sans-serif", letterSpacing: -1 }}>
          Nothing you don't.
        </div>
      </div>

      <div style={{ display: "flex", gap: 28, zIndex: 10 }}>
        {features.map((feat, i) => {
          const delay = i * BEAT;
          const lf  = Math.max(0, f - delay);
          const sc  = spring({ frame: lf, fps: 30, config: { damping: 15, stiffness: 175, mass: 0.6 } });
          const op  = interpolate(lf, [0, 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const rotY = interpolate(lf, [0, 28], [feat.fromRotY, 0], { extrapolateRight: "clamp" });
          const ty   = interpolate(lf, [0, 1], [90, 0], { extrapolateRight: "clamp" });
          const iconRot = Math.sin(f * 0.04 + i * 1.8) * 6;

          return (
            <div key={i} style={{
              transform: `perspective(1100px) rotateY(${rotY}deg) translateY(${ty}px) scale(${sc})`,
              opacity: op,
            }}>
              <div style={{ ...glassStyle("rgba(255,255,255,0.72)", 28, 28), padding: "44px 40px", width: 300, textAlign: "center" }}>
                <div style={{
                  width: 90, height: 90,
                  background: `linear-gradient(135deg,${feat.color}16,${feat.color}06)`,
                  border: `1.5px solid ${feat.color}38`, borderRadius: 24,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 46, margin: "0 auto 24px",
                  transform: `scale(${pulse}) rotate(${iconRot}deg)`,
                  boxShadow: `0 8px 32px ${feat.color}1a`,
                }}>{feat.icon}</div>

                <div style={{
                  fontSize: 30, fontWeight: 800, color: feat.color,
                  fontFamily: "system-ui,sans-serif", marginBottom: 12, lineHeight: 1.2,
                }}>{feat.title}</div>

                <div style={{ fontSize: 17, color: MUTED, fontFamily: "system-ui,sans-serif", lineHeight: 1.65, whiteSpace: "pre-line" }}>
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
// SCENE 5 · 705–825 · 8 beats · Social Proof
// ─────────────────────────────────────────────────────────────────────────────
const Scene5: React.FC = () => {
  const f = useCurrentFrame();
  const pulse = beatPulse(f, 0.05);

  const headSc = spring({ frame: f, fps: 30, config: { damping: 18, stiffness: 130, mass: 0.8 } });
  const headOp = interpolate(f, [0, 16], [0, 1], { extrapolateRight: "clamp" });

  const stats = [
    { val: 50000, sfx: "+", label: "Active Creators", icon: "👥", color: INDIGO, delay: 0 },
    { val: 10, sfx: "M+", label: "Images Generated", icon: "🖼️", color: PURPLE, delay: BEAT, dec: 0 },
    { val: 99.9, sfx: "%", label: "Uptime SLA", icon: "⚡", color: EMERALD, delay: BEAT * 2, dec: 1 },
  ];

  return (
    <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
      <BgGradient />

      <div style={{ opacity: headOp, transform: `scale(${headSc})`, textAlign: "center", marginBottom: 56, zIndex: 10 }}>
        <div style={{ fontSize: 18, color: INDIGO, letterSpacing: 8, fontWeight: 700, fontFamily: "system-ui,sans-serif", marginBottom: 10, textTransform: "uppercase" }}>
          Trusted Worldwide
        </div>
        <div style={{ fontSize: 52, fontWeight: 900, color: TEXT, fontFamily: "system-ui,sans-serif", letterSpacing: -1 }}>
          Creators love ArtFlow.
        </div>
      </div>

      <div style={{ display: "flex", gap: 28, zIndex: 10 }}>
        {stats.map((stat, i) => {
          const lf  = Math.max(0, f - stat.delay);
          const prg = spring({ frame: lf, fps: 30, config: { damping: 18, stiffness: 34, mass: 1.3 } });
          const raw = prg * stat.val;
          const disp = stat.dec ? raw.toFixed(stat.dec) : Math.round(raw).toLocaleString();
          const op  = interpolate(lf, [0, 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const ty  = interpolate(lf, [0, 1], [60, 0], { extrapolateRight: "clamp" });
          const sc  = spring({ frame: lf, fps: 30, config: { damping: 16, stiffness: 160, mass: 0.6 } });

          return (
            <div key={i} style={{ opacity: op, transform: `translateY(${ty}px) scale(${sc})` }}>
              <div style={{
                ...glassStyle("rgba(255,255,255,0.74)", 28, 28),
                padding: "44px 52px", textAlign: "center", minWidth: 268,
                transform: `scale(${pulse})`,
              }}>
                <div style={{ fontSize: 38, marginBottom: 10 }}>{stat.icon}</div>
                <div style={{
                  fontSize: 82, fontWeight: 900, fontFamily: "system-ui,sans-serif", lineHeight: 1,
                  background: `linear-gradient(135deg,${stat.color},${stat.color}bb)`,
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                }}>{disp}{stat.sfx}</div>
                <div style={{ fontSize: 17, color: MUTED, fontFamily: "system-ui,sans-serif", marginTop: 10, letterSpacing: 1 }}>
                  {stat.label}
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
// SCENE 6 · 825–900 · 5 beats · Laptop zoom CTA
// ─────────────────────────────────────────────────────────────────────────────
const Scene6: React.FC = () => {
  const f = useCurrentFrame();
  const pulse = beatPulse(f, 0.10);

  // Laptop slams in with spring from depth
  const laptopSc  = spring({ frame: f, fps: 30, config: { damping: 18, stiffness: 110, mass: 1.0 } });
  const laptopRotY = interpolate(f, [0, 28], [-22, 0], { extrapolateRight: "clamp" });
  const laptopRotX = interpolate(f, [0, 28], [10, -3], { extrapolateRight: "clamp" });

  // Rapid zoom punch on beat 2
  const punchF  = Math.max(0, f - BEAT * 1);
  const punchSc = interpolate(punchF, [0, 5, 12], [1, 1.12, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // CTA below
  const ctaOp = interpolate(f - BEAT * 2, [0, 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const ctaSc = spring({ frame: Math.max(0, f - BEAT * 2), fps: 30, config: { damping: 18, stiffness: 150, mass: 0.7 } });

  // Expanding rings
  const rings = [0, 25, 50].map((off) => {
    const rf = (f + off) % 75;
    return {
      sc:  interpolate(rf, [0, 75], [0.25, 2.8]),
      op:  interpolate(rf, [0, 10, 65, 75], [0, 0.5, 0.12, 0]),
    };
  });

  return (
    <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
      <BgGradient />

      {/* Rings */}
      {rings.map((r, i) => (
        <div key={i} style={{
          position: "absolute", width: 720, height: 720,
          border: "1.5px solid rgba(99,102,241,0.35)", borderRadius: "50%",
          transform: `scale(${r.sc})`, opacity: r.op,
        }} />
      ))}

      {/* Flying mini icons around laptop */}
      <FlyingIcons delay={0} count={8} origin={[960, 440]} />

      {/* Laptop */}
      <div style={{
        transform: `scale(${laptopSc * pulse * punchSc})`,
        zIndex: 10, marginBottom: 32,
      }}>
        <Laptop rotateY={laptopRotY} rotateX={laptopRotX} scale={1.05} />
      </div>

      {/* CTA glass card */}
      <div style={{ opacity: ctaOp, transform: `scale(${ctaSc})`, zIndex: 20 }}>
        <div style={{ ...glassStyle("rgba(255,255,255,0.82)", 36, 36), padding: "36px 80px", textAlign: "center" }}>
          <div style={{
            fontSize: 58, fontWeight: 900, fontFamily: "system-ui,sans-serif",
            background: `linear-gradient(135deg,${INDIGO},${PURPLE})`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
            marginBottom: 22, lineHeight: 1,
          }}>Start Free Today</div>

          <div style={{
            display: "inline-block", padding: "22px 76px",
            background: `linear-gradient(135deg,${INDIGO},${PURPLE})`,
            borderRadius: 64, fontSize: 28, fontWeight: 700, color: "white",
            fontFamily: "system-ui,sans-serif",
            transform: `scale(${pulse})`,
            boxShadow: `0 8px 48px rgba(99,102,241,0.40), 0 2px 16px rgba(0,0,0,0.08)`,
            letterSpacing: 0.5,
          }}>artflow.ai →</div>

          <div style={{ marginTop: 16, fontSize: 16, color: MUTED, fontFamily: "system-ui,sans-serif" }}>
            No credit card required · Launch in minutes
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── Root ─────────────────────────────────────────────────────────────────────
export const MidjourneyPromo: React.FC = () => (
  <AbsoluteFill>
    <Audio src={staticFile("beat.wav")} />
    <Sequence from={0}   durationInFrames={210}><Scene1 /></Sequence>
    <Sequence from={210} durationInFrames={165}><Scene2 /></Sequence>
    <Sequence from={375} durationInFrames={165}><Scene3 /></Sequence>
    <Sequence from={540} durationInFrames={165}><Scene4 /></Sequence>
    <Sequence from={705} durationInFrames={120}><Scene5 /></Sequence>
    <Sequence from={825} durationInFrames={75}> <Scene6 /></Sequence>
  </AbsoluteFill>
);
