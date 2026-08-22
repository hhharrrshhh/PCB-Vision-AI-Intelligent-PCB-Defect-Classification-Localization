// frontend/src/pages/Processing.jsx
// Shown while the real FastAPI backend is performing YOLO inference.
// The inspectionPromise prop is a Promise that resolves with the API response.

import React, { useEffect, useState } from "react";
import { CheckCircle2, AlertCircle, RefreshCcw } from "lucide-react";
import PCBGraphic from "../components/PCBGraphic";

// Processing steps shown while inference runs
// These are UI labels only — we don't fake stage timing.
const STAGES = [
  "Uploading image to backend",
  "Running YOLO inference",
  "Extracting bounding boxes",
  "Computing repair viability",
  "Generating report",
];

export default function Processing({ inspectionPromise, onSuccess, onError, onRetry }) {
  const [currentStage, setCurrentStage] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    if (!inspectionPromise) return;

    let stageInterval = null;
    let cancelled = false;

    // Animate through stages while awaiting response.
    // We advance one stage every ~800ms but never past the last "real" stage
    // (we hold on stage index 3 = "Computing repair viability" until response arrives).
    const HOLD_STAGE = 3;
    stageInterval = setInterval(() => {
      setCurrentStage((s) => {
        if (s >= HOLD_STAGE) return s; // hold until response
        return s + 1;
      });
    }, 800);

    inspectionPromise
      .then((result) => {
        if (cancelled) return;
        clearInterval(stageInterval);
        // Show final stage instantly then complete
        setCurrentStage(STAGES.length - 1);
        setTimeout(() => {
          if (!cancelled) {
            setIsDone(true);
            onSuccess(result);
          }
        }, 600);
      })
      .catch((err) => {
        if (cancelled) return;
        clearInterval(stageInterval);
        setErrorMsg(err.message || "An unknown error occurred during inspection.");
      });

    return () => {
      cancelled = true;
      clearInterval(stageInterval);
    };
  }, [inspectionPromise]);

  const progress = errorMsg
    ? 0
    : isDone
    ? 100
    : Math.round(((currentStage + 1) / STAGES.length) * 100);

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-6 py-16 text-zinc-50">
        <div className="w-full max-w-md text-center space-y-6">
          <div className="flex justify-center">
            <div className="rounded-2xl bg-red-500/10 p-5 border border-red-500/20">
              <AlertCircle size={36} className="text-red-400" />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-red-400">Inspection Failed</h2>
            <p className="mt-2 text-sm text-zinc-400 max-w-xs mx-auto">{errorMsg}</p>
          </div>
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
          >
            <RefreshCcw size={15} /> Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-6 py-16 text-zinc-50">
      <div className="w-full max-w-md">
        {/* Circular progress with PCB inside */}
        <div className="relative mx-auto mb-10 w-56 h-56">
          <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
            <circle cx="60" cy="60" r="52" fill="none" stroke="#27272a" strokeWidth="6" />
            <circle
              cx="60" cy="60" r="52"
              fill="none"
              stroke="#4F46E5"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 52}
              strokeDashoffset={2 * Math.PI * 52 * (1 - progress / 100)}
              className="transition-all duration-500"
            />
          </svg>
          <div className="absolute inset-6 rounded-full overflow-hidden">
            <PCBGraphic scan={!isDone} />
          </div>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-zinc-900 border border-zinc-800 px-3 py-1 text-sm font-medium">
            {progress}%
          </div>
        </div>

        {/* Stage indicators */}
        <div className="space-y-3">
          {STAGES.map((label, i) => {
            const state =
              i < currentStage ? "done" :
              i === currentStage ? "active" :
              "pending";
            return (
              <div key={label} className="flex items-center gap-3">
                <div
                  className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 border transition-colors ${
                    state === "done"   ? "bg-indigo-600 border-indigo-600" :
                    state === "active" ? "border-indigo-500 animate-pulse" :
                    "border-zinc-700"
                  }`}
                >
                  {state === "done" && <CheckCircle2 size={14} className="text-white" />}
                </div>
                <span
                  className={`text-sm ${
                    state === "pending" ? "text-zinc-600" :
                    state === "active"  ? "text-zinc-100" :
                    "text-zinc-400"
                  }`}
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>

        <p className="mt-8 text-center text-xs text-zinc-500">
          Running real YOLO inference on your image…
        </p>
      </div>
    </div>
  );
}
