// frontend/src/pages/Landing.jsx

import React from "react";
import {
  ScanLine, ArrowRight, Activity, Boxes, Layers,
  ShieldCheck, FileText, Cpu, Sparkles,
} from "lucide-react";
import PCBGraphic from "../components/PCBGraphic";
import { GlassCard } from "../components/Primitives";

const FEATURES = [
  { icon: Activity,    title: "Real-time Detection",       desc: "Boards analyzed the moment they're uploaded — no batch queue." },
  { icon: Boxes,       title: "AI Localization",           desc: "Every defect boxed at the exact coordinates it was found." },
  { icon: Layers,      title: "Multi-class Classification",desc: "Six defect types identified, not just pass or fail." },
  { icon: ShieldCheck, title: "High Accuracy",             desc: "Model performance holds above 90% across defect classes." },
  { icon: FileText,    title: "Repair Viability Analysis", desc: "Automatic cost estimation tells you repair vs discard instantly." },
  { icon: Cpu,         title: "Cloud Ready",               desc: "Runs from a browser tab — no local GPU required." },
];

const STATS = [
  { value: "90%+",     label: "Detection Accuracy" },
  { value: "<1.5 sec", label: "Inference Time" },
  { value: "6+",       label: "Defect Classes" },
  { value: "Real",     label: "YOLO Inference" },
];

export default function Landing({ goApp }) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      {/* Header */}
      <header className="flex items-center justify-between px-6 md:px-10 h-16 border-b border-zinc-900">
        <div className="flex items-center gap-2.5">
          <div className="rounded-lg bg-indigo-600 p-1.5">
            <ScanLine size={16} className="text-white" />
          </div>
          <span className="font-semibold tracking-tight">PCB Vision AI</span>
        </div>
        <button
          onClick={goApp}
          className="rounded-xl bg-zinc-100 text-zinc-900 text-sm font-medium px-4 py-2 hover:bg-white transition-colors"
        >
          Open Dashboard
        </button>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden px-6 md:px-10 pt-16 pb-20 md:pt-24 md:pb-28">
        {/* Background glows */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 left-1/4 h-72 w-72 rounded-full bg-indigo-600/20 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 h-72 w-72 rounded-full bg-indigo-800/10 blur-3xl" />
        </div>

        <div className="relative max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 text-xs text-zinc-400 mb-6">
              <Sparkles size={12} className="text-indigo-400" />
              Deep-learning defect inspection + repair viability
            </div>
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight leading-[1.1]">
              AI PCB Defect<br />Detection
            </h1>
            <p className="mt-5 text-zinc-400 text-lg max-w-md">
              Upload PCB images and instantly identify manufacturing defects using
              a trained YOLO model — with automatic repair cost estimation.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                onClick={goApp}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
              >
                Start Inspection <ArrowRight size={15} />
              </button>
              <button
                onClick={goApp}
                className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 px-5 py-3 text-sm font-medium text-zinc-200 hover:border-zinc-700 transition-colors"
              >
                View Dashboard
              </button>
            </div>
          </div>

          {/* Decorative PCB with scan animation */}
          <PCBGraphic
            scan
            boxes={[
              { uid: "l1", typeId: "open",      x: 14, y: 18, w: 11, h: 9 },
              { uid: "l2", typeId: "mousebite", x: 58, y: 55, w: 9,  h: 8 },
            ]}
          />
        </div>
      </section>

      {/* Stats bar */}
      <section className="px-6 md:px-10 py-16 border-t border-zinc-900">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-3xl font-semibold text-zinc-50 tracking-tight">{s.value}</div>
              <div className="mt-1 text-sm text-zinc-500">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="px-6 md:px-10 py-16 border-t border-zinc-900">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-semibold tracking-tight mb-10">
            Built for the whole inspection loop
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <GlassCard key={f.title} className="p-6 hover:border-zinc-700 transition-colors">
                <div className="rounded-xl bg-indigo-500/10 text-indigo-400 p-2.5 w-fit">
                  <f.icon size={18} />
                </div>
                <h3 className="mt-4 font-medium text-zinc-50">{f.title}</h3>
                <p className="mt-1.5 text-sm text-zinc-500">{f.desc}</p>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 md:px-10 py-20 border-t border-zinc-900">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-semibold tracking-tight">Catch defects before they ship</h2>
          <p className="mt-3 text-zinc-400">
            Run your first inspection in under a minute — no setup required.
          </p>
          <button
            onClick={goApp}
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
          >
            Start Inspection <ArrowRight size={15} />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 md:px-10 py-10 border-t border-zinc-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-zinc-500">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-indigo-600 p-1">
            <ScanLine size={13} className="text-white" />
          </div>
          PCB Vision AI © 2026
        </div>
        <div className="flex gap-6">
          <span className="hover:text-zinc-300 cursor-pointer">Docs</span>
          <span className="hover:text-zinc-300 cursor-pointer">Privacy</span>
          <span className="hover:text-zinc-300 cursor-pointer">Contact</span>
        </div>
      </footer>
    </div>
  );
}
