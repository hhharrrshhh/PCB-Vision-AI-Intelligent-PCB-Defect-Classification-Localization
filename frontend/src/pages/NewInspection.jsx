// frontend/src/pages/NewInspection.jsx
// Upload a PCB image, validate it, then start real backend inference.

import React, { useState, useRef } from "react";
import { Upload, Image as ImageIcon, ArrowRight, RefreshCcw, AlertCircle } from "lucide-react";
import { GlassCard, Skeleton } from "../components/Primitives";

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/bmp"];
const MAX_SIZE_MB = 20;

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}

/**
 * NewInspection
 *
 * Props:
 *   onAnalyze(file) — called when the user clicks Analyze
 *                     parent must start the real API call and navigate to Processing
 */
export default function NewInspection({ onAnalyze }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [dimensions, setDimensions] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState(null);
  const fileRef = useRef(null);

  const validateAndSet = (f) => {
    setError(null);
    if (!f) return;

    if (!ALLOWED_TYPES.includes(f.type)) {
      setError("Unsupported file type. Please upload a PNG, JPG, or JPEG image.");
      return;
    }
    if (f.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`File is too large. Maximum allowed size is ${MAX_SIZE_MB} MB.`);
      return;
    }

    const url = URL.createObjectURL(f);
    setPreview(url);
    setFile(f);

    // Get real dimensions
    const img = new Image();
    img.onload = () => setDimensions({ width: img.naturalWidth, height: img.naturalHeight });
    img.src = url;
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    validateAndSet(e.dataTransfer.files?.[0]);
  };

  const clear = () => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
    setDimensions(null);
    setError(null);
  };

  const handleAnalyze = () => {
    if (file) onAnalyze(file);
  };

  return (
    <div className="p-4 md:p-8 space-y-6 animate-fade-up">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">New Inspection</h1>
        <p className="text-sm text-zinc-500 mt-1">Upload a PCB image to run real YOLO defect detection.</p>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Upload / Preview area */}
        <GlassCard className="p-6 lg:col-span-3">
          {!file ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className={`flex flex-col items-center justify-center text-center rounded-2xl border-2 border-dashed py-20 px-6 cursor-pointer transition-colors ${
                dragOver ? "border-indigo-500 bg-indigo-500/5" : "border-zinc-800 hover:border-zinc-600"
              }`}
            >
              <input
                ref={fileRef}
                type="file"
                accept=".png,.jpg,.jpeg,.webp,.bmp"
                className="hidden"
                onChange={(e) => validateAndSet(e.target.files?.[0])}
              />
              <div className="rounded-2xl bg-indigo-500/10 p-4 mb-4">
                <Upload size={24} className="text-indigo-400" />
              </div>
              <p className="text-zinc-200 font-medium">Drag &amp; drop a PCB image, or click to browse</p>
              <p className="text-zinc-500 text-sm mt-1">Supports PNG, JPEG, JPG · Max {MAX_SIZE_MB} MB</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative rounded-2xl overflow-hidden border border-zinc-800 bg-black">
                <img
                  src={preview}
                  alt="Uploaded PCB"
                  className="w-full object-contain max-h-72 md:max-h-96"
                />
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleAnalyze}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
                >
                  Analyze <ArrowRight size={15} />
                </button>
                <button
                  onClick={clear}
                  className="rounded-xl border border-zinc-800 px-4 py-2.5 text-sm text-zinc-300 hover:border-zinc-600 flex items-center gap-2"
                >
                  <RefreshCcw size={14} /> Clear
                </button>
              </div>
            </div>
          )}
        </GlassCard>

        {/* Image information panel */}
        <GlassCard className="p-6 lg:col-span-2">
          <h3 className="text-sm font-medium text-zinc-50 mb-4">Image Information</h3>

          {file ? (
            <dl className="space-y-0 text-sm">
              {[
                ["Filename",   file.name],
                ["Type",       file.type.split("/")[1].toUpperCase()],
                ["Dimensions", dimensions ? `${dimensions.width} × ${dimensions.height} px` : "Loading…"],
                ["File size",  formatBytes(file.size)],
                ["Uploaded",   "Just now"],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between border-b border-zinc-900 py-3 last:border-0">
                  <dt className="text-zinc-500">{k}</dt>
                  <dd className="text-zinc-200 font-medium text-right max-w-[60%] truncate">{v}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-5 w-full" />
              ))}
            </div>
          )}

          <div className="mt-6 rounded-xl bg-zinc-900 border border-zinc-800 p-4 flex gap-3">
            <ImageIcon size={16} className="text-zinc-500 shrink-0 mt-0.5" />
            <p className="text-xs text-zinc-500">
              For best results, capture the board flat, in even lighting, with the full PCB outline visible.
            </p>
          </div>
        </GlassCard>
      </div>

      {/* Validation error shown outside panels */}
      {error && !file && (
        <div className="flex items-start gap-2 rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
