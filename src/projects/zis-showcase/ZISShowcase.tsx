import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  Easing,
  Audio,
  staticFile,
  Sequence,
  Img,
} from "remotion";
import { ArchViz } from "./ArchViz";

// ── ARCHIVAL FILM EFFECTS ─────────────────────────────────────────────────────

const ArchiveGrain: React.FC<{ frame: number; intensity?: number }> = ({ frame, intensity = 1 }) => {
  const shift = (frame * 31) % 200;
  return (
    <div style={{
      position: "absolute", inset: 0,
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='4'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)'/%3E%3C/svg%3E")`,
      backgroundPosition: `${shift}px ${(shift * 1.7) % 200}px`,
      opacity: 0.18 * intensity,
      mixBlendMode: "overlay",
      pointerEvents: "none",
    }} />
  );
};

const FilmScratches: React.FC<{ frame: number }> = ({ frame }) => {
  const s1 = Math.sin(frame * 0.3) > 0.7 ? 0.6 : 0;
  const s2 = Math.sin(frame * 0.7 + 1.2) > 0.85 ? 0.4 : 0;
  const s3 = Math.sin(frame * 0.5 + 2.8) > 0.9 ? 0.5 : 0;
  const pos1 = ((frame * 13) % 70) + 5;
  const pos2 = ((frame * 17 + 30) % 80) + 10;
  const pos3 = ((frame * 11 + 50) % 60) + 20;
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {s1 > 0 && <div style={{ position: "absolute", top: 0, bottom: 0, left: `${pos1}%`, width: 1, background: "rgba(255,255,255,0.4)", opacity: s1 }} />}
      {s2 > 0 && <div style={{ position: "absolute", top: 0, bottom: 0, left: `${pos2}%`, width: 1, background: "rgba(255,255,255,0.3)", opacity: s2 }} />}
      {s3 > 0 && <div style={{ position: "absolute", top: 0, bottom: 0, left: `${pos3}%`, width: 0.5, background: "rgba(255,255,200,0.5)", opacity: s3 }} />}
    </div>
  );
};

const ArchiveVignette: React.FC = () => (
  <div style={{
    position: "absolute", inset: 0,
    background: "radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.5) 70%, rgba(0,0,0,0.85) 100%)",
    pointerEvents: "none",
  }} />
);

const Flicker: React.FC<{ frame: number }> = ({ frame }) => {
  const flicker = Math.max(0, Math.sin(frame * 11.3) * 0.08 + Math.sin(frame * 7.7) * 0.06);
  return (
    <div style={{
      position: "absolute", inset: 0,
      background: `rgba(0,0,0,${flicker})`,
      pointerEvents: "none",
    }} />
  );
};

const HorizontalTear: React.FC<{ frame: number }> = ({ frame }) => {
  if (Math.sin(frame * 0.23) <= 0.92) return null;
  const tearY = ((frame * 7) % 60) + 20;
  const tearOffset = Math.sin(frame * 3.1) * 8;
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      <div style={{
        position: "absolute", top: `${tearY}%`, left: 0, right: 0, height: 4,
        background: "rgba(0,0,0,0.6)", transform: `translateX(${tearOffset}px)`,
      }} />
    </div>
  );
};

const LegacyCutFlash: React.FC<{ frame: number }> = ({ frame }) => {
  const CUTS = [72, 189, 233, 277, 306, 423, 450, 475, 503, 547, 664, 781];
  let flash = 0;
  for (const c of CUTS) {
    const d = Math.abs(frame - c);
    if (d < 3) flash = Math.max(flash, ((3 - d) / 3) * 0.6);
  }
  if (flash < 0.01) return null;
  return <div style={{ position: "absolute", inset: 0, background: `rgba(255,255,255,${flash})`, pointerEvents: "none" }} />;
};

const Letterbox: React.FC = () => (
  <>
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 88, background: "#000" }} />
    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 88, background: "#000" }} />
  </>
);

