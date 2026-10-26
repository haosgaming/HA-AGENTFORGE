import React, { useState } from "react";
import {
  Radio,
  Power,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Sun,
  Server,
  Lock,
  Unlock,
  RefreshCw,
  Send,
  Calendar,
  Clock,
  Play,
  Pause,
  Trash2,
  Plus,
  RotateCcw,
  Check
} from "lucide-react";
import { HaEntity, CronTask } from "../types";

interface HaEntityManagerProps {
  entities: HaEntity[];
  cronTasks: CronTask[];
  onToggleSwitch: (entityId: string, currentState: string) => void;
  onCallService: (domain: string, service: string, entityId: string, confirmed: boolean) => Promise<any>;
  onCreateCronTask: (task: Omit<CronTask, "id" | "last_run" | "execution_count" | "last_status" | "created_at">) => void;
  onToggleCronTask: (taskId: string) => void;
  onDeleteCronTask: (taskId: string) => void;
  onExecuteCronTaskNow: (taskId: string) => void;
}

export const HaEntityManager: React.FC<HaEntityManagerProps> = ({
  entities,
  cronTasks,
  onToggleSwitch,
  onCallService,
  onCreateCronTask,
  onToggleCronTask,
  onDeleteCronTask,
  onExecuteCronTaskNow,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<"entities" | "scheduler">("entities");
  const [filterDomain, setFilterDomain] = useState<string>("all");
  const [criticalModalEntity, setCriticalModalEntity] = useState<HaEntity | null>(null);
  const [confirmationCode, setConfirmationCode] = useState("");
  const [serviceDomain, setServiceDomain] = useState("switch");
  const [serviceAction, setServiceAction] = useState("toggle");
  const [serviceEntity, setServiceEntity] = useState("switch.emos_socket_1");
  const [serviceOutput, setServiceOutput] = useState<string | null>(null);

  // New Cron Form state
  const [cronName, setCronName] = useState("FVE Periodický Diverter (EMOS P0065)");
  const [cronEntity, setCronEntity] = useState("switch.emos_socket_1");
  const [cronAction, setCronAction] = useState<"toggle" | "turn_on" | "turn_off">("toggle");
  const [cronExpression, setCronExpression] = useState("*/5 * * * *");
  const [cronDescription, setCronDescription] = useState("Každých 5 minut");

  const filteredEntities = entities.filter((e) => {
    if (filterDomain === "all") return true;
    return e.domain === filterDomain;
  });

  const cronPresets = [
    { label: "Každých 5 minut", expr: "*/5 * * * *", desc: "Každých 5 minut (FVE přebytky)" },
    { label: "Každých 15 minut", expr: "*/15 * * * *", desc: "Každých 15 minut (ESP32-S3 Watcher)" },
    { label: "Každou hodinu", expr: "0 * * * *", desc: "Každou hodinu (CC1101 Heartbeat)" },
    { label: "Ráno v 08:00", expr: "0 8 * * *", desc: "Denně v 08:00 (Ranní sepnutí FVE)" },
    { label: "Večer ve 22:00", expr: "0 22 * * *", desc: "Denně ve 22:00 (Noční standby útlum)" },
  ];

  const handleEntityActionClick = (entity: HaEntity) => {
    if (entity.is_critical) {
      setCriticalModalEntity(entity);
      setConfirmationCode("");
      return;
    }
    if (entity.domain === "switch") {
      onToggleSwitch(entity.entity_id, entity.state);
    }
  };

  const handleConfirmCriticalAction = async () => {
    if (!criticalModalEntity) return;
    if (confirmationCode.toUpperCase() !== "POTVRDIT") {
      alert("Pro potvrzení zásahu musíte zadat slovo 'POTVRDIT'.");
      return;
    }

    const nextState = criticalModalEntity.state === "on" ? "turn_off" : "turn_on";
    await onCallService("switch", nextState, criticalModalEntity.entity_id, true);
    setCriticalModalEntity(null);
  };

  const handleExecuteServiceCall = async () => {
    const target = entities.find((e) => e.entity_id === serviceEntity);
    if (target?.is_critical) {
      setCriticalModalEntity(target);
      return;
    }
    const res = await onCallService(serviceDomain, serviceAction, serviceEntity, false);
    setServiceOutput(`Úspěšně provedeno volání ${serviceDomain}.${serviceAction} pro ${serviceEntity}`);
    setTimeout(() => setServiceOutput(null), 4000);
  };

  const handleCreateCronSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cronName.trim() || !cronEntity) return;

    onCreateCronTask({
      name: cronName.trim(),
      entity_id: cronEntity,
      action: cronAction,
      cron_expression: cronExpression.trim(),
      human_readable: cronDescription.trim() || cronExpression.trim(),
      is_active: true,
      next_run: "Za 5 minut (14:55:00)",
    });

    setCronName("");
  };

  const activeCronCount = cronTasks.filter((t) => t.is_active).length;

  return (
    <div className="space-y-4">
      {/* Dual Interface Status Banner */}
      <div className="rog-glass p-4 text-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold tracking-wide uppercase text-slate-100 flex items-center space-x-2">
              <Radio className="w-4 h-4 text-cyan-400" />
              <span>Home Assistant Core Duální Rozhraní &amp; Plánovač Úloh (Cron / APScheduler)</span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Hostitel: 192.168.1.110:8123 (HAOS 18.3, Core 2026.10.2). Asynchronní spouštění periodických úloh.
            </p>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-emerald-400 font-mono flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>REST API: 200 OK</span>
            </span>
            <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-cyan-300 font-mono flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span>SSH PTY: /config/.ssh/id_rsa</span>
            </span>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex space-x-2 mt-3 pt-3 border-t border-white/10 text-xs">
          <button
            onClick={() => setActiveSubTab("entities")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center space-x-1.5 ${
              activeSubTab === "entities"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 glow-cyan font-bold"
                : "bg-slate-900 text-slate-400 hover:text-slate-200"
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Stavy Entit &amp; Manuální Řízení</span>
          </button>

          <button
            onClick={() => setActiveSubTab("scheduler")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center space-x-1.5 ${
              activeSubTab === "scheduler"
                ? "bg-purple-500/20 text-purple-300 border border-purple-400/50 glow-violet font-bold"
                : "bg-slate-900 text-slate-400 hover:text-slate-200"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Periodický Plánovač Úloh (Cron)</span>
            <span className="px-1.5 py-0.2 rounded-full bg-purple-950 text-purple-300 text-[10px] font-mono">
              {activeCronCount} aktivních
            </span>
          </button>
        </div>
      </div>

      {/* VIEW 1: ENTITIES & MANUAL SERVICE CALLER */}
      {activeSubTab === "entities" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Entity List (2 Cols) */}
          <div className="lg:col-span-2 rog-glass p-4 text-slate-200">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3 mb-3">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Přehled Entit v Reálném Čase ({filteredEntities.length})
                </span>
              </div>

              {/* Filter buttons */}
              <div className="flex items-center space-x-1 text-xs">
                {["all", "sensor", "switch"].map((dom) => (
                  <button
                    key={dom}
                    onClick={() => setFilterDomain(dom)}
                    className={`px-2.5 py-1 rounded text-xs font-semibold capitalize transition-colors ${
                      filterDomain === dom
                        ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/50"
                        : "bg-slate-900 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {dom === "all" ? "Vše" : dom === "sensor" ? "Senzory" : "Spínače"}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[460px] overflow-y-auto pr-1">
              {filteredEntities.map((entity) => {
                const isSwitch = entity.domain === "switch";
                const isOn = entity.state.toLowerCase() === "on";

                return (
                  <div
                    key={entity.entity_id}
                    className={`p-3 rounded-xl border transition-all ${
                      entity.is_critical
                        ? "bg-red-950/20 border-red-500/40 hover:border-red-400"
                        : "bg-slate-900/60 border-white/10 hover:border-cyan-500/40"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-1.5">
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <span className="text-xs font-bold text-slate-100">{entity.friendly_name}</span>
                          {entity.is_critical && (
                            <span className="flex items-center space-x-0.5 px-1.5 py-0.2 rounded bg-red-950 border border-red-500/60 text-red-300 text-[9px] font-bold">
                              <Lock className="w-2.5 h-2.5 text-red-400" />
                              <span>KRITICKÁ</span>
                            </span>
                          )}
                        </div>
                        <span className="font-mono text-[10px] text-slate-400 block">{entity.entity_id}</span>
                      </div>

                      {isSwitch ? (
                        <button
                          onClick={() => handleEntityActionClick(entity)}
                          className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                            isOn
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/50 glow-green"
                              : "bg-slate-800 text-slate-400 border border-slate-700 hover:text-slate-200"
                          }`}
                        >
                          <Power className="w-3 h-3" />
                          <span>{isOn ? "ZAPNUTO" : "VYPNUTO"}</span>
                        </button>
                      ) : (
                        <div className="text-right">
                          <span className="font-mono text-sm font-bold text-cyan-300">
                            {entity.state} {entity.unit_of_measurement || ""}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="mt-2 pt-2 border-t border-white/5 flex flex-wrap gap-1 text-[10px] font-mono text-slate-400">
                      {Object.entries(entity.attributes).map(([k, v]) => (
                        <span key={k} className="px-1.5 py-0.5 rounded bg-slate-950 text-slate-300">
                          {k}: {String(v)}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Manual Service Caller (1 Col) */}
          <div className="rog-glass p-4 text-slate-200 flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-200 mb-1 uppercase tracking-wider flex items-center space-x-2">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Volání HA Služeb (Service Call)</span>
              </h3>
              <p className="text-[11px] text-slate-400 mb-3">
                Přímé odeslání požadavku do REST rozhraní HAOS (192.168.1.110:8123)
              </p>

              <div className="space-y-2.5 text-xs">
                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-mono block mb-1">Doména (Domain):</label>
                  <select
                    value={serviceDomain}
                    onChange={(e) => setServiceDomain(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400 font-mono"
                  >
                    <option value="switch">switch</option>
                    <option value="homeassistant">homeassistant</option>
                    <option value="logbook">logbook</option>
                    <option value="automation">automation</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-mono block mb-1">Služba (Service):</label>
                  <select
                    value={serviceAction}
                    onChange={(e) => setServiceAction(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400 font-mono"
                  >
                    <option value="toggle">toggle</option>
                    <option value="turn_on">turn_on</option>
                    <option value="turn_off">turn_off</option>
                    <option value="restart">restart</option>
                    <option value="reload">reload</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-mono block mb-1">Cílová Entita:</label>
                  <select
                    value={serviceEntity}
                    onChange={(e) => setServiceEntity(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400 font-mono"
                  >
                    {entities.map((e) => (
                      <option key={e.entity_id} value={e.entity_id}>
                        {e.entity_id} {e.is_critical ? "⚠️ [KRITICKÁ]" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleExecuteServiceCall}
                  className="w-full mt-2 flex items-center justify-center space-x-2 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs glow-cyan transition-colors"
                >
                  <Send className="w-3.5 h-3.5 fill-current" />
                  <span>Odeslat Service Call</span>
                </button>

                {serviceOutput && (
                  <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs font-mono animate-fade-in">
                    {serviceOutput}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/10 text-[10px] text-slate-400 font-mono">
              <span>Timeout ochranného mechanismu: 30 sekund</span>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: RECURRING CRON TASK SCHEDULER */}
      {activeSubTab === "scheduler" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Create Cron Job Form (1 Col) */}
          <div className="rog-glass p-4 text-slate-200 space-y-3.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center space-x-2">
              <Plus className="w-4 h-4 text-purple-400" />
              <span>Nová Periodická Úloha (Cron Job)</span>
            </h3>

            <form onSubmit={handleCreateCronSubmit} className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] text-slate-400 uppercase font-mono block mb-1">Název Úlohy:</label>
                <input
                  type="text"
                  value={cronName}
                  onChange={(e) => setCronName(e.target.value)}
                  placeholder="FVE Sepnutí EMOS #1"
                  className="w-full bg-slate-950 border border-white/10 rounded px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-purple-400"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 uppercase font-mono block mb-1">Cílová Entita (Spínač):</label>
                <select
                  value={cronEntity}
                  onChange={(e) => setCronEntity(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-400 font-mono"
                >
                  {entities
                    .filter((e) => e.domain === "switch")
                    .map((e) => (
                      <option key={e.entity_id} value={e.entity_id}>
                        {e.friendly_name} ({e.entity_id}) {e.is_critical ? "⚠️ [KRITICKÁ]" : ""}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 uppercase font-mono block mb-1">Akce Spínače:</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(["toggle", "turn_on", "turn_off"] as const).map((act) => (
                    <button
                      type="button"
                      key={act}
                      onClick={() => setCronAction(act)}
                      className={`py-1.5 rounded text-xs font-mono font-bold uppercase transition-colors ${
                        cronAction === act
                          ? "bg-purple-600 text-white border border-purple-400 glow-violet"
                          : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-700"
                      }`}
                    >
                      {act}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 uppercase font-mono block mb-1">Cron Výraz (5 polí):</label>
                <input
                  type="text"
                  value={cronExpression}
                  onChange={(e) => setCronExpression(e.target.value)}
                  placeholder="*/5 * * * *"
                  className="w-full bg-slate-950 border border-white/10 rounded px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-purple-400"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 uppercase font-mono block mb-1">Přednastavené Intervaly:</label>
                <div className="grid grid-cols-1 gap-1.5">
                  {cronPresets.map((preset, idx) => (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => {
                        setCronExpression(preset.expr);
                        setCronDescription(preset.desc);
                      }}
                      className="text-left px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-white/5 hover:border-purple-500/50 text-[11px] font-mono flex items-center justify-between text-slate-300"
                    >
                      <span>{preset.label}</span>
                      <span className="text-purple-400 font-bold">{preset.expr}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 uppercase font-mono block mb-1">Popis / Interval:</label>
                <input
                  type="text"
                  value={cronDescription}
                  onChange={(e) => setCronDescription(e.target.value)}
                  placeholder="Každých 5 minut"
                  className="w-full bg-slate-950 border border-white/10 rounded px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-purple-400"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-purple-700 hover:bg-purple-600 text-white font-bold text-xs glow-violet transition-colors flex items-center justify-center space-x-2"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Naplánovat Úlohu (APScheduler)</span>
              </button>
            </form>
          </div>

          {/* Scheduled Cron Tasks List (2 Cols) */}
          <div className="lg:col-span-2 rog-glass p-4 text-slate-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-purple-400" />
                  <span>Aktivní Periodické Úlohy ({cronTasks.length})</span>
                </h3>
                <span className="text-[10px] text-slate-400 font-mono">
                  Plánovač: APScheduler AsyncIO Background Worker
                </span>
              </div>

              <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                {cronTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`p-3.5 rounded-xl border transition-all ${
                      task.is_active
                        ? "bg-slate-900/80 border-purple-500/40 glow-violet"
                        : "bg-slate-900/40 border-white/5 opacity-70"
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-slate-100">{task.name}</span>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold uppercase ${
                              task.action === "toggle"
                                ? "bg-cyan-950 text-cyan-300 border border-cyan-500/50"
                                : task.action === "turn_on"
                                ? "bg-emerald-950 text-emerald-300 border border-emerald-500/50"
                                : "bg-red-950 text-red-300 border border-red-500/50"
                            }`}
                          >
                            {task.action}
                          </span>
                        </div>
                        <span className="font-mono text-[11px] text-cyan-300 block">{task.entity_id}</span>
                      </div>

                      {/* Controls: Active toggle, Run now, Delete */}
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => onExecuteCronTaskNow(task.id)}
                          className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold border border-slate-600 transition-colors"
                          title="Okamžité spuštění úlohy"
                        >
                          <Play className="w-3 h-3 text-emerald-400 fill-current" />
                          <span>Spustit Ihned</span>
                        </button>

                        <button
                          onClick={() => onToggleCronTask(task.id)}
                          className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                            task.is_active
                              ? "bg-purple-950 text-purple-300 border-purple-500/60"
                              : "bg-slate-800 text-slate-400 border-slate-700"
                          }`}
                        >
                          {task.is_active ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                          <span>{task.is_active ? "Aktivní" : "Pozastaveno"}</span>
                        </button>

                        <button
                          onClick={() => onDeleteCronTask(task.id)}
                          className="p-1 rounded-lg bg-slate-900 hover:bg-red-950 border border-slate-700 hover:border-red-500/60 text-slate-400 hover:text-red-300 transition-colors"
                          title="Smazat plánovanou úlohu"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Schedule Metadata */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-white/5 text-[10px] font-mono text-slate-400">
                      <div>
                        <span>Cron Výraz:</span>
                        <span className="text-purple-300 block font-bold">{task.cron_expression}</span>
                      </div>
                      <div>
                        <span>Interval:</span>
                        <span className="text-slate-200 block">{task.human_readable}</span>
                      </div>
                      <div>
                        <span>Poslední Běh:</span>
                        <span className="text-slate-200 block">{task.last_run || "Zatím nespuštěno"}</span>
                      </div>
                      <div>
                        <span>Spuštěno:</span>
                        <span className="text-emerald-400 block font-bold">{task.execution_count}x (OK)</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span>Cílový hostitel pro cron exekuci: 192.168.1.110:8123 (REST &amp; SSH)</span>
              <span className="text-purple-400 font-bold">APScheduler Engine Nominal</span>
            </div>
          </div>
        </div>
      )}

      {/* Critical Entity Confirmation Modal */}
      {criticalModalEntity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="rog-glass max-w-md w-full p-5 border border-red-500/60 glow-crimson text-slate-200">
            <div className="flex items-center space-x-2 text-red-400 mb-3">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
              <h3 className="text-sm font-black uppercase tracking-wider text-red-200">
                Bezpečnostní Pojistka: Kritická Entita
              </h3>
            </div>

            <p className="text-xs text-slate-300 mb-3 leading-relaxed">
              Zasahujete do systémové entity: <strong className="text-cyan-300 font-mono">{criticalModalEntity.entity_id}</strong>.
              Tento prvek ovlivňuje fyzické napájení racku nebo běh HAOS jádra!
            </p>

            <div className="p-3 rounded-lg bg-red-950/40 border border-red-500/40 text-xs mb-3 text-red-300">
              Pro autorizaci přepnutí napište slovo <strong>POTVRDIT</strong>:
            </div>

            <input
              type="text"
              value={confirmationCode}
              onChange={(e) => setConfirmationCode(e.target.value)}
              placeholder="Zadejte 'POTVRDIT'..."
              className="w-full p-2.5 rounded-lg bg-slate-950 border border-red-500/50 text-xs text-slate-100 font-mono mb-4 focus:outline-none focus:ring-1 focus:ring-red-400"
            />

            <div className="flex items-center justify-end space-x-2">
              <button
                onClick={() => setCriticalModalEntity(null)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold"
              >
                Zrušit
              </button>
              <button
                onClick={handleConfirmCriticalAction}
                className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs glow-crimson"
              >
                Autorizovat a Provést
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
