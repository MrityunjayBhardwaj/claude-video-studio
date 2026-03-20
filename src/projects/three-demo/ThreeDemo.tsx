import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";
import { ThreeCanvas } from "@remotion/three";

// ── ROTATING CUBE ─────────────────────────────────────────────────────────────
const RotatingCube: React.FC<{ t: number }> = ({ t }) => {
  const rx = t * 0.8;
  const ry = t * 1.3;
  const scale = 1 + Math.sin(t * 2.1) * 0.12;
  return (
    <mesh rotation={[rx, ry, 0]} scale={[scale, scale, scale]}>
      <boxGeometry args={[2, 2, 2]} />
      <meshStandardMaterial color="#E8845A" metalness={0.3} roughness={0.4} />
    </mesh>
  );
};

// ── ORBITING SPHERES ──────────────────────────────────────────────────────────
const OrbitingSpheres: React.FC<{ t: number }> = ({ t }) => {
  const count = 5;
  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const angle = t * 1.5 + (i / count) * Math.PI * 2;
        const radius = 3.5;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const y = Math.sin(t * 2 + i) * 0.6;
        const colors = ["#F0C84A", "#5AAAB8", "#4B7CB8", "#9898A8", "#E8845A"];
        return (
          <mesh key={i} position={[x, y, z]}>
            <sphereGeometry args={[0.35, 32, 32]} />
            <meshStandardMaterial color={colors[i]} metalness={0.5} roughness={0.2} />
          </mesh>
        );
      })}
    </>
  );
};

// ── GROUND RING ───────────────────────────────────────────────────────────────
const GroundRing: React.FC<{ t: number }> = ({ t }) => {
  const scale = 1 + Math.sin(t * 3) * 0.05;
  return (
    <mesh rotation={[-Math.PI / 2, 0, t * 0.3]} position={[0, -2.5, 0]} scale={[scale, scale, scale]}>
      <torusGeometry args={[4, 0.08, 16, 80]} />
      <meshStandardMaterial color="#4B7CB8" emissive="#1A3A6A" emissiveIntensity={0.4} metalness={0.8} roughness={0.1} />
    </mesh>
  );
};

// ── SCENE LIGHTING ─────────────────────────────────────────────────────────────
const Lights: React.FC<{ t: number }> = ({ t }) => {
  const lx = Math.cos(t * 0.7) * 6;
  const lz = Math.sin(t * 0.7) * 6;
  return (
    <>
      <ambientLight intensity={0.35} />
      <pointLight position={[lx, 5, lz]} intensity={80} color="#FFE8CC" />
      <pointLight position={[-lx * 0.6, -3, -lz * 0.6]} intensity={30} color="#3B6CB8" />
    </>
  );
};

// ── ROOT COMPOSITION ──────────────────────────────────────────────────────────
export const ThreeDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;

  // Fade in
  const opacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  // Camera pull-back over time
  const camZ = interpolate(frame, [0, 300], [8, 5.5], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  return (
    <AbsoluteFill style={{ background: "#060810", opacity }}>
      <ThreeCanvas
        width={width}
        height={height}
        style={{ background: "transparent" }}
        camera={{ fov: 60, position: [0, 1.5, camZ] }}
      >
        <Lights t={t} />
        <GroundRing t={t} />
        <RotatingCube t={t} />
        <OrbitingSpheres t={t} />
      </ThreeCanvas>

      {/* Title overlay */}
      <div style={{
        position: "absolute", bottom: 60, left: 72,
        fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
        opacity: interpolate(frame, [20, 50], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
      }}>
        <div style={{ fontSize: 40, fontWeight: 800, color: "#F0C84A", letterSpacing: -0.5 }}>
          @remotion/three
        </div>
        <div style={{ fontSize: 18, color: "#6688AA", marginTop: 4 }}>
          React Three Fiber · frame-driven · scrub-safe
        </div>
      </div>
    </AbsoluteFill>
  );
};
