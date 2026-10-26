import React, { useState } from "react";
import {
  Activity,
  Play,
  Square,
  AlertOctagon,
  RefreshCw,
  Bell,
  Cpu,
  HardDrive,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Clock
} from "lucide-react";
import { AgentInstance, AgentStatusType } from "../types";

interface AgentManagerViewProps {
  agents: AgentInstance[];
  onStartAgent: (id: number) => void;
  onStopAgent: (id: number) => void;
  onEmergencyStopAll: () => void;
  onSendWebhookAlert: (agentId: number) => void;
}

export const AgentManagerView: React.FC<AgentManagerViewProps> = ({
  agents,
  onStartAgent,
  onStopAgent,
  onEmergencyStopAll,
  onSendWebhookAlert,
}) => {
  const [selectedAgentId, setSelectedAgentId] = useState<number>(agents[0]?.id || 1);
  const activeAgent = agents.find((a) => a.id === selectedAgentId) || agents[0];

  const getStatusBadge = (status: AgentStatusType) => {
    switch (status) {
      case "RUNNING":
        return (
          <span className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 text-[11px] font-bold glow-green">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>BĚŽÍ (RUNNING)</span>
          </span>
        );
      case "ERROR":
        return (
          <span className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-red-950/80 border border-red-500/60 text-red-300 text-[11px] font-bold glow-crimson">
            <AlertTriangle className="w-3 h-3 text-red-400" />
            <span>CHYBA (ERROR)</span>
          </span>
        );
      case "BLOCKED":
        return (
          <span className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-amber-950/80 border border-amber-500/60 text-amber-300 text-[11px] font-bold glow-amber">
            <AlertOctagon className="w-3 h-3 text-amber-400" />
            <span>BLOKOVÁNO (BLOCKED)</span>
          </span>
        );
      case "IDLE":
      default:
        return (
          <span className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-700 text-slate-300 text-[11px] font-bold">
            <Clock className="w-3 h-3 text-cyan-400" />
            <span>V KLIDU (IDLE)</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Telemetry & Global Controls */}
      <div className="rog-glass p-4 text-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold tracking-wide uppercase text-slate-100 flex items-center space-x-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>Orchestrace Autonomních Agentů &amp; Telemetrie</span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Plánovač úloh na pozadí (APScheduler / Celery) s rotací logů do 10 000 znaků a Webhook notifikacemi
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => onSendWebhookAlert(activeAgent.id)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold transition-colors"
            >
              <Bell className="w-3.5 h-3.5 text-amber-400" />
              <span>Otestovat HA Webhook</span>
            </button>

            <button
              onClick={onEmergencyStopAll}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-red-950 hover:bg-red-900 border border-red-500/60 text-red-200 text-xs font-bold glow-crimson transition-all"
            >
              <AlertOctagon className="w-3.5 h-3.5 text-red-400" />
              <span>NOUZOVÉ ZASTAVENÍ VŠECH AGENTŮ</span>
            </button>
          </div>
        </div>
      </div>

      {/* Agents Grid and Selected Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Agents List Column */}
        <div className="space-y-3">
          {agents.map((agent) => {
            const isSelected = agent.id === selectedAgentId;
            return (
              <div
                key={agent.id}
                onClick={() => setSelectedAgentId(agent.id)}
                className={`p-3.5 rounded-xl cursor-pointer transition-all border ${
                  isSelected
                    ? "bg-slate-900/90 border-cyan-400/70 shadow-lg shadow-cyan-950/40 glow-cyan"
                    : "bg-slate-900/40 border-white/5 hover:border-white/20 hover:bg-slate-900/60"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-xs text-slate-100">{agent.name}</span>
                  {getStatusBadge(agent.status)}
                </div>

                <div className="text-[11px] font-mono text-slate-400 space-y-1">
                  <div className="flex justify-between">
                    <span>Skript:</span>
                    <span className="text-cyan-300 truncate max-w-[160px]">{agent.current_script_path}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Interval spouštění:</span>
                    <span className="text-slate-200">{agent.interval_seconds} s</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Poslední běh:</span>
                    <span className="text-slate-200">{agent.last_run_at}</span>
                  </div>
                </div>

                {/* Micro CPU & RAM bar */}
                <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>CPU: {agent.cpu_percent}%</span>
                  <span>RAM: {agent.memory_mb} MB</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Agent Details & Log Buffer (2 columns wide) */}
        <div className="lg:col-span-2 rog-glass p-4 text-slate-200 flex flex-col h-[540px]">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3 mb-3">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-bold text-slate-100">{activeAgent.name}</span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-cyan-300">
                  PID: {activeAgent.id + 1040}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">{activeAgent.current_script_path}</p>
            </div>

            <div className="flex items-center space-x-2">
              {activeAgent.status === "RUNNING" ? (
                <button
                  onClick={() => onStopAgent(activeAgent.id)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-amber-950 hover:bg-amber-900 border border-amber-500/60 text-amber-200 text-xs font-bold transition-all"
                >
                  <Square className="w-3.5 h-3.5 text-amber-400 fill-current" />
                  <span>Pozastavit Agenta</span>
                </button>
              ) : (
                <button
                  onClick={() => onStartAgent(activeAgent.id)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold glow-green transition-all"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Spustit Agenta</span>
                </button>
              )}
            </div>
          </div>

          {/* Real-time Metrics Card */}
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div className="p-2.5 rounded-lg bg-slate-950/60 border border-white/5">
              <span className="text-[10px] uppercase font-mono text-slate-400 block mb-1">Využití CPU</span>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-cyan-300 font-mono">{activeAgent.cpu_percent}%</span>
                <Cpu className="w-4 h-4 text-cyan-400" />
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950/60 border border-white/5">
              <span className="text-[10px] uppercase font-mono text-slate-400 block mb-1">Využití RAM</span>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-purple-300 font-mono">{activeAgent.memory_mb} MB</span>
                <HardDrive className="w-4 h-4 text-purple-400" />
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950/60 border border-white/5">
              <span className="text-[10px] uppercase font-mono text-slate-400 block mb-1">Rotace Logu</span>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-emerald-300 font-mono">
                  {activeAgent.log_buffer.length} / 10 000 zn.
                </span>
                <RefreshCw className="w-4 h-4 text-emerald-400" />
              </div>
            </div>
          </div>

          {/* Live Log Screen */}
          <div className="flex-1 flex flex-col rounded-xl bg-[#060910] border border-white/10 overflow-hidden font-mono text-xs">
            <div className="flex items-center justify-between px-3 py-1.5 bg-slate-950/80 border-b border-white/5 text-[11px] text-slate-400">
              <span>Stdout / Stderr Telemetrie (Posledních 10 000 znaků):</span>
              <span className="text-[10px] text-emerald-400">ŽIVÝ VÝSTUP (ASYNCIO)</span>
            </div>
            <div className="flex-1 p-3 overflow-y-auto leading-relaxed text-slate-300 whitespace-pre-wrap select-text font-mono-code">
              {activeAgent.log_buffer}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
