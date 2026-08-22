// frontend/src/components/Sidebar.jsx

import React from "react";
import { LayoutDashboard, PlusCircle, History as HistoryIcon, BarChart3, Settings as SettingsIcon, ScanLine, ArrowLeft } from "lucide-react";

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard",      icon: LayoutDashboard },
  { id: "new",       label: "New Inspection", icon: PlusCircle },
  { id: "history",   label: "History",        icon: HistoryIcon },
  { id: "analytics", label: "Analytics",      icon: BarChart3 },
  { id: "settings",  label: "Settings",       icon: SettingsIcon },
];

export default function Sidebar({ view, setView, mobileOpen, setMobileOpen }) {
  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`
          fixed z-50 md:z-0 md:static top-0 left-0 h-full w-64 shrink-0
          border-r border-zinc-800 bg-zinc-950 flex flex-col
          transition-transform duration-200
          ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 h-16 border-b border-zinc-800">
          <div className="rounded-lg bg-indigo-600 p-1.5">
            <ScanLine size={16} className="text-white" />
          </div>
          <span className="font-semibold text-zinc-50 tracking-tight">PCB Vision AI</span>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = view === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { setView(item.id); setMobileOpen(false); }}
                className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                  active
                    ? "bg-indigo-600/15 text-indigo-300 border border-indigo-500/20"
                    : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900"
                }`}
              >
                <item.icon size={17} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Back to landing */}
        <div className="p-3 border-t border-zinc-800">
          <button
            onClick={() => setView("landing")}
            className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900 transition-colors"
          >
            <ArrowLeft size={17} /> Back to site
          </button>
        </div>
      </aside>
    </>
  );
}
