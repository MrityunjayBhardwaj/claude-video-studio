import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
} from "remotion";

// ── ISO CONSTANTS ─────────────────────────────────────────────────────────────
const TW = 100;
const TH = 50;
const FLOOR_H = 28;
const OX = 960;
const OY = 400;

function iso(c: number, r: number, e: number = 0) {
  return {
    x: OX + (c - r) * TW / 2,
    y: OY + (c + r) * TH / 2 - e * FLOOR_H,
  };
}

// ── DAY PHASE ─────────────────────────────────────────────────────────────────
// 0 = full night, 1 = full day
function dayPhase(f: number): number {
  if (f < 150) return interpolate(f, [0, 150], [0.15, 0.95], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  if (f < 500) return 0.95;
  if (f < 700) return interpolate(f, [500, 700], [0.95, 0.04], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  if (f < 1050) return 0.04;
  return interpolate(f, [1050, 1200], [0.04, 0.3], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
}

// ── PALETTE ───────────────────────────────────────────────────────────────────
const C = {
  road:        "#484860",
  ground:      "#6B9E4A",
  park:        "#4A8A30",
  bldg_top:    ["#E8845A", "#F0C84A", "#5AAAB8", "#9898A8", "#4B7CB8"] as string[],
  bldg_right:  ["#C06040", "#C8A030", "#3888A0", "#787888", "#3860A0"] as string[],
  bldg_left:   ["#A04028", "#A08020", "#286880", "#585868", "#284890"] as string[],
  window_day:  "#334455",
  window_night:"#FFE066",
  lamp:        "#FFDD88",
};

// ── GRID DEFINITION ───────────────────────────────────────────────────────────
const GRID = 13;
const ROADS = new Set([0, 4, 8, 12]);
const BLOCK_COL_GROUPS = [[1,2,3],[5,6,7],[9,10,11]];
const BLOCK_ROW_GROUPS = [[1,2,3],[5,6,7],[9,10,11]];

type BlockTheme = {
  type: string;
  colorIdx: number;
  floorBase: number;
  floorVar: number;
  winR: number;
  winC: number;
};

const BLOCK_THEMES: BlockTheme[][] = [
  [
    { type:"downtown",    colorIdx:4, floorBase:6, floorVar:3, winR:3, winC:2 },
    { type:"commercial",  colorIdx:0, floorBase:3, floorVar:2, winR:2, winC:2 },
    { type:"residential", colorIdx:2, floorBase:2, floorVar:2, winR:2, winC:3 },
  ],
  [
    { type:"commercial",  colorIdx:1, floorBase:4, floorVar:2, winR:2, winC:2 },
    { type:"park",        colorIdx:-1,floorBase:0, floorVar:0, winR:0, winC:0 },
    { type:"industrial",  colorIdx:3, floorBase:3, floorVar:2, winR:1, winC:3 },
  ],
  [
    { type:"residential", colorIdx:2, floorBase:2, floorVar:2, winR:2, winC:2 },
    { type:"downtown",    colorIdx:4, floorBase:5, floorVar:3, winR:3, winC:2 },
    { type:"commercial",  colorIdx:0, floorBase:3, floorVar:2, winR:2, winC:2 },
  ],
];

type Building = {
  col: number; row: number;
  floors: number; colorIdx: number;
  winR: number; winC: number;
  seed: number;
};

function generateBuildings(): Building[] {
  const out: Building[] = [];
  for (let bgr = 0; bgr < 3; bgr++) {
    for (let bgc = 0; bgc < 3; bgc++) {
      const theme = BLOCK_THEMES[bgr][bgc];
      if (theme.type === "park") continue;
      for (let ri = 0; ri < 3; ri++) {
        for (let ci = 0; ci < 3; ci++) {
          const seed = bgr * 900 + bgc * 100 + ri * 10 + ci;
          const floors = theme.floorBase + ((seed * 7 + ci * 3) % (theme.floorVar + 1));
          out.push({
            col: BLOCK_COL_GROUPS[bgc][ci],
            row: BLOCK_ROW_GROUPS[bgr][ri],
            floors: Math.max(1, floors),
            colorIdx: theme.colorIdx,
            winR: theme.winR,
            winC: theme.winC,
            seed,
          });
        }
      }
    }
  }
  return out.sort((a, b) => (a.col + a.row) - (b.col + b.row));
}

const BUILDINGS = generateBuildings();

// ── BUILDING RENDERER ─────────────────────────────────────────────────────────
function BuildingEl({ b, dp }: { b: Building; dp: number }) {
  const { col, row, floors: h, colorIdx: ci, winR, winC } = b;
  const N  = iso(col,   row,   h);
  const E  = iso(col+1, row,   h);
  const S  = iso(col+1, row+1, h);
  const W  = iso(col,   row+1, h);
  const E0 = iso(col+1, row,   0);
  const S0 = iso(col+1, row+1, 0);
  const W0 = iso(col,   row+1, 0);

  const topPts   = `${N.x},${N.y} ${E.x},${E.y} ${S.x},${S.y} ${W.x},${W.y}`;
  const rightPts = `${E.x},${E.y} ${S.x},${S.y} ${S0.x},${S0.y} ${E0.x},${E0.y}`;
  const leftPts  = `${W.x},${W.y} ${S.x},${S.y} ${S0.x},${S0.y} ${W0.x},${W0.y}`;

  const wColor = dp < 0.5 ? C.window_night : C.window_day;

  const windows: React.ReactNode[] = [];
  if (winR > 0 && winC > 0 && h > 1) {
    // right face windows
    for (let wr = 0; wr < winR; wr++) {
      for (let wc = 0; wc < winC; wc++) {
        const t = (wr + 0.7) / (winR + 0.5);
        const u = (wc + 0.5) / (winC + 1);
        const tx = E.x + (S.x - E.x) * u;
        const ty = E.y + (S.y - E.y) * u;
        const bx = E0.x + (S0.x - E0.x) * u;
        const by = E0.y + (S0.y - E0.y) * u;
        const wx = tx + (bx - tx) * t;
        const wy = ty + (by - ty) * t;
        windows.push(<rect key={`wr${wr}${wc}`} x={wx - 3} y={wy - 2} width={6} height={5} fill={wColor} opacity={dp < 0.5 ? 0.9 : 0.5} rx={1} />);
      }
    }
    // left face windows
    for (let wr = 0; wr < winR; wr++) {
      for (let wc = 0; wc < winC; wc++) {
        const t = (wr + 0.7) / (winR + 0.5);
        const u = (wc + 0.5) / (winC + 1);
        const tx = W.x + (S.x - W.x) * u;
        const ty = W.y + (S.y - W.y) * u;
        const bx = W0.x + (S0.x - W0.x) * u;
        const by = W0.y + (S0.y - W0.y) * u;
        const wx = tx + (bx - tx) * t;
        const wy = ty + (by - ty) * t;
        windows.push(<rect key={`wl${wr}${wc}`} x={wx - 3} y={wy - 2} width={6} height={5} fill={wColor} opacity={dp < 0.5 ? 0.85 : 0.4} rx={1} />);
      }
    }
  }

  return (
    <g>
      <polygon points={rightPts} fill={C.bldg_right[ci]} />
      <polygon points={leftPts}  fill={C.bldg_left[ci]} />
      <polygon points={topPts}   fill={C.bldg_top[ci]} />
      {windows}
    </g>
  );
}

// ── GROUND + ROADS ─────────────────────────────────────────────────────────────
function GroundTiles() {
  const tiles: React.ReactNode[] = [];
  for (let r = 0; r < GRID; r++) {
    for (let c = 0; c < GRID; c++) {
      const isRoad = ROADS.has(c) || ROADS.has(r);
      const isPark = c >= 5 && c <= 7 && r >= 5 && r <= 7;
      const A = iso(c, r, 0);
      const B = iso(c+1, r, 0);
      const CC = iso(c+1, r+1, 0);
      const D = iso(c, r+1, 0);
      const pts = `${A.x},${A.y} ${B.x},${B.y} ${CC.x},${CC.y} ${D.x},${D.y}`;
      const fill = isRoad ? C.road : isPark ? C.park : C.ground;
      tiles.push(<polygon key={`g${c}-${r}`} points={pts} fill={fill} stroke="rgba(0,0,0,0.08)" strokeWidth={0.5} />);
    }
  }
  // Road lane markings
  for (let r = 0; r < GRID; r++) {
    for (let c = 0; c < GRID; c++) {
      const isRoadC = ROADS.has(c);
      const isRoadR = ROADS.has(r);
      if (isRoadC && !isRoadR) {
        const m = iso(c + 0.5, r + 0.5, 0.01);
        tiles.push(<circle key={`lm${c}-${r}`} cx={m.x} cy={m.y} r={2.5} fill="#F0C84A" opacity={0.55} />);
      }
      if (isRoadR && !isRoadC) {
        const m = iso(c + 0.5, r + 0.5, 0.01);
        tiles.push(<circle key={`lv${c}-${r}`} cx={m.x} cy={m.y} r={2.5} fill="#F0C84A" opacity={0.55} />);
      }
    }
  }
  return <>{tiles}</>;
}

// ── PARK DETAILS ──────────────────────────────────────────────────────────────
function ParkDetails() {
  const trees = [
    [5.4, 5.4], [6.5, 5.3], [7.5, 5.5],
    [5.3, 6.5], [7.6, 6.4],
    [5.5, 7.5], [6.4, 7.6], [7.5, 7.5],
  ];
  return (
    <>
      {trees.map(([tc, tr], i) => {
        const p = iso(tc, tr, 0);
        return (
          <g key={i}>
            <rect x={p.x - 3} y={p.y - 12} width={6} height={14} fill="#7B4F28" />
            <circle cx={p.x} cy={p.y - 22} r={15} fill="#2A7A38" />
            <circle cx={p.x - 4} cy={p.y - 28} r={10} fill="#38AA4A" />
            <circle cx={p.x + 5} cy={p.y - 26} r={9} fill="#32994A" />
          </g>
        );
      })}
      {/* Fountain */}
      {(() => {
        const fp = iso(6.5, 6.5, 0.15);
        return (
          <g>
            <ellipse cx={fp.x} cy={fp.y} rx={20} ry={10} fill="#3888CC" opacity={0.75} />
            <ellipse cx={fp.x} cy={fp.y - 6} rx={6} ry={3} fill="#66AAEE" opacity={0.9} />
          </g>
        );
      })()}
    </>
  );
}

// ── CHIMNEYS (industrial block) ───────────────────────────────────────────────
const CHIMNEY_POS = [
  [9.3, 9.4, 4], [10.6, 9.5, 4], [9.5, 10.7, 5],
  [10.5, 10.5, 4], [11.3, 11.3, 4], [9.2, 11.4, 5],
  [11.5, 9.8, 4], [10.2, 11.8, 3],
] as [number, number, number][];

// ── CAR SYSTEM ────────────────────────────────────────────────────────────────
type Car = {
  id: number;
  axis: "h" | "v";
  lane: number;
  offset: number; // 0-GRID
  speed: number;  // grid units per 30 frames
  color: string;
  laneShift: number; // +/- within road tile
};

const CAR_DEFS: Car[] = [
  { id:0,  axis:"h", lane:0,  offset:0,    speed:0.28, color:"#E8845A", laneShift:0.2 },
  { id:1,  axis:"h", lane:0,  offset:7,    speed:0.22, color:"#4B7CB8", laneShift:0.7 },
  { id:2,  axis:"h", lane:4,  offset:2,    speed:0.32, color:"#F0C84A", laneShift:0.25 },
  { id:3,  axis:"h", lane:4,  offset:8.5,  speed:0.26, color:"#5AAAB8", laneShift:0.65 },
  { id:4,  axis:"h", lane:8,  offset:1,    speed:0.30, color:"#E8845A", laneShift:0.3 },
  { id:5,  axis:"h", lane:8,  offset:9,    speed:0.20, color:"#9898A8", laneShift:0.7 },
  { id:6,  axis:"h", lane:12, offset:4,    speed:0.35, color:"#4B7CB8", laneShift:0.4 },
  { id:7,  axis:"v", lane:0,  offset:1.5,  speed:0.25, color:"#F0C84A", laneShift:0.3 },
  { id:8,  axis:"v", lane:4,  offset:3,    speed:0.29, color:"#5AAAB8", laneShift:0.2 },
  { id:9,  axis:"v", lane:4,  offset:9,    speed:0.24, color:"#E8845A", laneShift:0.75 },
  { id:10, axis:"v", lane:8,  offset:0.5,  speed:0.33, color:"#4B7CB8", laneShift:0.35 },
  { id:11, axis:"v", lane:8,  offset:7,    speed:0.27, color:"#9898A8", laneShift:0.6 },
  { id:12, axis:"v", lane:12, offset:5,    speed:0.31, color:"#F0C84A", laneShift:0.45 },
  { id:13, axis:"v", lane:12, offset:11,   speed:0.38, color:"#5AAAB8", laneShift:0.7 },
];

function carPos(car: Car, f: number) {
  const t = ((f * car.speed / 30) + car.offset) % GRID;
  if (car.axis === "h") return iso(t, car.lane + car.laneShift, 0.15);
  return iso(car.lane + car.laneShift, t, 0.15);
}

// ── PEOPLE SYSTEM ─────────────────────────────────────────────────────────────
type Person = {
  id: number;
  axis: "h" | "v";
  lane: number;
  shift: number;
  offset: number;
  speed: number;
  color: string;
};

const PERSON_COLORS = ["#E8845A","#4B7CB8","#F0C84A","#5AAAB8","#EECCBB","#88AACC","#FFCCAA"];
const PERSON_DEFS: Person[] = Array.from({ length: 24 }, (_, i) => {
  const lanes = [0,4,8,12];
  return {
    id: i,
    axis: i % 2 === 0 ? "h" : "v",
    lane: lanes[i % 4],
    shift: 0.1 + (i % 5) * 0.16,
    offset: (i * 0.41) % GRID,
    speed: 0.06 + (i % 6) * 0.015,
    color: PERSON_COLORS[i % PERSON_COLORS.length],
  };
});

// ── SMOKE SYSTEM ──────────────────────────────────────────────────────────────
function smokeOpacityAt(chimneyIdx: number, particleIdx: number, f: number): { x: number; y: number; r: number; opacity: number } {
  const seed = chimneyIdx * 17 + particleIdx * 7;
  const period = 40 + (seed % 25);
  const phase = ((f + seed * 11) % period) / period;
  const [cc, cr, ce] = CHIMNEY_POS[chimneyIdx];
  const base = iso(cc, cr, ce);
  const driftX = phase * (15 + (seed % 25)) * Math.sign(Math.sin(seed * 1.7));
  const driftY = -phase * (50 + (seed % 40));
  return {
    x: base.x + driftX + Math.sin(seed * 2.3 + f * 0.02) * 5 * phase,
    y: base.y + driftY,
    r: 3 + phase * 14,
    opacity: (1 - phase) * 0.55,
  };
}

// ── SKY ───────────────────────────────────────────────────────────────────────
const Sky: React.FC<{ frame: number; dp: number }> = ({ frame, dp }) => {
  const isDusk = frame >= 480 && frame <= 750;
  const duskT = isDusk
    ? (frame < 620 ? (frame - 480) / 140 : (750 - frame) / 130)
    : 0;

  const skyTop = isDusk
    ? `hsl(${275 - duskT*55}, ${35 + duskT*35}%, ${8 + duskT*18}%)`
    : dp > 0.5
      ? "#1655A8"
      : "#030818";

  const skyBot = isDusk
    ? `hsl(${20 + duskT*8}, ${65 + duskT*25}%, ${38 + duskT*18}%)`
    : dp > 0.5
      ? "#87CEEB"
      : "#0A1840";

  // Sun arc: travels left→right over 1200 frames
  const sunT = interpolate(frame, [0, 1200], [-0.1, 1.1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const sunX = 150 + sunT * 1620;
  const sunY = 320 - Math.sin(Math.max(0, Math.min(1, sunT)) * Math.PI) * 260;
  const sunOpacity = dp;

  // Moon arc offset by half cycle
  const moonT = ((sunT + 0.5) % 1.2) - 0.1;
  const moonX = 150 + moonT * 1620;
  const moonY = 320 - Math.sin(Math.max(0, Math.min(1, moonT)) * Math.PI) * 260;
  const moonOpacity = Math.max(0, 1 - dp * 1.8);

  const starsOpacity = Math.max(0, 1 - dp * 2.5);

  const cloudOffsets = [0, 520, 1040, 1580];

  return (
    <svg width={1920} height={560} style={{ position: "absolute", top: 0, left: 0 }}>
      <defs>
        <linearGradient id="skyG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={skyTop} />
          <stop offset="100%" stopColor={skyBot} />
        </linearGradient>
        <radialGradient id="sunG" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#FFFFFF" stopOpacity="1" />
          <stop offset="35%"  stopColor="#FFE080" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#FF8020" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="moonG" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#E8EEFF" stopOpacity="1" />
          <stop offset="55%"  stopColor="#8890CC" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#224488" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Sky gradient */}
      <rect width={1920} height={560} fill="url(#skyG)" />

      {/* Stars */}
      {starsOpacity > 0.04 && Array.from({ length: 30 }, (_, i) => (
        <circle
          key={i}
          cx={(i * 63 + 44) % 1900}
          cy={(i * 41 + 18) % 320}
          r={0.6 + (i % 3) * 0.5}
          fill="white"
          opacity={starsOpacity * (0.4 + (i % 3) * 0.2)}
        />
      ))}

      {/* Moon */}
      {moonOpacity > 0.03 && moonY < 520 && (
        <g transform={`translate(${moonX},${moonY})`} opacity={moonOpacity}>
          <circle cx={0} cy={0} r={70} fill="url(#moonG)" />
          <circle cx={0} cy={0} r={20} fill="#D8E0F8" />
          <circle cx={-6} cy={-5} r={5} fill="#B0B8D8" opacity={0.7} />
          <circle cx={7}  cy={4}  r={3} fill="#B0B8D8" opacity={0.6} />
        </g>
      )}

      {/* Sun */}
      {sunOpacity > 0.05 && sunY < 520 && (
        <g transform={`translate(${sunX},${sunY})`} opacity={sunOpacity}>
          <circle cx={0} cy={0} r={100} fill="url(#sunG)" />
          <circle cx={0} cy={0} r={28}  fill="#FFF8CC" />
          <circle cx={0} cy={0} r={22}  fill="#FFEE80" />
        </g>
      )}

      {/* Clouds */}
      {cloudOffsets.map((baseX, i) => {
        const cx = ((baseX + frame * (0.25 + i * 0.08)) % 2300) - 200;
        const cy = 75 + i * 55;
        const cloudOpacity = interpolate(dp, [0.1, 0.5], [0.15, 0.72], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        return (
          <g key={i} transform={`translate(${cx},${cy})`} opacity={cloudOpacity}>
            <ellipse cx={0}   cy={0}  rx={85} ry={32} fill="white" opacity={0.88} />
            <ellipse cx={-55} cy={8}  rx={55} ry={24} fill="white" opacity={0.82} />
            <ellipse cx={65}  cy={6}  rx={60} ry={26} fill="white" opacity={0.82} />
            <ellipse cx={20}  cy={-12} rx={45} ry={20} fill="white" opacity={0.75} />
          </g>
        );
      })}
    </svg>
  );
};

// ── CITY BASE LAYER ───────────────────────────────────────────────────────────
const CityBase: React.FC<{ dp: number }> = ({ dp }) => (
  <svg width={1920} height={1080} style={{ position: "absolute", top: 0, left: 0 }}>
    <GroundTiles />
    <ParkDetails />
    {BUILDINGS.map(b => <BuildingEl key={`b${b.col}-${b.row}`} b={b} dp={dp} />)}
  </svg>
);

// ── CHIMNEY STACKS ────────────────────────────────────────────────────────────
const ChimneyStacks: React.FC = () => (
  <svg width={1920} height={1080} style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}>
    {CHIMNEY_POS.map(([cc, cr, ce], i) => {
      const top = iso(cc, cr, ce);
      const bot = iso(cc, cr, ce - 1.5);
      return (
        <g key={i}>
          <line x1={top.x} y1={top.y} x2={bot.x} y2={bot.y + 8} stroke="#888" strokeWidth={8} strokeLinecap="round" />
          <circle cx={top.x} cy={top.y} r={5} fill="#666" />
        </g>
      );
    })}
  </svg>
);

// ── CARS ──────────────────────────────────────────────────────────────────────
const Cars: React.FC<{ frame: number; dp: number }> = ({ frame, dp }) => {
  const headlightOpacity = Math.max(0, (1 - dp) * 0.95);
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}>
      {CAR_DEFS.map(car => {
        const p = carPos(car, frame);
        const horiz = car.axis === "h";
        const rw = horiz ? 28 : 14;
        const rh = horiz ? 10 : 22;
        return (
          <g key={car.id} transform={`translate(${p.x},${p.y})`}>
            {/* Car shadow */}
            <ellipse cx={2} cy={4} rx={rw * 0.7} ry={rh * 0.4} fill="black" opacity={0.25} />
            {/* Body */}
            <ellipse cx={0} cy={0} rx={rw} ry={rh} fill={car.color} opacity={0.95} />
            {/* Roof */}
            <ellipse cx={0} cy={-rh * 0.6} rx={rw * 0.55} ry={rh * 0.55} fill={car.color} opacity={0.85} />
            {/* Windshield */}
            <ellipse cx={0} cy={-rh * 0.6} rx={rw * 0.3} ry={rh * 0.32} fill="#99CCEE" opacity={0.7} />
            {/* Headlights */}
            {headlightOpacity > 0.05 && (
              <>
                <circle cx={horiz ? rw - 3 : 0} cy={horiz ? 0 : -(rh - 3)} r={6} fill="#FFEEAA" opacity={headlightOpacity} />
                <circle cx={horiz ? -(rw - 3) : 0} cy={horiz ? 0 : rh - 3} r={4} fill="#FF4422" opacity={headlightOpacity * 0.8} />
              </>
            )}
          </g>
        );
      })}
    </svg>
  );
};

// ── PEOPLE ────────────────────────────────────────────────────────────────────
const People: React.FC<{ frame: number }> = ({ frame }) => (
  <svg width={1920} height={1080} style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}>
    {PERSON_DEFS.map(p => {
      const t = ((frame * p.speed / 30) + p.offset) % GRID;
      const pos = p.axis === "h"
        ? iso(t, p.lane + p.shift, 0.05)
        : iso(p.lane + p.shift, t, 0.05);
      const bob = Math.sin(frame * 0.35 + p.id * 1.57) * 2;
      return (
        <g key={p.id} transform={`translate(${pos.x},${pos.y + bob})`}>
          {/* Shadow */}
          <ellipse cx={1} cy={4} rx={4} ry={2} fill="black" opacity={0.18} />
          {/* Body */}
          <ellipse cx={0} cy={0} rx={4} ry={6} fill={p.color} opacity={0.92} />
          {/* Head */}
          <circle cx={0} cy={-8} r={3.5} fill="#F5CBA7" opacity={0.95} />
        </g>
      );
    })}
  </svg>
);

// ── SMOKE ─────────────────────────────────────────────────────────────────────
const Smoke: React.FC<{ frame: number; dp: number }> = ({ frame, dp }) => {
  const baseOpacity = 0.35 + (1 - dp) * 0.25;
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}>
      <defs>
        <radialGradient id="smokeG" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#C8C8C8" stopOpacity="1" />
          <stop offset="100%" stopColor="#C8C8C8" stopOpacity="0" />
        </radialGradient>
      </defs>
      {CHIMNEY_POS.map((_, ci) =>
        Array.from({ length: 10 }, (__, pi) => {
          const s = smokeOpacityAt(ci, pi, frame);
          return (
            <circle key={`s${ci}-${pi}`} cx={s.x} cy={s.y} r={s.r} fill="url(#smokeG)" opacity={s.opacity * baseOpacity} />
          );
        })
      )}
    </svg>
  );
};