// ── ANIMATION HELPERS ─────────────────────────────────────────────────────────
function fi(frame: number, start: number, dur = 15) {
  return interpolate(frame, [start, start + dur], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
}
function fo(frame: number, end: number, dur = 12) {
  return interpolate(frame, [end - dur, end], [1, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
    easing: Easing.in(Easing.quad),
  });
}

// ── SCENE 1: FILM LEADER COUNTDOWN (0-72) ─────────────────────────────────────
const CountdownLeader: React.FC<{ frame: number }> = ({ frame }) => {
  if (frame >= 72) return null;
  const num = Math.max(1, 6 - Math.floor((frame / 72) * 6));
  const phase = (frame % 12) / 12;
  const lineRot = phase * 360;
  const op = fi(frame, 0, 6) * fo(frame, 72, 8);

  return (
    <AbsoluteFill style={{ background: "#0A0A0A" }}>
      {/* Crosshair circle */}
      <div style={{
        position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{ width: 220, height: 220, borderRadius: "50%", border: "1.5px solid rgba(255,255,255,0.18)", position: "relative", opacity: op }}>
          <div style={{
            position: "absolute", top: "50%", left: 0, right: 0, height: 1,
            background: "rgba(255,255,255,0.4)", transformOrigin: "center",
            transform: `rotate(${lineRot}deg)`,
          }} />
          <div style={{
            position: "absolute", left: "50%", top: 0, bottom: 0, width: 1,
            background: "rgba(255,255,255,0.4)", transformOrigin: "center",
            transform: `rotate(${lineRot * 0.5}deg)`,
          }} />
          <div style={{
            position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 120, fontWeight: 900, color: "white",
            fontFamily: "'Courier New', monospace",
          }}>
            {num}
          </div>
        </div>
      </div>
      {/* Horizontal registration line */}
      <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 1, background: "rgba(255,255,255,0.06)" }} />
      {/* Archive ID */}
      <div style={{
        position: "absolute", bottom: 108, right: 80, opacity: 0.35,
        fontSize: 10, color: "white", fontFamily: "'Courier New', monospace", letterSpacing: 2,
      }}>
        MOSFILM ARCHIVE · {String(frame).padStart(4, "0")}
      </div>
      <div style={{
        position: "absolute", top: 108, left: 80, opacity: 0.3,
        fontSize: 10, color: "white", fontFamily: "'Courier New', monospace", letterSpacing: 2,
      }}>
        ZIS-101A SPORT · 1938
      </div>
    </AbsoluteFill>
  );
};

