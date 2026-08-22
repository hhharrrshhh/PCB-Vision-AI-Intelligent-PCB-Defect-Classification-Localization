// frontend/src/pages/Analytics.jsx
// Charts powered by real GET /analytics data. Empty states when no history exists.

import React, { useState, useEffect } from "react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { BarChart3, RefreshCcw } from "lucide-react";
import { ChartCard, EmptyState, Skeleton } from "../components/Primitives";
import { getAnalytics } from "../services/api";

const AXIS = { stroke: "#3f3f46", tick: { fill: "#71717a", fontSize: 11 } };
const TOOLTIP = { contentStyle: { background: "#18181b", border: "1px solid #27272a", borderRadius: 10, fontSize: 12 } };
const PASS_FAIL_COLORS = ["#22c55e", "#ef4444"];

export default function Analytics() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const load = () => {
    setLoading(true);
    setError(null);
    getAnalytics()
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <div className="p-4 md:p-8 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid lg:grid-cols-2 gap-5">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-80" />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-8">
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={load} className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-100">
            <RefreshCcw size={13} /> Retry
          </button>
        </div>
      </div>
    );
  }

  const hasData = data && data.total_inspections > 0;
  const daily   = data?.daily_stats || [];

  // Build common-defects chart data
  const commonDefects = Object.entries(data?.defects_by_class || {})
    .map(([cls, count]) => ({ name: cls.replaceAll("_", " "), count }))
    .sort((a, b) => b.count - a.count);

  return (
    <div className="p-4 md:p-8 space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">Analytics</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {hasData
              ? `Computed from ${data.total_inspections} inspection${data.total_inspections !== 1 ? "s" : ""}.`
              : "No inspection data yet."}
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-400 hover:text-zinc-100"
        >
          <RefreshCcw size={14} /> Refresh
        </button>
      </div>

      {!hasData ? (
        <EmptyState
          icon={BarChart3}
          title="No data to display"
          subtitle="Run at least one inspection to see analytics charts."
        />
      ) : (
        <div className="grid lg:grid-cols-2 gap-5">
          {/* Defects over time */}
          <ChartCard title="Defects Over Time" subtitle="Total defects detected per day">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={daily}>
                <defs>
                  <linearGradient id="defGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4F46E5" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#4F46E5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#27272a" vertical={false} />
                <XAxis dataKey="day" {...AXIS} />
                <YAxis {...AXIS} />
                <Tooltip {...TOOLTIP} />
                <Area type="monotone" dataKey="defects" stroke="#4F46E5" fill="url(#defGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Most common defects */}
          <ChartCard title="Most Common Defects" subtitle="Occurrences by defect class">
            {commonDefects.length === 0 ? (
              <div className="flex items-center justify-center h-full text-zinc-500 text-sm">No defects recorded</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={commonDefects} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid stroke="#27272a" horizontal={false} />
                  <XAxis type="number" {...AXIS} />
                  <YAxis type="category" dataKey="name" stroke={AXIS.stroke} tick={{ fill: "#a1a1aa", fontSize: 11 }} width={120} />
                  <Tooltip {...TOOLTIP} />
                  <Bar dataKey="count" fill="#4F46E5" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          {/* Average confidence trend */}
          <ChartCard title="Average Confidence" subtitle="Model confidence trend by day">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={daily}>
                <CartesianGrid stroke="#27272a" vertical={false} />
                <XAxis dataKey="day" {...AXIS} />
                <YAxis domain={[0, 100]} {...AXIS} />
                <Tooltip {...TOOLTIP} />
                <Line type="monotone" dataKey="avg_confidence" stroke="#22C55E" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Inspection volume */}
          <ChartCard title="Inspection Volume" subtitle="Boards inspected per day">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={daily}>
                <CartesianGrid stroke="#27272a" vertical={false} />
                <XAxis dataKey="day" {...AXIS} />
                <YAxis {...AXIS} />
                <Tooltip {...TOOLTIP} />
                <Bar dataKey="inspections" fill="#4F46E5" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Pass vs Fail pie */}
          <ChartCard title="Pass vs Fail" subtitle="Share of all inspections">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.pass_fail_ratio}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                >
                  {data.pass_fail_ratio.map((entry, i) => (
                    <Cell key={entry.name} fill={PASS_FAIL_COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip {...TOOLTIP} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Inference time */}
          <ChartCard title="Inference Time" subtitle="Average milliseconds per inspection per day">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={daily}>
                <CartesianGrid stroke="#27272a" vertical={false} />
                <XAxis dataKey="day" {...AXIS} />
                <YAxis {...AXIS} />
                <Tooltip {...TOOLTIP} />
                <Line type="monotone" dataKey="processing_time_ms" stroke="#F59E0B" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}
    </div>
  );
}
