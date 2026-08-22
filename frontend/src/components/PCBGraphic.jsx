// frontend/src/components/PCBGraphic.jsx
// Decorative SVG PCB artwork used on Landing and Processing screens.
// On the Results page, the REAL uploaded image + real bounding boxes are shown instead.

import React from "react";

const DEFECT_COLORS = {
  open_circuit:    { border: "#ef4444", label: "Open Circuit" },
  short_circuit:   { border: "#f59e0b", label: "Short Circuit" },
  mouse_bite:      { border: "#a855f7", label: "Mouse Bite" },
  missing_hole:    { border: "#3b82f6", label: "Missing Hole" },
  spur:            { border: "#10b981", label: "Spur" },
  spurious_copper: { border: "#ec4899", label: "Spurious Copper" },
  // Legacy JSX typeId keys
  open:            { border: "#ef4444", label: "Open Circuit" },
  short:           { border: "#f59e0b", label: "Short Circuit" },
  mousebite:       { border: "#a855f7", label: "Mouse Bite" },
  missinghole:     { border: "#3b82f6", label: "Missing Hole" },
  spuriouscopper:  { border: "#ec4899", label: "Spurious Copper" },
  spur_default:    { border: "#10b981", label: "Spur" },
};

/**
 * PCBGraphic
 *
 * @param {Array}   boxes     - array of { uid, typeId, x, y, w, h } (percentage-based)
 * @param {string}  activeId  - uid of the currently hovered box
 * @param {Function} onHover  - called with uid on mouseenter, null on mouseleave
 * @param {Function} onClick  - called with uid on click
 * @param {boolean} scan      - whether to show scanning animation
 * @param {boolean} dim       - whether to dim the SVG (used during processing)
 */
export default function PCBGraphic({ boxes = [], activeId, onHover, onClick, scan = false, dim = false }) {
  return (
    <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950">
      {/* PCB trace artwork */}
      <svg viewBox="0 0 400 300" className={`w-full h-full ${dim ? "opacity-40" : ""}`}>
        <rect width="400" height="300" fill="#0a2318" />
        {/* Horizontal trace guides */}
        {Array.from({ length: 6 }).map((_, i) => (
          <line key={"h" + i} x1="0" y1={30 + i * 45} x2="400" y2={30 + i * 45} stroke="#1f6b3f" strokeWidth="1.5" opacity="0.5" />
        ))}
        {/* Vertical trace guides */}
        {Array.from({ length: 8 }).map((_, i) => (
          <line key={"v" + i} x1={20 + i * 48} y1="0" x2={20 + i * 48} y2="300" stroke="#1f6b3f" strokeWidth="1" opacity="0.3" />
        ))}
        {/* Main traces */}
        <path d="M20 40 H160 V90 H260 V150 H340" stroke="#3fae6f" strokeWidth="2.5" fill="none" />
        <path d="M40 260 H140 V190 H220 V120 H380" stroke="#3fae6f" strokeWidth="2.5" fill="none" />
        <path d="M60 20 V120 H100" stroke="#3fae6f" strokeWidth="2" fill="none" />
        {/* Solder pads */}
        {[[40, 40], [160, 90], [260, 150], [340, 150], [140, 260], [220, 190], [100, 120]].map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r="6" fill="#d4af37" stroke="#8a6d1f" strokeWidth="1" />
        ))}
        {/* Components */}
        <rect x="170" y="180" width="60" height="40" rx="3" fill="#111" stroke="#3fae6f" strokeWidth="1.5" />
        <rect x="280" y="40" width="40" height="24" rx="2" fill="#111" stroke="#3fae6f" strokeWidth="1.5" />
        {/* Edge vias */}
        {Array.from({ length: 12 }).map((_, i) => (
          <circle key={"via" + i} cx={30 + (i % 6) * 65} cy={i < 6 ? 15 : 285} r="3" fill="#8a6d1f" />
        ))}
      </svg>

      {/* Scan line animation */}
      {scan && (
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute left-0 right-0 h-16 bg-gradient-to-b from-transparent via-indigo-500/25 to-transparent"
            style={{ animation: "scan 2.4s linear infinite" }}
          />
        </div>
      )}

      {/* Defect bounding boxes (percentage-based, for decorative use only) */}
      {boxes.map((b) => {
        const colorInfo = DEFECT_COLORS[b.typeId] || { border: "#4f46e5", label: b.typeId };
        const isActive = activeId === b.uid;
        return (
          <div
            key={b.uid}
            onMouseEnter={() => onHover && onHover(b.uid)}
            onMouseLeave={() => onHover && onHover(null)}
            onClick={() => onClick && onClick(b.uid)}
            className={`absolute rounded-md border-2 cursor-pointer transition-all duration-200 ${isActive ? "z-10 scale-105 shadow-lg" : "opacity-80"}`}
            style={{
              left: b.x + "%",
              top: b.y + "%",
              width: b.w + "%",
              height: b.h + "%",
              borderColor: colorInfo.border,
              backgroundColor: colorInfo.border + "22",
            }}
          >
            <span
              className="absolute -top-5 left-0 whitespace-nowrap rounded px-1.5 py-0.5 text-[10px] font-medium text-zinc-950"
              style={{ backgroundColor: colorInfo.border }}
            >
              {colorInfo.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