// ── SCENE 2: ERA TITLE — МОСКВА 1938 (72-180) ─────────────────────────────────
const SceneEra: React.FC<{ frame: number }> = ({ frame }) => {
  if (frame < 72 || frame >= 189) return null;
  const lf = frame - 72;
  const dur = 117;

  const titleOp = fi(lf, 6, 20) * fo(lf, dur, 14);
  const yearOp = fi(lf, 18, 14) * fo(lf, dur, 14);
  const lineW = interpolate(lf, [12, 36], [0, 380], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) * fo(lf, dur, 14);
  const subOp = fi(lf, 30, 12) * fo(lf, dur, 12);

  // Slow Ken Burns on the photo background
  const photoScale = interpolate(lf, [0, dur], [1.06, 1.0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const photoOp = fi(lf, 4, 20) * fo(lf, dur, 16);

  return (
    <AbsoluteFill style={{ background: "#0C0A07" }}>
      {/* Real archive photo as background */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", opacity: photoOp * 0.28 }}>
        <Img
          src={staticFile("zis-photos/zis1.jpg")}
          style={{
            width: "100%", height: "100%", objectFit: "cover",
            transform: `scale(${photoScale})`,
            filter: "grayscale(1) sepia(0.3) contrast(1.1) brightness(0.6)",
          }}
        />
      </div>
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(ellipse at center, rgba(20,14,5,0.6) 0%, rgba(0,0,0,0.85) 100%)",
      }} />
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{
          opacity: titleOp, transform: `translateY(${(1 - fi(lf, 6, 20)) * 32}px)`,
          fontSize: 118, fontWeight: 900, color: "#E8D5A8",
          fontFamily: "'Times New Roman', serif",
          letterSpacing: 8, textAlign: "center", lineHeight: 1,
          textShadow: "0 0 60px rgba(200,160,60,0.25)",
        }}>
          МОСКВА
        </div>
        <div style={{ width: lineW, height: 2, background: "linear-gradient(90deg, transparent, #C8A864, transparent)", margin: "16px 0" }} />
        <div style={{
          opacity: yearOp, transform: `translateY(${(1 - fi(lf, 18, 14)) * 22}px)`,
          fontSize: 44, fontWeight: 300, color: "#C8A864",
          fontFamily: "'Times New Roman', serif", letterSpacing: 18, textAlign: "center",
        }}>
          1 9 3 8
        </div>
        <div style={{
          opacity: subOp * 0.7, marginTop: 18,
          fontSize: 11, color: "rgba(200,170,100,0.6)",
          fontFamily: "'Courier New', monospace", letterSpacing: 4,
        }}>
          ГОСУДАРСТВЕННЫЙ АВТОМОБИЛЬНЫЙ ЗАВОД
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── SCENE 3: CAR NAME SPLASH (180-300) — 3 rapid cuts at 40-frame intervals ───
const SceneCarName: React.FC<{ frame: number }> = ({ frame }) => {
  if (frame < 189 || frame >= 306) return null;
  const lf = frame - 189;

  const words = ["ZIS", "101-A", "SPORT"];
  const colors = ["#FFFFFF", "#C8A864", "#FFFFFF"];
  const sizes = [180, 134, 104];
  const spacing = [24, 10, 18];

  // Beat-aligned: word cuts at lf=44 (beat 15=233) and lf=88 (beat 18=277)
  const WORD_STARTS = [0, 44, 88];
  const WORD_DURS   = [44, 44, 29];
  const idx  = lf < 44 ? 0 : lf < 88 ? 1 : 2;
  const sf   = lf - WORD_STARTS[idx];
  const wdur = WORD_DURS[idx];

  const op = fi(sf, 0, 7) * fo(sf, wdur, 7);
  const scl = 0.88 + fi(sf, 0, 10) * 0.12;

  return (
    <AbsoluteFill style={{ background: "#040404" }}>
      {/* Background glow */}
      <div style={{
        position: "absolute", inset: 0,
        background: `radial-gradient(ellipse at center, rgba(${idx === 1 ? "200,168,100" : "255,255,255"},0.04) 0%, transparent 60%)`,
      }} />
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{
          opacity: op, transform: `scale(${scl})`,
          fontSize: sizes[idx], fontWeight: 900, color: colors[idx],
          fontFamily: "'Helvetica Neue', Arial, sans-serif",
          letterSpacing: spacing[idx], textAlign: "center",
          textShadow: idx === 1 ? "0 0 80px rgba(200,168,100,0.4)" : "none",
        }}>
          {words[idx]}
        </div>
      </div>
      {/* Sub-cut progress dots */}
      <div style={{ position: "absolute", bottom: 112, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 8 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: i === idx ? 22 : 6, height: 2,
            background: i <= idx ? "#C8A864" : "rgba(255,255,255,0.15)",
          }} />
        ))}
      </div>
    </AbsoluteFill>
  );
};

