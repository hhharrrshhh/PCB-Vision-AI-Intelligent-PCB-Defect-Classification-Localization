// frontend/src/pages/Dashboard.jsx
// Real data from GET /history and GET /analytics. Empty states for fresh install.

import React, { useState, useEffect } from "react";
import {
  Activity, Bug, Gauge, Clock, PlusCircle, ArrowRight,
} from "lucide-react";
import {
  GlassCard, MetricCard, StatusBadge, EmptyState, Skeleton,
} from "../components/Primitives";
import { getHistory, getAnalytics } from "../services/api";

export default function Dashboard({ goto }) {
  const [analytics, setAnalytics] = useState(null);
  const [history, setHistory]     = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  useEffect(() => {
    Promise.all([getAnalytics(), getHistory(5, 0)])
      .then(([ana, hist]) => {
        setAnalytics(ana);
        setHistory(hist.records || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const recentRows = history?.slice(0, 5) || [];

  return (
    <div className="p-4 md:p-8 space-y-8 animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">Dashboard</h1>
          <p className="text-sm text-zinc-500 mt-1">Overview of your inspection activity.</p>
        </div>
        <button
          onClick={() => goto("new")}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
        >
          <PlusCircle size={16} /> New Inspection
        </button>
      </div>

      {/* Metric cards */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400">
          {error}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <MetricCard
            icon={Activity}
            label="Total Inspections"
            value={analytics?.total_inspections ?? 0}
            tone="indigo"
          />
          <MetricCard
            icon={Bug}
            label="Detected Defects"
            value={analytics?.total_defects ?? 0}
            tone="amber"
          />
          <MetricCard
            icon={Gauge}
            label="Avg Confidence"
            value={analytics?.avg_confidence ?? 0}
            decimals={1}
            suffix="%"
            tone="green"
          />
          <MetricCard
            icon={Clock}
            label="Avg Processing Time"
            value={analytics ? analytics.avg_processing_time_ms / 1000 : 0}
            decimals={2}
            suffix="s"
            tone="indigo"
          />
        </div>
      )}

      {/* Recent inspections table */}
      <GlassCard className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-zinc-50">Recent Inspections</h3>
          {recentRows.length > 0 && (
            <button
              onClick={() => goto("history")}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              View all <ArrowRight size={12} />
            </button>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10" />)}
          </div>
        ) : recentRows.length === 0 ? (
          <EmptyState
            icon={Activity}
            title="No inspections yet"
            subtitle="Run your first PCB inspection to see results here."
            action={
              <button
                onClick={() => goto("new")}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
              >
                <PlusCircle size={15} /> New Inspection
              </button>
            }
          />
        ) : (
          <div className="overflow-x-auto -mx-5 px-5">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="text-left text-zinc-500 border-b border-zinc-800">
                  <th className="font-medium py-2.5 pr-4">Filename</th>
                  <th className="font-medium py-2.5 pr-4">Date</th>
                  <th className="font-medium py-2.5 pr-4">Status</th>
                  <th className="font-medium py-2.5 pr-4">Defects</th>
                  <th className="font-medium py-2.5 pr-4">Confidence</th>
                  <th className="font-medium py-2.5">Duration</th>
                </tr>
              </thead>
              <tbody>
                {recentRows.map((r) => (
                  <tr
                    key={r.inspection_id}
                    className="border-b border-zinc-900 last:border-0 hover:bg-zinc-900/60 transition-colors"
                  >
                    <td className="py-3 pr-4 text-zinc-200 max-w-[160px] truncate">{r.filename}</td>
                    <td className="py-3 pr-4 text-zinc-500 text-xs">
                      {new Date(r.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 pr-4"><StatusBadge status={r.status} /></td>
                    <td className="py-3 pr-4 text-zinc-300">{r.total_defects}</td>
                    <td className="py-3 pr-4 text-zinc-300">{r.avg_confidence}%</td>
                    <td className="py-3 text-zinc-300">{r.duration_s}s</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  );
}