// ── STREET LAMPS ──────────────────────────────────────────────────────────────
const StreetLamps: React.FC<{ dp: number }> = ({ dp }) => {
  const glow = Math.max(0, (1 - dp) * 0.85);
  if (glow < 0.03) return null;

  const lamps: { col: number; row: number }[] = [];
  [0, 4, 8, 12].forEach(rl => {
    for (let i = 1; i < GRID - 1; i += 2) {
      if (!ROADS.has(i)) {
        lamps.push({ col: rl, row: i });
        lamps.push({ col: i, row: rl });
      }
    }
  });

  return (
    <svg width={1920} height={1080} style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}>
      <defs>
        <radialGradient id="lampG" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#FFDD88" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#FF9900" stopOpacity="0" />
        </radialGradient>
      </defs>
      {lamps.map((lp, i) => {
        const p = iso(lp.col + 0.5, lp.row + 0.5, 0.4);
        return (
          <g key={i} opacity={glow}>
            <circle cx={p.x} cy={p.y} r={36} fill="url(#lampG)" />
            <circle cx={p.x} cy={p.y} r={5}  fill="#FFEE88" />
          </g>
        );
      })}
    </svg>
  );
};

// ── FOG LAYER ─────────────────────────────────────────────────────────────────
const Fog: React.FC<{ frame: number; dp: number }> = ({ frame, dp }) => {
  const fogStrength = Math.max(0, (1 - dp) * 0.38);
  if (fogStrength < 0.02) return null;
  const shift = (frame * 0.25) % 500;
  return (
    <>
      <div style={{
        position: "absolute", inset: 0,
        background: `linear-gradient(108deg, transparent 15%, rgba(80,100,160,${fogStrength}) 45%, rgba(60,80,140,${fogStrength * 0.6}) 65%, transparent 85%)`,
        transform: `translateX(${shift - 250}px)`,
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", inset: 0,
        background: `linear-gradient(to top, rgba(10,20,60,${fogStrength * 0.5}) 0%, transparent 40%)`,
        pointerEvents: "none",
      }} />
    </>
  );
};