// ── SCENE 4: STORY TEXT (300-420) ─────────────────────────────────────────────
const SceneStory: React.FC<{ frame: number }> = ({ frame }) => {
  if (frame < 306 || frame >= 423) return null;
  const lf = frame - 306;

  const lines: Array<{ text: string; size: number; weight: number; color: string; italic: boolean; delay: number }> = [
    { text: "IN 1938, THE SOVIET UNION", size: 33, weight: 700, color: "#E8E0D0", italic: false, delay: 0 },
    { text: "BUILT SOMETHING EXTRAORDINARY.", size: 33, weight: 700, color: "#E8E0D0", italic: false, delay: 14 },
    { text: "", size: 0, weight: 0, color: "", italic: false, delay: 0 },
    { text: "One vehicle.", size: 26, weight: 400, color: "#A09070", italic: true, delay: 30 },
    { text: "One prototype.", size: 26, weight: 400, color: "#A09070", italic: true, delay: 42 },
    { text: "Designed for glory.", size: 26, weight: 400, color: "#C8A864", italic: true, delay: 56 },
  ];

  const photoScale = interpolate(lf, [0, 117], [1.0, 1.05], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const photoOp = fi(lf, 0, 20) * fo(lf, 117, 20);

  return (
    <AbsoluteFill style={{ background: "#080806" }}>
      {/* Side-view photo as subtle background */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", opacity: photoOp * 0.2 }}>
        <Img
          src={staticFile("zis-photos/zis3.jpg")}
          style={{
            width: "100%", height: "100%", objectFit: "cover",
            transform: `scale(${photoScale})`,
            filter: "grayscale(1) sepia(0.2) contrast(1.0) brightness(0.5)",
          }}
        />
      </div>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 30% 50%, rgba(20,14,3,0.5) 0%, rgba(0,0,0,0.8) 70%)" }} />
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "flex-start", justifyContent: "center", paddingLeft: 120 }}>
        {lines.map((line, i) => {
          if (!line.text) return <div key={i} style={{ height: 14 }} />;
          const op = fi(lf, line.delay, 16) * fo(lf, 115 - i * 3, 14);
          const tx = (1 - fi(lf, line.delay, 16)) * 40;
          return (
            <div key={i} style={{
              opacity: op, transform: `translateX(${tx}px)`,
              fontSize: line.size, fontWeight: line.weight, color: line.color,
              fontFamily: "'Times New Roman', serif",
              letterSpacing: 2, lineHeight: 1.65,
              fontStyle: line.italic ? "italic" : "normal",
            }}>
              {line.text}
            </div>
          );
        })}
      </div>
      {/* Ornamental bracket */}
      <div style={{
        position: "absolute", top: 100, left: 72, width: 40, height: 40,
        borderTop: "1px solid rgba(200,168,100,0.4)", borderLeft: "1px solid rgba(200,168,100,0.4)",
        opacity: fi(lf, 4, 12),
      }} />
      <div style={{
        position: "absolute", bottom: 100, right: 72, width: 40, height: 40,
        borderBottom: "1px solid rgba(200,168,100,0.25)", borderRight: "1px solid rgba(200,168,100,0.25)",
        opacity: fi(lf, 20, 12) * fo(lf, 115, 10),
      }} />
    </AbsoluteFill>
  );
};

