import React from "react";
import {
  Terminal,
  Cpu,
  Shield,
  GitBranch,
  Radio,
  Server,
  Layers,
  Activity,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Code2
} from "lucide-react";
import { NetworkNode } from "../types";

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  nodes: NetworkNode[];
  runningCount: number;
  totalAgents: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  nodes,
  runningCount,
  totalAgents
}) => {
  const tabs = [
    { id: "ide", label: "AI Prompt & IDE", icon: Code2, badge: "SSE" },
    { id: "agents", label: "Agent Orchestrator", icon: Activity, badge: `${runningCount}/${totalAgents}` },
    { id: "entities", label: "HA Core & Entities", icon: Radio, badge: "192.168.1.110" },
    { id: "terminal", label: "SSH Terminal (PTY)", icon: Terminal, badge: "30s T/O" },
    { id: "git", label: "Git & Revisions", icon: GitBranch, badge: "Fernet" },
    { id: "architecture", label: "Backend & Docker", icon: Layers, badge: "FastAPI" },
  ];

  return (
    <header className="border-b border-white/10 bg-[#090d16]/95 backdrop-blur-md sticky top-0 z-50 px-4 py-2.5">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-2.5">
        <div className="flex items-center space-x-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 via-blue-600/30 to-purple-600/20 border border-cyan-500/40 glow-cyan">
            <Flame className="w-5 h-5 text-cyan-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-lg font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-200 to-purple-400">
                HA-AGENTFORGE
              </span>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-cyan-950/80 border border-cyan-500/50 text-cyan-300">
                CORE 2026.10.2
              </span>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-950/80 border border-emerald-500/50 text-emerald-300">
                HAOS 18.3 BARE-METAL
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Orchestrátor &amp; Exekuční Prostředí pro Autonomní Agenty Home Assistant Core
            </p>
          </div>
        </div>

        {/* Live Network Indicators */}
        <div className="hidden lg:flex items-center space-x-2 text-xs">
          <div className="flex items-center px-2.5 py-1 rounded-lg bg-slate-900/80 border border-slate-700/60 text-slate-300 space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-mono text-[11px]">HAOS: 192.168.1.110:8123</span>
          </div>
          <div className="flex items-center px-2.5 py-1 rounded-lg bg-slate-900/80 border border-slate-700/60 text-slate-300 space-x-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span className="font-mono text-[11px]">ESP32-S3: 192.168.1.109</span>
          </div>
          <div className="flex items-center px-2.5 py-1 rounded-lg bg-slate-900/80 border border-slate-700/60 text-slate-300 space-x-2">
            <span className="w-2 h-2 rounded-full bg-purple-400" />
            <span className="font-mono text-[11px]">PVE: 192.168.1.108</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav className="flex space-x-1.5 overflow-x-auto pb-0.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                isActive
                  ? "bg-gradient-to-r from-cyan-950/90 to-blue-950/90 border border-cyan-400/60 text-cyan-200 shadow-md shadow-cyan-950/50 glow-cyan"
                  : "bg-slate-900/40 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? "text-cyan-400" : "text-slate-400"}`} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                    isActive
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/40"
                      : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </header>
  );
};
