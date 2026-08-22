// frontend/src/App.jsx
// Root application — multi-view orchestrator.
// Manages navigation state, backend health, and inspection data flow.

import React, { useState, useEffect, useRef } from "react";

import Sidebar       from "./components/Sidebar";
import Navbar        from "./components/Navbar";
import Landing       from "./pages/Landing";
import Dashboard     from "./pages/Dashboard";
import NewInspection from "./pages/NewInspection";
import Processing    from "./pages/Processing";
import Results       from "./pages/Results";
import Analytics     from "./pages/Analytics";
import History       from "./pages/History";
import SettingsPage  from "./pages/SettingsPage";
import { checkBackendHealth, uploadAndInspectPCB } from "./services/api";

const TITLES = {
  dashboard:  "Dashboard",
  new:        "New Inspection",
  processing: "AI Processing",
  results:    "Results",
  analytics:  "Analytics",
  history:    "History",
  settings:   "Settings",
};

export default function App() {
  // ── Navigation ─────────────────────────────────────────────────────────────
  const [view,         setView]         = useState("landing");
  const [mobileOpen,   setMobileOpen]   = useState(false);

  // ── Backend health ──────────────────────────────────────────────────────────
  const [isConnected,  setIsConnected]  = useState(false);

  // ── Inspection state ────────────────────────────────────────────────────────
  const [pendingFile,  setPendingFile]  = useState(null);   // File object passed from NewInspection
  const [imageUrl,     setImageUrl]     = useState(null);   // Object URL for the uploaded image
  const [inspResult,   setInspResult]   = useState(null);   // Full API response
  const inspPromiseRef = useRef(null);                      // Ref holding the in-flight Promise

  // ── Check backend on mount ─────────────────────────────────────────────────
  useEffect(() => {
    checkBackendHealth()
      .then(() => setIsConnected(true))
      .catch(() => setIsConnected(false));
  }, []);

  // ── Handle "Analyze" click from NewInspection ──────────────────────────────
  const handleAnalyze = (file) => {
    // Revoke previous object URL if any
    if (imageUrl) URL.revokeObjectURL(imageUrl);

    const url = URL.createObjectURL(file);
    setImageUrl(url);
    setPendingFile(file);
    setInspResult(null);

    // Create the real API promise BEFORE navigating to Processing
    // so Processing can receive it immediately without timing issues
    inspPromiseRef.current = uploadAndInspectPCB(file);

    setView("processing");
  };

  // ── Called by Processing on successful inference ────────────────────────────
  const handleInspectionSuccess = (result) => {
    setInspResult(result);
    setView("results");
  };

  // ── Called by Processing on error — go back to NewInspection ───────────────
  const handleInspectionError = () => {
    setView("new");
  };

  // ── Landing page (outside the app shell) ───────────────────────────────────
  if (view === "landing") {
    return <Landing goApp={() => setView("dashboard")} />;
  }

  // ── Processing page (also outside the shell — full-screen) ─────────────────
  if (view === "processing") {
    return (
      <Processing
        inspectionPromise={inspPromiseRef.current}
        onSuccess={handleInspectionSuccess}
        onError={handleInspectionError}
        onRetry={() => setView("new")}
      />
    );
  }

  // ── App shell (sidebar + navbar + main content) ────────────────────────────
  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-50 font-sans overflow-hidden">
      <Sidebar
        view={view}
        setView={setView}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar
          title={TITLES[view] || ""}
          setMobileOpen={setMobileOpen}
          isBackendConnected={isConnected}
        />

        <main className="flex-1 overflow-y-auto">
          {view === "dashboard"  && <Dashboard  goto={setView} />}
          {view === "new"        && <NewInspection onAnalyze={handleAnalyze} />}
          {view === "results"    && <Results result={inspResult} imageUrl={imageUrl} />}
          {view === "analytics"  && <Analytics />}
          {view === "history"    && <History />}
          {view === "settings"   && <SettingsPage />}
        </main>
      </div>
    </div>
  );
}