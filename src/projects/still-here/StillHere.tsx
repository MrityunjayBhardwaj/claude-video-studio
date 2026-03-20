/**
 * Still Here — Emotional Story · Perseverance
 * 1080×1920 (9:16 vertical) · 30fps · 30s = 900 frames
 *
 * A single light in darkness that nearly goes out,
 * fights back, and is joined by others.
 *
 * Music: "Dreaming Big" by Ahjay Stelino (Mixkit, free license)
 */
import React from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  Sequence,
  interpolate,
  random,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

// ─── Motion tokens ──────────────────────────────────────────────────────────
const DUR = { micro: 3, fast: 8, med: 15, slow: 30, dramatic: 60 };
const SP = { stiffness: 120, damping: 18, mass: 1 };
const SP_GENTLE = { stiffness: 80, damping: 14, mass: 1.2 };
const EASE = {
  entrance: Easing.bezier(0.0, 0.0, 0.2, 1.0),
  exit: Easing.bezier(0.4, 0.0, 1.0, 1.0),
  dramatic: Easing.bezier(0.4, 0.0, 0.0, 1.0),
  breathe: Easing.bezier(0.37, 0, 0.63, 1), // sine-like
};

// ─── Palette ────────────────────────────────────────────────────────────────
const VOID = "#040408";
const WARM_WHITE = "#ffecd2";
const GOLD = "#f5a623";
const SOFT_AMBER = "#ffb347";
const TEXT_PRIMARY = "rgba(255,255,255,0.92)";
const TEXT_MUTED = "rgba(255,255,255,0.45)";

// ─── Helpers ────────────────────────────────────────────────────────────────
const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

const breathe = (frame: number, period: number, amplitude: number) =>
  Math.sin((frame / period) * Math.PI * 2) * amplitude;