// ── SCENE 5: SPECS RAPID-FIRE (420-540) — 4 cards × 30 frames ────────────────
const SceneSpecs: React.FC<{ frame: number }> = ({ frame }) => {
  if (frame < 423 || frame >= 547) return null;
  const lf = frame - 423;

  const specs = [
    { label: "ENGINE DISPLACEMENT", value: "6,003", unit: "CC" },
    { label: "MAXIMUM POWER", value: "141", unit: "HP" },
    { label: "TOP SPEED", value: "162", unit: "KM/H" },
    { label: "UNITS PRODUCED", value: "1", unit: "PROTOTYPE" },
  ];

  // Beat-aligned: spec cuts at lf=27 (beat30=450), lf=52 (beat32=475), lf=80 (beat34=503)
  const SPEC_STARTS = [0, 27, 52, 80];
  const SPEC_DURS   = [27, 25, 28, 44];
  const idx  = lf < 27 ? 0 : lf < 52 ? 1 : lf < 80 ? 2 : 3;
  const sf   = lf - SPEC_STARTS[idx];
  const sdur = SPEC_DURS[idx];
  const spec = specs[idx];

  const numOp = fi(sf, 0, 7) * fo(sf, sdur, 5);
  const labelOp = fi(sf, 3, 9) * fo(sf, sdur, 5);
  const scl = 0.90 + fi(sf, 0, 12) * 0.10;

  return (
    <AbsoluteFill style={{ background: "#020204" }}>
      <div style={{
        position: "absolute", top: "50%", left: 0, right: 0, height: 1,
        background: "linear-gradient(90deg, transparent, rgba(200,168,100,0.12), transparent)",
        transform: "translateY(-70px)",
      }} />
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{
          opacity: labelOp,
          fontSize: 11, fontWeight: 700, color: "#C8A864",
          fontFamily: "'Courier New', monospace", letterSpacing: 6, marginBottom: 12, textAlign: "center",
        }}>
          {spec.label}
        </div>
        <div style={{
          opacity: numOp, transform: `scale(${scl})`,
          fontSize: idx === 3 ? 100 : 140, fontWeight: 900, color: "white",
          fontFamily: "'Helvetica Neue', Arial, sans-serif",
          letterSpacing: -4, lineHeight: 1, textAlign: "center",
        }}>
          {spec.value}
          <span style={{ fontSize: 28, fontWeight: 300, color: "#C8A864", marginLeft: 12, letterSpacing: 2 }}>
            {spec.unit}
          </span>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 42, opacity: 0.6 }}>
          {specs.map((_, i) => (
            <div key={i} style={{
              width: i === idx ? 24 : 6, height: 2,
              background: i <= idx ? "#C8A864" : "rgba(255,255,255,0.15)",
            }} />
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── SCENE 6: ARCHIVE PHOTO SCENE (540-660) — real historical photos ───────────
const ARCHIVE_PHOTOS = [
  { src: "zis-photos/zis2.jpg", caption: "ZIS-101A SPORT · FRONT 3/4 VIEW · 1938", panX: [0, -30], panY: [0, -10], scale: [1.05, 1.12] },
  { src: "zis-photos/zis4.jpg", caption: "ZIS-101A SPORT · SIDE PROFILE · МОСКВА 1938", panX: [20, -20], panY: [-5, 5], scale: [1.08, 1.02] },
  { src: "zis-photos/zis5.jpg", caption: "ZIS-101A SPORT · THE ONLY PROTOTYPE · 1938", panX: [-10, 10], panY: [0, -15], scale: [1.04, 1.10] },
];

const SceneArchive: React.FC<{ frame: number }> = ({ frame }) => {
  if (frame < 547 || frame >= 664) return null;
  const lf = frame - 547; // 0-116

  // Beat-aligned photo cuts: lf=44 (beat40=591), lf=88 (beat43=635)
  const PHOTO_STARTS = [0, 44, 88];
  const PHOTO_DURS   = [44, 44, 29];
  const photoIdx = lf < 44 ? 0 : lf < 88 ? 1 : 2;
  const sf   = lf - PHOTO_STARTS[photoIdx];
  const pdur = PHOTO_DURS[photoIdx];
  const photo = ARCHIVE_PHOTOS[photoIdx];

  const photoOp   = fi(sf, 0, 10) * fo(sf, pdur, 10);
  const captionOp = fi(sf, 8, 12) * fo(sf, pdur, 8);

  // Ken Burns: interpolate pan and scale within the photo slot
  const t = sf / pdur;
  const panX = photo.panX[0] + (photo.panX[1] - photo.panX[0]) * t;
  const panY = photo.panY[0] + (photo.panY[1] - photo.panY[0]) * t;
  const scale = photo.scale[0] + (photo.scale[1] - photo.scale[0]) * t;

  // Photo counter fade-in (overall scene)
  const sceneOp = fi(lf, 0, 8) * fo(lf, 118, 10);

  return (
    <AbsoluteFill style={{ background: "#050403" }}>
      {/* Photo fills the frame */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", opacity: photoOp }}>
        <Img
          src={staticFile(photo.src)}
          style={{
            width: "100%", height: "100%", objectFit: "cover",
            transform: `scale(${scale}) translate(${panX}px, ${panY}px)`,
            filter: "grayscale(0.8) sepia(0.5) contrast(1.15) brightness(0.75)",
          }}
        />
        {/* Aging vignette */}
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.65) 100%)",
        }} />
        {/* Sepia wash */}
        <div style={{ position: "absolute", inset: 0, background: "rgba(40,25,5,0.15)" }} />
      </div>

      {/* Film border frame */}
      <div style={{
        position: "absolute", inset: 0, opacity: sceneOp * 0.7, pointerEvents: "none",
        border: "3px solid rgba(200,180,130,0.12)",
      }} />

      {/* Photo index dots */}
      <div style={{
        position: "absolute", bottom: 128, left: "50%", transform: "translateX(-50%)",
        display: "flex", gap: 8, opacity: sceneOp,
      }}>
        {ARCHIVE_PHOTOS.map((_, i) => (
          <div key={i} style={{
            width: i === photoIdx ? 20 : 6, height: 2,
            background: i <= photoIdx ? "rgba(200,180,130,0.8)" : "rgba(255,255,255,0.2)",
          }} />
        ))}
      </div>

      {/* Caption */}
      <div style={{
        position: "absolute", bottom: 104, left: 0, right: 0, textAlign: "center",
        opacity: captionOp * sceneOp,
        fontFamily: "'Courier New', monospace",
        fontSize: 11, color: "rgba(200,180,130,0.75)", letterSpacing: 4,
        textTransform: "uppercase",
      }}>
        {photo.caption}
      </div>

      {/* Corner brackets */}
      {[
        { top: 92, left: 60 }, { top: 92, right: 60 },
        { bottom: 92, left: 60 }, { bottom: 92, right: 60 },
      ].map((pos, i) => (
        <div key={i} style={{
          position: "absolute", width: 20, height: 20, opacity: sceneOp * 0.5,
          ...pos,
          borderTop: i < 2 ? "1px solid rgba(200,180,130,0.5)" : undefined,
          borderBottom: i >= 2 ? "1px solid rgba(200,180,130,0.5)" : undefined,
          borderLeft: i % 2 === 0 ? "1px solid rgba(200,180,130,0.5)" : undefined,
          borderRight: i % 2 === 1 ? "1px solid rgba(200,180,130,0.5)" : undefined,
        }} />
      ))}
    </AbsoluteFill>
  );
};

