import React from 'react';
import { AlertTriangle, CheckCircle2, FileText } from 'lucide-react';

export default function DefectSummary({ defects = [], totalDefects = 0, processingTime = 0, filename = '' }) {
  const exportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ filename, totalDefects, processingTime, defects }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `pcb_inspection_${filename || 'results'}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="bg-pcb-card border border-pcb-border rounded-xl p-6 shadow-md flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-pcb-warning" />
          Inspection Findings
        </h2>
        {totalDefects > 0 && (
          <button
            onClick={exportJSON}
            className="flex items-center gap-1 text-xs text-pcb-accent bg-pcb-accent/10 hover:bg-pcb-accent/20 px-2.5 py-1 rounded border border-pcb-accent/30 transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            Export JSON
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-pcb-dark/60 border border-pcb-border p-3 rounded-lg">
          <p className="text-xs text-gray-400">Total Defects</p>
          <p className={`text-xl font-bold mt-0.5 ${totalDefects > 0 ? 'text-pcb-danger' : 'text-pcb-accent'}`}>
            {totalDefects}
          </p>
        </div>
        <div className="bg-pcb-dark/60 border border-pcb-border p-3 rounded-lg">
          <p className="text-xs text-gray-400">Inference Speed</p>
          <p className="text-xl font-bold text-gray-200 mt-0.5">
            {processingTime} <span className="text-xs font-normal text-gray-400">ms</span>
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto max-h-[320px] space-y-2 pr-1">
        {totalDefects === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-400 text-center">
            <CheckCircle2 className="w-10 h-10 text-pcb-accent mb-2" />
            <p className="text-sm font-medium text-gray-200">No Defects Detected</p>
            <p className="text-xs text-gray-400 mt-1">Board meets automated inspection quality thresholds.</p>
          </div>
        ) : (
          defects.map((defect) => (
            <div
              key={defect.defect_id}
              className="bg-pcb-dark/40 border border-pcb-border p-3 rounded-lg flex items-center justify-between"
            >
              <div>
                <span className="text-xs font-semibold text-pcb-accent mr-2">#{defect.defect_id}</span>
                <span className="text-sm text-gray-200 capitalize font-medium">
                  {defect.class_name.replace('_', ' ')}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold text-gray-300">
                  {(defect.confidence * 100).toFixed(1)}%
                </span>
                <p className="text-[10px] text-gray-400">Confidence</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}