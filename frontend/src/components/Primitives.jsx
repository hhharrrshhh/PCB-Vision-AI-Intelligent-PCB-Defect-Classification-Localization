// frontend/src/components/Primitives.jsx
// Shared UI building blocks used across all pages

import React, { useState, useEffect } from "react";
import { CheckCircle2, XCircle, TrendingUp } from "lucide-react";

// ── GlassCard ────────────────────────────────────────────────────────────────
export function GlassCard({ className = "", children, ...rest }) {
  return (
    <div
      className={`rounded-[20px] border border-zinc-800 bg-zinc-900/60 backdrop-blur-xl shadow-lg shadow-black/20 ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

// ── StatusBadge ──────────────────────────────────────────────────────────────
export function StatusBadge({ status }) {
  const pass = status === "Pass";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
        pass ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
      }`}
    >
      {pass ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
      {status}
    </span>
  );
}

// ── SeverityPill ─────────────────────────────────────────────────────────────
export function SeverityPill({ severity }) {
  const map = {
    Critical: "bg-red-500/10 text-red-400 border border-red-500/20",
    Medium:   "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    Low:      "bg-blue-500/10 text-blue-400 border border-blue-500/20",
  };
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${map[severity] || map.Low}`}>
      {severity}
    </span>
  );
}

// ── AnimatedCounter ───────────────────────────────────────────────────────────
export function AnimatedCounter({ value, decimals = 0, suffix = "" }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let frame;
    const start = performance.now();
    const duration = 900;
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(value * eased);
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  return (
    <span>
      {display.toFixed(decimals)}
      {suffix}
    </span>
  );
}

// ── MetricCard ────────────────────────────────────────────────────────────────
export function MetricCard({ icon: Icon, label, value, decimals = 0, suffix = "", trend, tone = "indigo" }) {
  const toneMap = {
    indigo: "text-indigo-400 bg-indigo-500/10",
    green:  "text-green-400 bg-green-500/10",
    amber:  "text-amber-400 bg-amber-500/10",
    red:    "text-red-400 bg-red-500/10",
  };
  return (
    <GlassCard className="p-5 hover:border-zinc-700 transition-colors">
      <div className="flex items-center justify-between">
        <div className={`rounded-xl p-2.5 ${toneMap[tone] || toneMap.indigo}`}>
          <Icon size={18} />
        </div>
        {trend != null && (
          <span
            className={`flex items-center gap-1 text-xs font-medium ${
              trend >= 0 ? "text-green-400" : "text-red-400"
            }`}
          >
            <TrendingUp size={12} className={trend < 0 ? "rotate-180" : ""} />
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className="mt-4 text-2xl font-semibold text-zinc-50 tracking-tight">
        <AnimatedCounter value={value} decimals={decimals} suffix={suffix} />
      </div>
      <div className="mt-1 text-sm text-zinc-400">{label}</div>
    </GlassCard>
  );
}

// ── ChartCard ─────────────────────────────────────────────────────────────────
export function ChartCard({ title, subtitle, children, className = "" }) {
  return (
    <GlassCard className={`p-5 ${className}`}>
      <div className="mb-4">
        <h3 className="text-sm font-medium text-zinc-50">{title}</h3>
        {subtitle && <p className="text-xs text-zinc-500 mt-0.5">{subtitle}</p>}
      </div>
      <div className="h-64">{children}</div>
    </GlassCard>
  );
}

// ── EmptyState ────────────────────────────────────────────────────────────────
export function EmptyState({ icon: Icon, title, subtitle, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="rounded-2xl bg-zinc-800/60 p-4 mb-4">
        <Icon size={28} className="text-zinc-500" />
      </div>
      <div className="text-zinc-200 font-medium">{title}</div>
      <div className="text-zinc-500 text-sm mt-1 max-w-xs">{subtitle}</div>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
export function Skeleton({ className = "" }) {
  return <div className={`animate-pulse rounded-lg bg-zinc-800/70 ${className}`} />;
}

// ── Spinner ───────────────────────────────────────────────────────────────────
export function Spinner({ size = 20, className = "" }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.2" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
