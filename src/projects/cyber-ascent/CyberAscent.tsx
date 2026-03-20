/**
 * CYBER ASCENT — "From Nothing to Everything"
 * Cyberpunk rags-to-riches character arc · Maximum animation density · 3D camera
 * 1080×1920 (9:16) · 30fps · 60s = 1800 frames
 *
 * Showcases: 300+ particles, 3D perspective camera with continuous motion,
 * parallax depth layers, procedural cityscapes, holographic UI, glitch effects,
 * rain system, neon signage, character silhouette evolution, data streams,
 * dynamic lighting, color morphing across acts, kinetic typography.
 *
 * 5-ACT STRUCTURE:
 * Act 1 (0–360):    THE GUTTER — Rain, darkness, a lone figure
 * Act 2 (360–720):  THE SPARK — First hack, neon awakens
 * Act 3 (720–1080): THE CLIMB — Data streams, city rises around them
 * Act 4 (1080–1440): THE THRONE — Holographic empire, maximum spectacle
 * Act 5 (1440–1800): THE COST — What was gained, what was lost
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

// ═══════════════════════════════════════════════════════════════════════════════
// MOTION TOKENS — cyberpunk: snappy with elastic aftershock
// ═══════════════════════════════════════════════════════════════════════════════
const DUR = { micro: 2, fast: 5, med: 12, slow: 24, dramatic: 45, epic: 75 };
const SP = { stiffness: 280, damping: 22, mass: 0.9 };
const SP_GLITCH = { stiffness: 500, damping: 12, mass: 0.5 };
const SP_HEAVY = { stiffness: 80, damping: 16, mass: 2.5 };
const SP_BOUNCE = { stiffness: 200, damping: 10, mass: 1 };
const SP_SNAP = { stiffness: 600, damping: 35, mass: 0.4 };
const EASE = {
  entrance: Easing.bezier(0.0, 0.0, 0.2, 1.0),
  exit: Easing.bezier(0.7, 0.0, 1.0, 1.0),
  dramatic: Easing.bezier(0.4, 0.0, 0.0, 1.0),
  elastic: Easing.bezier(0.34, 1.56, 0.64, 1),
  snap: Easing.bezier(0.9, 0.0, 0.1, 1.0),
  power: Easing.bezier(0.0, 0.0, 0.0, 1.0),
};

// ═══════════════════════════════════════════════════════════════════════════════
// BEAT SYNC — 120 BPM @ 30fps = 15 frames per beat
// Audio uses 0.5s kick loop = exactly 15 frames at 30fps
// All key visual events snap to BEAT multiples for audio-visual lock
// ═══════════════════════════════════════════════════════════════════════════════
const BEAT = 15;
const beatPulse = (frame: number, amp = 0.07): number => {
  const t = frame % BEAT;
  return 1 + amp * Math.max(0, 1 - t / 3.5);
};
// Accent on every Nth beat (for bigger visual hits)
const beatAccent = (frame: number, n = 4): boolean =>
  Math.floor(frame / BEAT) % n === 0 && frame % BEAT < 3;

// ═══════════════════════════════════════════════════════════════════════════════
// COLOR SYSTEM — evolves across acts
// Act 1: cold, desaturated     → Act 2: first neon sparks
// Act 3: electric bloom        → Act 4: holographic opulence
// Act 5: golden melancholy
// ═══════════════════════════════════════════════════════════════════════════════
const C = {
  // Base
  void: "#03010a",
  darkGround: "#0a0612",
  surface: "#110b1f",
  // Neon palette
  cyan: "#00fff2",
  magenta: "#ff00aa",
  purple: "#9d4edd",
  deepPurple: "#3c096c",
  hotPink: "#ff006e",
  electricBlue: "#4361ee",
  neonGreen: "#39ff14",
  // Wealth palette
  gold: "#ffd700",
  amber: "#ffaa00",
  platinum: "#e5e4e2",
  // Atmosphere
  rain: "#4a90d9",
  smog: "#1a1625",
  // Text
  textBright: "rgba(255,255,255,0.95)",
  textDim: "rgba(255,255,255,0.40)",
  textNeon: "#00fff2",
};

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════
const lerp = (a: number, b: number, t: number) => a + (b - a) * Math.max(0, Math.min(1, t));
const lerpColor = (hex1: string, hex2: string, t: number) => {
  const parse = (h: string) => [
    parseInt(h.slice(1, 3), 16),
    parseInt(h.slice(3, 5), 16),
    parseInt(h.slice(5, 7), 16),
  ];
  const ct = Math.max(0, Math.min(1, t));
  const [r1, g1, b1] = parse(hex1);
  const [r2, g2, b2] = parse(hex2);
  return `rgb(${Math.round(lerp(r1, r2, ct))},${Math.round(lerp(g1, g2, ct))},${Math.round(lerp(b1, b2, ct))})`;
};
const breathe = (f: number, period: number, amp: number) =>
  Math.sin((f / period) * Math.PI * 2) * amp;
const noise = (f: number, seed: string, speed = 0.03) =>
  Math.sin(f * speed + random(seed) * 100) * 0.5 + 0.5;
const glitch = (f: number, seed: string, intensity = 1): number => {
  const h = random(`${seed}-${Math.floor(f / 3)}`);
  return h > 0.85 ? (random(`${seed}-g-${Math.floor(f / 2)}`) - 0.5) * 40 * intensity : 0;
};

// ═══════════════════════════════════════════════════════════════════════════════
// 3D CAMERA WRAPPER — perspective + all 6 DOF
// ═══════════════════════════════════════════════════════════════════════════════
const Camera: React.FC<{
  children: React.ReactNode;
  zoom?: number;
  panX?: number;
  panY?: number;
  rotateX?: number;
  rotateY?: number;
  rotateZ?: number;
  perspective?: number;
  originX?: string;
  originY?: string;
}> = ({
  children,
  zoom = 1,
  panX = 0,
  panY = 0,
  rotateX = 0,
  rotateY = 0,
  rotateZ = 0,
  perspective = 1200,
  originX = "50%",
  originY = "50%",
}) => (
  <div
    style={{
      position: "absolute",
      width: "100%",
      height: "100%",
      perspective,
      perspectiveOrigin: `${originX} ${originY}`,
      overflow: "hidden",
    }}
  >
    <div
      style={{
        position: "absolute",
        width: "100%",
        height: "100%",
        transformStyle: "preserve-3d",
        transform: `translateX(${panX}px) translateY(${panY}px) scale(${zoom}) rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg)`,
        transformOrigin: `${originX} ${originY}`,
      }}
    >
      {children}
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// RAIN SYSTEM — procedural cyberpunk rain
// ═══════════════════════════════════════════════════════════════════════════════
const RainSystem: React.FC<{
  count?: number;
  speed?: number;
  opacity?: number;
  color?: string;
  wind?: number;
  seed?: string;
}> = ({ count = 200, speed = 8, opacity = 0.3, color = C.rain, wind = 2, seed = "rain" }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  return (
    <>
      {Array.from({ length: count }).map((_, i) => {
        const rx = random(`${seed}-x-${i}`);
        const ry = random(`${seed}-y-${i}`);
        const rs = random(`${seed}-s-${i}`);
        const rlen = random(`${seed}-l-${i}`);

        const dropSpeed = (0.6 + rs * 0.8) * speed;
        const len = 15 + rlen * 40;
        const x = rx * (width + 200) - 100 + frame * wind * (0.5 + rs * 0.5);
        const y = ((ry * (height + len) + frame * dropSpeed) % (height + len)) - len;
        const dropOpacity = opacity * (0.3 + rs * 0.7);

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x % (width + 200) - 100,
              top: y,
              width: 1,
              height: len,
              background: `linear-gradient(to bottom, transparent, ${color}${Math.round(dropOpacity * 255).toString(16).padStart(2, "0")})`,
              borderRadius: 1,
            }}
          />
        );
      })}
    </>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// PARTICLE SYSTEM — reusable, multi-drift
// ═══════════════════════════════════════════════════════════════════════════════
const Particles: React.FC<{
  count: number;
  color: string;
  minSize?: number;
  maxSize?: number;
  speed?: number;
  spread?: number;
  opacity?: number;
  glow?: boolean;
  drift?: "up" | "down" | "radial" | "swirl" | "rise";
  centerX?: number;
  centerY?: number;
  seed?: string;
}> = ({
  count, color, minSize = 1, maxSize = 4, speed = 1, spread = 1,
  opacity = 0.6, glow = false, drift = "up", centerX = 540, centerY = 960, seed = "p",
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  return (
    <>
      {Array.from({ length: count }).map((_, i) => {
        const rx = random(`${seed}-x-${i}`);
        const ry = random(`${seed}-y-${i}`);
        const rs = random(`${seed}-s-${i}`);
        const rsp = random(`${seed}-sp-${i}`);
        const size = minSize + rs * (maxSize - minSize);
        const pSpeed = (0.5 + rsp) * speed;

        let x: number, y: number;
        if (drift === "radial") {
          const angle = rx * Math.PI * 2;
          const dist = ry * spread * 400 + frame * pSpeed * 0.8;
          x = centerX + Math.cos(angle + frame * 0.008 * pSpeed) * dist;
          y = centerY + Math.sin(angle + frame * 0.008 * pSpeed) * dist;
        } else if (drift === "swirl") {
          const angle = rx * Math.PI * 2 + frame * 0.02 * pSpeed;
          const dist = 50 + ry * spread * 350 + Math.sin(frame * 0.015 + i) * 30;
          x = centerX + Math.cos(angle) * dist;
          y = centerY + Math.sin(angle) * dist;
        } else if (drift === "rise") {
          x = rx * width * spread + (1 - spread) * width * 0.5 + breathe(frame + i * 7, 40, 15);
          y = ((ry * height - frame * pSpeed * 1.5) % (height + 100) + height + 100) % (height + 100) - 50;
        } else if (drift === "down") {
          x = rx * width * spread + (1 - spread) * width * 0.5;
          y = ((ry * height + frame * pSpeed * 2) % (height + 100)) - 50;
        } else {
          x = rx * width * spread + (1 - spread) * width * 0.5;
          y = ((ry * height - frame * pSpeed * 2) % (height + 100) + height + 100) % (height + 100) - 50;
        }

        const twinkle = 0.5 + Math.sin(frame * 0.1 + i * 7) * 0.5;

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x - size / 2,
              top: y - size / 2,
              width: size,
              height: size,
              borderRadius: "50%",
              background: color,
              opacity: opacity * twinkle,
              boxShadow: glow ? `0 0 ${size * 3}px ${color}, 0 0 ${size * 6}px ${color}66` : undefined,
            }}
          />
        );
      })}
    </>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// PROCEDURAL CITYSCAPE — parallax layers of cyberpunk buildings
// ═══════════════════════════════════════════════════════════════════════════════
const CityLayer: React.FC<{
  yBase: number;
  buildingCount: number;
  minH: number;
  maxH: number;
  color: string;
  seed: string;
  windowColor?: string;
  neonAccent?: string;
  parallaxSpeed?: number;
  glowIntensity?: number;
}> = ({
  yBase, buildingCount, minH, maxH, color, seed,
  windowColor = "rgba(255,255,255,0.05)", neonAccent, parallaxSpeed = 0, glowIntensity = 0,
}) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const panOffset = frame * parallaxSpeed;

  return (
    <>
      {Array.from({ length: buildingCount }).map((_, i) => {
        const bx = random(`${seed}-bx-${i}`);
        const bh = random(`${seed}-bh-${i}`);
        const bw = random(`${seed}-bw-${i}`);
        const buildingW = 40 + bw * 80;
        const buildingH = minH + bh * (maxH - minH);
        const x = (bx * (width + 200) - 100 + panOffset) % (width + 200) - 100;
        const hasAntenna = random(`${seed}-ant-${i}`) > 0.7;
        const hasNeon = neonAccent && random(`${seed}-neon-${i}`) > 0.6;
        const windowRows = Math.floor(buildingH / 20);
        const windowCols = Math.floor(buildingW / 16);

        return (
          <React.Fragment key={i}>
            {/* Building body */}
            <div
              style={{
                position: "absolute",
                left: x,
                bottom: 1920 - yBase,
                width: buildingW,
                height: buildingH,
                background: `linear-gradient(180deg, ${color}dd 0%, ${color} 100%)`,
                borderTop: `1px solid rgba(255,255,255,0.06)`,
                boxShadow: glowIntensity > 0
                  ? `0 0 ${glowIntensity * 30}px ${neonAccent || color}22`
                  : undefined,
              }}
            >
              {/* Windows */}
              {Array.from({ length: windowRows * windowCols }).map((_, wi) => {
                const row = Math.floor(wi / windowCols);
                const col = wi % windowCols;
                const lit = random(`${seed}-w-${i}-${wi}`) > 0.5;
                const flicker = lit && random(`${seed}-wf-${i}-${wi}`) > 0.9
                  ? Math.sin(frame * 0.3 + wi) > 0 ? 0.8 : 0.2
                  : lit ? 0.6 : 0;
                return (
                  <div
                    key={wi}
                    style={{
                      position: "absolute",
                      left: 6 + col * 16,
                      top: 8 + row * 20,
                      width: 8,
                      height: 12,
                      background: flicker > 0 ? windowColor : "transparent",
                      opacity: flicker,
                      boxShadow: flicker > 0.4 ? `0 0 4px ${windowColor}` : undefined,
                    }}
                  />
                );
              })}
            </div>
            {/* Antenna */}
            {hasAntenna && (
              <div
                style={{
                  position: "absolute",
                  left: x + buildingW / 2 - 1,
                  bottom: 1920 - yBase + buildingH,
                  width: 2,
                  height: 20 + random(`${seed}-anth-${i}`) * 30,
                  background: `linear-gradient(to top, ${color}, rgba(255,255,255,0.15))`,
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: -3,
                    left: -3,
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: hasNeon ? neonAccent : "#ff0000",
                    opacity: 0.5 + Math.sin(frame * 0.2 + i) * 0.5,
                    boxShadow: `0 0 8px ${hasNeon ? neonAccent : "#ff0000"}`,
                  }}
                />
              </div>
            )}
            {/* Neon strip on building */}
            {hasNeon && neonAccent && (
              <div
                style={{
                  position: "absolute",
                  left: x,
                  bottom: 1920 - yBase + buildingH * (0.2 + random(`${seed}-ns-${i}`) * 0.6),
                  width: buildingW,
                  height: 3,
                  background: neonAccent,
                  opacity: 0.6 + breathe(frame + i * 10, 30, 0.3),
                  boxShadow: `0 0 15px ${neonAccent}, 0 0 40px ${neonAccent}44`,
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// CHARACTER SILHOUETTE — evolving from hunched to powerful
// ═══════════════════════════════════════════════════════════════════════════════
const CharacterSilhouette: React.FC<{
  pose: "hunched" | "standing" | "walking" | "powerful" | "throne";
  x: number;
  y: number;
  scale?: number;
  color?: string;
  glowColor?: string;
  glowIntensity?: number;
  opacity?: number;
}> = ({ pose, x, y, scale = 1, color = "#0a0612", glowColor, glowIntensity = 0, opacity = 1 }) => {
  const frame = useCurrentFrame();
  const breatheAmt = breathe(frame, 40, 2);

  // SVG paths for different poses — stylized cyberpunk silhouettes
  const poses: Record<string, string> = {
    hunched: "M50,95 C50,95 45,75 42,65 C39,55 35,50 38,42 C41,34 45,30 50,28 C55,30 59,34 62,42 C65,50 61,55 58,65 C55,75 50,95 50,95 Z M38,42 L30,55 M62,42 L70,50 M42,65 L35,85 M58,65 L65,85",
    standing: "M50,95 L50,55 M50,55 C50,55 45,45 45,38 C45,31 47,25 50,22 C53,25 55,31 55,38 C55,45 50,55 50,55 Z M50,55 L35,70 M50,55 L65,70 M50,75 L40,95 M50,75 L60,95",
    walking: "M50,95 L45,70 L50,55 M50,55 C50,55 45,45 45,38 C45,31 47,25 50,22 C53,25 55,31 55,38 C55,45 50,55 50,55 Z M50,55 L35,65 M50,55 L68,62 M50,75 L35,95 M50,75 L62,95",
    powerful: "M50,95 L50,50 M50,50 C50,50 43,40 43,33 C43,26 46,20 50,18 C54,20 57,26 57,33 C57,40 50,50 50,50 Z M50,50 L25,40 M50,50 L75,40 M50,70 L38,95 M50,70 L62,95",
    throne: "M50,95 L50,55 M50,55 C50,55 43,45 43,38 C43,31 46,25 50,22 C54,25 57,31 57,38 C57,45 50,55 50,55 Z M50,55 L28,58 M50,55 L72,58 M50,75 L42,95 M50,75 L58,95 M25,50 L25,15 L75,15 L75,50 M30,15 L30,5 M70,15 L70,5",
  };

  return (
    <div
      style={{
        position: "absolute",
        left: x - 50 * scale,
        top: y - 95 * scale + breatheAmt,
        width: 100 * scale,
        height: 100 * scale,
        opacity,
      }}
    >
      {/* Glow behind character */}
      {glowColor && glowIntensity > 0 && (
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "40%",
            width: 120 * scale,
            height: 120 * scale,
            marginLeft: -60 * scale,
            marginTop: -60 * scale,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${glowColor}${Math.round(glowIntensity * 60).toString(16).padStart(2, "0")} 0%, transparent 70%)`,
            filter: `blur(${20 * glowIntensity}px)`,
          }}
        />
      )}
      <svg
        viewBox="0 0 100 100"
        width={100 * scale}
        height={100 * scale}
        style={{
          position: "absolute",
          filter: glowColor && glowIntensity > 0
            ? `drop-shadow(0 0 ${10 * glowIntensity}px ${glowColor}) drop-shadow(0 0 ${25 * glowIntensity}px ${glowColor}66)`
            : undefined,
        }}
      >
        <path
          d={poses[pose]}
          fill={color}
          stroke={glowColor || color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// NEON SIGN — flickering cyberpunk text
// ═══════════════════════════════════════════════════════════════════════════════
const NeonSign: React.FC<{
  text: string;
  x: number;
  y: number;
  color: string;
  size?: number;
  flicker?: boolean;
  delay?: number;
  broken?: boolean;
}> = ({ text, x, y, color, size = 24, flicker = true, delay = 0, broken = false }) => {
  const frame = useCurrentFrame();
  const f = Math.max(0, frame - delay);

  let flickerOp = 1;
  if (flicker) {
    const t = f * 0.15;
    flickerOp = 0.7 + Math.sin(t) * 0.15 + Math.sin(t * 3.7) * 0.1 + Math.sin(t * 7.3) * 0.05;
  }
  if (broken) {
    flickerOp *= random(`neon-b-${Math.floor(f / 8)}`) > 0.4 ? 1 : 0.1;
  }

  const appear = interpolate(f, [0, DUR.fast], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        fontSize: size,
        fontWeight: 700,
        fontFamily: "'Courier New', monospace",
        color,
        opacity: appear * flickerOp,
        textShadow: `0 0 ${size * 0.4}px ${color}, 0 0 ${size * 0.8}px ${color}88, 0 0 ${size * 1.5}px ${color}44`,
        whiteSpace: "nowrap",
        letterSpacing: 2,
      }}
    >
      {text}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// DATA STREAM — vertical scrolling code/data
// ═══════════════════════════════════════════════════════════════════════════════
const DataStream: React.FC<{
  x: number;
  width?: number;
  color?: string;
  speed?: number;
  density?: number;
  opacity?: number;
  seed?: string;
}> = ({ x, width: w = 30, color = C.cyan, speed = 3, density = 20, opacity = 0.4, seed = "ds" }) => {
  const frame = useCurrentFrame();
  const { height } = useVideoConfig();
  const chars = "01アイウエオカキクケコ▓░▒█>></>{}[]";

  return (
    <div style={{ position: "absolute", left: x, top: 0, width: w, height: "100%", overflow: "hidden" }}>
      {Array.from({ length: density }).map((_, i) => {
        const ry = random(`${seed}-y-${i}`);
        const rc = random(`${seed}-c-${i}`);
        const rs = random(`${seed}-s-${i}`);
        const charIdx = Math.floor(rc * chars.length);
        const yPos = ((ry * height + frame * speed * (0.5 + rs)) % (height + 40)) - 20;
        const charOpacity = opacity * (0.3 + rs * 0.7) * (Math.sin(frame * 0.15 + i * 3) * 0.3 + 0.7);

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              top: yPos,
              left: random(`${seed}-lx-${i}`) * w,
              fontSize: 10 + rs * 8,
              fontFamily: "'Courier New', monospace",
              color,
              opacity: charOpacity,
              textShadow: `0 0 4px ${color}`,
            }}
          >
            {chars[charIdx]}
          </div>
        );
      })}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// HOLOGRAPHIC PANEL — floating UI element
// ═══════════════════════════════════════════════════════════════════════════════
const HoloPanel: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  color?: string;
  delay?: number;
  children?: React.ReactNode;
  rotateY?: number;
  rotateX?: number;
  scanline?: boolean;
}> = ({
  x, y, w, h, color = C.cyan, delay = 0, children,
  rotateY = 0, rotateX = 0, scanline = true,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const appear = spring({
    frame: Math.max(0, frame - delay),
    fps,
    config: SP,
  });

  const scanY = scanline ? (frame * 3) % h : -1;

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        height: h,
        opacity: appear,
        transform: `perspective(800px) rotateY(${rotateY}deg) rotateX(${rotateX}deg) scale(${0.8 + appear * 0.2})`,
        transformOrigin: "center",
        background: `linear-gradient(180deg, ${color}15 0%, ${color}08 100%)`,
        border: `1px solid ${color}55`,
        borderRadius: 4,
        boxShadow: `0 0 20px ${color}22, inset 0 0 30px ${color}08`,
        overflow: "hidden",
      }}
    >
      {/* Corner brackets */}
      {[
        { left: 0, top: 0, borderTop: `2px solid ${color}`, borderLeft: `2px solid ${color}` },
        { right: 0, top: 0, borderTop: `2px solid ${color}`, borderRight: `2px solid ${color}` },
        { left: 0, bottom: 0, borderBottom: `2px solid ${color}`, borderLeft: `2px solid ${color}` },
        { right: 0, bottom: 0, borderBottom: `2px solid ${color}`, borderRight: `2px solid ${color}` },
      ].map((style, i) => (
        <div key={i} style={{ position: "absolute", width: 12, height: 12, ...style } as React.CSSProperties} />
      ))}
      {/* Scanline */}
      {scanline && scanY >= 0 && (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: scanY,
            width: "100%",
            height: 2,
            background: `linear-gradient(to right, transparent, ${color}44, transparent)`,
          }}
        />
      )}
      {children}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// RING BURST — expanding concentric rings
// ═══════════════════════════════════════════════════════════════════════════════
const RingBurst: React.FC<{
  x: number; y: number; delay: number; count?: number; color?: string; maxSize?: number;
}> = ({ x, y, delay, count = 5, color = C.cyan, maxSize = 500 }) => {
  const frame = useCurrentFrame();
  return (
    <>
      {Array.from({ length: count }).map((_, i) => {
        const ringDelay = delay + i * 4;
        const f = Math.max(0, frame - ringDelay);
        const expand = interpolate(f, [0, 25], [0, 1], {
          extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE.entrance,
        });
        const fade = interpolate(f, [5, 25], [0.8, 0], {
          extrapolateLeft: "clamp", extrapolateRight: "clamp",
        });
        const size = expand * maxSize * (0.5 + i * 0.15);
        return (
          <div key={i} style={{
            position: "absolute", left: x - size / 2, top: y - size / 2,
            width: size, height: size, borderRadius: "50%",
            border: `${2 - i * 0.3}px solid ${color}`,
            opacity: fade, boxShadow: `0 0 20px ${color}44`,
          }} />
        );
      })}
    </>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// KINETIC TEXT — glitch-capable, glow-capable
// ═══════════════════════════════════════════════════════════════════════════════
const KineticText: React.FC<{
  text: string;
  delay: number;
  duration: number;
  size?: number;
  color?: string;
  y?: number;
  weight?: number;
  wordByWord?: boolean;
  glowColor?: string;
  glitchy?: boolean;
  mono?: boolean;
}> = ({
  text, delay, duration, size = 72, color = C.textBright,
  y = 50, weight = 700, wordByWord = false, glowColor, glitchy = false, mono = false,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const glitchX = glitchy ? glitch(frame, `gt-${text}`, 0.5) : 0;
  const glitchSkew = glitchy && random(`gs-${Math.floor(frame / 4)}`) > 0.92
    ? (random(`gsk-${Math.floor(frame / 3)}`) - 0.5) * 8 : 0;

  if (!wordByWord) {
    const s = spring({ frame: Math.max(0, frame - delay), fps, config: SP });
    const exitProg = interpolate(frame, [delay + duration - DUR.med, delay + duration], [1, 0], {
      extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE.exit,
    });
    return (
      <div style={{
        position: "absolute", left: 60, right: 60, top: `${y}%`,
        transform: `translateY(-50%) translateX(${glitchX}px) scale(${0.6 + s * 0.4}) skewX(${glitchSkew}deg)`,
        opacity: Math.min(s, exitProg),
        fontSize: size, fontWeight: weight,
        fontFamily: mono ? "'Courier New', monospace" : "'SF Pro Display', 'Helvetica Neue', sans-serif",
        color, textAlign: "center",
        letterSpacing: size > 60 ? -2 : mono ? 2 : -0.5,
        textShadow: glowColor ? `0 0 40px ${glowColor}, 0 0 80px ${glowColor}66` : undefined,
      }}>
        {text}
      </div>
    );
  }

  const words = text.split(" ");
  return (
    <div style={{
      position: "absolute", left: 60, right: 60, top: `${y}%`,
      transform: `translateY(-50%) translateX(${glitchX}px) skewX(${glitchSkew}deg)`,
      display: "flex", flexWrap: "wrap", justifyContent: "center", gap: size * 0.3,
    }}>
      {words.map((word, i) => {
        const wordDelay = delay + i * 3;
        const s = spring({ frame: Math.max(0, frame - wordDelay), fps, config: SP_SNAP });
        const exitProg = interpolate(frame, [delay + duration - DUR.med, delay + duration], [1, 0], {
          extrapolateLeft: "clamp", extrapolateRight: "clamp",
        });
        return (
          <span key={i} style={{
            display: "inline-block", fontSize: size, fontWeight: weight,
            fontFamily: mono ? "'Courier New', monospace" : "'SF Pro Display', 'Helvetica Neue', sans-serif",
            color, opacity: Math.min(s, exitProg),
            transform: `translateY(${(1 - s) * 40}px) scale(${0.7 + s * 0.3})`,
            textShadow: glowColor ? `0 0 30px ${glowColor}` : undefined,
          }}>
            {word}
          </span>
        );
      })}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// GLITCH OVERLAY — chromatic aberration + scan distortion
// ═══════════════════════════════════════════════════════════════════════════════
const GlitchOverlay: React.FC<{ intensity?: number; seed?: string }> = ({ intensity = 1, seed = "glitch" }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const active = random(`${seed}-${Math.floor(frame / 6)}`) > 0.85;
  if (!active) return null;

  const sliceCount = 3 + Math.floor(random(`${seed}-sc-${frame}`) * 5);

  return (
    <div style={{ position: "absolute", width: "100%", height: "100%", pointerEvents: "none" }}>
      {Array.from({ length: sliceCount }).map((_, i) => {
        const sliceY = random(`${seed}-sy-${frame}-${i}`) * height;
        const sliceH = 5 + random(`${seed}-sh-${frame}-${i}`) * 40;
        const offsetX = (random(`${seed}-sx-${frame}-${i}`) - 0.5) * 30 * intensity;
        return (
          <div key={i} style={{
            position: "absolute", left: offsetX, top: sliceY,
            width: "100%", height: sliceH,
            background: `linear-gradient(90deg, ${C.cyan}08, ${C.magenta}06, transparent)`,
            mixBlendMode: "screen",
          }} />
        );
      })}
      {/* Horizontal line artifacts */}
      <div style={{
        position: "absolute", left: 0,
        top: random(`${seed}-hl-${frame}`) * height,
        width: "100%", height: 1,
        background: C.cyan, opacity: 0.15 * intensity,
      }} />
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// SCENE 1: THE GUTTER — Rain, darkness, a lone figure (0–360, 0–12s)
// Emotional: Isolation. Heaviness. Cold. The viewer feels the weight.
// Camera: Slow dolly down, slight tilt, rain parallax
// ═══════════════════════════════════════════════════════════════════════════════
const Scene01: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Camera: slow descent + subtle rotation
  const camZoom = interpolate(frame, [0, 360], [1.1, 1.25], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE.dramatic,
  });
  const camPanY = interpolate(frame, [0, 360], [-40, 20], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE.dramatic,
  });
  const camRotZ = interpolate(frame, [0, 360], [-0.5, 0.3], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const camRotX = interpolate(frame, [0, 360], [2, -1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  // Beat-reactive scale pulse for the whole scene
  const pulse = beatPulse(frame, 0.04);

  // Character fades in from darkness — on beat 4 (frame 60)
  const charAppear = interpolate(frame, [BEAT * 4, BEAT * 8], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE.dramatic,
  });

  // Neon signs flicker on — starting beat 2 (frame 30)
  const neonReveal = interpolate(frame, [BEAT * 2, BEAT * 6], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  // Overall scene lighting — starts very dark
  const ambientLight = interpolate(frame, [0, BEAT * 12], [0.3, 0.7], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE.dramatic,
  });

  // Puddle reflection ripple
  const ripple = breathe(frame, 20, 3);

  return (
    <AbsoluteFill style={{ background: C.void }}>
      <Camera
        zoom={camZoom}
        panY={camPanY}
        rotateZ={camRotZ}
        rotateX={camRotX}
        perspective={1400}
      >
        {/* Deep background city — far layer */}
        <div style={{ opacity: ambientLight * 0.4 }}>
          <CityLayer
            yBase={1100}
            buildingCount={20}
            minH={100}
            maxH={350}
            color="#0d0820"
            seed="city-far"
            windowColor={C.cyan + "15"}
            parallaxSpeed={0.1}
          />
        </div>

        {/* Mid city layer */}
        <div style={{ opacity: ambientLight * 0.7 }}>
          <CityLayer
            yBase={1250}
            buildingCount={15}
            minH={150}
            maxH={500}
            color="#12082a"
            seed="city-mid"
            windowColor={C.cyan + "25"}
            neonAccent={C.magenta}
            parallaxSpeed={0.3}
            glowIntensity={neonReveal * 0.3}
          />
        </div>

        {/* Near city layer */}
        <div style={{ opacity: ambientLight }}>
          <CityLayer
            yBase={1450}
            buildingCount={10}
            minH={200}
            maxH={600}
            color="#1a0e35"
            seed="city-near"
            windowColor={C.cyan + "35"}
            neonAccent={C.cyan}
            parallaxSpeed={0.6}
            glowIntensity={neonReveal * 0.6}
          />
        </div>

        {/* Ground / alley floor */}
        <div style={{
          position: "absolute",
          left: -100,
          bottom: 1920 - 1550,
          width: width + 200,
          height: 500,
          background: `linear-gradient(180deg, ${C.darkGround} 0%, #050210 100%)`,
        }} />

        {/* Puddle reflection */}
        <div style={{
          position: "absolute",
          left: width * 0.2,
          top: 1550 + ripple,
          width: width * 0.6,
          height: 80,
          background: `linear-gradient(180deg, ${C.cyan}08, ${C.magenta}05, transparent)`,
          borderRadius: "50%",
          filter: "blur(8px)",
          opacity: neonReveal * 0.5,
        }} />

        {/* Neon signs — each on a beat boundary */}
        {neonReveal > 0 && (
          <>
            <NeonSign text="夢" x={120} y={900} color={C.magenta} size={48} delay={BEAT * 2} />
            <NeonSign text="HOTEL" x={750} y={850} color={C.cyan} size={20} delay={BEAT * 3} broken />
            <NeonSign text="24HR" x={300} y={950} color={C.hotPink} size={16} delay={BEAT * 5} />
            <NeonSign text="RAMEN" x={600} y={780} color={C.amber} size={22} delay={BEAT * 4} />
          </>
        )}

        {/* Character — hunched in the rain */}
        <CharacterSilhouette
          pose="hunched"
          x={540}
          y={1450}
          scale={3}
          color="#080416"
          opacity={charAppear}
        />
      </Camera>

      {/* Rain — on top of everything, not affected by camera */}
      <div style={{ opacity: ambientLight }}>
        <RainSystem count={250} speed={10} opacity={0.25} wind={1.5} seed="rain1" />
      </div>

      {/* Atmospheric fog */}
      <div style={{
        position: "absolute", left: 0, top: height * 0.6,
        width: "100%", height: height * 0.4,
        background: `linear-gradient(to top, ${C.smog}88, transparent)`,
        pointerEvents: "none",
      }} />

      {/* Text — on beats for audio-visual lock */}
      <KineticText
        text="ROCK BOTTOM"
        delay={BEAT * 6}
        duration={BEAT * 12}
        size={78}
        weight={900}
        y={25}
        glowColor={C.magenta}
        glitchy
      />
      <KineticText
        text="is where empires begin."
        delay={BEAT * 10}
        duration={BEAT * 10}
        size={32}
        weight={300}
        y={33}
        color={C.textDim}
      />
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// SCENE 2: THE SPARK — First hack, neon awakens (360–720, 12–24s)
// Emotional: Discovery. Power tasted for the first time.
// Camera: Push in aggressively, rotate to dynamic angle, data streams appear
// ═══════════════════════════════════════════════════════════════════════════════
const Scene02: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Camera: dramatic zoom + tilt
  const camZoom = interpolate(frame, [0, 360], [1.0, 1.8], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE.dramatic,
  });
  const camRotY = interpolate(frame, [0, 180, 360], [0, -8, 3], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const camRotX = interpolate(frame, [0, 360], [0, 5], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const camPanX = interpolate(frame, [0, 360], [0, -50], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE.dramatic,
  });

  // Beat-reactive pulse
  const pulse = beatPulse(frame, 0.06);

  // Character transforms from hunched to standing — beat 2 to beat 6
  const poseProgress = interpolate(frame, [BEAT * 2, BEAT * 6], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE.dramatic,
  });

  // Neon awakening — beat 4 to beat 14
  const neonPower = interpolate(frame, [BEAT * 4, BEAT * 14], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE.dramatic,
  });

  // Data streams materialize — beat 6 to beat 10
  const dataAppear = interpolate(frame, [BEAT * 6, BEAT * 10], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  // Screen flash at the "hack" moment — exactly on beat 4 (frame 60)
  const hackBeat = BEAT * 4;
  const hackFlash = frame > hackBeat - 2 && frame < hackBeat + 10
    ? interpolate(frame, [hackBeat - 2, hackBeat, hackBeat + 10], [0, 0.8, 0], {
        extrapolateLeft: "clamp", extrapolateRight: "clamp",
      })
    : 0;

  // Holo panel data — beat 8 to beat 12
  const holoReveal = interpolate(frame, [BEAT * 8, BEAT * 12], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ background: C.void }}>
      <Camera
        zoom={camZoom}
        panX={camPanX}
        rotateY={camRotY}
        rotateX={camRotX}
        perspective={1000}
      >
        {/* City background — now more alive */}
        <CityLayer
          yBase={1200}
          buildingCount={18}
          minH={120}
          maxH={450}
          color="#12082a"
          seed="city2-far"
          windowColor={lerpColor("#ffffff15", C.cyan + "40", neonPower)}
          neonAccent={C.cyan}
          parallaxSpeed={0.2}
          glowIntensity={neonPower * 0.8}
        />
        <CityLayer
          yBase={1400}
          buildingCount={12}
          minH={180}
          maxH={550}
          color="#1a0e35"
          seed="city2-near"
          windowColor={lerpColor("#ffffff20", C.magenta + "50", neonPower)}
          neonAccent={C.magenta}
          parallaxSpeed={0.5}
          glowIntensity={neonPower}
        />

        {/* Data streams rising from ground */}
        {dataAppear > 0 && (
          <div style={{ opacity: dataAppear }}>
            {[100, 250, 400, 680, 820, 950].map((xPos, i) => (
              <DataStream
                key={i}
                x={xPos}
                color={i % 2 === 0 ? C.cyan : C.neonGreen}
                speed={2 + i * 0.5}
                density={15}
                opacity={0.3}
                seed={`ds2-${i}`}
              />
            ))}
          </div>
        )}

        {/* Character — now standing */}
        <CharacterSilhouette
          pose={poseProgress > 0.5 ? "standing" : "hunched"}
          x={540}
          y={1350}
          scale={3.5}
          color="#0a0416"
          glowColor={C.cyan}
          glowIntensity={neonPower * 0.8}
        />

        {/* Ring burst at hack moment — on beat 4 */}
        {frame > hackBeat && (
          <RingBurst x={540} y={1250} delay={hackBeat} count={6} color={C.cyan} maxSize={600} />
        )}
      </Camera>

      {/* Holographic panels — floating around character */}
      {holoReveal > 0 && (
        <>
          <HoloPanel x={60} y={500} w={250} h={160} color={C.cyan} delay={BEAT * 8} rotateY={15}>
            <div style={{
              padding: 12, fontFamily: "'Courier New', monospace",
              fontSize: 11, color: C.cyan, opacity: 0.8,
            }}>
              <div style={{ marginBottom: 6, fontWeight: 700 }}>ACCESS GRANTED</div>
              <div style={{ opacity: 0.5 }}>{">"} sys.breach(node_0x7F)</div>
              <div style={{ opacity: 0.5 }}>{">"} decrypt.key: ████████</div>
              <div style={{ color: C.neonGreen }}>{">"} STATUS: CONNECTED</div>
            </div>
          </HoloPanel>
          <HoloPanel x={770} y={600} w={220} h={140} color={C.magenta} delay={BEAT * 10} rotateY={-12}>
            <div style={{
              padding: 12, fontFamily: "'Courier New', monospace",
              fontSize: 11, color: C.magenta, opacity: 0.8,
            }}>
              <div style={{ marginBottom: 6, fontWeight: 700 }}>FUNDS: ¥0.00</div>
              <div style={{ opacity: 0.5 }}>CREDIT: DENIED</div>
              <div style={{ opacity: 0.5 }}>RANK: UNKNOWN</div>
              <div style={{ color: C.amber }}>POTENTIAL: ∞</div>
            </div>
          </HoloPanel>
        </>
      )}

      {/* Hack flash */}
      <div style={{
        position: "absolute", width: "100%", height: "100%",
        background: C.cyan, opacity: hackFlash, pointerEvents: "none",
      }} />

      {/* Light rain still present but lighter */}
      <RainSystem count={100} speed={8} opacity={0.12} wind={1} seed="rain2" />

      {/* Glitch effect */}
      <GlitchOverlay intensity={neonPower * 0.5} seed="g2" />

      {/* Text — beat-synced */}
      <KineticText
        text="ONE LINE OF CODE"
        delay={BEAT * 1}
        duration={BEAT * 10}
        size={64}
        weight={900}
        y={20}
        glowColor={C.cyan}
        wordByWord
        mono
      />
      <KineticText
        text="changed everything."
        delay={BEAT * 6}
        duration={BEAT * 8}
        size={38}
        weight={300}
        y={28}
        color={C.textDim}
      />
      <KineticText
        text="ACCESS: GRANTED"
        delay={BEAT * 12}
        duration={BEAT * 8}
        size={56}
        weight={800}
        y={75}
        glowColor={C.neonGreen}
        glitchy
        mono
      />
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// SCENE 3: THE CLIMB — City rises, data everywhere (720–1080, 24–36s)
// Emotional: Acceleration. Hunger. The world bending to will.
// Camera: Dramatic upward crane shot, buildings grow, then orbits character
// ═══════════════════════════════════════════════════════════════════════════════
const Scene03: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Camera: crane up + orbit
  const camZoom = interpolate(frame, [0, 180, 360], [1.3, 1.0, 1.5], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE.dramatic,
  });
  const camPanY = interpolate(frame, [0, 360], [100, -200], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE.dramatic,
  });
  const camRotY = interpolate(frame, [0, 360], [-5, 12], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE.dramatic,
  });
  const camRotZ = breathe(frame, 80, 1.5);
  const camRotX = interpolate(frame, [0, 360], [8, -3], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  // City grows — buildings get taller over time
  const growthProgress = interpolate(frame, [0, 300], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE.dramatic,
  });

  // Neon intensity increases
  const neonIntensity = interpolate(frame, [0, 200], [0.3, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  // Data streams multiply
  const dataIntensity = interpolate(frame, [0, 150], [0.3, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  // Rising particles — wealth/energy streaming upward
  const particleRise = interpolate(frame, [60, 180], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  // Counter for accumulating wealth
  const wealthCount = Math.floor(interpolate(frame, [90, 300], [0, 9999999], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE.dramatic,
  }));

  return (
    <AbsoluteFill style={{ background: C.void }}>
      <Camera
        zoom={camZoom}
        panY={camPanY}
        rotateY={camRotY}
        rotateX={camRotX}
        rotateZ={camRotZ}
        perspective={900}
      >
        {/* Sky glow — city light pollution */}
        <div style={{
          position: "absolute", left: 0, top: 0, width: "100%", height: "60%",
          background: `radial-gradient(ellipse at 50% 100%, ${C.deepPurple}44 0%, transparent 70%)`,
        }} />

        {/* Far city — grows */}
        <CityLayer
          yBase={900 + (1 - growthProgress) * 200}
          buildingCount={25}
          minH={80 + growthProgress * 100}
          maxH={300 + growthProgress * 400}
          color="#0d0820"
          seed="city3-far"
          windowColor={C.cyan + Math.round(neonIntensity * 50).toString(16).padStart(2, "0")}
          neonAccent={C.cyan}
          parallaxSpeed={0.15}
          glowIntensity={neonIntensity * 0.5}
        />

        {/* Mid city — grows faster */}
        <CityLayer
          yBase={1100 + (1 - growthProgress) * 150}
          buildingCount={18}
          minH={120 + growthProgress * 200}
          maxH={450 + growthProgress * 500}
          color="#150a2e"
          seed="city3-mid"
          windowColor={C.magenta + Math.round(neonIntensity * 60).toString(16).padStart(2, "0")}
          neonAccent={C.magenta}
          parallaxSpeed={0.35}
          glowIntensity={neonIntensity * 0.7}
        />

        {/* Near city — grows most */}
        <CityLayer
          yBase={1350 + (1 - growthProgress) * 100}
          buildingCount={12}
          minH={200 + growthProgress * 300}
          maxH={600 + growthProgress * 600}
          color="#1e0f3d"
          seed="city3-near"
          windowColor={C.amber + Math.round(neonIntensity * 70).toString(16).padStart(2, "0")}
          neonAccent={C.amber}
          parallaxSpeed={0.6}
          glowIntensity={neonIntensity}
        />

        {/* Data streams — more of them, faster */}
        <div style={{ opacity: dataIntensity }}>
          {Array.from({ length: 12 }).map((_, i) => (
            <DataStream
              key={i}
              x={60 + i * 85}
              color={[C.cyan, C.neonGreen, C.magenta, C.amber][i % 4]}
              speed={3 + i * 0.3}
              density={12}
              opacity={0.25}
              seed={`ds3-${i}`}
            />
          ))}
        </div>

        {/* Character — walking, then powerful */}
        <CharacterSilhouette
          pose={frame < 180 ? "walking" : "powerful"}
          x={540}
          y={1300}
          scale={3.5}
          color="#080212"
          glowColor={lerpColor(C.cyan, C.gold, growthProgress)}
          glowIntensity={0.5 + growthProgress * 0.5}
        />

        {/* Rising energy particles */}
        {particleRise > 0 && (
          <div style={{ opacity: particleRise }}>
            <Particles
              count={80}
              color={C.gold}
              minSize={1}
              maxSize={4}
              speed={2}
              spread={0.5}
              opacity={0.5}
              glow
              drift="rise"
              centerX={540}
              centerY={1300}
              seed="rise3"
            />
            <Particles
              count={50}
              color={C.cyan}
              minSize={1}
              maxSize={3}
              speed={1.5}
              spread={0.4}
              opacity={0.4}
              glow
              drift="rise"
              centerX={540}
              centerY={1300}
              seed="rise3b"
            />
          </div>
        )}
      </Camera>

      {/* Wealth counter HUD */}
      <HoloPanel x={width / 2 - 160} y={height * 0.82} w={320} h={80} color={C.gold} delay={90}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          height: "100%", fontFamily: "'Courier New', monospace",
        }}>
          <div style={{ fontSize: 14, color: C.gold, opacity: 0.6, marginRight: 12 }}>NET WORTH</div>
          <div style={{
            fontSize: 32, fontWeight: 900, color: C.gold,
            textShadow: `0 0 20px ${C.gold}88`,
          }}>
            ¥{wealthCount.toLocaleString()}
          </div>
        </div>
      </HoloPanel>

      {/* Glitch overlay — intensifying */}
      <GlitchOverlay intensity={0.7 + growthProgress * 0.3} seed="g3" />

      {/* Text */}
      <KineticText
        text="THE CITY BOWS"
        delay={10}
        duration={130}
        size={70}
        weight={900}
        y={15}
        glowColor={C.cyan}
        wordByWord
      />
      <KineticText
        text="Every node. Every system."
        delay={70}
        duration={100}
        size={30}
        weight={300}
        y={23}
        color={C.textDim}
      />
      <KineticText
        text="NOTHING IS OUT OF REACH"
        delay={220}
        duration={120}
        size={52}
        weight={800}
        y={55}
        glowColor={C.gold}
        glitchy
      />
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// SCENE 4: THE THRONE — Holographic empire (1080–1440, 36–48s)
// Emotional: Triumph. Power. Opulence. Maximum visual spectacle.
// Camera: Wide orbital establishing shot, then dramatic pull to character
// ═══════════════════════════════════════════════════════════════════════════════
const Scene04: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Camera: slow majestic orbit then push
  const camZoom = interpolate(frame, [0, 180, 360], [0.9, 1.1, 1.6], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE.dramatic,
  });
  const camRotY = interpolate(frame, [0, 360], [-15, 15], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE.dramatic,
  });
  const camRotX = interpolate(frame, [0, 180, 360], [5, -2, 8], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const camPanY = interpolate(frame, [0, 360], [0, -80], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE.dramatic,
  });

  // Gold-purple color shift
  const opulence = interpolate(frame, [0, 200], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE.dramatic,
  });

  // Holographic panels multiply
  const panelWave = interpolate(frame, [0, 120], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  // Particle intensity peaks
  const particlePeak = 0.8 + breathe(frame, 30, 0.2);

  return (
    <AbsoluteFill style={{
      background: `radial-gradient(ellipse at 50% 70%, ${C.deepPurple}66 0%, ${C.void} 70%)`,
    }}>
      <Camera
        zoom={camZoom}
        rotateY={camRotY}
        rotateX={camRotX}
        panY={camPanY}
        perspective={800}
      >
        {/* Massive city backdrop — fully lit */}
        <CityLayer
          yBase={800}
          buildingCount={30}
          minH={150}
          maxH={800}
          color="#0d0820"
          seed="city4-far"
          windowColor={C.gold + "40"}
          neonAccent={C.gold}
          parallaxSpeed={0.1}
          glowIntensity={1}
        />
        <CityLayer
          yBase={1050}
          buildingCount={20}
          minH={200}
          maxH={900}
          color="#150a2e"
          seed="city4-mid"
          windowColor={C.amber + "50"}
          neonAccent={C.magenta}
          parallaxSpeed={0.3}
          glowIntensity={1}
        />
        <CityLayer
          yBase={1300}
          buildingCount={14}
          minH={300}
          maxH={1000}
          color="#1e0f3d"
          seed="city4-near"
          windowColor={C.gold + "60"}
          neonAccent={C.cyan}
          parallaxSpeed={0.5}
          glowIntensity={1}
        />

        {/* Character on throne — powerful pose */}
        <CharacterSilhouette
          pose="throne"
          x={540}
          y={1200}
          scale={4}
          color="#050010"
          glowColor={C.gold}
          glowIntensity={0.8 + opulence * 0.2}
        />

        {/* Orbital ring around character */}
        {[0, 1, 2].map(i => {
          const ringAngle = frame * 0.8 + i * 120;
          const ringSize = 300 + i * 80;
          return (
            <div key={`orbit-${i}`} style={{
              position: "absolute",
              left: 540 - ringSize,
              top: 1100 - ringSize * 0.3,
              width: ringSize * 2,
              height: ringSize * 0.6,
              borderRadius: "50%",
              border: `1px solid ${[C.gold, C.cyan, C.magenta][i]}44`,
              transform: `rotateX(65deg) rotateZ(${ringAngle}deg)`,
              opacity: panelWave,
            }} />
          );
        })}

        {/* Rising gold particles */}
        <Particles
          count={120}
          color={C.gold}
          minSize={1}
          maxSize={5}
          speed={1.5}
          spread={0.8}
          opacity={0.5 * particlePeak}
          glow
          drift="rise"
          centerX={540}
          centerY={1200}
          seed="gold4"
        />
        <Particles
          count={60}
          color={C.cyan}
          minSize={1}
          maxSize={3}
          speed={1}
          spread={0.6}
          opacity={0.3}
          glow
          drift="swirl"
          centerX={540}
          centerY={1000}
          seed="swirl4"
        />
      </Camera>

      {/* Floating holographic panels — empire dashboard */}
      {panelWave > 0 && (
        <>
          <HoloPanel x={30} y={300} w={280} h={200} color={C.gold} delay={20} rotateY={20} rotateX={-5}>
            <div style={{ padding: 16, fontFamily: "'Courier New', monospace", fontSize: 11, color: C.gold }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>EMPIRE STATUS</div>
              <div>NODES CONTROLLED: 12,847</div>
              <div>NETWORK UPTIME: 99.97%</div>
              <div>INFLUENCE: ██████████ 98%</div>
              <div style={{ marginTop: 8, color: C.neonGreen }}>ALL SYSTEMS NOMINAL</div>
            </div>
          </HoloPanel>
          <HoloPanel x={770} y={350} w={250} h={180} color={C.cyan} delay={40} rotateY={-18} rotateX={3}>
            <div style={{ padding: 16, fontFamily: "'Courier New', monospace", fontSize: 11, color: C.cyan }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>ASSETS</div>
              <div>¥ 847,293,441</div>
              <div>BTC: 12,400</div>
              <div>REAL ESTATE: 47 UNITS</div>
              <div style={{ marginTop: 8, opacity: 0.5 }}>+2,847% YTD</div>
            </div>
          </HoloPanel>
          <HoloPanel x={50} y={680} w={200} h={130} color={C.magenta} delay={65} rotateY={12}>
            <div style={{ padding: 12, fontFamily: "'Courier New', monospace", fontSize: 10, color: C.magenta }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>LOYALTY INDEX</div>
              <div>INNER CIRCLE: 7</div>
              <div>OPERATIVES: 340</div>
              <div style={{ color: C.amber }}>TRUST: DECLINING ⚠</div>
            </div>
          </HoloPanel>
          <HoloPanel x={820} y={720} w={220} h={120} color={C.neonGreen} delay={85} rotateY={-15}>
            <div style={{ padding: 12, fontFamily: "'Courier New', monospace", fontSize: 10, color: C.neonGreen }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>THREATS</div>
              <div>ACTIVE: 3</div>
              <div>NEUTRALIZED: 41</div>
              <div style={{ color: C.hotPink }}>INCOMING: ████</div>
            </div>
          </HoloPanel>
        </>
      )}

      {/* Data streams — golden */}
      {[80, 200, 350, 700, 900, 1000].map((xPos, i) => (
        <DataStream
          key={i}
          x={xPos}
          color={i % 2 === 0 ? C.gold : C.amber}
          speed={1.5}
          density={10}
          opacity={0.15}
          seed={`ds4-${i}`}
        />
      ))}

      {/* Glitch — power artifacts */}
      <GlitchOverlay intensity={0.3} seed="g4" />

      {/* Text */}
      <KineticText
        text="THEY BUILT WALLS"
        delay={15}
        duration={130}
        size={60}
        weight={900}
        y={10}
        glowColor={C.gold}
        wordByWord
      />
      <KineticText
        text="I BUILT AN EMPIRE"
        delay={80}
        duration={130}
        size={72}
        weight={900}
        y={18}
        glowColor={C.magenta}
        wordByWord
      />
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// SCENE 5: THE COST — What was gained, what was lost (1440–1800, 48–60s)
// Emotional: Reflection. Melancholy. Power's price. Quiet after the storm.
// Camera: Slow pull-back, desaturating, returning to a lone figure
// ═══════════════════════════════════════════════════════════════════════════════
const Scene05: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Camera: slow, mournful pull-back
  const camZoom = interpolate(frame, [0, 360], [1.5, 0.9], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE.dramatic,
  });
  const camRotY = interpolate(frame, [0, 360], [8, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE.dramatic,
  });
  const camPanY = interpolate(frame, [0, 360], [-50, 20], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE.dramatic,
  });

  // Color desaturation — from gold back toward cold
  const desatProgress = interpolate(frame, [0, 240], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE.dramatic,
  });

  // Holograms glitching out and disappearing
  const holoDecay = interpolate(frame, [60, 180], [1, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE.exit,
  });

  // City dims
  const cityDim = interpolate(frame, [0, 300], [1, 0.25], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE.dramatic,
  });

  // Single light reappears — callback to Scene 1
  const singleLight = interpolate(frame, [200, 280], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE.dramatic,
  });

  // Rain returns
  const rainReturn = interpolate(frame, [120, 200], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  // Final fade
  const finalFade = interpolate(frame, [320, 360], [1, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE.exit,
  });

  return (
    <AbsoluteFill style={{
      background: lerpColor(C.deepPurple, C.void, desatProgress * 0.7),
      opacity: finalFade,
    }}>
      <Camera
        zoom={camZoom}
        rotateY={camRotY}
        panY={camPanY}
        perspective={1200}
      >
        {/* City — dimming */}
        <div style={{ opacity: cityDim }}>
          <CityLayer
            yBase={900}
            buildingCount={25}
            minH={150}
            maxH={700}
            color="#0d0820"
            seed="city5-far"
            windowColor={lerpColor(C.gold + "40", "#ffffff08", desatProgress)}
            neonAccent={lerpColor(C.gold, C.rain, desatProgress)}
            parallaxSpeed={0.1}
            glowIntensity={1 - desatProgress * 0.8}
          />
          <CityLayer
            yBase={1200}
            buildingCount={15}
            minH={200}
            maxH={800}
            color="#150a2e"
            seed="city5-near"
            windowColor={lerpColor(C.amber + "50", "#ffffff10", desatProgress)}
            neonAccent={lerpColor(C.magenta, C.rain, desatProgress)}
            parallaxSpeed={0.3}
            glowIntensity={1 - desatProgress * 0.7}
          />
        </div>

        {/* Character — back to lone figure, but different pose */}
        <CharacterSilhouette
          pose="powerful"
          x={540}
          y={1350}
          scale={3}
          color="#050010"
          glowColor={lerpColor(C.gold, C.rain, desatProgress)}
          glowIntensity={0.4}
        />

        {/* Single warm light — like Scene 1's core light */}
        {singleLight > 0 && (
          <div style={{
            position: "absolute",
            left: 540 - 80,
            top: 1200 - 80,
            width: 160,
            height: 160,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${C.amber}44 0%, transparent 70%)`,
            opacity: singleLight * 0.6,
            transform: `scale(${1 + breathe(frame, 40, 0.1)})`,
          }} />
        )}
      </Camera>

      {/* Decaying holo panels — glitching */}
      {holoDecay > 0 && (
        <>
          <HoloPanel x={100} y={400} w={200} h={120} color={C.cyan} delay={0}>
            <div style={{
              padding: 10, fontFamily: "'Courier New', monospace",
              fontSize: 10, color: C.cyan,
              opacity: holoDecay * (random(`hd-${Math.floor(frame / 4)}`) > 0.3 ? 1 : 0.1),
            }}>
              <div>CONNECTION LOST</div>
              <div>NODE_0x7F: OFFLINE</div>
              <div style={{ color: C.hotPink }}>ERROR: TIMEOUT</div>
            </div>
          </HoloPanel>
          <HoloPanel x={750} y={500} w={180} h={100} color={C.magenta} delay={0}>
            <div style={{
              padding: 10, fontFamily: "'Courier New', monospace",
              fontSize: 10, color: C.magenta,
              opacity: holoDecay * (random(`hd2-${Math.floor(frame / 5)}`) > 0.4 ? 1 : 0.1),
            }}>
              <div>LOYALTY: 0</div>
              <div style={{ color: C.hotPink }}>ALL ALLIES GONE</div>
            </div>
          </HoloPanel>
        </>
      )}

      {/* Rain returns */}
      {rainReturn > 0 && (
        <div style={{ opacity: rainReturn * 0.3 }}>
          <RainSystem count={150} speed={7} opacity={0.2} wind={1} seed="rain5" />
        </div>
      )}

      {/* Sparse particles — embers dying */}
      <Particles
        count={30}
        color={C.amber}
        minSize={1}
        maxSize={3}
        speed={0.5}
        spread={0.8}
        opacity={0.2 * (1 - desatProgress * 0.5)}
        glow
        drift="rise"
        seed="embers5"
      />

      {/* Text */}
      <KineticText
        text="YOU CAN HAVE EVERYTHING"
        delay={20}
        duration={140}
        size={52}
        weight={800}
        y={18}
        color={lerpColor(C.gold, C.textDim, desatProgress)}
        glowColor={C.gold}
      />
      <KineticText
        text="and still have nothing."
        delay={100}
        duration={140}
        size={36}
        weight={300}
        y={27}
        color={C.textDim}
      />
      <KineticText
        text="THE ASCENT NEVER ENDS."
        delay={250}
        duration={100}
        size={44}
        weight={700}
        y={80}
        glowColor={C.cyan}
        glitchy
        mono
      />
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// ROOT COMPOSITION — Assembles all scenes with Sequences
// ═══════════════════════════════════════════════════════════════════════════════
export const CyberAscent: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: C.void }}>
      <Audio src={staticFile("cyber-ascent.mp3")} volume={0.75} />
      <Sequence from={0} durationInFrames={360} name="Act 1: The Gutter">
        <Scene01 />
      </Sequence>
      <Sequence from={360} durationInFrames={360} name="Act 2: The Spark">
        <Scene02 />
      </Sequence>
      <Sequence from={720} durationInFrames={360} name="Act 3: The Climb">
        <Scene03 />
      </Sequence>
      <Sequence from={1080} durationInFrames={360} name="Act 4: The Throne">
        <Scene04 />
      </Sequence>
      <Sequence from={1440} durationInFrames={360} name="Act 5: The Cost">
        <Scene05 />
      </Sequence>
    </AbsoluteFill>
  );
};
