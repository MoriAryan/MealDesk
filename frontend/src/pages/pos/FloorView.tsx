import React, { useMemo, useState, useRef, useEffect } from "react";
import {
  Users, MousePointerClick, ChevronLeft, Plus,
  Pencil, Trash2, Check, X, Building2, Square
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { DiningTable, Floor } from "../../api/types";
import { createFloor, updateFloor, deleteFloor } from "../../api/floors";
import { createTable, updateTable, deleteTable } from "../../api/tables";
import { useAuth } from "../../auth/AuthProvider";

type TableShape = "round" | "square" | "rectangle";

interface TableDef {
  id: string;
  name: string;
  seats: number;
  shape: TableShape;
  status?: "occupied" | "free";
  floor: string;
}

const DEFAULT_TABLES: TableDef[] = [
  { id: "table-1", name: "Table 1", seats: 2, shape: "round", status: "free", floor: "Main Floor" },
  { id: "table-2", name: "Table 2", seats: 2, shape: "round", status: "free", floor: "Main Floor" },
  { id: "table-3", name: "Table 3", seats: 4, shape: "square", status: "free", floor: "Main Floor" },
  { id: "table-4", name: "Table 4", seats: 4, shape: "square", status: "free", floor: "Main Floor" },
  { id: "table-7", name: "Bar 1",  seats: 2, shape: "rectangle", status: "free", floor: "Main Floor" },
  { id: "table-5", name: "Patio 1", seats: 6, shape: "rectangle", status: "free", floor: "Patio" },
  { id: "table-6", name: "Patio 2", seats: 2, shape: "round", status: "free", floor: "Patio" },
];

// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// Full 3D Interactive Building
// â€¢ True orthographic 3D→2D projection (rotate around Y=azimuth, X=elevation)
// â€¢ Painter's algorithm: faces sorted back→front every frame
// â€¢ Per-floor: ledge bands, 3-front/2-side windows with cross-frames, ground door
// â€¢ Roof: parapet walls + HVAC box
// â€¢ No buttons, no slider — drag freely to orbit in all directions
// ─────────────────────────────────────────────────────────────────────────────
function IsoBuilding({ floorCount, hoveredFloorIdx = null }: { floorCount: number; hoveredFloorIdx?: number | null }) {
  /* ── Building config ──────────────────────────── */
  const W = 140, D = 100, H = 56;
  const safe = Math.max(1, floorCount);
  const TH   = safe * H;

  /* ── Orbit state (refs for RAF, state for renders) ── */
  const azRef  = useRef(-0.62);
  const elRef  = useRef(0.50);
  const tgAz   = useRef(-0.62);
  const tgEl   = useRef(0.50);
  const [viewAz, setViewAz] = useState(-0.62);
  const [viewEl, setViewEl] = useState(0.50);
  const dragging = useRef(false);
  const lastPt   = useRef({ x: 0, y: 0 });
  const rafId    = useRef<number | null>(null);

  useEffect(() => {
    const loop = () => {
      const lf = 0.09;
      const na = azRef.current + (tgAz.current - azRef.current) * lf;
      const ne = elRef.current + (tgEl.current - elRef.current) * lf;
      const mv = Math.abs(na - azRef.current) + Math.abs(ne - elRef.current);
      azRef.current = na; elRef.current = ne;
      if (mv > 0.0004) { setViewAz(na); setViewEl(ne); }
      rafId.current = requestAnimationFrame(loop);
    };
    rafId.current = requestAnimationFrame(loop);
    return () => { if (rafId.current) cancelAnimationFrame(rafId.current); };
  }, []);

  const onPD = (e: React.PointerEvent) => {
    dragging.current = true;
    lastPt.current = { x: e.clientX, y: e.clientY };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPM = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - lastPt.current.x;
    const dy = e.clientY - lastPt.current.y;
    tgAz.current += dx * 0.009;
    tgEl.current = Math.max(0.04, Math.min(1.48, tgEl.current - dy * 0.007));
    lastPt.current = { x: e.clientX, y: e.clientY };
  };
  const onPU = () => { dragging.current = false; };

  /* ── 3D → 2D projection (orthographic) ─────────── */
  const az = viewAz, el = viewEl;
  const proj = (wx: number, wy: number, wz: number) => {
    // Center the building so it rotates around its middle
    const x = wx - W / 2;
    const y = wy - TH * 0.38;
    const z = wz - D / 2;
    // Rotate around Y axis (azimuth / yaw)
    const x1 = x * Math.cos(az) + z * Math.sin(az);
    const z1 = -x * Math.sin(az) + z * Math.cos(az);
    // Rotate around X axis (elevation / pitch)
    const x2 = x1;
    const y2 = y * Math.cos(el) - z1 * Math.sin(el);
    const z2 = y * Math.sin(el) + z1 * Math.cos(el);
    return { x: x2, y: -y2, d: z2 }; // flip Y for SVG
  };

  const pt  = (x: number, y: number, z: number) => {
    const p = proj(x, y, z);
    return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
  };
  const pts = (cs: [number, number, number][]) =>
    cs.map(([x, y, z]) => pt(x, y, z)).join(' ');
  const dep = (cs: [number, number, number][]) =>
    cs.reduce((s, [x, y, z]) => s + proj(x, y, z).d, 0) / cs.length;
  const seg = (a: [number,number,number], b: [number,number,number]) => {
    const pa = proj(...a), pb = proj(...b);
    return { x1: pa.x.toFixed(1), y1: pa.y.toFixed(1), x2: pb.x.toFixed(1), y2: pb.y.toFixed(1), d: (pa.d + pb.d) / 2 };
  };

  /* ── Face visibility (dot product with view direction) ── */
  // view_dir in world space = (-cos(el)sin(az), sin(el), cos(el)cos(az))
  const vdx = -Math.cos(el) * Math.sin(az);
  const vdy =  Math.sin(el);
  const vdz =  Math.cos(el) * Math.cos(az);

  // Front face at z=D has outward normal (0,0,+1) → visible when vdz > 0
  // Back  face at z=0 has outward normal (0,0,-1) → visible when vdz < 0
  // Right face at x=W has outward normal (+1,0,0) → visible when vdx > 0
  // Left  face at x=0 has outward normal (-1,0,0) → visible when vdx < 0
  // Top   face at y=TH has outward normal (0,+1,0) → visible when vdy > 0
  const SF = vdz >  0.01; // showFront
  const SB = vdz < -0.01; // showBack
  const SR = vdx >  0.01; // showRight
  const SL = vdx < -0.01; // showLeft
  const ST = vdy >  0.01; // showTop

  /* ── Polygon collector (painter's algorithm) ─────── */
  type Prim = { d: number; el: React.ReactElement };
  const prims: Prim[] = [];
  let k = 0;

  const addPoly = (
    cs: [number, number, number][],
    fill: string, stroke: string, sw = 1.0,
    baseDepth?: number, // IF provided, overrides the centroid depth calculation
    subZ = 0,           // Minor logical offset used to sort elements mathematically on the same plane
    extra: Partial<React.SVGProps<SVGPolygonElement>> = {}
  ) => {
    const d = (baseDepth !== undefined ? baseDepth : dep(cs)) + subZ * 0.05;
    prims.push({ d, el: <polygon key={k++} points={pts(cs)} fill={fill} stroke={stroke} strokeWidth={sw} {...extra} /> });
  };

  const addLine = (
    a: [number,number,number], b: [number,number,number],
    stroke: string, sw = 1.2,
    baseDepth?: number,
    subZ = 0
  ) => {
    const s = seg(a, b);
    const d = (baseDepth !== undefined ? baseDepth : s.d) + subZ * 0.05;
    prims.push({ d, el: <line key={k++} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke={stroke} strokeWidth={sw} strokeLinecap="round" /> });
  };

  /* ── Color palette ────────────────────────────────── */
  const C = {
    front : "#1c1c25",
    back  : "#12121a",
    right : "#171720",
    left  : "#14141c",
    top   : "#20202c",
    ledge : "#232330",
    win   : "rgba(255,140,60,0.08)",
    winS  : "#2e2e46",
    edge  : "#38384e",
    soft  : "#2c2c42",
    gnd   : "#0b0b12",
    accent: "#ff8c42",
  };

  /* ── Helper for Face Centroid Depths ─────────────── */
  const fcD = (cx: number, cy: number, cz: number) => proj(cx, cy, cz).d;

  /* ── Ground slab ──────────────────────────────────── */
  addPoly([[-18,0,-18],[W+18,0,-18],[W+18,0,D+18],[-18,0,D+18]], C.gnd, C.edge, 0.8);

  /* ── Top Roof Face ────────────────────────────────── */
  if (ST) addPoly([[0,TH,0],[W,TH,0],[W,TH,D],[0,TH,D]], C.top, C.edge);

  /* ── Per-floor rendering (Walls + Details) ───────── */
  const LH = 5;    // ledge height
  const WH = Math.round(H * 0.50); // window height
  const W3 = 22, W2 = 17; // window widths (front vs side)

  for (let i = 0; i < safe; i++) {
    const yB = i * H;           // floor bottom
    const yT = yB + H;          // floor top
    const yW = yB + LH + 8;     // window top
    const yWe = yW + WH;        // window bottom
    const isGnd = i === 0;

    // The depth of the exact center of each wall for THIS floor segment
    const cY = yB + H / 2;
    const d_F = fcD(W/2, cY, D);
    const d_R = fcD(W, cY, D/2);
    const d_L = fcD(0, cY, D/2);
    const d_B = fcD(W/2, cY, 0);

    /* Main wall segments */
    const isHovered = hoveredFloorIdx !== null && i === hoveredFloorIdx;
    const hoverTint = "rgba(249,115,22,0.22)";
    const frontFill = isHovered ? hoverTint : C.front;
    const backFill  = isHovered ? hoverTint : C.back;
    const rightFill = isHovered ? hoverTint : C.right;
    const leftFill  = isHovered ? hoverTint : C.left;

    if (SB) addPoly([[W,yB,0],[0,yB,0],[0,yT,0],[W,yT,0]], backFill,  C.edge, isHovered ? 1.2 : 1.0, d_B, 0);
    if (SL) addPoly([[0,yB,0],[0,yB,D],[0,yT,D],[0,yT,0]], leftFill,  C.edge, isHovered ? 1.2 : 1.0, d_L, 0);
    if (SR) addPoly([[W,yB,D],[W,yB,0],[W,yT,0],[W,yT,D]], rightFill, C.edge, isHovered ? 1.2 : 1.0, d_R, 0);
    if (SF) addPoly([[0,yB,D],[W,yB,D],[W,yT,D],[0,yT,D]], frontFill, C.edge, isHovered ? 1.2 : 1.0, d_F, 0);

    /* Front face details */
    if (SF) {
      addPoly([[0,yB,D],[W,yB,D],[W,yB+LH,D],[0,yB+LH,D]], C.ledge, C.soft, 0.7, d_F, 1);
      const gF = (W - 3 * W3) / 4;
      for (let w = 0; w < 3; w++) {
        if (isGnd && w === 1) continue; // door gap
        const wx0 = gF + w * (W3 + gF);
        const wx1 = wx0 + W3;
        addPoly([[wx0,yW,D],[wx1,yW,D],[wx1,yWe,D],[wx0,yWe,D]], C.win, C.winS, 0.8, d_F, 2);
        const my = (yW + yWe) / 2, mx = (wx0 + wx1) / 2;
        addLine([wx0,my,D],[wx1,my,D], C.winS, 0.45, d_F, 3);
        addLine([mx,yW,D],[mx,yWe,D], C.winS, 0.45, d_F, 3);
      }
      if (isGnd) {
        const dX = W / 2 - 11, dH = Math.round(H * 0.68);
        addPoly([[dX,0,D],[dX+22,0,D],[dX+22,dH,D],[dX,dH,D]], "rgba(0,0,0,0.6)", C.soft, 0.8, d_F, 2);
        // Door frame
        addPoly([[dX,dH-4,D],[dX+22,dH-4,D],[dX+22,dH,D],[dX,dH,D]], C.ledge, C.soft, 0.6, d_F, 3);
      }
    }

    /* Right face details */
    if (SR) {
      addPoly([[W,yB,D],[W,yB,0],[W,yB+LH,0],[W,yB+LH,D]], C.ledge, C.soft, 0.7, d_R, 1);
      const gR = (D - 2 * W2) / 3;
      for (let w = 0; w < 2; w++) {
        const wz1 = D - gR - w * (W2 + gR);
        const wz0 = wz1 - W2;
        addPoly([[W,yW,wz0],[W,yW,wz1],[W,yWe,wz1],[W,yWe,wz0]], C.win, C.winS, 0.8, d_R, 2);
        const my = (yW + yWe) / 2;
        addLine([W,my,wz0],[W,my,wz1], C.winS, 0.45, d_R, 3);
      }
    }

    /* Left face details */
    if (SL) {
      addPoly([[0,yB,0],[0,yB,D],[0,yB+LH,D],[0,yB+LH,0]], C.ledge, C.soft, 0.7, d_L, 1);
      const gL = (D - 2 * W2) / 3;
      for (let w = 0; w < 2; w++) {
        const wz0 = gL + w * (W2 + gL);
        const wz1 = wz0 + W2;
        addPoly([[0,yW,wz0],[0,yW,wz1],[0,yWe,wz1],[0,yWe,wz0]], C.win, C.winS, 0.8, d_L, 2);
        const my = (yW + yWe) / 2;
        addLine([0,my,wz0],[0,my,wz1], C.winS, 0.45, d_L, 3);
      }
    }

    /* Back face details */
    if (SB) {
      addPoly([[W,yB,0],[0,yB,0],[0,yB+LH,0],[W,yB+LH,0]], C.ledge, C.soft, 0.7, d_B, 1);
      const gBk = (W - 3 * W3) / 4;
      for (let w = 0; w < 3; w++) {
        const wx1 = W - gBk - w * (W3 + gBk);
        const wx0 = wx1 - W3;
        addPoly([[wx1,yW,0],[wx0,yW,0],[wx0,yWe,0],[wx1,yWe,0]], C.win, C.winS, 0.8, d_B, 2);
      }
    }

    /* Horizontal floor lines on top face (since top face is 1 mesh, lines just go on top of it) */
    if (ST && i > 0) addLine([0,yB,0],[W,yB,0], C.soft, 0.5);
  }

  /* ── Roof details ─────────────────────────────────── */
  if (ST) {
    // Parapet walls at roof edge
    const PH = 5;
    if (SF || ST) addPoly([[0,TH,D],[W,TH,D],[W,TH+PH,D],[0,TH+PH,D]], C.ledge, C.edge, 0.8, undefined, 0);
    if (SR || ST) addPoly([[W,TH,D],[W,TH,0],[W,TH+PH,0],[W,TH+PH,D]], C.ledge, C.edge, 0.8, undefined, 0);
    if (SL || ST) addPoly([[0,TH,0],[0,TH,D],[0,TH+PH,D],[0,TH+PH,0]], C.ledge, C.edge, 0.8, undefined, 0);
    if (SB || ST) addPoly([[W,TH,0],[0,TH,0],[0,TH+PH,0],[W,TH+PH,0]], C.ledge, C.edge, 0.8, undefined, 0);
    // HVAC box top + visible walls
    const hx0=W*0.28,hx1=W*0.56, hz0=D*0.28,hz1=D*0.62, hH=14;
    addPoly([[hx0,TH,hz0],[hx1,TH,hz0],[hx1,TH,hz1],[hx0,TH,hz1]], C.ledge, C.edge, 0.8, undefined, 1);
    if (SF) addPoly([[hx0,TH,hz1],[hx1,TH,hz1],[hx1,TH+hH,hz1],[hx0,TH+hH,hz1]], "#1a1a26", C.edge, 0.8, undefined, 2);
    if (SR) addPoly([[hx1,TH,hz0],[hx1,TH,hz1],[hx1,TH+hH,hz1],[hx1,TH+hH,hz0]], "#141420", C.edge, 0.8, undefined, 2);
    // Water tank
    const tx0=W*0.65,tx1=W*0.82, tz0=D*0.3,tz1=D*0.55, tH=18;
    addPoly([[tx0,TH,tz0],[tx1,TH,tz0],[tx1,TH,tz1],[tx0,TH,tz1]], C.ledge, C.edge, 0.7, undefined, 1);
    if (SF) addPoly([[tx0,TH,tz1],[tx1,TH,tz1],[tx1,TH+tH,tz1],[tx0,TH+tH,tz1]], "#181824", C.edge, 0.7, undefined, 2);
    if (SR) addPoly([[tx1,TH,tz0],[tx1,TH,tz1],[tx1,TH+tH,tz1],[tx1,TH+tH,tz0]], "#121220", C.edge, 0.7, undefined, 2);
  }

  /* ── Vertical corner edges (prominent lines) ──────── */
  if (SF || SR) addLine([W,0,D],[W,TH,D], C.edge, 1.6);
  if (SF || SL) addLine([0,0,D],[0,TH,D], C.edge, 1.6);
  if (SB || SR) addLine([W,0,0],[W,TH,0], C.edge, 1.2);
  if (SB || SL) addLine([0,0,0],[0,TH,0], C.edge, 1.2);
  // Bottom base perimeter
  if (SF) addLine([0,0,D],[W,0,D], C.edge, 1.2);
  if (SR) addLine([W,0,0],[W,0,D], C.edge, 1.0);
  if (SL) addLine([0,0,0],[0,0,D], C.edge, 1.0);
  if (SB) addLine([0,0,0],[W,0,0], C.edge, 0.9);

  /* ── Accent line on top front edge ───────────────── */
  if (SF || ST) addLine([0,TH,D],[W,TH,D], C.accent, 1.6);

  /* ── Sort back→front and render ──────────────────── */
  prims.sort((a, b) => a.d - b.d);

  return (
    <div className="flex flex-col h-full select-none">
      {/* Orbit viewport */}
      <div
        className="flex-1 w-full flex items-center justify-center cursor-grab active:cursor-grabbing"
        onPointerDown={onPD}
        onPointerMove={onPM}
        onPointerUp={onPU}
        onPointerLeave={onPU}
      >
        <svg
          width="100%"
          viewBox={(() => {
            // Dynamic viewBox: tighter crop for fewer floors, zoom out for more
            const baseW = 380;
            const topPad = Math.min(220, 80 + safe * 40);
            const totalH = Math.max(260, safe * 95);
            return `-${baseW/2} -${topPad} ${baseW} ${totalH}`;
          })()}
          style={{ maxHeight: "360px", overflow: "visible" }}
        >
          {prims.map((p, i) => <g key={i}>{p.el}</g>)}
        </svg>
      </div>

      {/* Hint */}
      <div className="text-center pb-5">
        <div className="flex items-center justify-center gap-1.5 opacity-35">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted">
            <path d="M12 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"/><path d="M12 8v8M8 12H4M20 12h-4M7 7L4 4M17 17l3 3M7 17l-3 3M17 7l3-3"/>
          </svg>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted">
            {safe} {safe === 1 ? 'Floor' : 'Floors'} Â· Drag to orbit
          </p>
        </div>
      </div>
    </div>
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// Graphic table visual (top-down seat diagram)
// ─────────────────────────────────────────────────────────────────────────────
function GraphicTable({ shape, seats, isActive }: { shape: TableShape; seats: number; isActive: boolean }) {
  const tableColor = isActive
    ? "bg-accent border-accent shadow-accent/30"
    : "bg-panel border-border/80 shadow-black/10 group-hover:border-accent/60 group-hover:shadow-[0_0_20px_rgba(var(--color-accent-rgb),0.3)]";
  const chairColor = isActive
    ? "bg-accent/80 border-accent"
    : "bg-border/50 border-border group-hover:bg-accent/30 group-hover:border-accent/50";

  const chairs: React.ReactNode[] = [];
  if (shape === "round" || shape === "square") {
    chairs.push(<div key="t" className={`absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-3 rounded-t-full border-t border-x transition-colors duration-500 ${chairColor}`} />);
    chairs.push(<div key="b" className={`absolute -bottom-3 left-1/2 -translate-x-1/2 w-8 h-3 rounded-b-full border-b border-x transition-colors duration-500 ${chairColor}`} />);
    if (seats >= 4) {
      chairs.push(<div key="l" className={`absolute -left-3 top-1/2 -translate-y-1/2 w-3 h-8 rounded-l-full border-l border-y transition-colors duration-500 ${chairColor}`} />);
      chairs.push(<div key="r" className={`absolute -right-3 top-1/2 -translate-y-1/2 w-3 h-8 rounded-r-full border-r border-y transition-colors duration-500 ${chairColor}`} />);
    }
  } else {
    const wide = seats >= 6;
    chairs.push(<div key="t1" className={`absolute -top-3 ${wide ? "left-1/3" : "left-1/2"} -translate-x-1/2 w-8 h-3 rounded-t-full border-t border-x transition-colors duration-500 ${chairColor}`} />);
    chairs.push(<div key="b1" className={`absolute -bottom-3 ${wide ? "left-1/3" : "left-1/2"} -translate-x-1/2 w-8 h-3 rounded-b-full border-b border-x transition-colors duration-500 ${chairColor}`} />);
    if (wide) {
      chairs.push(<div key="t2" className={`absolute -top-3 left-2/3 -translate-x-1/2 w-8 h-3 rounded-t-full border-t border-x transition-colors duration-500 ${chairColor}`} />);
      chairs.push(<div key="b2" className={`absolute -bottom-3 left-2/3 -translate-x-1/2 w-8 h-3 rounded-b-full border-b border-x transition-colors duration-500 ${chairColor}`} />);
      chairs.push(<div key="l" className={`absolute -left-3 top-1/2 -translate-y-1/2 w-3 h-8 rounded-l-full border-l border-y transition-colors duration-500 ${chairColor}`} />);
      chairs.push(<div key="r" className={`absolute -right-3 top-1/2 -translate-y-1/2 w-3 h-8 rounded-r-full border-r border-y transition-colors duration-500 ${chairColor}`} />);
    }
  }

  return (
    <div
      className={`relative flex items-center justify-center transition-all duration-500 shadow-xl ${
        shape === "round"
          ? "w-24 h-24 rounded-full"
          : shape === "square"
          ? "w-28 h-28 rounded-[2rem]"
          : "w-48 h-28 rounded-[2rem]"
      } border-[3px] ${tableColor}`}
    >
      <div className={`absolute inset-1 rounded-[inherit] border transition-colors duration-500 ${isActive ? "border-white/20 bg-white/10" : "border-ink/5 bg-ink/5 group-hover:border-accent/10"}`} />
      {chairs}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-white/20 blur-md rounded-full pointer-events-none transition-opacity duration-500 ${isActive ? "opacity-100" : "opacity-0 group-hover:opacity-40"}`} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────
interface Props {
  posConfigId: string | null;
  reloadData?: () => Promise<void>;
  floors?: Floor[];
  tables?: DiningTable[];
  activeTableId: string | null;
  setActiveTableId: (id: string) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────
export function FloorView({
  posConfigId, reloadData,
  floors: inputFloors, tables: inputTables,
  activeTableId, setActiveTableId,
}: Props) {
  const { accessToken } = useAuth();
  const hasRealData = Boolean(inputFloors?.length);

  const floorsList = useMemo(() => {
    if (inputFloors && inputFloors.length > 0) {
      return inputFloors
        .map(f => ({ id: f.id, name: f.name, created_at: f.created_at ?? '', isReal: true }))
        .sort((a, b) => a.created_at.localeCompare(b.created_at));
    }
    if (!hasRealData && !posConfigId) {
      return Array.from(new Set(DEFAULT_TABLES.map(t => t.floor))).map(f => ({
        id: f, name: f, isReal: false,
      }));
    }
    return [];
  }, [inputFloors, hasRealData, posConfigId]);

  // ── Tier 1: floor overview state ──────────────────────────────────────────
  const [activeFloorId,   setActiveFloorId]   = useState<string | null>(null);
  const [isAddingFloor,   setIsAddingFloor]   = useState(false);
  const [newFloorName,    setNewFloorName]    = useState("");
  const [isSubmittingFloor, setIsSubmittingFloor] = useState(false);

  // Floor edit/delete state
  const [editingFloorId,   setEditingFloorId]   = useState<string | null>(null);
  const [editFloorName,    setEditFloorName]    = useState("");
  const [isSavingFloor,    setIsSavingFloor]    = useState(false);
  const [deletingFloorId,  setDeletingFloorId]  = useState<string | null>(null);
  
  // Floor hover state for 3D building
  const [hoveredFloorIdx,  setHoveredFloorIdx]  = useState<number | null>(null);

  // ── Tier 2: table state ───────────────────────────────────────────────────
  const [isAddingTable,     setIsAddingTable]     = useState(false);
  const [newTableNum,       setNewTableNum]       = useState("");
  const [newTableSeats,     setNewTableSeats]     = useState<number>(2);
  const [isSubmittingTable, setIsSubmittingTable] = useState(false);

  // edit
  const [editingTableId,   setEditingTableId]   = useState<string | null>(null);
  const [editTableNum,     setEditTableNum]     = useState("");
  const [editTableSeats,   setEditTableSeats]   = useState<number>(2);
  const [isSavingEdit,     setIsSavingEdit]     = useState(false);

  // delete
  const [deletingTableId,  setDeletingTableId]  = useState<string | null>(null);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleCreateFloor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !posConfigId || !newFloorName.trim()) return;
    setIsSubmittingFloor(true);
    try {
      await createFloor(accessToken, { posConfigId, name: newFloorName });
      setNewFloorName("");
      setIsAddingFloor(false);
      if (reloadData) await reloadData();
    } catch (err) { alert("Failed: " + String(err)); }
    finally { setIsSubmittingFloor(false); }
  };

  const handleUpdateFloor = async (floorId: string) => {
    if (!accessToken || !editFloorName.trim()) return;
    setIsSavingFloor(true);
    try {
      await updateFloor(accessToken, floorId, { name: editFloorName });
      setEditingFloorId(null);
      if (reloadData) await reloadData();
    } catch (err) { alert("Failed: " + String(err)); }
    finally { setIsSavingFloor(false); }
  };

  const handleDeleteFloor = async (floorId: string) => {
    if (!accessToken) return;
    if (!confirm("Delete this floor? All its tables will also be removed.")) return;
    setDeletingFloorId(floorId);
    try {
      await deleteFloor(accessToken, floorId);
      if (reloadData) await reloadData();
    } catch (err) { alert("Failed: " + String(err)); }
    finally { setDeletingFloorId(null); }
  };

  const handleCreateTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !posConfigId || !activeFloorId || !newTableNum.trim()) return;
    setIsSubmittingTable(true);
    try {
      await createTable(accessToken, { floorId: activeFloorId, tableNumber: newTableNum, seats: newTableSeats });
      setNewTableNum(""); setNewTableSeats(2); setIsAddingTable(false);
      if (reloadData) await reloadData();
    } catch (err) { alert("Failed: " + String(err)); }
    finally { setIsSubmittingTable(false); }
  };

  const startEdit = (table: TableDef) => {
    setEditingTableId(table.id);
    setEditTableNum(table.name);
    setEditTableSeats(table.seats);
  };

  const handleSaveEdit = async (tableId: string) => {
    if (!accessToken) return;
    setIsSavingEdit(true);
    try {
      await updateTable(accessToken, tableId, { tableNumber: editTableNum, seats: editTableSeats });
      setEditingTableId(null);
      if (reloadData) await reloadData();
    } catch (err) { alert("Failed: " + String(err)); }
    finally { setIsSavingEdit(false); }
  };

  const handleDelete = async (tableId: string) => {
    if (!accessToken) return;
    setDeletingTableId(tableId);
    try {
      await deleteTable(accessToken, tableId);
      if (reloadData) await reloadData();
    } catch (err) { alert("Failed: " + String(err)); }
    finally { setDeletingTableId(null); }
  };

  const getTablesForFloor = (floorIdOrName: string): TableDef[] => {
    if (!hasRealData && !posConfigId) {
      return DEFAULT_TABLES.filter(t => t.floor === floorIdOrName);
    }
    if (!inputTables) return [];
    return inputTables
      .filter(t => t.floor_id === floorIdOrName)
      .map(t => ({
        id: t.id,
        name: t.table_number,
        seats: t.seats,
        shape: t.seats >= 6 ? "rectangle" : t.seats >= 4 ? "square" : "round",
        status: t.active ? "free" : "occupied",
        floor: floorIdOrName,
      } as TableDef));
  };

  const activeFloorName = floorsList.find(f => f.id === activeFloorId)?.name ?? "";

  return (
    <div className="h-full w-full bg-bg overflow-hidden">
      <AnimatePresence mode="wait">
        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
            TIER 1: Floor overview — split panel
        â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
        {!activeFloorId ? (
          <motion.div
            key="overview"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: -60, filter: "blur(4px)" }}
            transition={{ duration: 0.35 }}
            className="flex flex-col-reverse lg:flex-row h-full overflow-hidden"
          >
            {/* ── Left: floor cards ─────────────────────────────────── */}
            <div className="flex-1 flex flex-col min-w-0 p-5 sm:p-8 md:p-10 overflow-y-auto lg:border-r border-border/40">
              <div className="mb-6 md:mb-8">
                <h2 className="text-2xl md:text-3xl font-black tracking-tight text-ink flex items-center gap-2 md:gap-3">
                  <Building2 className="text-accent shrink-0" size={24} />
                  Cafe Floors
                </h2>
                <p className="text-muted mt-1.5 pl-1 text-sm">
                  Select a zone to manage its tables and layout.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5">
                <AnimatePresence>
                  {floorsList.map((floor, idx) => {
                    const tableCount = getTablesForFloor(floor.id).length;
                    const isEdit = editingFloorId === floor.id;
                    const isDeleting = deletingFloorId === floor.id;
                    return (
                      <motion.div
                        layout
                        key={floor.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ delay: idx * 0.05, type: "spring", bounce: 0.3 }}
                        className="group relative h-40"
                        onMouseEnter={() => setHoveredFloorIdx(idx)}
                        onMouseLeave={() => setHoveredFloorIdx(null)}
                      >
                        {isEdit ? (
                          /* ── Inline floor editor ── */
                          <div className="h-40 flex flex-col justify-center rounded-2xl border-2 border-accent/50 bg-panel p-4 md:p-5 shadow-lg gap-2 md:gap-3">
                            <p className="text-[10px] md:text-[11px] font-black uppercase tracking-widest text-accent">Rename Floor</p>
                            <input
                              autoFocus
                              value={editFloorName}
                              onChange={e => setEditFloorName(e.target.value)}
                              onKeyDown={e => e.key === "Enter" && handleUpdateFloor(floor.id)}
                              className="w-full bg-bg border border-border rounded-xl px-3 py-2 md:py-2.5 text-sm text-ink focus:outline-none focus:border-accent font-semibold"
                            />
                            <div className="flex gap-2">
                              <button type="button" onClick={() => setEditingFloorId(null)} className="flex-1 py-1.5 md:py-2 text-xs font-bold uppercase border border-border rounded-xl hover:bg-bg text-muted"><X size={13} className="mx-auto" /></button>
                              <button disabled={isSavingFloor} onClick={() => handleUpdateFloor(floor.id)} className="flex-1 py-1.5 md:py-2 text-xs font-bold uppercase bg-accent text-white rounded-xl disabled:opacity-50"><Check size={13} className="mx-auto" /></button>
                            </div>
                          </div>
                        ) : (
                          /* ── Floor card ── */
                          <>
                            <button
                              onClick={() => setActiveFloorId(floor.id)}
                              className="w-full h-full text-left overflow-hidden rounded-2xl border border-border/70 bg-panel shadow-sm hover:-translate-y-1 hover:shadow-lg hover:shadow-accent/10 hover:border-accent/50 transition-all focus:outline-none focus:ring-2 focus:ring-accent/40"
                            >
                              <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-accent/5 blur-2xl group-hover:bg-accent/15 transition-colors" />
                              <div className="absolute inset-0 p-4 md:p-5 flex flex-col justify-between">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-muted opacity-70">Level {idx + 1}</span>
                                  <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-bg border border-border text-muted">{tableCount} table{tableCount !== 1 ? "s" : ""}</span>
                                </div>
                                <div>
                                  <h3 className="text-xl md:text-2xl font-black tracking-tight text-ink group-hover:text-accent transition-colors">{floor.name}</h3>
                                  <p className="text-[10px] md:text-xs text-muted mt-1 md:mt-1.5 opacity-60 font-semibold uppercase tracking-widest flex items-center gap-1.5">Tap to enter →</p>
                                </div>
                              </div>
                            </button>
                            {/* Edit / Delete overlay — visible on hover */}
                            {posConfigId && (
                              <div className="absolute -top-2 -right-2 flex gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity z-10">
                                <button
                                  onClick={e => { e.stopPropagation(); setEditFloorName(floor.name); setEditingFloorId(floor.id); }}
                                  className="h-8 w-8 flex items-center justify-center rounded-full bg-panel border border-border shadow-md hover:border-accent hover:text-accent transition-all"
                                >
                                  <Pencil size={12} />
                                </button>
                                <button
                                  onClick={e => { e.stopPropagation(); handleDeleteFloor(floor.id); }}
                                  disabled={isDeleting}
                                  className="h-8 w-8 flex items-center justify-center rounded-full bg-panel border border-border shadow-md hover:border-red-500 hover:text-red-500 transition-all disabled:opacity-50"
                                >
                                  {isDeleting ? <span className="h-3 w-3 rounded-full border-2 border-red-500/40 border-t-red-500 animate-spin" /> : <Trash2 size={12} />}
                                </button>
                              </div>
                            )}
                          </>
                        )}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {/* Add floor card / form */}
                {posConfigId && (
                  <AnimatePresence mode="wait">
                    {!isAddingFloor ? (
                      <motion.button
                        key="add-btn"
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsAddingFloor(true)}
                        className="h-40 flex flex-col items-center justify-center gap-2 md:gap-3 rounded-2xl border-2 border-dashed border-border/60 bg-bg hover:border-accent/50 hover:bg-accent/5 transition-all focus:outline-none"
                      >
                        <div className="h-10 w-10 md:h-11 md:w-11 rounded-full bg-panel border border-border shadow-sm text-muted flex items-center justify-center">
                          <Plus size={20} className="md:w-[22px] md:h-[22px]" />
                        </div>
                        <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-muted">Add New Floor</span>
                      </motion.button>
                    ) : (
                      <motion.form
                        key="add-form"
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        onSubmit={handleCreateFloor}
                        className="h-40 flex flex-col justify-center rounded-2xl border-2 border-accent/40 bg-panel p-4 md:p-5 shadow-lg gap-2 md:gap-3"
                      >
                        <p className="text-[10px] md:text-[11px] font-black uppercase tracking-widest text-accent">New Floor</p>
                        <input
                          autoFocus
                          value={newFloorName}
                          onChange={e => setNewFloorName(e.target.value)}
                          placeholder="e.g. VIP Lounge"
                          className="w-full bg-bg border border-border rounded-xl px-3 py-2 md:py-2.5 text-sm text-ink focus:outline-none focus:border-accent font-semibold"
                        />
                        <div className="flex gap-2 mb-1">
                          <button type="button" onClick={() => setIsAddingFloor(false)} className="flex-1 py-1.5 md:py-2 text-[10px] md:text-xs font-bold uppercase border border-border rounded-xl hover:bg-bg text-muted">Cancel</button>
                          <button disabled={!newFloorName.trim() || isSubmittingFloor} type="submit" className="flex-1 py-1.5 md:py-2 text-[10px] md:text-xs font-bold uppercase bg-accent text-white rounded-xl disabled:opacity-50">Deploy</button>
                        </div>
                      </motion.form>
                    )}
                  </AnimatePresence>
                )}
              </div>
            </div>

            {/* ── Right: 3D Building ───────────────────── */}
            <div className="flex w-full lg:w-[42%] xl:w-[42%] h-[35vh] lg:h-auto shrink-0 flex-col border-b lg:border-b-0 lg:border-l border-border/40 bg-bg/50">
              <div className="px-5 md:px-6 pt-5 md:pt-8 pb-2 border-b border-border/40 shrink-0">
                <p className="text-[10px] md:text-xs font-black uppercase tracking-widest text-muted opacity-60">
                  Live Preview
                </p>
                <h3 className="text-base md:text-lg font-black text-ink">
                  {floorsList.length === 0 ? "No floors yet" : `${floorsList.length}-storey Cafe`}
                </h3>
              </div>
              <div className="flex-1 min-h-[200px] lg:min-h-0">
                <IsoBuilding floorCount={floorsList.length} hoveredFloorIdx={hoveredFloorIdx} />
              </div>
            </div>
          </motion.div>

        ) : (
        /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
            TIER 2: Table detail for a specific floor
        â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
          <motion.div
            key="tables"
            initial={{ opacity: 0, x: 60, filter: "blur(4px)" }}
            animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, x: 60 }}
            transition={{ duration: 0.35, type: "spring", bounce: 0.15 }}
            className="flex flex-col h-full p-6 md:p-10"
          >
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => { setActiveFloorId(null); setIsAddingTable(false); setEditingTableId(null); }}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-panel border border-border shadow-sm hover:border-accent hover:text-accent transition-all group"
                >
                  <ChevronLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
                </button>
                <div>
                  <h2 className="text-3xl font-black text-ink tracking-tight flex items-center gap-2">
                    {activeFloorName}
                    <span className="text-xs px-2.5 py-1 bg-ink text-panel rounded-lg uppercase tracking-widest font-bold">Floor</span>
                  </h2>
                  <p className="text-muted mt-0.5 font-medium flex items-center gap-2 text-sm">
                    <MousePointerClick size={14} /> Click a table to open its register
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Legend */}
                <div className="flex items-center gap-5 text-xs font-bold uppercase tracking-widest bg-panel px-5 py-2.5 border border-border rounded-full">
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-muted/50 inline-block" /> Free</span>
                  <span className="flex items-center gap-1.5 text-accent"><span className="w-2 h-2 rounded-full bg-accent inline-block" /> Active</span>
                </div>
                {/* Add table */}
                {posConfigId && !isAddingTable && (
                  <button
                    onClick={() => setIsAddingTable(true)}
                    className="flex items-center gap-2 bg-ink text-panel px-5 py-2.5 rounded-full font-bold text-xs uppercase tracking-widest hover:opacity-90 transition-all shadow-artisanal"
                  >
                    <Plus size={15} /> Add Table
                  </button>
                )}
              </div>
            </div>

            {/* Add Table form */}
            <AnimatePresence>
              {isAddingTable && (
                <motion.form
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: "auto", marginBottom: 28 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  onSubmit={handleCreateTable}
                  className="overflow-hidden"
                >
                  <div className="bg-panel border-2 border-accent/40 rounded-2xl p-5 flex flex-col md:flex-row items-end gap-4 w-full shadow-lg">
                    <div className="flex-1 w-full">
                      <label className="block text-[11px] font-black uppercase tracking-widest text-muted mb-1.5">Table Name</label>
                      <input autoFocus value={newTableNum} onChange={e => setNewTableNum(e.target.value)} placeholder="e.g. T-12" className="w-full bg-bg border border-border rounded-xl px-4 py-2.5 text-ink focus:outline-none focus:border-accent font-semibold text-sm" />
                    </div>
                    <div className="w-full md:w-44">
                      <label className="block text-[11px] font-black uppercase tracking-widest text-muted mb-1.5 flex items-center gap-1.5"><Users size={11} /> Capacity</label>
                      <select value={newTableSeats} onChange={e => setNewTableSeats(Number(e.target.value))} className="w-full bg-bg border border-border rounded-xl px-4 py-2.5 text-ink focus:outline-none focus:border-accent font-semibold text-sm appearance-none cursor-pointer">
                        <option value={2}>2 — Round</option>
                        <option value={4}>4 — Square</option>
                        <option value={6}>6 — Long</option>
                        <option value={8}>8 — Long+</option>
                      </select>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                      <button type="button" onClick={() => setIsAddingTable(false)} className="flex-1 md:flex-none px-5 py-2.5 font-bold uppercase tracking-widest bg-bg border border-border rounded-xl hover:bg-border text-xs text-muted">Cancel</button>
                      <button disabled={!newTableNum.trim() || isSubmittingTable} type="submit" className="flex-1 md:flex-none px-6 py-2.5 font-bold uppercase tracking-widest bg-accent text-white rounded-xl shadow-sm disabled:opacity-50 text-xs">Create</button>
                    </div>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Table grid */}
            <div className="flex-1 overflow-y-auto">
              <div className="bg-panel/40 border border-border/40 rounded-3xl p-8 min-h-[55vh] relative">
                {/* Grid background */}
                <div className="absolute inset-0 rounded-3xl opacity-[0.03] pointer-events-none" style={{ backgroundImage: "linear-gradient(#000 1px,transparent 1px),linear-gradient(90deg,#000 1px,transparent 1px)", backgroundSize: "72px 72px" }} />

                {getTablesForFloor(activeFloorId).length === 0 ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-muted">
                    <Square size={44} className="opacity-20 mb-3" strokeWidth={1} />
                    <p className="font-bold uppercase tracking-widest text-sm">Floor is empty</p>
                    <p className="text-xs opacity-60 mt-1">Use "Add Table" above to start mapping.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-10 gap-y-14 relative z-10">
                    <AnimatePresence>
                      {getTablesForFloor(activeFloorId).map((table, idx) => {
                        const isActive  = activeTableId === table.id;
                        const isEditing = editingTableId === table.id;
                        const isDeleting = deletingTableId === table.id;

                        return (
                          <motion.div
                            layout
                            key={table.id}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.7 }}
                            transition={{ delay: idx * 0.04, type: "spring", bounce: 0.35 }}
                            className="relative group"
                          >
                            {/* Table button */}
                            <motion.button
                              whileHover={{ y: -4, scale: 1.02 }}
                              whileTap={{ scale: 0.96 }}
                              onClick={() => !isEditing && setActiveTableId(table.id)}
                              className={`w-full flex flex-col items-center p-7 rounded-3xl transition-all duration-200 border-2 ${
                                isActive
                                  ? "border-accent/40 bg-accent/5 ring-[5px] ring-accent/10 shadow-[0_16px_36px_rgba(var(--color-accent-rgb),0.14)]"
                                  : "border-transparent bg-panel hover:bg-bg hover:border-accent/25 hover:shadow-[0_16px_32px_rgba(var(--color-accent-rgb),0.08)]"
                              }`}
                            >
                              <div className="mb-8 pointer-events-none relative">
                                <GraphicTable shape={table.shape} seats={table.seats} isActive={isActive} />
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-0.5 opacity-50 bg-bg px-1.5 py-0.5 rounded-full border border-border">
                                  <Users size={9} /><span className="text-[9px] font-black">{table.seats}</span>
                                </div>
                              </div>

                              {isEditing ? (
                                <div className="w-full space-y-2" onClick={e => e.stopPropagation()}>
                                  <input
                                    autoFocus
                                    value={editTableNum}
                                    onChange={e => setEditTableNum(e.target.value)}
                                    className="w-full bg-bg border border-border rounded-xl px-3 py-2 text-sm text-ink font-bold focus:outline-none focus:border-accent text-center"
                                  />
                                  <select
                                    value={editTableSeats}
                                    onChange={e => setEditTableSeats(Number(e.target.value))}
                                    className="w-full bg-bg border border-border rounded-xl px-3 py-2 text-sm text-ink focus:outline-none focus:border-accent font-semibold appearance-none"
                                  >
                                    <option value={2}>2 — Round</option>
                                    <option value={4}>4 — Square</option>
                                    <option value={6}>6 — Long</option>
                                    <option value={8}>8 — Long+</option>
                                  </select>
                                  <div className="flex gap-2">
                                    <button onClick={() => setEditingTableId(null)} className="flex-1 py-1.5 text-xs font-bold border border-border rounded-xl text-muted hover:bg-bg">
                                      <X size={13} className="mx-auto" />
                                    </button>
                                    <button onClick={() => handleSaveEdit(table.id)} disabled={isSavingEdit} className="flex-1 py-1.5 text-xs font-bold bg-accent text-white rounded-xl disabled:opacity-50">
                                      <Check size={13} className="mx-auto" />
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-center w-full">
                                  <h3 className={`text-xl font-black tracking-tight transition-colors ${isActive ? "text-accent" : "text-ink group-hover:text-accent"}`}>
                                    {table.name}
                                  </h3>
                                  <p className="text-[11px] font-bold uppercase tracking-widest text-muted opacity-60 mt-1">
                                    {table.status === "free" ? "Available" : "Occupied"}
                                  </p>
                                </div>
                              )}
                            </motion.button>

                            {/* Edit / Delete controls */}
                            {!isEditing && posConfigId && (
                              <div className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => startEdit(table)}
                                  className="h-7 w-7 rounded-full bg-panel border border-border shadow-sm flex items-center justify-center text-muted hover:text-accent hover:border-accent transition-colors"
                                  title="Edit table"
                                >
                                  <Pencil size={11} />
                                </button>
                                <button
                                  onClick={() => handleDelete(table.id)}
                                  disabled={isDeleting}
                                  className="h-7 w-7 rounded-full bg-panel border border-border shadow-sm flex items-center justify-center text-muted hover:text-danger hover:border-danger transition-colors disabled:opacity-50"
                                  title="Delete table"
                                >
                                  <Trash2 size={11} />
                                </button>
                              </div>
                            )}
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
