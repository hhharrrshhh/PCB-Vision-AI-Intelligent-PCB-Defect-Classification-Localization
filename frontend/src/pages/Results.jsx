// frontend/src/pages/Results.jsx
// Displays real YOLO detections on the actual uploaded image.
// Includes the Repair Viability Analysis section.

import React, { useState, useRef, useEffect } from "react";
import {
  CheckCircle2, XCircle, FileJson, Download,
  Eye, EyeOff, ZoomIn, X, Wrench, AlertTriangle, Clock,
  Gauge, IndianRupee,
} from "lucide-react";
import { GlassCard, SeverityPill } from "../components/Primitives";

// ── Class color map ───────────────────────────────────────────────────────────
const CLASS_COLORS = {
  open_circuit:    { hex: "#ef4444", soft: "bg-red-500/10",    text: "text-red-400",    border: "border-red-500" },
  short_circuit:   { hex: "#f59e0b", soft: "bg-amber-500/10",  text: "text-amber-400",  border: "border-amber-500" },
  mouse_bite:      { hex: "#a855f7", soft: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500" },
  missing_hole:    { hex: "#3b82f6", soft: "bg-blue-500/10",   text: "text-blue-400",   border: "border-blue-500" },
  spur:            { hex: "#10b981", soft: "bg-emerald-500/10",text: "text-emerald-400",border: "border-emerald-500" },
  spurious_copper: { hex: "#ec4899", soft: "bg-pink-500/10",   text: "text-pink-400",   border: "border-pink-500" },
  default:         { hex: "#6366f1", soft: "bg-indigo-500/10", text: "text-indigo-400", border: "border-indigo-500" },
};

function getColor(className) {
  return CLASS_COLORS[className] || CLASS_COLORS.default;
}

// ── Repair Viability Section ──────────────────────────────────────────────────
function RepairViability({ analysis }) {
  if (!analysis) return null;

  const { recommendation, estimated_repair_cost, replacement_cost, repair_ratio,
          estimated_repair_time_minutes, viability_score, reason } = analysis;

  const isRepair   = recommendation === "REPAIR";
  const isCaution  = recommendation === "REPAIR WITH CAUTION";
  const isDiscard  = recommendation === "DISCARD PCB";
  const isPass     = recommendation === "PASS";

  const recColor = isRepair  ? "text-green-400  bg-green-500/10  border-green-500/20" :
                   isCaution ? "text-amber-400  bg-amber-500/10  border-amber-500/20" :
                   isPass    ? "text-green-400  bg-green-500/10  border-green-500/20" :
                               "text-red-400    bg-red-500/10    border-red-500/20";

  // Bar proportions (cap at 100% for display)
  const repairPct     = Math.min(100, Math.round((estimated_repair_cost / replacement_cost) * 100));
  const replacePct    = 100;

  return (
    <GlassCard className="p-5 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-zinc-50 flex items-center gap-2">
          <Wrench size={15} className="text-indigo-400" />
          Repair Viability Analysis
        </h3>
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${recColor}`}>
          {isRepair  && <CheckCircle2 size={13} />}
          {isCaution && <AlertTriangle size={13} />}
          {isDiscard && <XCircle size={13} />}
          {isPass    && <CheckCircle2 size={13} />}
          {recommendation}
        </span>
      </div>

      {/* Cost grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-3 text-center">
          <p className="text-xs text-zinc-500 mb-1">Repair Cost</p>
          <p className="text-lg font-semibold text-zinc-50">₹{estimated_repair_cost.toFixed(0)}</p>
        </div>
        <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-3 text-center">
          <p className="text-xs text-zinc-500 mb-1">Replacement</p>
          <p className="text-lg font-semibold text-zinc-50">₹{replacement_cost.toFixed(0)}</p>
        </div>
        <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-3 text-center">
          <p className="text-xs text-zinc-500 mb-1 flex items-center justify-center gap-1">
            <Clock size={11} />Repair Time
          </p>
          <p className="text-lg font-semibold text-zinc-50">
            {estimated_repair_time_minutes.toFixed(0)}
            <span className="text-xs font-normal text-zinc-400"> min</span>
          </p>
        </div>
        <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-3 text-center">
          <p className="text-xs text-zinc-500 mb-1 flex items-center justify-center gap-1">
            <Gauge size={11} />Viability
          </p>
          <p className={`text-lg font-semibold ${isRepair || isPass ? "text-green-400" : isCaution ? "text-amber-400" : "text-red-400"}`}>
            {viability_score}%
          </p>
        </div>
      </div>

      {/* Cost comparison bar */}
      <div>
        <p className="text-xs text-zinc-500 mb-2">Cost comparison (repair vs replacement)</p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400 w-20 shrink-0">Repair</span>
            <div className="flex-1 bg-zinc-800 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  isRepair ? "bg-green-500" : isCaution ? "bg-amber-500" : "bg-red-500"
                }`}
                style={{ width: repairPct + "%" }}
              />
            </div>
            <span className="text-xs text-zinc-400 w-14 text-right">₹{estimated_repair_cost.toFixed(0)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400 w-20 shrink-0">Replace</span>
            <div className="flex-1 bg-zinc-800 rounded-full h-2.5 overflow-hidden">
              <div className="h-full rounded-full bg-indigo-600" style={{ width: replacePct + "%" }} />
            </div>
            <span className="text-xs text-zinc-400 w-14 text-right">₹{replacement_cost.toFixed(0)}</span>
          </div>
        </div>
        <p className="text-[11px] text-zinc-500 mt-1.5">
          Repair is <span className="font-medium text-zinc-300">{Math.round(repair_ratio * 100)}%</span> of replacement cost
        </p>
      </div>

      {/* Reason */}
      <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-3">
        <p className="text-xs text-zinc-500 mb-1">Analysis Rationale</p>
        <p className="text-sm text-zinc-300 leading-relaxed">{reason}</p>
      </div>
    </GlassCard>
  );
}

// ── Interactive image viewer — numbered markers + SVG leader lines ─────────────
function PCBViewer({ imageUrl, defects, activeId, onHoverDefect }) {
  const containerRef = useRef(null);
  const imgRef       = useRef(null);
  const [renderedSize, setRenderedSize] = useState(null);
  const [naturalSize,  setNaturalSize]  = useState(null);
  const [showBoxes, setShowBoxes] = useState(true);
  const [zoomed,    setZoomed]    = useState(false);

  useEffect(() => {
    if (!imgRef.current) return;
    const update = () => {
      if (imgRef.current)
        setRenderedSize({ width: imgRef.current.clientWidth, height: imgRef.current.clientHeight });
    };
    const ro = new ResizeObserver(update);
    ro.observe(imgRef.current);
    update();
    return () => ro.disconnect();
  }, [imageUrl]);

  const handleImgLoad = (e) => {
    setNaturalSize({ width: e.target.naturalWidth,  height: e.target.naturalHeight });
    setRenderedSize({ width: e.target.clientWidth,  height: e.target.clientHeight });
  };

  // Scale a bbox from natural → rendered pixel space
  const scaleBox = (bbox) => {
    if (!naturalSize || !renderedSize) return null;
    const sx = renderedSize.width  / naturalSize.width;
    const sy = renderedSize.height / naturalSize.height;
    return {
      x:  bbox.x_min * sx,
      y:  bbox.y_min * sy,
      w:  (bbox.x_max - bbox.x_min) * sx,
      h:  (bbox.y_max - bbox.y_min) * sy,
    };
  };

  // marker_radius = max(14, min(imgW, imgH) * 0.014)  — same formula as Python reference
  const markerR = renderedSize
    ? Math.max(14, Math.min(renderedSize.width, renderedSize.height) * 0.014)
    : 14;

  const ViewerContent = () => {
    const W = renderedSize?.width  ?? 0;
    const H = renderedSize?.height ?? 0;

    return (
      <div className="relative inline-block w-full select-none">
        <img
          ref={imgRef}
          src={imageUrl}
          alt="PCB Inspection"
          onLoad={handleImgLoad}
          draggable={false}
          className="w-full h-auto object-contain max-h-[480px] block rounded-xl"
        />

        {showBoxes && W > 0 && (
          <svg
            className="absolute inset-0 pointer-events-none"
            width={W}
            height={H}
            style={{ top: 0, left: 0 }}
          >
            {defects.map((d) => {
              const box = scaleBox(d.bbox);
              if (!box) return null;

              const c        = getColor(d.class_name);
              const isActive = activeId === d.defect_id;
              const alpha    = isActive ? "ff" : "cc";

              // box center
              const cx = box.x + box.w / 2;
              const cy = box.y + box.h / 2;

              // place marker at top-right corner of box, clamped inside image
              const mx = Math.min(Math.max(box.x + box.w + markerR * 0.4, markerR + 2), W - markerR - 2);
              const my = Math.min(Math.max(box.y - markerR * 0.4, markerR + 2), H - markerR - 2);

              const strokeW = Math.max(2, Math.round(markerR / 5));
              const fs      = Math.max(9, Math.round(markerR * 0.72));

              return (
                <g key={d.defect_id} style={{ cursor: "pointer" }} pointerEvents="all"
                  onMouseEnter={() => onHoverDefect(d.defect_id)}
                  onMouseLeave={() => onHoverDefect(null)}
                >
                  {/* Bounding box */}
                  <rect
                    x={box.x} y={box.y} width={box.w} height={box.h}
                    fill="none"
                    stroke={c.hex}
                    strokeWidth={isActive ? strokeW + 1 : strokeW}
                    strokeOpacity={isActive ? 1 : 0.8}
                    rx={2}
                  />
                  {isActive && (
                    <rect
                      x={box.x} y={box.y} width={box.w} height={box.h}
                      fill={c.hex} fillOpacity={0.08}
                      rx={2}
                    />
                  )}

                  {/* Leader line: marker edge → box center */}
                  <line
                    x1={mx} y1={my} x2={cx} y2={cy}
                    stroke={c.hex} strokeWidth={1.5} strokeOpacity={0.6}
                    strokeDasharray="4 3"
                  />

                  {/* Marker circle — dark outline for contrast */}
                  <circle cx={mx} cy={my} r={markerR + 1.5} fill="#0a0a0a" fillOpacity={0.85} />
                  <circle
                    cx={mx} cy={my} r={markerR}
                    fill={c.hex + alpha}
                    stroke={isActive ? "#fff" : c.hex}
                    strokeWidth={isActive ? 2 : 1.5}
                  />

                  {/* Detection number */}
                  <text
                    x={mx} y={my}
                    textAnchor="middle" dominantBaseline="central"
                    fontSize={fs} fontWeight="700" fill="#fff"
                    fontFamily="system-ui, sans-serif"
                  >
                    {d.defect_id}
                  </text>
                </g>
              );
            })}
          </svg>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
          Detected — hover a card below to highlight
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowBoxes(!showBoxes)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-400 hover:text-zinc-100"
          >
            {showBoxes ? <EyeOff size={12} /> : <Eye size={12} />}
            {showBoxes ? "Hide" : "Show"} overlays
          </button>
          <button
            onClick={() => setZoomed(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-400 hover:text-zinc-100"
          >
            <ZoomIn size={12} /> Zoom
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative rounded-xl overflow-hidden border border-zinc-800 bg-black/40 cursor-zoom-in"
        onClick={() => setZoomed(true)}
      >
        <ViewerContent />
      </div>

      {/* Zoom modal */}
      {zoomed && (
        <div
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4"
          onClick={() => setZoomed(false)}
        >
          <div className="max-w-5xl w-full relative" onClick={(e) => e.stopPropagation()}>
            <div className="relative rounded-2xl overflow-hidden border border-zinc-800 bg-black">
              <img src={imageUrl} alt="PCB Zoomed" className="w-full h-auto object-contain max-h-[88vh]" />
            </div>
            <button
              onClick={() => setZoomed(false)}
              className="mt-3 mx-auto flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-100"
            >
              <X size={14} /> Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Defect card ───────────────────────────────────────────────────────────────
function DefectCard({ defect, isActive, onMouseEnter, onMouseLeave }) {
  const c = getColor(defect.class_name);
  const ri = defect.repair_info;

  return (
    <GlassCard
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`p-4 cursor-pointer transition-all duration-200 ${isActive ? "border-zinc-600 ring-1 ring-indigo-500/30" : "hover:border-zinc-700"}`}
    >
      <div className="flex items-center justify-between mb-3">
        {/* Numbered badge — matches the SVG marker on the image */}
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
          style={{ background: c.hex }}
        >
          {defect.defect_id}
        </div>
        {ri && <SeverityPill severity={ri.severity} />}
      </div>

      <h4 className="text-sm font-semibold text-zinc-50">
        {ri?.display_name || defect.class_name.replaceAll("_", " ")}
      </h4>
      <p className="text-xs text-zinc-500 mt-1 leading-relaxed line-clamp-2">
        {ri?.description || "Defect detected by YOLO model."}
      </p>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-zinc-500">
        <span>Confidence <span className="text-zinc-200 font-medium">{(defect.confidence * 100).toFixed(1)}%</span></span>
        <span>ID <span className="text-zinc-200 font-medium">#{defect.defect_id}</span></span>
        <span>X <span className="text-zinc-200 font-medium">{defect.bbox.x_min.toFixed(0)}, {defect.bbox.y_min.toFixed(0)}</span></span>
        <span>W×H <span className="text-zinc-200 font-medium">{(defect.bbox.x_max - defect.bbox.x_min).toFixed(0)}×{(defect.bbox.y_max - defect.bbox.y_min).toFixed(0)}px</span></span>
      </div>

      {ri && (
        <div className="mt-3 pt-3 border-t border-zinc-800 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-500 flex items-center gap-1"><IndianRupee size={11} />Repair cost</span>
            <span className="text-zinc-200 font-medium">₹{ri.estimated_repair_cost.toFixed(0)}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-500 flex items-center gap-1"><Clock size={11} />Repair time</span>
            <span className="text-zinc-200 font-medium">{ri.estimated_repair_time_minutes.toFixed(0)} min</span>
          </div>
          <div className="text-xs text-zinc-400 leading-relaxed">
            <span className="text-zinc-500">Suggestion: </span>
            {ri.suggested_repair}
          </div>
        </div>
      )}
    </GlassCard>
  );
}

// ── Main Results page ─────────────────────────────────────────────────────────
export default function Results({ result, imageUrl }) {
  const [activeId, setActiveId] = useState(null);

  if (!result) {
    return (
      <div className="p-4 md:p-8 flex flex-col items-center justify-center min-h-[60vh] text-zinc-500">
        <Layers size={40} className="mb-3 opacity-40" />
        <p className="text-sm">No inspection result to display. Run a new inspection first.</p>
      </div>
    );
  }

  const {
    filename, total_defects, defects = [], processing_time_ms,
    inspection_id, inspection_status, repair_analysis,
  } = result;

  const status = inspection_status || (total_defects > 0 ? "Fail" : "Pass");
  const isPassed = status === "Pass";
  const topConf  = defects.length > 0 ? Math.max(...defects.map((d) => d.confidence)) : null;

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url;
    a.download = `pcb_inspection_${inspection_id || "result"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 md:p-8 space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">Inspection Results</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {filename} {inspection_id && <span>· {inspection_id}</span>}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={exportJSON}
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-800 px-3.5 py-2 text-sm text-zinc-300 hover:border-zinc-600 transition-colors"
          >
            <FileJson size={14} /> Export JSON
          </button>
          {imageUrl && (
            <a
              href={imageUrl}
              download={`pcb_${inspection_id || "image"}.png`}
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-800 px-3.5 py-2 text-sm text-zinc-300 hover:border-zinc-600 transition-colors"
            >
              <Download size={14} /> Download Image
            </a>
          )}
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid xl:grid-cols-4 gap-6">
        {/* Image viewers */}
        <div className="xl:col-span-3 space-y-4">
          {imageUrl && (
            <PCBViewer
              imageUrl={imageUrl}
              defects={defects}
              activeId={activeId}
              onHoverDefect={setActiveId}
            />
          )}
        </div>

        {/* Inspection summary card */}
        <GlassCard className="p-5 h-fit">
          <div className={`rounded-xl p-4 mb-4 ${isPassed ? "bg-green-500/10" : "bg-red-500/10"}`}>
            <div className="flex items-center gap-2">
              {isPassed
                ? <CheckCircle2 className="text-green-400" size={18} />
                : <XCircle className="text-red-400" size={18} />}
              <span className={`text-lg font-semibold ${isPassed ? "text-green-400" : "text-red-400"}`}>
                {status.toUpperCase()}
              </span>
            </div>
          </div>
          <dl className="space-y-0 text-sm">
            {[
              ["Total defects",     total_defects],
              ["Highest confidence", topConf ? `${(topConf * 100).toFixed(1)}%` : "—"],
              ["Processing time",   `${(processing_time_ms / 1000).toFixed(2)}s`],
              ["Inspection ID",      inspection_id || "—"],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between border-b border-zinc-900 py-3 last:border-0">
                <dt className="text-zinc-500">{k}</dt>
                <dd className="text-zinc-200 font-medium">{v}</dd>
              </div>
            ))}
          </dl>
        </GlassCard>
      </div>

      {/* Repair Viability Analysis */}
      <RepairViability analysis={repair_analysis} />

      {/* Defect cards */}
      {total_defects > 0 && (
        <div>
          <h3 className="text-sm font-medium text-zinc-50 mb-3 flex items-center gap-2">
            <AlertTriangle size={15} className="text-amber-400" />
            Detected Defects ({total_defects})
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {defects.map((d) => (
              <DefectCard
                key={d.defect_id}
                defect={d}
                isActive={activeId === d.defect_id}
                onMouseEnter={() => setActiveId(d.defect_id)}
                onMouseLeave={() => setActiveId(null)}
              />
            ))}
          </div>
        </div>
      )}

      {total_defects === 0 && (
        <GlassCard className="p-8 text-center">
          <CheckCircle2 size={32} className="text-green-400 mx-auto mb-3" />
          <p className="text-zinc-100 font-medium">No defects detected</p>
          <p className="text-zinc-500 text-sm mt-1">The PCB passes automated inspection quality thresholds.</p>
        </GlassCard>
      )}
    </div>
  );
}
