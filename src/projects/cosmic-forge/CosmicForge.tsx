/**
 * COSMIC FORGE — "The Birth of a Star"
 * Kurzgesagt-inspired · Maximum animation density · Camera motion · Particle systems
 * 1080×1920 (9:16) · 30fps · 40s = 1200 frames
 *
 * Pushes Remotion to the edge: 200+ particles, 3D perspective camera,
 * parallax layers, SVG characters, procedural explosions, color morphing.
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
// MOTION TOKENS — aggressive, fast-paced
// ═══════════════════════════════════════════════════════════════════════════════
const DUR = { micro: 2, fast: 5, med: 10, slow: 20, dramatic: 40, epic: 60 };
const SP = { stiffness: 300, damping: 22, mass: 0.8 };
const SP_BOUNCE = { stiffness: 200, damping: 10, mass: 1 };
const SP_SNAP = { stiffness: 500, damping: 30, mass: 0.6 };
const SP_HEAVY = { stiffness: 100, damping: 16, mass: 2 };
const SP_GENTLE = { stiffness: 80, damping: 14, mass: 1.2 };
const EASE = {
  in: Easing.bezier(0.7, 0, 1, 1),
  out: Easing.bezier(0, 0, 0.2, 1),
  dramatic: Easing.bezier(0.4, 0, 0, 1),
  elastic: Easing.bezier(0.34, 1.56, 0.64, 1),
  snap: Easing.bezier(0.9, 0, 0.1, 1),
};

// ═══════════════════════════════════════════════════════════════════════════════
// COLOR SYSTEM — cosmic progression: deep blue → purple → orange → white-hot
// ═══════════════════════════════════════════════════════════════════════════════
const C = {
  void: "#020010",
  deepBlue: "#0a0a2e",
  nebulaPurple: "#2d1b69",
  nebulaPink: "#e74c8b",
  nebulaBlue: "#4a90d9",
  cosmicTeal: "#00d4aa",
  warmOrange: "#ff6b35",
  solarYellow: "#ffd700",
  hotWhite: "#fff8e7",
  plasma: "#ff4444",
  fusionBlue: "#00aaff",
  starCore: "#ffffff",
  textPrimary: "rgba(255,255,255,0.95)",
  textSecondary: "rgba(255,255,255,0.55)",
};

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerpColor = (hex1: string, hex2: string, t: number) => {
  const parse = (h: string) => [
    parseInt(h.slice(1, 3), 16),
    parseInt(h.slice(3, 5), 16),
    parseInt(h.slice(5, 7), 16),
  ];
  const [r1, g1, b1] = parse(hex1);
  const [r2, g2, b2] = parse(hex2);
  const r = Math.round(lerp(r1, r2, t));
  const g = Math.round(lerp(g1, g2, t));
  const b = Math.round(lerp(b1, b2, t));
  return `rgb(${r},${g},${b})`;
};
const breathe = (f: number, period: number, amp: number) =>
  Math.sin((f / period) * Math.PI * 2) * amp;
const noise = (f: number, seed: string, speed = 0.03) =>
  Math.sin(f * speed + random(seed) * 100) * 0.5 + 0.5;

// ═══════════════════════════════════════════════════════════════════════════════
// PARTICLE SYSTEM — reusable across scenes
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
  drift?: "up" | "down" | "radial" | "swirl";
  centerX?: number;
  centerY?: number;
  seed?: string;
}> = ({
  count,
  color,
  minSize = 1,
  maxSize = 4,
  speed = 1,
  spread = 1,
  opacity = 0.6,
  glow = false,
  drift = "up",
  centerX = 540,
  centerY = 960,
  seed = "p",
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
        const particleSpeed = (0.5 + rsp) * speed;

        let x: number, y: number;

        if (drift === "radial") {
          const angle = rx * Math.PI * 2;
          const dist = ry * spread * 400 + frame * particleSpeed * 0.8;
          x = centerX + Math.cos(angle + frame * 0.008 * particleSpeed) * dist;
          y = centerY + Math.sin(angle + frame * 0.008 * particleSpeed) * dist;
        } else if (drift === "swirl") {
          const angle = rx * Math.PI * 2 + frame * 0.02 * particleSpeed;
          const dist = 50 + ry * spread * 350 + Math.sin(frame * 0.015 + i) * 30;
          x = centerX + Math.cos(angle) * dist;
          y = centerY + Math.sin(angle) * dist;
        } else if (drift === "down") {
          x = rx * width * spread + (1 - spread) * width * 0.5;
          y = ((ry * height + frame * particleSpeed * 2) % (height + 100)) - 50;
        } else {
          x = rx * width * spread + (1 - spread) * width * 0.5;
          y = ((ry * height - frame * particleSpeed * 2) % (height + 100) + height + 100) % (height + 100) - 50;
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
              boxShadow: glow
                ? `0 0 ${size * 3}px ${color}, 0 0 ${size * 6}px ${color}66`
                : undefined,
            }}
          />
        );
      })}
    </>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// EXPLOSION BURST — radial particle burst
// ═══════════════════════════════════════════════════════════════════════════════
const Explosion: React.FC<{
  delay: number;
  x: number;
  y: number;
  count?: number;
  color?: string;
  maxRadius?: number;
  duration?: number;
}> = ({ delay, x, y, count = 40, color = C.solarYellow, maxRadius = 300, duration = 30 }) => {
  const frame = useCurrentFrame();
  const f = Math.max(0, frame - delay);
  if (f <= 0 || f > duration + 10) return null;

  const progress = interpolate(f, [0, duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE.out,
  });
  const fadeOut = interpolate(f, [duration * 0.5, duration], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <>
      {/* Central flash */}
      <div
        style={{
          position: "absolute",
          left: x - 60,
          top: y - 60,
          width: 120,
          height: 120,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${C.starCore} 0%, ${color}88 40%, transparent 70%)`,
          opacity: fadeOut * 0.9,
          transform: `scale(${1 + progress * 3})`,
          boxShadow: `0 0 80px ${color}, 0 0 160px ${color}88`,
        }}
      />
      {/* Burst particles */}
      {Array.from({ length: count }).map((_, i) => {
        const angle = (i / count) * Math.PI * 2 + random(`exp-a-${i}`) * 0.3;
        const dist = progress * maxRadius * (0.5 + random(`exp-d-${i}`) * 0.5);
        const size = 2 + random(`exp-s-${i}`) * 5;
        const px = x + Math.cos(angle) * dist;
        const py = y + Math.sin(angle) * dist;

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: px - size / 2,
              top: py - size / 2,
              width: size,
              height: size,
              borderRadius: "50%",
              background: i % 3 === 0 ? C.starCore : color,
              opacity: fadeOut * (0.5 + random(`exp-o-${i}`) * 0.5),
              boxShadow: `0 0 ${size * 2}px ${color}`,
            }}
          />
        );
      })}
    </>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// CUTE ATOM CHARACTER — Kurzgesagt-style with face
// ═══════════════════════════════════════════════════════════════════════════════
const AtomCharacter: React.FC<{
  x: number;
  y: number;
  size?: number;
  color: string;
  glowColor?: string;
  eyeStyle?: "happy" | "determined" | "surprised" | "sleepy";
  delay?: number;
  wobble?: boolean;
  orbitSpeed?: number;
}> = ({
  x,
  y,
  size = 50,
  color,
  glowColor,
  eyeStyle = "happy",
  delay = 0,
  wobble = true,
  orbitSpeed = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const appear = spring({
    frame: Math.max(0, frame - delay),
    fps,
    config: SP_BOUNCE,
  });

  const wobbleX = wobble ? breathe(frame + delay * 3, 25, 4) : 0;
  const wobbleY = wobble ? breathe(frame + delay * 7, 30, 3) : 0;
  const squish = wobble ? 1 + breathe(frame, 20, 0.04) : 1;

  // Orbit around a point
  const ox = orbitSpeed
    ? Math.cos((frame + delay * 10) * orbitSpeed) * 60
    : 0;
  const oy = orbitSpeed
    ? Math.sin((frame + delay * 10) * orbitSpeed) * 40
    : 0;

  const finalX = x + wobbleX + ox;
  const finalY = y + wobbleY + oy;

  const glow = glowColor || color;

  // Eye rendering
  const eyeSize = size * 0.14;
  const eyeSpacing = size * 0.18;
  const eyeY = -size * 0.05;

  let leftEye: React.ReactNode;
  let rightEye: React.ReactNode;

  if (eyeStyle === "happy") {
    // Curved happy eyes (like Kurzgesagt)
    leftEye = (
      <div style={{
        width: eyeSize * 1.5, height: eyeSize * 0.8,
        borderBottom: `${eyeSize * 0.4}px solid #fff`,
        borderRadius: "0 0 50% 50%",
        position: "absolute",
        left: `calc(50% - ${eyeSpacing + eyeSize * 0.75}px)`,
        top: `calc(50% + ${eyeY}px)`,
      }} />
    );
    rightEye = (
      <div style={{
        width: eyeSize * 1.5, height: eyeSize * 0.8,
        borderBottom: `${eyeSize * 0.4}px solid #fff`,
        borderRadius: "0 0 50% 50%",
        position: "absolute",
        left: `calc(50% + ${eyeSpacing - eyeSize * 0.75}px)`,
        top: `calc(50% + ${eyeY}px)`,
      }} />
    );
  } else if (eyeStyle === "determined") {
    leftEye = (
      <div style={{
        width: eyeSize, height: eyeSize,
        background: "#fff", borderRadius: "50%",
        position: "absolute",
        left: `calc(50% - ${eyeSpacing + eyeSize / 2}px)`,
        top: `calc(50% + ${eyeY}px)`,
      }} />
    );
    rightEye = (
      <div style={{
        width: eyeSize, height: eyeSize,
        background: "#fff", borderRadius: "50%",
        position: "absolute",
        left: `calc(50% + ${eyeSpacing - eyeSize / 2}px)`,
        top: `calc(50% + ${eyeY}px)`,
      }} />
    );
  } else if (eyeStyle === "surprised") {
    const bigEye = eyeSize * 1.4;
    leftEye = (
      <div style={{
        width: bigEye, height: bigEye,
        background: "#fff", borderRadius: "50%",
        position: "absolute",
        left: `calc(50% - ${eyeSpacing + bigEye / 2}px)`,
        top: `calc(50% + ${eyeY - 2}px)`,
        boxShadow: "inset 0 0 0 2px rgba(0,0,0,0.15)",
      }}>
        <div style={{
          width: bigEye * 0.45, height: bigEye * 0.45,
          background: "#222", borderRadius: "50%",
          position: "absolute", left: "30%", top: "25%",
        }} />
      </div>
    );
    rightEye = (
      <div style={{
        width: bigEye, height: bigEye,
        background: "#fff", borderRadius: "50%",
        position: "absolute",
        left: `calc(50% + ${eyeSpacing - bigEye / 2}px)`,
        top: `calc(50% + ${eyeY - 2}px)`,
        boxShadow: "inset 0 0 0 2px rgba(0,0,0,0.15)",
      }}>
        <div style={{
          width: bigEye * 0.45, height: bigEye * 0.45,
          background: "#222", borderRadius: "50%",
          position: "absolute", left: "30%", top: "25%",
        }} />
      </div>
    );
  } else {
    // sleepy — half-closed
    leftEye = (
      <div style={{
        width: eyeSize * 1.3, height: eyeSize * 0.4,
        background: "#fff", borderRadius: "50%",
        position: "absolute",
        left: `calc(50% - ${eyeSpacing + eyeSize * 0.65}px)`,
        top: `calc(50% + ${eyeY + 2}px)`,
      }} />
    );
    rightEye = (
      <div style={{
        width: eyeSize * 1.3, height: eyeSize * 0.4,
        background: "#fff", borderRadius: "50%",
        position: "absolute",
        left: `calc(50% + ${eyeSpacing - eyeSize * 0.65}px)`,
        top: `calc(50% + ${eyeY + 2}px)`,
      }} />
    );
  }

  return (
    <div
      style={{
        position: "absolute",
        left: finalX - size / 2,
        top: finalY - size / 2,
        width: size,
        height: size,
        opacity: appear,
        transform: `scale(${appear * squish})`,
      }}
    >
      {/* Glow halo */}
      <div
        style={{
          position: "absolute",
          left: -size * 0.4,
          top: -size * 0.4,
          width: size * 1.8,
          height: size * 1.8,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${glow}44 0%, transparent 70%)`,
        }}
      />
      {/* Body */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: size,
          height: size,
          borderRadius: "50%",
          background: `radial-gradient(circle at 35% 35%, ${lerpColor(color, "#ffffff", 0.3)}, ${color} 60%, ${lerpColor(color, "#000000", 0.3)})`,
          boxShadow: `0 0 ${size * 0.5}px ${glow}66, inset 0 ${-size * 0.15}px ${size * 0.3}px rgba(0,0,0,0.25)`,
        }}
      />
      {/* Eyes */}
      {leftEye}
      {rightEye}
      {/* Electron orbit rings (optional) */}
      <div
        style={{
          position: "absolute",
          left: -size * 0.3,
          top: size * 0.2,
          width: size * 1.6,
          height: size * 0.6,
          borderRadius: "50%",
          border: `1px solid ${glow}44`,
          transform: `rotate(${frame * 2 + delay * 30}deg)`,
        }}
      />
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// CAMERA WRAPPER — 3D perspective transform for camera motion
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
}> = ({
  children,
  zoom = 1,
  panX = 0,
  panY = 0,
  rotateX = 0,
  rotateY = 0,
  rotateZ = 0,
  perspective = 1200,
}) => (
  <div
    style={{
      position: "absolute",
      width: "100%",
      height: "100%",
      perspective,
      perspectiveOrigin: "50% 50%",
    }}
  >
    <div
      style={{
        position: "absolute",
        width: "100%",
        height: "100%",
        transformStyle: "preserve-3d",
        transform: `translateX(${panX}px) translateY(${panY}px) scale(${zoom}) rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg)`,
        transformOrigin: "50% 50%",
      }}
    >
      {children}
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// NEBULA BACKGROUND — animated gradient with parallax layers
// ═══════════════════════════════════════════════════════════════════════════════
const NebulaBackground: React.FC<{
  color1?: string;
  color2?: string;
  color3?: string;
  intensity?: number;
}> = ({
  color1 = C.nebulaPurple,
  color2 = C.nebulaBlue,
  color3 = C.nebulaPink,
  intensity = 0.4,
}) => {
  const frame = useCurrentFrame();

  const shift1 = breathe(frame, 90, 100);
  const shift2 = breathe(frame + 30, 120, 150);
  const shift3 = breathe(frame + 60, 80, 80);

  return (
    <>
      <div
        style={{
          position: "absolute",
          left: 200 + shift1,
          top: 300 + shift2 * 0.5,
          width: 800,
          height: 800,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${color1}${Math.round(intensity * 99).toString(16).padStart(2, "0")} 0%, transparent 70%)`,
          filter: "blur(80px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: -100 + shift2,
          top: 800 + shift3,
          width: 900,
          height: 900,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${color2}${Math.round(intensity * 80).toString(16).padStart(2, "0")} 0%, transparent 70%)`,
          filter: "blur(100px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 400 + shift3,
          top: 1200 + shift1 * 0.3,
          width: 700,
          height: 700,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${color3}${Math.round(intensity * 60).toString(16).padStart(2, "0")} 0%, transparent 70%)`,
          filter: "blur(90px)",
        }}
      />
    </>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// RING BURST — expanding concentric rings
