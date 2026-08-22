// frontend/src/components/Navbar.jsx

import React from "react";
import { Search, Bell, Menu, Activity } from "lucide-react";

export default function Navbar({ title, setMobileOpen, isBackendConnected }) {
  return (
    <header className="sticky top-0 z-30 h-16 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-xl flex items-center gap-3 px-4 md:px-6">
      {/* Hamburger (mobile) */}
      <button
        className="md:hidden text-zinc-400 hover:text-zinc-100"
        onClick={() => setMobileOpen(true)}
      >
        <Menu size={20} />
      </button>

      {/* Page title */}
      <div className="hidden md:flex items-center gap-2 text-sm">
        <span className="text-zinc-200 font-medium">{title}</span>
      </div>

      {/* Right section */}
      <div className="ml-auto flex items-center gap-2 md:gap-3">
        {/* Search */}
        <div className="hidden sm:flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-1.5 w-52">
          <Search size={15} className="text-zinc-500" />
          <input
            placeholder="Search inspections…"
            className="bg-transparent text-sm text-zinc-200 placeholder-zinc-500 outline-none w-full"
            readOnly
          />
        </div>

        {/* Backend status */}
        <div
          className={`hidden sm:flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium ${
            isBackendConnected
              ? "border-green-500/20 bg-green-500/10 text-green-400"
              : "border-red-500/20 bg-red-500/10 text-red-400"
          }`}
        >
          <Activity size={13} className={isBackendConnected ? "animate-pulse" : ""} />
          {isBackendConnected ? "Backend Online" : "Backend Offline"}
        </div>

        {/* Notifications */}
        <button className="relative rounded-xl border border-zinc-800 bg-zinc-900 p-2 text-zinc-400 hover:text-zinc-100">
          <Bell size={16} />
          <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-indigo-500" />
        </button>

        {/* Avatar */}
        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-800 flex items-center justify-center text-xs font-semibold text-white">
          AI
        </div>
      </div>
    </header>
  );
}