// ── CITY AMBIENT GLOW (night) ─────────────────────────────────────────────────
const AmbientGlow: React.FC<{ dp: number }> = ({ dp }) => {
  const glow = Math.max(0, (1 - dp) * 0.45);
  if (glow < 0.02) return null;
  return (
    <div style={{
      position: "absolute", inset: 0,
      background: `radial-gradient(ellipse 1000px 380px at 960px 580px, rgba(255,180,60,${glow * 0.35}) 0%, transparent 70%)`,
      pointerEvents: "none",
    }} />
  );
};

// ── NIGHT VIGNETTE ────────────────────────────────────────────────────────────
const NightVignette: React.FC<{ dp: number }> = ({ dp }) => {
  const darkness = Math.max(0, (1 - dp) * 0.6);
  return (
    <div style={{
      position: "absolute", inset: 0,
      background: `rgba(4,8,30,${darkness})`,
      pointerEvents: "none",
    }} />
  );
};

// ── UI OVERLAYS ───────────────────────────────────────────────────────────────
const TimeIndicator: React.FC<{ frame: number; dp: number }> = ({ frame, dp }) => {
  const breakpoints: [number, string][] = [
    [0,    "5:30 AM"],
    [150,  "9:00 AM"],
    [300,  "12:00 PM"],
    [500,  "3:30 PM"],
    [620,  "6:30 PM"],
    [700,  "8:00 PM"],
    [800,  "11:00 PM"],
    [1000, "2:00 AM"],
    [1100, "4:30 AM"],
  ];
  let label = "6:00 AM";
  for (let i = breakpoints.length - 1; i >= 0; i--) {
    if (frame >= breakpoints[i][0]) { label = breakpoints[i][1]; break; }
  }

  const textColor = dp > 0.55 ? "#1A2040" : "#CCE0FF";
  const bgColor   = dp > 0.55 ? "rgba(255,255,255,0.18)" : "rgba(0,4,24,0.55)";
  const border    = dp > 0.55 ? "rgba(0,0,0,0.12)" : "rgba(100,140,220,0.35)";

  return (
    <div style={{
      position: "absolute", top: 44, right: 64,
      background: bgColor,
      borderRadius: 14,
      padding: "10px 24px",
      fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
      fontSize: 26, fontWeight: 700,
      color: textColor,
      border: `1px solid ${border}`,
      letterSpacing: 1,
    }}>
      {label}
    </div>
  );
};