// ── SCENE 7: LEGACY DECLARATION (660-780) ─────────────────────────────────────
const SceneLegacy: React.FC<{ frame: number }> = ({ frame }) => {
  if (frame < 664 || frame >= 781) return null;
  const lf = frame - 664;

  const lines: Array<{ text: string; size: number; weight: number; color: string; italic: boolean; delay: number }> = [
    { text: "THERE WAS ONLY ONE.", size: 50, weight: 900, color: "#FFFFFF", italic: false, delay: 0 },
    { text: "It never raced.", size: 30, weight: 300, color: "#A09070", italic: true, delay: 22 },
    { text: "It never needed to.", size: 30, weight: 300, color: "#A09070", italic: true, delay: 38 },
    { text: "IT WAS ALREADY LEGEND.", size: 54, weight: 900, color: "#C8A864", italic: false, delay: 60 },
  ];

  const photoOp = fi(lf, 0, 24) * fo(lf, 115, 20);
  const photoScale = interpolate(lf, [0, 117], [1.08, 1.0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: "#060504" }}>
      {/* Real photo background, very subtle */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", opacity: photoOp * 0.22 }}>
        <Img
          src={staticFile("zis-photos/zis1.jpg")}
          style={{
            width: "100%", height: "100%", objectFit: "cover",
            transform: `scale(${photoScale})`,
            filter: "grayscale(1) sepia(0.4) contrast(1.1) brightness(0.5)",
          }}
        />
      </div>
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(ellipse at center, rgba(20,12,3,0.65) 0%, rgba(0,0,0,0.88) 100%)",
      }} />
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
        {lines.map((line, i) => {
          const op = fi(lf, line.delay, 16) * fo(lf, 115 - i * 4, 12);
          const tx = (1 - fi(lf, line.delay, 16)) * (i % 2 === 0 ? 44 : -44);
          return (
            <div key={i} style={{
              opacity: op, transform: `translateX(${tx}px)`,
              fontSize: line.size, fontWeight: line.weight, color: line.color,
              fontFamily: "'Times New Roman', serif",
              letterSpacing: 4, textAlign: "center",
              fontStyle: line.italic ? "italic" : "normal", lineHeight: 1.2,
            }}>
              {line.text}
            </div>
          );
        })}
      </div>
      {/* Ornamental divider */}
      <div style={{
        position: "absolute", bottom: 142, left: "50%", transform: "translateX(-50%)",
        width: interpolate(lf, [62, 90], [0, 200], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) * fo(lf, 115, 10),
        height: 1, background: "linear-gradient(90deg, transparent, #C8A864, transparent)",
      }} />
    </AbsoluteFill>
  );
};

