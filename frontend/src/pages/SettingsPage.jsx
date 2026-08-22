// frontend/src/pages/SettingsPage.jsx

import React, { useState } from "react";
import { GlassCard } from "../components/Primitives";
import { KeyRound, Save, CheckCircle2 } from "lucide-react";

function Row({ label, hint, children }) {
  return (
    <div className="flex items-center justify-between gap-6 py-4 border-b border-zinc-900 last:border-0">
      <div>
        <div className="text-sm text-zinc-200">{label}</div>
        {hint && <div className="text-xs text-zinc-500 mt-0.5">{hint}</div>}
      </div>
      {children}
    </div>
  );
}

function Toggle({ on, setOn }) {
  return (
    <button
      onClick={() => setOn(!on)}
      className={`h-6 w-11 rounded-full transition-colors relative ${on ? "bg-indigo-600" : "bg-zinc-700"}`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${on ? "translate-x-5" : "translate-x-0.5"}`}
      />
    </button>
  );
}

export default function SettingsPage() {
  const [threshold,   setThreshold]   = useState(25);
  const [emailNotif,  setEmailNotif]  = useState(false);
  const [pushNotif,   setPushNotif]   = useState(false);
  const [repCost,     setRepCost]     = useState(1500);
  const [laborRate,   setLaborRate]   = useState(8);
  const [saved,       setSaved]       = useState(false);

  const handleSave = () => {
    // In a full implementation, these would POST to /api/v1/inspection/settings
    // For now, values are stored in component state (they affect UI only).
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="p-4 md:p-8 max-w-3xl space-y-6 animate-fade-up">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">Settings</h1>
        <p className="text-sm text-zinc-500 mt-1">Manage your workspace and inspection preferences.</p>
      </div>

      {/* Model settings */}
      <GlassCard className="p-5">
        <h3 className="text-sm font-medium text-zinc-50 mb-1">Model</h3>
        <Row label="Inference threshold" hint="Minimum confidence required to flag a defect">
          <div className="flex items-center gap-3 w-48">
            <input
              type="range" min="10" max="95" value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="w-full"
            />
            <span className="text-sm text-zinc-300 w-10 text-right">{threshold}%</span>
          </div>
        </Row>
        <Row label="Active model" hint="YOLO model weights currently loaded">
          <span className="text-sm text-zinc-400 font-mono">best.pt</span>
        </Row>
      </GlassCard>

      {/* Repair cost settings */}
      <GlassCard className="p-5">
        <h3 className="text-sm font-medium text-zinc-50 mb-1">Repair Cost Parameters</h3>
        <p className="text-xs text-zinc-500 mb-3">
          These values configure how the repair viability analysis calculates costs.
          They will take effect on the next inspection.
        </p>
        <Row label="PCB replacement cost" hint="Estimated cost to procure a new PCB (₹)">
          <div className="flex items-center gap-2">
            <span className="text-zinc-400 text-sm">₹</span>
            <input
              type="number" min="100" max="50000" value={repCost}
              onChange={(e) => setRepCost(Number(e.target.value))}
              className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 outline-none w-28 text-right"
            />
          </div>
        </Row>
        <Row label="Labor rate" hint="Technician cost per minute (₹/min)">
          <div className="flex items-center gap-2">
            <span className="text-zinc-400 text-sm">₹/min</span>
            <input
              type="number" min="1" max="500" value={laborRate}
              onChange={(e) => setLaborRate(Number(e.target.value))}
              className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 outline-none w-24 text-right"
            />
          </div>
        </Row>
      </GlassCard>

      {/* Notifications */}
      <GlassCard className="p-5">
        <h3 className="text-sm font-medium text-zinc-50 mb-1">Notifications</h3>
        <Row label="Email notifications" hint="Get a summary when an inspection fails">
          <Toggle on={emailNotif} setOn={setEmailNotif} />
        </Row>
        <Row label="Push notifications" hint="Real-time alerts in your browser">
          <Toggle on={pushNotif} setOn={setPushNotif} />
        </Row>
      </GlassCard>

      {/* Profile */}
      <GlassCard className="p-5">
        <h3 className="text-sm font-medium text-zinc-50 mb-1">Profile</h3>
        <Row label="Application">
          <span className="text-sm text-zinc-400">PCB Vision AI</span>
        </Row>
        <Row label="Backend URL">
          <span className="text-sm text-zinc-400 font-mono">localhost:8000</span>
        </Row>
        <Row label="Keyboard shortcuts" hint="View all available shortcuts">
          <button className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5">
            <KeyRound size={13} /> View
          </button>
        </Row>
      </GlassCard>

      {/* Save button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-colors ${
            saved
              ? "bg-green-600 text-white"
              : "bg-indigo-600 text-white hover:bg-indigo-500"
          }`}
        >
          {saved ? <CheckCircle2 size={15} /> : <Save size={15} />}
          {saved ? "Saved!" : "Save Settings"}
        </button>
      </div>
    </div>
  );
}