const TitleCard: React.FC<{ frame: number }> = ({ frame }) => {
  const opacity = interpolate(frame, [0, 40, 160, 220], [0, 1, 1, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  if (opacity < 0.01) return null;
  return (
    <div style={{
      position: "absolute", bottom: 90, left: 80, opacity,
      fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
    }}>
      <div style={{ fontSize: 52, fontWeight: 800, color: "#F0C84A", letterSpacing: -1 }}>
        ISOMETRIC CITY
      </div>
      <div style={{ fontSize: 22, fontWeight: 400, color: "#88AABB", marginTop: 6 }}>
        A Day in the Life  •  40s
      </div>
    </div>
  );
};

// ── ROOT COMPOSITION ──────────────────────────────────────────────────────────
export const IsometricCity: React.FC = () => {
  const frame = useCurrentFrame();
  const dp = dayPhase(frame);

  const cityBrightness = 0.22 + dp * 0.78;
  const citySaturate   = 0.55 + dp * 0.45;
  const cityFilter     = `brightness(${cityBrightness.toFixed(3)}) saturate(${citySaturate.toFixed(3)})`;

  return (
    <AbsoluteFill style={{ background: "#020510", overflow: "hidden" }}>
      {/* Sky layer */}
      <Sky frame={frame} dp={dp} />

      {/* City geometry with day/night filter */}
      <div style={{ position: "absolute", inset: 0, filter: cityFilter }}>
        <CityBase dp={dp} />
        <ChimneyStacks />
      </div>

      {/* Street lamps — not filtered (always warm) */}
      <StreetLamps dp={dp} />

      {/* Moving elements — also filtered for night */}
      <div style={{ position: "absolute", inset: 0, filter: cityFilter }}>
        <Cars frame={frame} dp={dp} />
        <People frame={frame} />
      </div>

      {/* Smoke — semi-independent of day filter */}
      <Smoke frame={frame} dp={dp} />

      {/* Atmospheric effects */}
      <Fog frame={frame} dp={dp} />
      <AmbientGlow dp={dp} />
      <NightVignette dp={dp} />

      {/* UI */}
      <TitleCard frame={frame} />
      <TimeIndicator frame={frame} dp={dp} />
    </AbsoluteFill>
  );
};
