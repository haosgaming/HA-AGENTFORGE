import React from "react";
import {
  Flame,
  Search,
  Cpu,
  Layers,
  Sparkles,
  Command,
  Activity,
  Code2,
  Radio,
  Terminal,
  GitBranch,
  Menu,
  Server,
  HardDrive
} from "lucide-react";
import { NetworkNode, LlmProviderConfig } from "../types";

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  nodes: NetworkNode[];
  runningCount: number;
  totalAgents: number;
  llmConfig: LlmProviderConfig;
  onOpenLlmConfig: () => void;
  onOpenCommandPalette: () => void;
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  nodes,
  runningCount,
  totalAgents,
  llmConfig,
  onOpenLlmConfig,
  onOpenCommandPalette,
  onToggleSidebar
}) => {
  const isLocalLlm = llmConfig.providerType !== "openai";

  const tabLabels: Record<string, { title: string; subtitle: string; icon: React.ElementType }> = {
    ide: { title: "Vývojové Studio", subtitle: "Tvorba promptů, Monaco IDE & AST validace", icon: Code2 },
    playground: { title: "Srovnávací Laboratoř Modelů", subtitle: "AST porovnání GPT-4o vs lokální SLM (Dell R510)", icon: Sparkles },
    agents: { title: "Orchestrátor Agentů", subtitle: "Telemetrie, D3.js 24h heatmapa a rotace logů", icon: Activity },
    entities: { title: "HA Core & Správa Entit", subtitle: "REST/WS rozhraní (192.168.1.110) a plánovač Cron", icon: Radio },
    terminal: { title: "Vzdálená SSH Konzole (PTY)", subtitle: "asyncssh relace s knihovnou předpřipravených příkazů", icon: Terminal },
    git: { title: "Verzování Kódu & GitHub", subtitle: "Vizuální Side-by-Side diff a Fernet šifrování", icon: GitBranch },
    architecture: { title: "Architektura & Docker Stack", subtitle: "Produkční Docker Compose a FastAPI backend", icon: Layers }
  };

  const current = tabLabels[activeTab] || tabLabels.ide;
  const CurrentIcon = current.icon;

  return (
    <header className="border-b border-white/10 bg-[#090d16]/95 backdrop-blur-md sticky top-0 z-40 px-4 py-2 shrink-0 flex flex-wrap items-center justify-between gap-3">
      {/* Left: Mobile Sidebar Trigger + Breadcrumb Current Section */}
      <div className="flex items-center space-x-3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="p-1.5 rounded-lg bg-slate-900 border border-white/10 text-slate-400 hover:text-slate-200 transition-colors md:hidden"
            title="Přepnout navigační menu"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}

        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-300">
            <CurrentIcon className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-sm text-slate-100 tracking-wide uppercase">
                {current.title}
              </span>
              <span className="hidden sm:inline-block px-1.5 py-0.2 rounded bg-cyan-950/70 border border-cyan-500/30 text-cyan-400 text-[10px] font-mono font-bold">
                CORE 2026.10.2
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              {current.subtitle}
            </p>
          </div>
        </div>
      </div>

      {/* Right: Quick Search Button, LLM Status & All Network Infrastructure Nodes */}
      <div className="flex items-center flex-wrap gap-2">
        {/* Command Palette Button */}
        <button
          onClick={onOpenCommandPalette}
          className="flex items-center space-x-2 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-200 text-xs font-mono transition-all shadow-sm"
          title="Rychlé vyhledávání funkcí (Ctrl+K)"
        >
          <Search className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden md:inline">Příkazové menu</span>
          <kbd className="hidden lg:inline text-[10px] px-1.5 py-0.2 rounded bg-black/50 border border-white/10 text-slate-400">
            Ctrl+K
          </kbd>
        </button>

        {/* Active LLM Provider Quick Chip */}
        <button
          onClick={onOpenLlmConfig}
          className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl border font-mono transition-all text-xs shadow-sm ${
            isLocalLlm
              ? "bg-purple-950/80 border-purple-500/50 text-purple-200 hover:bg-purple-900/60"
              : "bg-emerald-950/80 border-emerald-500/50 text-emerald-200 hover:bg-emerald-900/60"
          }`}
          title="Konfigurace LLM Poskytovatele (Ollama / vLLM vs Cloud OpenAI)"
        >
          <Cpu className="w-3.5 h-3.5" />
          <span className="font-bold text-[11px] hidden sm:inline">
            {isLocalLlm ? `Lokální: ${llmConfig.modelName}` : `Cloud: ${llmConfig.modelName}`}
          </span>
          <span className="text-[9px] px-1 py-0.2 rounded bg-black/40 border border-white/10 uppercase">
            {isLocalLlm ? "Bez Klíče" : "API Klíč"}
          </span>
        </button>

        {/* Complete Network Infrastructure Topology Strip */}
        <div className="hidden lg:flex items-center space-x-1.5 text-xs font-mono">
          {/* Node 1: Proxmox Dell R510 (192.168.1.108) */}
          <div
            className="flex items-center space-x-1.5 px-2 py-1 rounded-lg bg-slate-900/90 border border-purple-500/40 text-purple-200"
            title="Dell PowerEdge R510 (Proxmox VE 7.4, 2x Xeon L5640, MAC: 78:2B:CB:19:0D:FD)"
          >
            <span className="w-2 h-2 rounded-full bg-purple-400" />
            <span className="text-[11px]">PVE: 192.168.1.108</span>
          </div>

          {/* Node 2: ESP32-S3 Sub-GHz Gateway (192.168.1.109) */}
          <div
            className="flex items-center space-x-1.5 px-2 py-1 rounded-lg bg-slate-900/90 border border-cyan-500/40 text-cyan-200"
            title="ESP32-S3 433MHz Gateway (CC1101, ESP-IDF v5.5+, MAC: 30:ED:A0:BD:31:F4)"
          >
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span className="text-[11px]">ESP32-S3: 192.168.1.109</span>
          </div>

          {/* Node 3: Home Assistant Bare-metal (192.168.1.110) */}
          <div
            className="flex items-center space-x-1.5 px-2 py-1 rounded-lg bg-slate-900/90 border border-emerald-500/40 text-emerald-200"
            title="Home Assistant OS 18.3 | Core 2026.10.2 (MAC: B0:5C:DA:3B:05:A9)"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-[11px]">HAOS: 192.168.1.110</span>
          </div>

          {/* Node 4: TrueNAS SCALE (192.168.1.115) */}
          <div
            className="hidden 2xl:flex items-center space-x-1.5 px-2 py-1 rounded-lg bg-slate-900/90 border border-slate-700/60 text-slate-300"
            title="truenas2 (TrueNAS SCALE 27.0, ZFS Storage)"
          >
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            <span className="text-[11px]">TrueNAS: 192.168.1.115</span>
          </div>
        </div>
      </div>
    </header>
  );
};