// ─── Text component with fade+slide ─────────────────────────────────────────
const StoryText: React.FC<{
  children: string;
  delay: number;
  duration: number;
  size?: number;
  color?: string;
  y?: number;
  lineHeight?: number;
  weight?: number;
}> = ({
  children,
  delay,
  duration,
  size = 52,
  color = TEXT_PRIMARY,
  y = 0,
  lineHeight = 1.4,
  weight = 300,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fadeInEnd = delay + DUR.slow;
  const fadeOutStart = delay + duration - DUR.slow;

  const enterProgress = interpolate(frame, [delay, fadeInEnd], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE.dramatic,
  });

  const exitProgress = interpolate(
    frame,
    [fadeOutStart, fadeOutStart + DUR.slow],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE.exit }
  );

  const opacity = Math.min(enterProgress, exitProgress);
  const slideY = (1 - enterProgress) * 25;

  return (
    <div
      style={{
        position: "absolute",
        left: 80,
        right: 80,
        top: `${50 + y}%`,
        transform: `translateY(calc(-50% + ${slideY}px))`,
        opacity,
        fontSize: size,
        fontWeight: weight,
        fontFamily: "'SF Pro Display', 'Helvetica Neue', sans-serif",
        color,
        textAlign: "center",
        lineHeight,
        letterSpacing: size > 60 ? -1 : 0.2,
      }}
    >
      {children}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// SCENE 1: A single light breathes in darkness
// 0–150 frames (0–5s)
// Emotional beat: Quiet heaviness. The viewer feels alone.
// ═══════════════════════════════════════════════════════════════════════════════
const Scene01: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Light appears from nothing
  const lightAppear = interpolate(frame, [0, 45], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE.dramatic,
  });

  // Breathing pulse
  const pulse = breathe(frame, 40, 0.15);
  const lightScale = 0.8 + lightAppear * 0.2 + pulse * lightAppear * 0.1;
  const lightOpacity = lightAppear * (0.7 + pulse * 0.15);

  // Glow radius breathes
  const glowSize = 80 + pulse * 20;
  const outerGlow = 200 + pulse * 40;

  return (
    <AbsoluteFill style={{ background: VOID }}>
      {/* Outer atmospheric glow */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "42%",
          width: outerGlow * 2,
          height: outerGlow * 2,
          marginLeft: -outerGlow,
          marginTop: -outerGlow,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${GOLD}12 0%, transparent 70%)`,
          opacity: lightOpacity * 0.5,
          transform: `scale(${lightScale})`,
        }}
      />

      {/* Core light */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "42%",
          width: glowSize * 2,
          height: glowSize * 2,
          marginLeft: -glowSize,
          marginTop: -glowSize,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${WARM_WHITE} 0%, ${GOLD}88 25%, ${SOFT_AMBER}33 50%, transparent 72%)`,
          opacity: lightOpacity,
          transform: `scale(${lightScale})`,
          boxShadow: `0 0 ${glowSize}px ${GOLD}44, 0 0 ${glowSize * 2}px ${GOLD}18`,
        }}
      />

      {/* Tiny bright center */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "42%",
          width: 12,
          height: 12,
          marginLeft: -6,
          marginTop: -6,
          borderRadius: "50%",
          background: "#fff",
          opacity: lightOpacity,
          transform: `scale(${lightScale})`,
          boxShadow: `0 0 20px #fff, 0 0 40px ${WARM_WHITE}`,
        }}
      />

      {/* Text */}
      <StoryText delay={20} duration={120} size={48} y={18} weight={300}>
        Some days are heavy.
      </StoryText>
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// SCENE 2: The light flickers and nearly dies
// 150–300 frames (5–10s)
// Emotional beat: Fear. Loss. The light might not make it.
// ═══════════════════════════════════════════════════════════════════════════════
const Scene02: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Flicker pattern — irregular dimming
  const flicker1 = frame > 15 && frame < 25 ? 0.3 : 1;
  const flicker2 = frame > 40 && frame < 48 ? 0.15 : 1;
  const flicker3 = frame > 65 && frame < 80 ? 0.08 : 1;

  // Overall dimming trajectory
  const dimming = interpolate(frame, [0, 100], [0.7, 0.05], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE.exit,
  });

  // Smoothed flicker
  const flickerBase = Math.min(flicker1, flicker2, flicker3);
  const lightIntensity = dimming * flickerBase;

  // Light shrinks as it dims
  const lightScale = 0.3 + lightIntensity * 0.7;

  const pulse = breathe(frame, 25, 0.08);
  const glowSize = 60 + pulse * 10;

  // At the very end, light is barely a pinprick
  const nearDeath = interpolate(frame, [100, 150], [1, 0.6], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const finalIntensity = clamp(lightIntensity * nearDeath, 0.03, 1);

  return (
    <AbsoluteFill style={{ background: VOID }}>
      {/* Outer glow — fading */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "42%",
          width: 400,
          height: 400,
          marginLeft: -200,
          marginTop: -200,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${GOLD}10 0%, transparent 70%)`,
          opacity: finalIntensity * 0.3,
          transform: `scale(${lightScale})`,
        }}
      />

      {/* Core light — flickering */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "42%",
          width: glowSize * 2,
          height: glowSize * 2,
          marginLeft: -glowSize,
          marginTop: -glowSize,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${WARM_WHITE}cc 0%, ${GOLD}66 30%, transparent 65%)`,
          opacity: finalIntensity,
          transform: `scale(${lightScale})`,
          boxShadow: `0 0 ${glowSize * finalIntensity}px ${GOLD}33`,
        }}
      />

      {/* Bright center — shrinking */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "42%",
          width: 8,
          height: 8,
          marginLeft: -4,
          marginTop: -4,
          borderRadius: "50%",
          background: "#fff",
          opacity: finalIntensity,
          transform: `scale(${lightScale * 0.8})`,
          boxShadow: `0 0 ${12 * finalIntensity}px #fff`,
        }}
      />

      {/* Text */}
      <StoryText delay={10} duration={110} size={44} y={18} weight={300}>
        You wonder if you'll make it.
      </StoryText>
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// SCENE 3: The light fights back
// 300–510 frames (10–17s)
// Emotional beat: Defiance. Small but unbreakable. The turn.
// ═══════════════════════════════════════════════════════════════════════════════
const Scene03: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Light reignites — spring from near-zero
  const reignite = spring({
    frame: Math.max(0, frame - 30),
    fps,
    config: { stiffness: 60, damping: 12, mass: 1.5 },
  });

  // Then grows stronger
  const strengthen = interpolate(frame, [60, 180], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE.dramatic,
  });

  const lightIntensity = 0.05 + reignite * 0.55 + strengthen * 0.4;
  const lightScale = 0.2 + reignite * 0.5 + strengthen * 0.3;

  const pulse = breathe(frame, 35, 0.08);
  const glowSize = 70 + strengthen * 50 + pulse * 15;
  const outerGlow = 200 + strengthen * 150;

  return (
    <AbsoluteFill style={{ background: VOID }}>
      {/* Growing outer glow */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "42%",
          width: outerGlow * 2,
          height: outerGlow * 2,
          marginLeft: -outerGlow,
          marginTop: -outerGlow,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${GOLD}15 0%, ${SOFT_AMBER}08 40%, transparent 70%)`,
          opacity: lightIntensity * 0.6,
          transform: `scale(${lightScale})`,
        }}
      />

      {/* Core light — coming back */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "42%",
          width: glowSize * 2,
          height: glowSize * 2,
          marginLeft: -glowSize,
          marginTop: -glowSize,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${WARM_WHITE} 0%, ${GOLD}aa 20%, ${SOFT_AMBER}44 45%, transparent 70%)`,
          opacity: lightIntensity,
          transform: `scale(${lightScale})`,
          boxShadow: `0 0 ${glowSize}px ${GOLD}55, 0 0 ${glowSize * 2}px ${GOLD}22`,
        }}
      />

      {/* Bright center — growing */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "42%",
          width: 14,
          height: 14,
          marginLeft: -7,
          marginTop: -7,
          borderRadius: "50%",
          background: "#fff",
          opacity: lightIntensity,
          transform: `scale(${lightScale})`,
          boxShadow: `0 0 25px #fff, 0 0 50px ${WARM_WHITE}`,
        }}
      />

      {/* Text — the turn */}
      <StoryText delay={20} duration={80} size={56} y={18} weight={400}>
        But you're still here.
      </StoryText>

      <StoryText
        delay={110}
        duration={90}
        size={38}
        y={24}
        weight={300}
        color={TEXT_MUTED}
      >
        And that means something.
      </StoryText>
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// SCENE 4: Other lights appear — constellation forms
// 510–750 frames (17–25s)
// Emotional beat: Connection. You are not alone. Building hope.
// ═══════════════════════════════════════════════════════════════════════════════
const Scene04: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Central light is now strong
  const pulse = breathe(frame, 40, 0.06);
  const centerGlow = 120 + pulse * 15;

  // Other lights appear one by one
  const otherLights = [
    { x: 0.28, y: 0.30, delay: 20, size: 0.5, seed: "a" },
    { x: 0.72, y: 0.35, delay: 35, size: 0.4, seed: "b" },
    { x: 0.35, y: 0.55, delay: 50, size: 0.35, seed: "c" },
    { x: 0.68, y: 0.52, delay: 60, size: 0.45, seed: "d" },
    { x: 0.20, y: 0.45, delay: 75, size: 0.3, seed: "e" },
    { x: 0.80, y: 0.44, delay: 85, size: 0.38, seed: "f" },
    { x: 0.42, y: 0.28, delay: 95, size: 0.32, seed: "g" },
    { x: 0.58, y: 0.58, delay: 105, size: 0.36, seed: "h" },
    { x: 0.15, y: 0.38, delay: 115, size: 0.28, seed: "i" },
    { x: 0.85, y: 0.50, delay: 120, size: 0.34, seed: "j" },
    { x: 0.50, y: 0.25, delay: 130, size: 0.42, seed: "k" },
    { x: 0.38, y: 0.62, delay: 135, size: 0.30, seed: "l" },
  ];

  // Connection lines appear after lights
  const connectionOpacity = interpolate(frame, [100, 160], [0, 0.15], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE.dramatic,
  });

  return (
    <AbsoluteFill style={{ background: VOID }}>
      {/* Connection lines (SVG) */}
      <svg
        width={width}
        height={height}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          opacity: connectionOpacity,
        }}
      >
        {otherLights.map((light, i) => {
          if (i === 0) return null;
          const prev = otherLights[i - 1];
          const lineAppear = interpolate(
            frame,
            [light.delay + 10, light.delay + 40],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );
          return (
            <line
              key={`line-${i}`}
              x1={prev.x * width}
              y1={prev.y * height}
              x2={prev.x * width + (light.x * width - prev.x * width) * lineAppear}
              y2={prev.y * height + (light.y * height - prev.y * height) * lineAppear}
              stroke={GOLD}
              strokeWidth={1}
              opacity={0.3}
            />
          );
        })}
        {/* Lines to center */}
        {otherLights.slice(0, 6).map((light, i) => {
          const lineAppear = interpolate(
            frame,
            [light.delay + 20, light.delay + 50],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );
          return (
            <line
              key={`center-line-${i}`}
              x1={0.5 * width}
              y1={0.42 * height}
              x2={0.5 * width + (light.x * width - 0.5 * width) * lineAppear}
              y2={0.42 * height + (light.y * height - 0.42 * height) * lineAppear}
              stroke={WARM_WHITE}
              strokeWidth={0.5}
              opacity={0.2}
            />
          );
        })}
      </svg>

      {/* Other lights */}
      {otherLights.map((light, i) => {
        const appear = spring({
          frame: Math.max(0, frame - light.delay),
          fps,
          config: SP_GENTLE,
        });
        const drift = breathe(frame + i * 13, 50 + i * 5, 3);
        const glowR = 25 * light.size;

        return (
          <div
            key={`light-${i}`}
            style={{
              position: "absolute",
              left: light.x * width - glowR,
              top: light.y * height - glowR + drift,
              width: glowR * 2,
              height: glowR * 2,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${WARM_WHITE}cc 0%, ${GOLD}66 35%, transparent 70%)`,
              opacity: appear * (0.5 + light.size * 0.5),
              transform: `scale(${appear * light.size})`,
              boxShadow: `0 0 ${glowR}px ${GOLD}44`,
            }}
          />
        );
      })}

      {/* Central light — strong */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "42%",
          width: 400,
          height: 400,
          marginLeft: -200,
          marginTop: -200,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${GOLD}18 0%, transparent 70%)`,
          opacity: 0.5 + pulse * 0.1,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "42%",
          width: centerGlow * 2,
          height: centerGlow * 2,
          marginLeft: -centerGlow,
          marginTop: -centerGlow,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${WARM_WHITE} 0%, ${GOLD}aa 18%, ${SOFT_AMBER}44 40%, transparent 68%)`,
          opacity: 0.85 + pulse * 0.1,
          boxShadow: `0 0 ${centerGlow}px ${GOLD}55, 0 0 ${centerGlow * 2}px ${GOLD}22`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "42%",
          width: 16,
          height: 16,
          marginLeft: -8,
          marginTop: -8,
          borderRadius: "50%",
          background: "#fff",
          boxShadow: `0 0 30px #fff, 0 0 60px ${WARM_WHITE}`,
        }}
      />

      {/* Text */}
      <StoryText delay={30} duration={90} size={42} y={22} weight={300}>
        You were never alone.
      </StoryText>
      <StoryText delay={130} duration={100} size={50} y={22} weight={400}>
        Look closer.
      </StoryText>
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// SCENE 5: Full constellation pulses — closing
// 750–900 frames (25–30s)
// Emotional beat: Resolve. Warmth. Quiet power. Keep going.
// ═══════════════════════════════════════════════════════════════════════════════
const Scene05: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // All lights in constellation — breathing together
  const lights = [
    { x: 0.50, y: 0.42, size: 1.0 },
    { x: 0.28, y: 0.30, size: 0.5 },
    { x: 0.72, y: 0.35, size: 0.4 },
    { x: 0.35, y: 0.55, size: 0.35 },
    { x: 0.68, y: 0.52, size: 0.45 },
    { x: 0.20, y: 0.45, size: 0.3 },
    { x: 0.80, y: 0.44, size: 0.38 },
    { x: 0.42, y: 0.28, size: 0.32 },
    { x: 0.58, y: 0.58, size: 0.36 },
    { x: 0.15, y: 0.38, size: 0.28 },
    { x: 0.85, y: 0.50, size: 0.34 },
    { x: 0.50, y: 0.25, size: 0.42 },
    { x: 0.38, y: 0.62, size: 0.30 },
  ];

  // Synchronized pulse — all lights breathe together
  const syncPulse = breathe(frame, 30, 0.12);

  // Final fade to emphasize "keep going"
  const endFade = interpolate(frame, [120, 150], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE.exit,
  });

  // Text "Keep going." appears and stays
  const textOpacity = interpolate(frame, [5, 35], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE.dramatic,
  });
  const textSlide = interpolate(frame, [5, 35], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE.dramatic,
  });

  // Stars fade slightly at the very end so text holds alone
  const starsEndFade = interpolate(frame, [110, 145], [1, 0.3], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ background: VOID }}>
      {/* Connection web */}
      <svg
        width={width}
        height={height}
        style={{ position: "absolute", top: 0, left: 0, opacity: 0.12 * starsEndFade }}
      >
        {lights.map((light, i) =>
          lights.slice(i + 1).map((other, j) => {
            const dx = (light.x - other.x) * width;
            const dy = (light.y - other.y) * height;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 500) return null;
            return (
              <line
                key={`web-${i}-${j}`}
                x1={light.x * width}
                y1={light.y * height}
                x2={other.x * width}
                y2={other.y * height}
                stroke={GOLD}
                strokeWidth={0.5}
                opacity={1 - dist / 500}
              />
            );
          })
        )}
      </svg>

      {/* All lights — synchronized pulse */}
      {lights.map((light, i) => {
        const drift = breathe(frame + i * 11, 45, 2);
        const isCenter = i === 0;
        const baseGlow = isCenter ? 120 : 25 * light.size;
        const glowR = baseGlow + syncPulse * (isCenter ? 15 : 5);
        const intensity = isCenter ? 0.9 : 0.4 + light.size * 0.4;

        return (
          <React.Fragment key={`star-${i}`}>
            {isCenter && (
              <div
                style={{
                  position: "absolute",
                  left: light.x * width - 250,
                  top: light.y * height - 250,
                  width: 500,
                  height: 500,
                  borderRadius: "50%",
                  background: `radial-gradient(circle, ${GOLD}18 0%, transparent 70%)`,
                  opacity: (0.5 + syncPulse * 0.15) * starsEndFade,
                }}
              />
            )}
            <div
              style={{
                position: "absolute",
                left: light.x * width - glowR,
                top: light.y * height - glowR + drift,
                width: glowR * 2,
                height: glowR * 2,
                borderRadius: "50%",
                background: isCenter
                  ? `radial-gradient(circle, ${WARM_WHITE} 0%, ${GOLD}aa 18%, ${SOFT_AMBER}44 40%, transparent 68%)`
                  : `radial-gradient(circle, ${WARM_WHITE}cc 0%, ${GOLD}55 35%, transparent 70%)`,
                opacity: intensity * (1 + syncPulse * 0.15) * starsEndFade,
                boxShadow: isCenter
                  ? `0 0 ${glowR}px ${GOLD}55, 0 0 ${glowR * 2}px ${GOLD}22`
                  : `0 0 ${glowR}px ${GOLD}33`,
              }}
            />
            {isCenter && (
              <div
                style={{
                  position: "absolute",
                  left: light.x * width - 8,
                  top: light.y * height - 8,
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  background: "#fff",
                  opacity: starsEndFade,
                  boxShadow: `0 0 30px #fff, 0 0 60px ${WARM_WHITE}`,
                }}
              />
            )}
          </React.Fragment>
        );
      })}

      {/* "Keep going." — centered, quiet power */}
      <div
        style={{
          position: "absolute",
          left: 80,
          right: 80,
          top: "72%",
          transform: `translateY(${textSlide}px)`,
          opacity: textOpacity * endFade,
          fontSize: 68,
          fontWeight: 500,
          fontFamily: "'SF Pro Display', 'Helvetica Neue', sans-serif",
          color: TEXT_PRIMARY,
          textAlign: "center",
          letterSpacing: -0.5,
        }}
      >
        Keep going.
      </div>
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// ROOT COMPOSITION
// ═══════════════════════════════════════════════════════════════════════════════
export const StillHere: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: VOID }}>
      <Audio src={staticFile("dreaming-big.mp3")} volume={0.7} />

      <Sequence from={0} durationInFrames={150} name="Some days are heavy">
        <Scene01 />
      </Sequence>

      <Sequence from={150} durationInFrames={150} name="You wonder">
        <Scene02 />
      </Sequence>

      <Sequence from={300} durationInFrames={210} name="Still here">
        <Scene03 />
      </Sequence>

      <Sequence from={510} durationInFrames={240} name="Not alone">
        <Scene04 />
      </Sequence>

      <Sequence from={750} durationInFrames={150} name="Keep going">
        <Scene05 />
      </Sequence>
    </AbsoluteFill>
  );
};