// ═══════════════════════════════════════════════════════════════════════════════
const RingBurst: React.FC<{
  x: number;
  y: number;
  delay: number;
  count?: number;
  color?: string;
  maxSize?: number;
}> = ({ x, y, delay, count = 5, color = C.solarYellow, maxSize = 500 }) => {
  const frame = useCurrentFrame();

  return (
    <>
      {Array.from({ length: count }).map((_, i) => {
        const ringDelay = delay + i * 4;
        const f = Math.max(0, frame - ringDelay);
        const expand = interpolate(f, [0, 25], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: EASE.out,
        });
        const fade = interpolate(f, [5, 25], [0.8, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const size = expand * maxSize * (0.5 + i * 0.15);

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
              border: `${2 - i * 0.3}px solid ${color}`,
              opacity: fade,
              boxShadow: `0 0 20px ${color}44`,
            }}
          />
        );
      })}
    </>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// KINETIC TEXT — aggressive animated text
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
}> = ({
  text,
  delay,
  duration,
  size = 72,
  color = C.textPrimary,
  y = 50,
  weight = 700,
  wordByWord = false,
  glowColor,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (!wordByWord) {
    const s = spring({
      frame: Math.max(0, frame - delay),
      fps,
      config: SP,
    });
    const exitProgress = interpolate(
      frame,
      [delay + duration - DUR.med, delay + duration],
      [1, 0],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE.in }
    );
    const scale = 0.6 + s * 0.4;

    return (
      <div
        style={{
          position: "absolute",
          left: 60,
          right: 60,
          top: `${y}%`,
          transform: `translateY(-50%) scale(${scale})`,
          opacity: Math.min(s, exitProgress),
          fontSize: size,
          fontWeight: weight,
          fontFamily: "'SF Pro Display', 'Helvetica Neue', sans-serif",
          color,
          textAlign: "center",
          letterSpacing: size > 60 ? -2 : -0.5,
          textShadow: glowColor
            ? `0 0 40px ${glowColor}, 0 0 80px ${glowColor}66`
            : undefined,
        }}
      >
        {text}
      </div>
    );
  }

  // Word by word stagger
  const words = text.split(" ");
  return (
    <div
      style={{
        position: "absolute",
        left: 60,
        right: 60,
        top: `${y}%`,
        transform: "translateY(-50%)",
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: size * 0.3,
      }}
    >
      {words.map((word, i) => {
        const wordDelay = delay + i * 3;
        const s = spring({
          frame: Math.max(0, frame - wordDelay),
          fps,
          config: SP_SNAP,
        });
        const exitProgress = interpolate(
          frame,
          [delay + duration - DUR.med, delay + duration],
          [1, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );

        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              fontSize: size,
              fontWeight: weight,
              fontFamily: "'SF Pro Display', 'Helvetica Neue', sans-serif",
              color,
              opacity: Math.min(s, exitProgress),
              transform: `translateY(${(1 - s) * 40}px) scale(${0.7 + s * 0.3})`,
              letterSpacing: size > 60 ? -2 : -0.5,
              textShadow: glowColor
                ? `0 0 30px ${glowColor}`
                : undefined,
            }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// SCENE 1: COSMIC VOID — Stars ignite, camera drifts (0–180 frames, 0–6s)
// ═══════════════════════════════════════════════════════════════════════════════
const Scene01: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Camera: slow zoom in + slight rotation
  const camZoom = interpolate(frame, [0, 180], [0.8, 1.15], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE.dramatic,
  });
  const camRotZ = interpolate(frame, [0, 180], [-2, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE.dramatic,
  });
  const camPanY = interpolate(frame, [0, 180], [50, -30], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Stars fade in waves
  const starsOpacity1 = interpolate(frame, [0, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const starsOpacity2 = interpolate(frame, [15, 45], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Big nebula pulse
  const nebulaIntensity = interpolate(frame, [20, 100], [0, 0.5], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE.dramatic,
  });

  return (
    <AbsoluteFill style={{ background: C.void }}>
      <Camera zoom={camZoom} rotateZ={camRotZ} panY={camPanY}>
        {/* Star field layer 1 — distant, small */}
        <div style={{ opacity: starsOpacity1 }}>
          <Particles
            count={120}
            color="#ffffff"
            minSize={0.5}
            maxSize={2}
            speed={0.1}
            spread={1.2}
            opacity={0.7}
            seed="s1"
            drift="up"
          />
        </div>

        {/* Star field layer 2 — closer, brighter */}
        <div style={{ opacity: starsOpacity2 }}>
          <Particles
            count={40}
            color={C.nebulaBlue}
            minSize={1.5}
            maxSize={3.5}
            speed={0.2}
            spread={1.1}
            opacity={0.5}
            glow
            seed="s2"
            drift="up"
          />
        </div>

        {/* Nebula clouds */}
        <NebulaBackground intensity={nebulaIntensity} />

        {/* Shooting star streaks */}
        {[30, 65, 110].map((d, i) => {
          const streakF = Math.max(0, frame - d);
          const streakProgress = interpolate(streakF, [0, 12], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const streakFade = interpolate(streakF, [6, 15], [1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const sx = 200 + i * 300;
          const sy = 300 + i * 200;
          return (
            <div
              key={`streak-${i}`}
              style={{
                position: "absolute",
                left: sx + streakProgress * 200,
                top: sy + streakProgress * 100,
                width: 80 * streakProgress,
                height: 2,
                background: `linear-gradient(to right, transparent, ${C.hotWhite})`,
                opacity: streakFade,
                transform: `rotate(-30deg)`,
                borderRadius: 2,
                boxShadow: `0 0 10px ${C.hotWhite}`,
              }}
            />
          );
        })}
      </Camera>

      {/* Title text */}
      <KineticText
        text="IN THE BEGINNING"
        delay={10}
        duration={80}
        size={64}
        weight={800}
        y={45}
        wordByWord
        glowColor={C.nebulaBlue}
      />
      <KineticText
        text="there was dust."
        delay={50}
        duration={90}
        size={44}
        weight={300}
        y={55}
        color={C.textSecondary}
      />
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// SCENE 2: GAS CLOUD COLLAPSE — Swirling particles, atoms appear (180–360, 6–12s)
// ═══════════════════════════════════════════════════════════════════════════════
const Scene02: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Camera: dramatic zoom-in + tilt
  const camZoom = interpolate(frame, [0, 180], [1, 1.8], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE.dramatic,
  });
  const camRotX = interpolate(frame, [0, 180], [0, 8], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const camRotZ = interpolate(frame, [0, 180], [0, -5], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Gravity: particles spiral inward
  const collapseProgress = interpolate(frame, [30, 180], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE.dramatic,
  });

  return (
    <AbsoluteFill style={{ background: C.void }}>
      <Camera zoom={camZoom} rotateX={camRotX} rotateZ={camRotZ} perspective={1000}>
        {/* Background stars */}
        <Particles
          count={60}
          color="#ffffff"
          minSize={0.5}
          maxSize={2}
          speed={0.1}
          opacity={0.4}
          seed="bg2"
          drift="up"
        />

        {/* Nebula — intensifying */}
        <NebulaBackground
          color1={C.nebulaPurple}
          color2={C.warmOrange}
          color3={C.nebulaBlue}
          intensity={0.3 + collapseProgress * 0.3}
        />

        {/* Swirling dust/gas particles — collapsing inward */}
        <Particles
          count={100}
          color={C.nebulaPink}
          minSize={1}
          maxSize={4}
          speed={1.5}
          spread={1 - collapseProgress * 0.5}
          opacity={0.5}
          glow
          drift="swirl"
          centerX={540}
          centerY={850}
          seed="swirl1"
        />
        <Particles
          count={80}
          color={C.nebulaBlue}
          minSize={1}
          maxSize={3}
          speed={1.2}
          spread={1 - collapseProgress * 0.4}
          opacity={0.4}
          glow
          drift="swirl"
          centerX={540}
          centerY={850}
          seed="swirl2"
        />

        {/* Cute hydrogen atoms appearing */}
        <AtomCharacter
          x={540}
          y={850}
          size={45}
          color={C.nebulaBlue}
          glowColor={C.fusionBlue}
          eyeStyle="sleepy"
          delay={40}
          orbitSpeed={0.03}
        />
        <AtomCharacter
          x={480}
          y={790}
          size={35}
          color={C.nebulaBlue}
          glowColor={C.fusionBlue}
          eyeStyle="sleepy"
          delay={55}
          orbitSpeed={0.025}
        />
        <AtomCharacter
          x={610}
          y={810}
          size={38}
          color={C.nebulaBlue}
          glowColor={C.fusionBlue}
          eyeStyle="sleepy"
          delay={70}
          orbitSpeed={0.028}
        />
        <AtomCharacter
          x={520}
          y={920}
          size={30}
          color={C.nebulaBlue}
          glowColor={C.fusionBlue}
          eyeStyle="sleepy"
          delay={85}
          orbitSpeed={0.02}
        />

        {/* Growing gravitational glow at center */}
        <div
          style={{
            position: "absolute",
            left: 540 - 150,
            top: 850 - 150,
            width: 300,
            height: 300,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${C.warmOrange}${Math.round(collapseProgress * 40).toString(16).padStart(2, "0")} 0%, transparent 70%)`,
            transform: `scale(${1 + collapseProgress * 0.5})`,
          }}
        />
      </Camera>

      {/* Text */}
      <KineticText
        text="GRAVITY PULLS"
        delay={5}
        duration={80}
        size={58}
        weight={800}
        y={25}
        wordByWord
        glowColor={C.nebulaPurple}
      />
      <KineticText
        text="Hydrogen atoms spiral inward"
        delay={45}
        duration={80}
        size={32}
        weight={300}
        y={32}
        color={C.textSecondary}
      />
      <KineticText
        text="10 million years of falling"
        delay={100}
        duration={70}
        size={36}
        weight={500}
        y={72}
        glowColor={C.warmOrange}
      />
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// SCENE 3: COMPRESSION & HEAT — Things get intense (360–540, 12–18s)
// ═══════════════════════════════════════════════════════════════════════════════
const Scene03: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Camera: shaking, zooming harder
  const camZoom = interpolate(frame, [0, 180], [1.5, 2.5], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE.dramatic,
  });
  const shake = frame > 60
    ? breathe(frame, 3, 3 + (frame - 60) * 0.03)
    : 0;
  const camRotZ = breathe(frame, 50, 3);

  // Heat: background color shifts from blue to orange
  const heatProgress = interpolate(frame, [0, 180], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE.dramatic,
  });
  const bgColor = lerpColor(C.deepBlue, "#1a0800", heatProgress);

  // Core grows and brightens
  const coreSize = 80 + heatProgress * 200;
  const coreGlow = heatProgress;

  // Pressure waves
  const pulseFreq = 25 - heatProgress * 15; // faster as it heats

  return (
    <AbsoluteFill style={{ background: bgColor }}>
      <Camera
        zoom={camZoom}
        panX={shake}
        panY={shake * 0.7}
        rotateZ={camRotZ}
        perspective={800}
      >
        {/* Background particles — now hot */}
        <Particles
          count={60}
          color={lerpColor(C.nebulaBlue, C.warmOrange, heatProgress)}
          minSize={1}
          maxSize={3}
          speed={2 + heatProgress * 3}
          spread={0.6 - heatProgress * 0.3}
          opacity={0.5}
          glow
          drift="swirl"
          centerX={540}
          centerY={960}
          seed="heat1"
        />

        {/* Hot plasma particles */}
        {heatProgress > 0.3 && (
          <Particles
            count={40}
            color={C.plasma}
            minSize={1}
            maxSize={5}
            speed={3}
            spread={0.4}
            opacity={heatProgress * 0.6}
            glow
            drift="radial"
            centerX={540}
            centerY={960}
            seed="plasma"
          />
        )}

        {/* Core — growing hot sphere */}
        <div
          style={{
            position: "absolute",
            left: 540 - coreSize,
            top: 960 - coreSize,
            width: coreSize * 2,
            height: coreSize * 2,
            borderRadius: "50%",
            background: `radial-gradient(circle at 40% 40%, ${C.hotWhite} 0%, ${C.solarYellow} 20%, ${C.warmOrange} 45%, ${C.plasma}88 70%, transparent 90%)`,
            opacity: 0.3 + coreGlow * 0.7,
            boxShadow: `0 0 ${coreSize}px ${C.warmOrange}88, 0 0 ${coreSize * 2}px ${C.warmOrange}44, 0 0 ${coreSize * 3}px ${C.plasma}22`,
          }}
        />

        {/* Pressure pulse rings */}
        {[0, 1, 2].map((i) => {
          const ringFrame = (frame + i * 10) % Math.max(10, Math.round(pulseFreq));
          const ringExpand = ringFrame / Math.max(10, Math.round(pulseFreq));
          const ringSize = coreSize + ringExpand * 200;
          return (
            <div
              key={`ring-${i}`}
              style={{
                position: "absolute",
                left: 540 - ringSize,
                top: 960 - ringSize,
                width: ringSize * 2,
                height: ringSize * 2,
                borderRadius: "50%",
                border: `1px solid ${C.warmOrange}`,
                opacity: (1 - ringExpand) * 0.3 * coreGlow,
              }}
            />
          );
        })}

        {/* Atoms — now awake and moving faster */}
        <AtomCharacter
          x={540}
          y={960}
          size={55}
          color={C.warmOrange}
          glowColor={C.solarYellow}
          eyeStyle="determined"
          delay={0}
          orbitSpeed={0.05}
        />
        <AtomCharacter
          x={480}
          y={910}
          size={40}
          color={C.warmOrange}
          glowColor={C.solarYellow}
          eyeStyle="determined"
          delay={10}
          orbitSpeed={0.06}
        />
        <AtomCharacter
          x={600}
          y={930}
          size={42}
          color={C.warmOrange}
          glowColor={C.solarYellow}
          eyeStyle="surprised"
          delay={20}
          orbitSpeed={0.055}
        />
      </Camera>

      {/* Text */}
      <KineticText
        text="15 MILLION °C"
        delay={10}
        duration={70}
        size={80}
        weight={900}
        y={18}
        glowColor={C.warmOrange}
      />
      <KineticText
        text="The core ignites."
        delay={60}
        duration={60}
        size={42}
        weight={400}
        y={27}
      />
      <KineticText
        text="Atoms collide."
        delay={100}
        duration={70}
        size={52}
        weight={700}
        y={78}
        wordByWord
        glowColor={C.plasma}
      />
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// SCENE 4: NUCLEAR FUSION — The moment of ignition (540–780, 18–26s)
// ═══════════════════════════════════════════════════════════════════════════════
const Scene04: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Camera: extreme zoom + dramatic pull-out after explosion
  const preExplosion = frame < 60;
  const camZoom = preExplosion
    ? interpolate(frame, [0, 60], [2.5, 3.5], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: EASE.in,
      })
    : interpolate(frame, [60, 120], [3.5, 0.9], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: EASE.out,
      });

  const camShake = frame > 55 && frame < 90
    ? breathe(frame, 2, 8 * (1 - (frame - 55) / 35))
    : 0;

  // Flash on fusion
  const flashOpacity = frame > 58
    ? interpolate(frame, [58, 62, 90], [0, 1, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 0;

  // Post-explosion: star is born
  const starBorn = frame > 65;
  const starGrow = starBorn
    ? spring({
        frame: frame - 65,
        fps,
        config: SP_HEAVY,
      })
    : 0;

  // Background transitions to warm
  const bgProgress = interpolate(frame, [55, 120], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const bgColor = lerpColor("#1a0800", "#0a0515", bgProgress);

  return (
    <AbsoluteFill style={{ background: bgColor }}>
      <Camera zoom={camZoom} panX={camShake} panY={camShake * 0.6} perspective={900}>
        {/* Background stars — reappearing after pull-out */}
        {starBorn && (
          <Particles
            count={80}
            color="#ffffff"
            minSize={0.5}
            maxSize={2}
            speed={0.1}
            opacity={starGrow * 0.5}
            seed="born-stars"
            drift="up"
          />
        )}

        {/* Pre-explosion: atoms rushing toward each other */}
        {preExplosion && (
          <>
            <AtomCharacter
              x={540 - 100 + interpolate(frame, [0, 55], [0, 90], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: EASE.in,
              })}
              y={960}
              size={50}
              color={C.warmOrange}
              glowColor={C.solarYellow}
              eyeStyle="determined"
              delay={0}
              wobble={false}
            />
            <AtomCharacter
              x={540 + 100 - interpolate(frame, [0, 55], [0, 90], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: EASE.in,
              })}
              y={960}
              size={50}
              color={C.warmOrange}
              glowColor={C.solarYellow}
              eyeStyle="determined"
              delay={0}
              wobble={false}
            />
          </>
        )}

        {/* EXPLOSION at frame 60 */}
        <Explosion
          delay={58}
          x={540}
          y={960}
          count={60}
          color={C.solarYellow}
          maxRadius={500}
          duration={40}
        />
        <RingBurst
          x={540}
          y={960}
          delay={60}
          count={7}
          color={C.solarYellow}
          maxSize={800}
        />

        {/* Newborn star — emerges from explosion */}
        {starBorn && (
          <>
            {/* Outer corona */}
            <div
              style={{
                position: "absolute",
                left: 540 - 300,
                top: 960 - 300,
                width: 600,
                height: 600,
                borderRadius: "50%",
                background: `radial-gradient(circle, ${C.solarYellow}22 0%, ${C.warmOrange}11 50%, transparent 70%)`,
                opacity: starGrow * 0.6,
                transform: `scale(${starGrow * 1.2})`,
              }}
            />
            {/* Star body */}
            <div
              style={{
                position: "absolute",
                left: 540 - 80,
                top: 960 - 80,
                width: 160,
                height: 160,
                borderRadius: "50%",
                background: `radial-gradient(circle at 40% 35%, ${C.starCore} 0%, ${C.hotWhite} 15%, ${C.solarYellow} 40%, ${C.warmOrange} 70%, ${C.plasma}44 90%)`,
                opacity: starGrow,
                transform: `scale(${starGrow})`,
                boxShadow: `0 0 60px ${C.solarYellow}, 0 0 120px ${C.warmOrange}88, 0 0 200px ${C.warmOrange}44`,
              }}
            />
            {/* Solar flares */}
            {[0, 1, 2, 3, 4, 5].map((i) => {
              const flareAngle = (i / 6) * Math.PI * 2 + frame * 0.015;
              const flareLen = 40 + breathe(frame + i * 20, 15, 20);
              const fx = 540 + Math.cos(flareAngle) * (80 + flareLen * 0.3);
              const fy = 960 + Math.sin(flareAngle) * (80 + flareLen * 0.3);
              return (
                <div
                  key={`flare-${i}`}
                  style={{
                    position: "absolute",
                    left: fx - 3,
                    top: fy - flareLen / 2,
                    width: 6,
                    height: flareLen,
                    borderRadius: 3,
                    background: `linear-gradient(to bottom, ${C.solarYellow}, transparent)`,
                    opacity: starGrow * 0.5,
                    transform: `rotate(${(flareAngle * 180) / Math.PI + 90}deg)`,
                    transformOrigin: "center top",
                  }}
                />
              );
            })}
          </>
        )}

        {/* Helium atom born from fusion — cute and surprised */}
        {starBorn && (
          <AtomCharacter
            x={540}
            y={870}
            size={40}
            color={C.solarYellow}
            glowColor={C.hotWhite}
            eyeStyle="surprised"
            delay={75}
          />
        )}
      </Camera>

      {/* White flash overlay */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width,
          height,
          background: C.starCore,
          opacity: flashOpacity,
        }}
      />

      {/* Text */}
      <KineticText
        text="FUSION"
        delay={62}
        duration={60}
        size={110}
        weight={900}
        y={22}
        glowColor={C.solarYellow}
      />
      <KineticText
        text="Two become one."
        delay={80}
        duration={50}
        size={38}
        weight={300}
        y={30}
        color={C.textSecondary}
      />
      <KineticText
        text="A star is born."
        delay={120}
        duration={100}
        size={56}
        weight={600}
        y={78}
        glowColor={C.warmOrange}
      />
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// SCENE 5: STELLAR GLORY — Full star with planets, zoomed-out cosmic view
// (780–1020, 26–34s)
// ═══════════════════════════════════════════════════════════════════════════════
const Scene05: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Camera: slow majestic orbit
  const camRotY = interpolate(frame, [0, 240], [0, 15], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const camRotX = interpolate(frame, [0, 240], [5, -3], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const camZoom = interpolate(frame, [0, 240], [0.95, 1.05], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE.dramatic,
  });

  // Star pulsing gently
  const starPulse = breathe(frame, 40, 0.04);
  const starSize = 120 + starPulse * 10;

  // Planets orbiting
  const planets = [
    { dist: 220, speed: 0.012, size: 20, color: "#5555cc", name: "1" },
    { dist: 320, speed: 0.008, size: 28, color: "#44aa66", name: "2" },
    { dist: 430, speed: 0.005, size: 18, color: "#cc8844", name: "3" },
    { dist: 550, speed: 0.003, size: 35, color: "#cc9966", name: "4" },
  ];

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at 50% 45%, #0a0515 0%, ${C.void} 70%)`,
      }}
    >
      <Camera
        zoom={camZoom}
        rotateX={camRotX}
        rotateY={camRotY}
        perspective={1400}
      >
        {/* Deep star field — lots of stars */}
        <Particles
          count={150}
          color="#ffffff"
          minSize={0.3}
          maxSize={2.5}
          speed={0.05}
          opacity={0.6}
          seed="deep"
          drift="up"
        />
        <Particles
          count={30}
          color={C.nebulaBlue}
          minSize={1}
          maxSize={3}
          speed={0.08}
          opacity={0.25}
          glow
          seed="blue-deep"
          drift="up"
        />

        {/* Distant nebula remnant */}
        <div
          style={{
            position: "absolute",
            left: 100,
            top: 400,
            width: 600,
            height: 600,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${C.nebulaPurple}15 0%, transparent 70%)`,
            filter: "blur(40px)",
          }}
        />

        {/* Orbit rings */}
        {planets.map((p, i) => {
          const ringAppear = spring({
            frame: Math.max(0, frame - 30 - i * 15),
            fps,
            config: SP_GENTLE,
          });
          return (
            <div
              key={`orbit-${i}`}
              style={{
                position: "absolute",
                left: 540 - p.dist,
                top: 850 - p.dist * 0.4,
                width: p.dist * 2,
                height: p.dist * 0.8,
                borderRadius: "50%",
                border: `1px solid rgba(255,255,255,0.08)`,
                opacity: ringAppear * 0.5,
                transform: `rotateX(60deg)`,
              }}
            />
          );
        })}

        {/* Star */}
        <div
          style={{
            position: "absolute",
            left: 540 - 250,
            top: 850 - 250,
            width: 500,
            height: 500,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${C.solarYellow}33 0%, ${C.warmOrange}11 50%, transparent 70%)`,
            opacity: 0.5 + starPulse * 0.1,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 540 - starSize,
            top: 850 - starSize,
            width: starSize * 2,
            height: starSize * 2,
            borderRadius: "50%",
            background: `radial-gradient(circle at 38% 38%, ${C.starCore} 0%, ${C.hotWhite} 15%, ${C.solarYellow} 45%, ${C.warmOrange} 75%)`,
            boxShadow: `0 0 80px ${C.solarYellow}aa, 0 0 160px ${C.warmOrange}55, 0 0 300px ${C.warmOrange}22`,
          }}
        />

        {/* Planets */}
        {planets.map((p, i) => {
          const angle = frame * p.speed + i * 1.5;
          const px = 540 + Math.cos(angle) * p.dist;
          const py = 850 + Math.sin(angle) * p.dist * 0.4;
          const behind = Math.sin(angle) > 0;
          const planetAppear = spring({
            frame: Math.max(0, frame - 50 - i * 15),
            fps,
            config: SP,
          });

          return (
            <div
              key={`planet-${i}`}
              style={{
                position: "absolute",
                left: px - p.size,
                top: py - p.size,
                width: p.size * 2,
                height: p.size * 2,
                borderRadius: "50%",
                background: `radial-gradient(circle at 35% 35%, ${lerpColor(p.color, "#ffffff", 0.3)}, ${p.color})`,
                opacity: planetAppear * (behind ? 0.4 : 0.9),
                zIndex: behind ? 0 : 10,
                boxShadow: `0 0 ${p.size}px ${p.color}44`,
                transform: `scale(${planetAppear})`,
              }}
            />
          );
        })}

        {/* Happy atom characters floating around the star */}
        <AtomCharacter x={350} y={700} size={30} color={C.solarYellow} eyeStyle="happy" delay={60} orbitSpeed={0.02} />
        <AtomCharacter x={720} y={750} size={25} color={C.fusionBlue} eyeStyle="happy" delay={75} orbitSpeed={0.015} />
        <AtomCharacter x={540} y={1050} size={35} color={C.cosmicTeal} eyeStyle="happy" delay={90} orbitSpeed={0.018} />
      </Camera>

      {/* Text */}
      <KineticText
        text="BILLIONS OF YEARS"
        delay={15}
        duration={80}
        size={52}
        weight={800}
        y={12}
        wordByWord
        glowColor={C.solarYellow}
      />
      <KineticText
        text="of light, warmth, and life."
        delay={50}
        duration={80}
        size={36}
        weight={300}
        y={19}
        color={C.textSecondary}
      />
      <KineticText
        text="Every atom in your body"
        delay={120}
        duration={100}
        size={40}
        weight={500}
        y={80}
      />
      <KineticText
        text="was forged in a star."
        delay={145}
        duration={85}
        size={48}
        weight={700}
        y={87}
        glowColor={C.solarYellow}
      />
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// SCENE 6: CLOSING — You are stardust (1020–1200, 34–40s)
// ═══════════════════════════════════════════════════════════════════════════════
const Scene06: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Camera: very slow zoom out to infinity
  const camZoom = interpolate(frame, [0, 180], [1.1, 0.85], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE.dramatic,
  });

  // Everything fades at the end
  const endFade = interpolate(frame, [140, 175], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE.in,
  });

  // Star field — maximum density
  const starFieldOpacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ background: C.void }}>
      <Camera zoom={camZoom}>
        {/* Maximum star density */}
        <div style={{ opacity: starFieldOpacity * endFade }}>
          <Particles count={200} color="#ffffff" minSize={0.3} maxSize={2} speed={0.05} opacity={0.7} seed="final1" drift="up" />
          <Particles count={50} color={C.nebulaBlue} minSize={1} maxSize={3} speed={0.08} opacity={0.3} glow seed="final2" drift="up" />
          <Particles count={30} color={C.nebulaPink} minSize={1} maxSize={2.5} speed={0.06} opacity={0.2} glow seed="final3" drift="up" />
          <Particles count={20} color={C.solarYellow} minSize={1} maxSize={3} speed={0.04} opacity={0.25} glow seed="final4" drift="up" />
        </div>

        {/* Nebula wisps */}
        <NebulaBackground
          color1={C.nebulaPurple}
          color2={C.nebulaBlue}
          color3={C.warmOrange}
          intensity={0.15}
        />

        {/* Central warm glow — you */}
        <div
          style={{
            position: "absolute",
            left: 540 - 200,
            top: 900 - 200,
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${C.solarYellow}22 0%, ${C.warmOrange}08 50%, transparent 70%)`,
            opacity: endFade,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 540 - 30,
            top: 900 - 30,
            width: 60,
            height: 60,
            borderRadius: "50%",
            background: `radial-gradient(circle at 40% 40%, ${C.starCore}, ${C.hotWhite} 30%, ${C.solarYellow} 60%)`,
            opacity: endFade,
            boxShadow: `0 0 40px ${C.solarYellow}88, 0 0 80px ${C.warmOrange}44`,
          }}
        />
      </Camera>

      {/* Final text — big, emotional */}
      <div style={{ opacity: endFade }}>
        <KineticText
          text="YOU ARE"
          delay={10}
          duration={160}
          size={90}
          weight={900}
          y={35}
          wordByWord
        />
        <KineticText
          text="STARDUST"
          delay={22}
          duration={155}
          size={100}
          weight={900}
          y={45}
          glowColor={C.solarYellow}
        />
        <KineticText
          text="Look up."
          delay={70}
          duration={100}
          size={44}
          weight={300}
          y={58}
          color={C.textSecondary}
        />
      </div>
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// ROOT COMPOSITION — 40 seconds, 1200 frames
// ═══════════════════════════════════════════════════════════════════════════════
export const CosmicForge: React.FC = () => (
  <AbsoluteFill style={{ background: C.void }}>
    <Audio src={staticFile("epic-orchestra.mp3")} volume={0.8} />

    <Sequence from={0} durationInFrames={180} name="Cosmic Void">
      <Scene01 />
    </Sequence>

    <Sequence from={180} durationInFrames={180} name="Gas Collapse">
      <Scene02 />
    </Sequence>

    <Sequence from={360} durationInFrames={180} name="Compression">
      <Scene03 />
    </Sequence>

    <Sequence from={540} durationInFrames={240} name="Fusion">
      <Scene04 />
    </Sequence>

    <Sequence from={780} durationInFrames={240} name="Stellar Glory">
      <Scene05 />
    </Sequence>

    <Sequence from={1020} durationInFrames={180} name="Stardust">
      <Scene06 />
    </Sequence>
  </AbsoluteFill>
);