// ── SCENE 8: REBORN IN 3D (780-900) ──────────────────────────────────────────
const SceneResurrection: React.FC<{ frame: number }> = ({ frame }) => {
  if (frame < 781 || frame >= 900) return null;
  const lf = frame - 781;

  const titleOp = fi(lf, 18, 22) * fo(lf, 119, 16);
  const subOp = fi(lf, 40, 18) * fo(lf, 119, 12);
  const glow = interpolate(lf, [18, 70, 100], [0, 1, 0.6], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const scl = 0.82 + fi(lf, 18, 32) * 0.18;

  // Fade to black at the very end — transition into ArchViz's film burn
  const fadeBlack = interpolate(lf, [103, 119], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: "#060504" }}>
      {/* Center glow burst */}
      <div style={{
        position: "absolute", inset: 0,
        background: `radial-gradient(ellipse at center, rgba(200,168,100,${glow * 0.18}) 0%, transparent 55%)`,
      }} />
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{
          opacity: fi(lf, 14, 14) * fo(lf, 119, 14),
          fontSize: 12, fontWeight: 700, color: "#C8A864",
          fontFamily: "'Courier New', monospace", letterSpacing: 12, marginBottom: 18,
          textShadow: `0 0 40px rgba(200,168,100,${glow * 0.8})`,
        }}>
          NOW
        </div>
        <div style={{
          opacity: titleOp, transform: `scale(${scl})`,
          fontSize: 86, fontWeight: 900, color: "white",
          fontFamily: "'Helvetica Neue', Arial, sans-serif",
          letterSpacing: -2, lineHeight: 1, textAlign: "center",
          textShadow: `0 0 80px rgba(200,168,100,${glow * 0.5})`,
        }}>
          REBORN
        </div>
        <div style={{
          opacity: titleOp, transform: `scale(${scl})`,
          fontSize: 26, fontWeight: 300, color: "#C8A864",
          fontFamily: "'Helvetica Neue', Arial, sans-serif",
          letterSpacing: 12, marginTop: 8,
        }}>
          IN 3D
        </div>
        {/* Growing transition line */}
        <div style={{
          marginTop: 44, opacity: subOp,
          width: interpolate(lf, [50, 100], [0, 440], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          height: 1, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent)",
        }} />
        <div style={{
          opacity: subOp * 0.7, marginTop: 20,
          fontSize: 10, color: "rgba(255,255,255,0.3)",
          fontFamily: "'Courier New', monospace", letterSpacing: 5,
        }}>
          ZIS-101A SPORT  ·  1938  ·  DIGITAL RECONSTRUCTION
        </div>
      </div>
      {/* Fade to black for clean handoff */}
      {fadeBlack > 0.01 && (
        <div style={{ position: "absolute", inset: 0, background: `rgba(0,0,0,${fadeBlack})` }} />
      )}
    </AbsoluteFill>
  );
};

// ── LEGACY INTRO ROOT ─────────────────────────────────────────────────────────
const LegacyIntro: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <CountdownLeader frame={frame} />
      <SceneEra frame={frame} />
      <SceneCarName frame={frame} />
      <SceneStory frame={frame} />
      <SceneSpecs frame={frame} />
      <SceneArchive frame={frame} />
      <SceneLegacy frame={frame} />
      <SceneResurrection frame={frame} />

      {/* Global archival overlays */}
      <ArchiveGrain frame={frame} />
      <FilmScratches frame={frame} />
      <ArchiveVignette />
      <Flicker frame={frame} />
      <HorizontalTear frame={frame} />
      <LegacyCutFlash frame={frame} />
      <Letterbox />
    </AbsoluteFill>
  );
};

// ── FULL ZIS SHOWCASE (2700 frames = 30s legacy + 60s 3D) ────────────────────
export const ZISShowcase: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {/* Background music throughout the full 90s video */}
      <Audio src={staticFile("showcase-music.mp3")} />

      {/* 30-second archival legacy intro */}
      <Sequence from={0} durationInFrames={900} name="Legacy Intro">
        <LegacyIntro />
      </Sequence>

      {/* 60-second 3D b-roll — ArchViz plays from its own frame 0 */}
      <Sequence from={900} durationInFrames={1800} name="3D B-Roll">
        <ArchViz noAudio />
      </Sequence>
    </AbsoluteFill>
  );
};
