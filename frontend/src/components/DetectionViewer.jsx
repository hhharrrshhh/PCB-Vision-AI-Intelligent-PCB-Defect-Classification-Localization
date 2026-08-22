import React, { useState } from 'react';
import { Eye, EyeOff, Layers } from 'lucide-react';

// Color map corresponding to our supported PCB defect taxonomy
const CLASS_COLORS = {
  open_circuit: { bg: 'bg-red-500/20', border: 'border-red-500', text: 'text-red-400', hex: '#ef4444' },
  short_circuit: { bg: 'bg-amber-500/20', border: 'border-amber-500', text: 'text-amber-400', hex: '#f59e0b' },
  mouse_bite: { bg: 'bg-purple-500/20', border: 'border-purple-500', text: 'text-purple-400', hex: '#a855f7' },
  missing_hole: { bg: 'bg-blue-500/20', border: 'border-blue-500', text: 'text-blue-400', hex: '#3b82f6' },
  spur: { bg: 'bg-emerald-500/20', border: 'border-emerald-500', text: 'text-emerald-400', hex: '#10b981' },
  spurious_copper: { bg: 'bg-pink-500/20', border: 'border-pink-500', text: 'text-pink-400', hex: '#ec4899' },
  default: { bg: 'bg-cyan-500/20', border: 'border-cyan-500', text: 'text-cyan-400', hex: '#06b6d4' }
};

export default function DetectionViewer({ imageUrl, defects = [], imageDimensions }) {
  const [showBoxes, setShowBoxes] = useState(true);
  const [hoveredDefectId, setHoveredDefectId] = useState(null);

  if (!imageUrl) {
    return (
      <div className="bg-pcb-card border border-pcb-border rounded-xl p-8 flex flex-col items-center justify-center min-h-[400px] text-gray-500">
        <Layers className="w-12 h-12 mb-3 opacity-40 text-pcb-accent" />
        <p className="text-sm">No PCB image loaded. Upload an image to view detection overlays.</p>
      </div>
    );
  }

  return (
    <div className="bg-pcb-card border border-pcb-border rounded-xl p-6 shadow-md">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Layers className="w-5 h-5 text-pcb-accent" />
          Interactive Detection Viewer
        </h2>

        <button
          onClick={() => setShowBoxes(!showBoxes)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pcb-dark border border-pcb-border text-xs text-gray-300 hover:text-white transition-colors"
        >
          {showBoxes ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          {showBoxes ? 'Hide Overlays' : 'Show Overlays'}
        </button>
      </div>

      <div className="relative inline-block w-full overflow-hidden rounded-lg border border-pcb-border bg-black/40">
        <img
          src={imageUrl}
          alt="PCB Inspection Visual"
          className="w-full h-auto object-contain max-h-[550px] block mx-auto"
        />

        {/* Overlay Bounding Boxes */}
        {showBoxes &&
          defects.map((defect) => {
            const colorScheme = CLASS_COLORS[defect.class_name] || CLASS_COLORS.default;
            const isHovered = hoveredDefectId === defect.defect_id;

            // Bounding Box Coordinates (x_min, y_min, x_max, y_max)
            const { x_min, y_min, x_max, y_max } = defect.bbox;
            
            // Calculate pixel percentages relative to original dimensions if provided, or absolute
            const style = imageDimensions ? {
              left: `${(x_min / imageDimensions.width) * 100}%`,
              top: `${(y_min / imageDimensions.height) * 100}%`,
              width: `${((x_max - x_min) / imageDimensions.width) * 100}%`,
              height: `${((y_max - y_min) / imageDimensions.height) * 100}%`,
            } : {
              left: `${x_min}px`,
              top: `${y_min}px`,
              width: `${x_max - x_min}px`,
              height: `${y_max - y_min}px`,
            };

            return (
              <div
                key={defect.defect_id}
                onMouseEnter={() => setHoveredDefectId(defect.defect_id)}
                onMouseLeave={() => setHoveredDefectId(null)}
                style={style}
                className={`absolute border-2 ${colorScheme.border} ${colorScheme.bg} transition-all duration-150 cursor-pointer ${
                  isHovered ? 'ring-2 ring-white z-20 scale-[1.01]' : 'z-10'
                }`}
              >
                <span
                  className={`absolute -top-6 left-0 px-1.5 py-0.5 text-[10px] font-bold rounded ${colorScheme.border} bg-pcb-dark ${colorScheme.text} whitespace-nowrap shadow`}
                >
                  #{defect.defect_id} {defect.class_name.replace('_', ' ')} ({(defect.confidence * 100).toFixed(0)}%)
                </span>
              </div>
            );
          })}
      </div>
    </div>
  );
}