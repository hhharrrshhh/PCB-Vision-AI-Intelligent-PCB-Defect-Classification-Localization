// frontend/src/pages/History.jsx
// Real GET /history data — searchable, filterable, paginated.

import React, { useState, useEffect, useMemo } from "react";
import { Search, Filter, ChevronLeft, ChevronRight, RefreshCcw, History as HistoryIcon } from "lucide-react";
import { GlassCard, StatusBadge, EmptyState, Skeleton } from "../components/Primitives";
import { getHistory } from "../services/api";

const PAGE_SIZE = 8;

export default function History() {
  const [records, setRecords]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [query, setQuery]       = useState("");
  const [filter, setFilter]     = useState("All");
  const [page, setPage]         = useState(1);

  const load = () => {
    setLoading(true);
    setError(null);
    getHistory(200, 0)
      .then((res) => setRecords(res.records || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    return records.filter((r) => {
      const q   = query.toLowerCase();
      const matchQ = !q || r.filename?.toLowerCase().includes(q) || r.inspection_id?.toLowerCase().includes(q);
      const matchF = filter === "All" || r.status === filter;
      return matchQ && matchF;
    });
  }, [records, query, filter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const rows       = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSearch = (e) => { setQuery(e.target.value); setPage(1); };
  const handleFilter = (f)   => { setFilter(f);            setPage(1); };

  return (
    <div className="p-4 md:p-8 space-y-6 animate-fade-up">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">Inspection History</h1>
          <p className="text-sm text-zinc-500 mt-1">Every inspection run — searchable and filterable.</p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-400 hover:text-zinc-100"
        >
          <RefreshCcw size={14} /> Refresh
        </button>
      </div>

      {/* Search + filter bar */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 flex-1 min-w-[220px]">
          <Search size={15} className="text-zinc-500" />
          <input
            value={query}
            onChange={handleSearch}
            placeholder="Search by filename or inspection ID…"
            className="bg-transparent text-sm text-zinc-200 placeholder-zinc-500 outline-none w-full"
          />
        </div>
        <div className="flex items-center gap-1 rounded-xl border border-zinc-800 bg-zinc-900 p-1">
          {["All", "Pass", "Fail"].map((f) => (
            <button
              key={f}
              onClick={() => handleFilter(f)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === f ? "bg-indigo-600 text-white" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <GlassCard className="p-5">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10" />)}
          </div>
        ) : error ? (
          <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">{error}</div>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={records.length === 0 ? HistoryIcon : Filter}
            title={records.length === 0 ? "No inspections recorded" : "No results match your search"}
            subtitle={records.length === 0
              ? "Run your first PCB inspection to see it here."
              : "Try a different search term or clear your filter."}
          />
        ) : (
          <>
            <div className="overflow-x-auto -mx-5 px-5">
              <table className="w-full text-sm min-w-[700px]">
                <thead>
                  <tr className="text-left text-zinc-500 border-b border-zinc-800">
                    <th className="font-medium py-2.5 pr-4">ID</th>
                    <th className="font-medium py-2.5 pr-4">Filename</th>
                    <th className="font-medium py-2.5 pr-4">Date</th>
                    <th className="font-medium py-2.5 pr-4">Status</th>
                    <th className="font-medium py-2.5 pr-4">Defects</th>
                    <th className="font-medium py-2.5 pr-4">Confidence</th>
                    <th className="font-medium py-2.5">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr
                      key={r.inspection_id}
                      className="border-b border-zinc-900 last:border-0 hover:bg-zinc-900/60 transition-colors"
                    >
                      <td className="py-3 pr-4 text-zinc-500 font-mono text-xs">{r.inspection_id}</td>
                      <td className="py-3 pr-4 text-zinc-200 max-w-[160px] truncate">{r.filename}</td>
                      <td className="py-3 pr-4 text-zinc-500 text-xs">
                        {new Date(r.timestamp).toLocaleString()}
                      </td>
                      <td className="py-3 pr-4"><StatusBadge status={r.status} /></td>
                      <td className="py-3 pr-4 text-zinc-300">{r.total_defects}</td>
                      <td className="py-3 pr-4 text-zinc-300">
                        {r.avg_confidence > 0 ? `${r.avg_confidence}%` : "—"}
                      </td>
                      <td className="py-3 text-zinc-300">{r.duration_s}s</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-900">
              <span className="text-xs text-zinc-500">
                Page {page} of {totalPages} · {filtered.length} result{filtered.length !== 1 ? "s" : ""}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="rounded-lg border border-zinc-800 p-1.5 text-zinc-400 disabled:opacity-30 hover:border-zinc-700"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-lg border border-zinc-800 p-1.5 text-zinc-400 disabled:opacity-30 hover:border-zinc-700"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </>
        )}
      </GlassCard>
    </div>
  );
}
