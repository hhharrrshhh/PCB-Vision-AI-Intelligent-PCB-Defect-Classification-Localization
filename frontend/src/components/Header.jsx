import React from 'react';
import { Cpu, Activity } from 'lucide-react';

export default function Header({ isConnected }) {
  return (
    <header className="bg-pcb-card border-b border-pcb-border px-6 py-4 flex items-center justify-between shadow-lg">
      <div className="flex items-center space-x-3">
        <div className="bg-pcb-accent/20 p-2 rounded-lg border border-pcb-accent/40">
          <Cpu className="w-6 h-6 text-pcb-accent" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white tracking-wide">PCB Vision AI</h1>
          <p className="text-xs text-gray-400">Automated Defect Detection & Localization System</p>
        </div>
      </div>

      <div className="flex items-center space-x-2 bg-pcb-dark/60 px-3 py-1.5 rounded-full border border-pcb-border">
        <Activity className={`w-4 h-4 ${isConnected ? 'text-pcb-accent animate-pulse' : 'text-pcb-danger'}`} />
        <span className="text-xs text-gray-300 font-medium">
          {isConnected ? 'Backend Connected' : 'Backend Disconnected'}
        </span>
      </div>
    </header>
  );
}