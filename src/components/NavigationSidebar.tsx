import React, { useState } from "react";
import {
  Code2,
  Sparkles,
  Activity,
  Radio,
  Terminal,
  GitBranch,
  Layers,
  Cpu,
  Server,
  Zap,
  ChevronLeft,
  ChevronRight,
  Search,
  Sliders,
  CheckCircle2,
  Flame,
  ShieldCheck,
  Clock,
  Wifi,
  HardDrive
} from "lucide-react";
import { NetworkNode, LlmProviderConfig } from "../types";

export interface NavGroup {
  groupTitle: string;
  items: {
    id: string;
    label: string;
    subtitle: string;
    icon: React.ElementType;
    badge?: string;
    badgeColor?: string;
  }[];
}

interface NavigationSidebarProps {
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onOpenCommandPalette: () => void;
  onOpenLlmConfig: () => void;
  llmConfig: LlmProviderConfig;
  runningAgentsCount: number;
  totalAgentsCount: number;
  nodes: NetworkNode[];
}

export const NavigationSidebar: React.FC<NavigationSidebarProps> = ({
  activeTab,
  onSelectTab,
  isCollapsed,
  onToggleCollapse,
  onOpenCommandPalette,
  onOpenLlmConfig,
  llmConfig,
  runningAgentsCount,
  totalAgentsCount,
  nodes
}) => {
  const isLocalLlm = llmConfig.providerType !== "openai";

  const navigationGroups: NavGroup[] = [
    {
      groupTitle: "Vývoj & AI Modely",
      items: [
        {
          id: "ide",
          label: "Vývojové Studio",
          subtitle: "Prompt, Monaco IDE & AST",
          icon: Code2,
          badge: "SSE",
          badgeColor: "bg-cyan-950 text-cyan-300 border-cyan-500/40"
        },
        {
          id: "playground",
          label: "Srovnávací Laboratoř",
          subtitle: "Lokální SLM vs GPT-4o Diff",
          icon: Sparkles,
          badge: "AST Diff",
          badgeColor: "bg-purple-950 text-purple-300 border-purple-500/40"
        }
      ]
    },
    {
      groupTitle: "Orchestrace & Telemetrie",
      items: [
        {
          id: "agents",
          label: "Orchestrátor Agentů",
          subtitle: "D3 Heatmapa & Logy 10k",
          icon: Activity,
          badge: `${runningAgentsCount}/${totalAgentsCount}`,
          badgeColor: "bg-emerald-950 text-emerald-300 border-emerald-500/40"
        },
        {
          id: "entities",
          label: "HA Core & Entity",
          subtitle: "Duální rozhraní & Cron",
          icon: Radio,
          badge: "192.168.1.110",
          badgeColor: "bg-cyan-950 text-cyan-300 border-cyan-500/40"
        }
      ]
    },
    {
      groupTitle: "Infrastruktura & Nástroje",
      items: [
        {
          id: "terminal",
          label: "Vzdálená Konzole PTY",
          subtitle: "SSH root@192.168.1.110:22",
          icon: Terminal,
          badge: "30s T/O",
          badgeColor: "bg-amber-950 text-amber-300 border-amber-500/40"
        },
        {
          id: "git",
          label: "Verzování & GitHub",
          subtitle: "Vizuální Diff & Fernet",
          icon: GitBranch,
          badge: "Revize",
          badgeColor: "bg-slate-900 text-slate-300 border-slate-700"
        },
        {
          id: "architecture",
          label: "Architektura & Docker",
          subtitle: "Compose stack & FastAPI",
          icon: Layers,
          badge: "Produkce",
          badgeColor: "bg-blue-950 text-blue-300 border-blue-500/40"
        }
      ]
    }
  ];

  return (
    <aside
      className={`rog-glass border-r border-white/10 flex flex-col shrink-0 transition-all duration-300 select-none z-30 ${
        isCollapsed ? "w-16" : "w-72"
      }`}
    >
      {/* Sidebar Header & Brand */}
      <div className="p-3.5 border-b border-white/10 flex items-center justify-between bg-slate-950/80">
        {!isCollapsed && (
          <div className="flex items-center space-x-2.5 overflow-hidden">
            <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/30 to-purple-600/30 border border-cyan-500/50 glow-cyan shrink-0">
              <Flame className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="overflow-hidden">
              <div className="font-black text-xs tracking-wider text-slate-100 flex items-center space-x-1.5 truncate">
                <span>HA-AGENTFORGE</span>
              </div>
              <span className="text-[10px] text-cyan-400 font-mono block truncate">
                PROVOZNÍ MENU
              </span>
            </div>
          </div>
        )}

        {isCollapsed && (
          <div className="mx-auto">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-950/60 border border-cyan-500/50 text-cyan-400">
              <Flame className="w-4 h-4" />
            </div>
          </div>
        )}

        <button
          onClick={onToggleCollapse}
          className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors shrink-0"
          title={isCollapsed ? "Rozbalit navigační menu" : "Sbalit menu"}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Quick Jump Command Search Bar */}
      <div className="p-2 border-b border-white/5">
        <button
          onClick={onOpenCommandPalette}
          className={`w-full flex items-center rounded-xl bg-slate-900/80 hover:bg-slate-800/90 border border-white/10 hover:border-cyan-500/40 text-slate-400 hover:text-slate-200 text-xs transition-all ${
            isCollapsed ? "justify-center p-2" : "justify-between px-3 py-2"
          }`}
          title="Rychlé vyhledávání funkcí (Ctrl+K)"
        >
          <div className="flex items-center space-x-2">
            <Search className="w-3.5 h-3.5 text-cyan-400" />
            {!isCollapsed && <span className="font-sans">Hledat funkci...</span>}
          </div>
          {!isCollapsed && (
            <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-black/40 border border-white/10 font-mono text-slate-500">
              Ctrl+K
            </kbd>
          )}
        </button>
      </div>

      {/* Main Navigation Scroll Area */}
      <div className="flex-1 overflow-y-auto p-2 space-y-4">
        {navigationGroups.map((group, groupIdx) => (
          <div key={groupIdx} className="space-y-1">
            {!isCollapsed && (
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2 block mb-1 font-mono">
                {group.groupTitle}
              </span>
            )}

            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full text-left rounded-xl transition-all flex items-center ${
                    isCollapsed ? "justify-center p-2.5" : "justify-between p-2.5"
                  } ${
                    isActive
                      ? "bg-gradient-to-r from-cyan-950/90 to-blue-950/80 border border-cyan-400/60 text-cyan-200 shadow-md glow-cyan"
                      : "bg-transparent hover:bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-transparent"
                  }`}
                  title={`${item.label} - ${item.subtitle}`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div
                      className={`p-1.5 rounded-lg shrink-0 ${
                        isActive
                          ? "bg-cyan-500/20 text-cyan-300"
                          : "bg-slate-900/80 text-slate-400"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>

                    {!isCollapsed && (
                      <div className="overflow-hidden">
                        <div className="font-bold text-xs truncate leading-snug">
                          {item.label}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate leading-tight">
                          {item.subtitle}
                        </div>
                      </div>
                    )}
                  </div>

                  {!isCollapsed && item.badge && (
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded border font-mono shrink-0 ml-1.5 ${
                        item.badgeColor || "bg-slate-900 text-slate-300 border-slate-700"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Active LLM Provider Quick Widget */}
      <div className="p-2 border-t border-white/10 bg-slate-950/90">
        {!isCollapsed ? (
          <div className="p-2.5 rounded-xl bg-slate-900/60 border border-white/5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase font-mono flex items-center space-x-1">
                <Cpu className="w-3 h-3 text-purple-400" />
                <span>LLM Poskytovatel</span>
              </span>
              <button
                onClick={onOpenLlmConfig}
                className="text-[10px] text-cyan-400 hover:text-cyan-300 font-mono transition-colors"
              >
                Změnit
              </button>
            </div>

            <div className="flex items-center justify-between text-xs font-mono">
              <span className="font-bold text-slate-200 truncate">
                {llmConfig.modelName}
              </span>
              <span
                className={`text-[9px] px-1 py-0.2 rounded border font-mono ${
                  isLocalLlm
                    ? "bg-purple-950 border-purple-500/40 text-purple-300"
                    : "bg-emerald-950 border-emerald-500/40 text-emerald-300"
                }`}
              >
                {isLocalLlm ? "LOKÁLNÍ" : "CLOUD"}
              </span>
            </div>

            <div className="text-[10px] text-slate-500 font-mono truncate">
              {isLocalLlm ? "Dell R510 (192.168.1.108:11434)" : "OpenAI Cloud API"}
            </div>
          </div>
        ) : (
          <button
            onClick={onOpenLlmConfig}
            className="w-full flex justify-center p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-purple-400 border border-purple-500/30 transition-colors"
            title={`Aktivní LLM: ${llmConfig.modelName} (Klikněte pro nastavení)`}
          >
            <Cpu className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Infrastructure Node Heartbeats (Strict Topological Sequence) */}
      {!isCollapsed && (
        <div className="p-2.5 border-t border-white/5 bg-slate-950/40 text-[10px] font-mono text-slate-400 space-y-1.5">
          <div className="text-[9px] uppercase tracking-wider text-slate-500 font-bold mb-1">
            Topologie Infrastruktury (L2/L3):
          </div>
          {/* Node 1: 192.168.1.108 */}
          <div className="flex items-center justify-between hover:text-slate-200">
            <span className="flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
              <span>Proxmox (Dell R510):</span>
            </span>
            <span className="text-purple-300 font-bold">192.168.1.108</span>
          </div>

          {/* Node 2: 192.168.1.109 */}
          <div className="flex items-center justify-between hover:text-slate-200">
            <span className="flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span>ESP32-S3 Sub-GHz:</span>
            </span>
            <span className="text-cyan-300 font-bold">192.168.1.109</span>
          </div>

          {/* Node 3: 192.168.1.110 */}
          <div className="flex items-center justify-between hover:text-slate-200">
            <span className="flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>Home Assistant OS:</span>
            </span>
            <span className="text-emerald-300 font-bold">192.168.1.110</span>
          </div>

          {/* Node 4: 192.168.1.115 */}
          <div className="flex items-center justify-between hover:text-slate-200">
            <span className="flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              <span>TrueNAS SCALE (ZFS):</span>
            </span>
            <span className="text-blue-300 font-bold">192.168.1.115</span>
          </div>
        </div>
      )}
    </aside>
  );
};
