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
  Send
} from "lucide-react";
import { HaEntity } from "../types";

interface HaEntityManagerProps {
  entities: HaEntity[];
  onToggleSwitch: (entityId: string, currentState: string) => void;
  onCallService: (domain: string, service: string, entityId: string, confirmed: boolean) => Promise<any>;
}

export const HaEntityManager: React.FC<HaEntityManagerProps> = ({
  entities,
  onToggleSwitch,
  onCallService,
}) => {
  const [filterDomain, setFilterDomain] = useState<string>("all");
  const [criticalModalEntity, setCriticalModalEntity] = useState<HaEntity | null>(null);
  const [confirmationCode, setConfirmationCode] = useState("");
  const [serviceDomain, setServiceDomain] = useState("switch");
  const [serviceAction, setServiceAction] = useState("toggle");
  const [serviceEntity, setServiceEntity] = useState("switch.emos_socket_1");
  const [serviceOutput, setServiceOutput] = useState<string | null>(null);

  const filteredEntities = entities.filter((e) => {
    if (filterDomain === "all") return true;
    return e.domain === filterDomain;
  });

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

  return (
    <div className="space-y-4">
      {/* Dual Interface Status Banner */}
      <div className="rog-glass p-4 text-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold tracking-wide uppercase text-slate-100 flex items-center space-x-2">
              <Radio className="w-4 h-4 text-cyan-400" />
              <span>Home Assistant Core Duální Rozhraní (SSH &amp; WebSocket/REST API)</span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Hostitel: 192.168.1.110:8123 (Bare-metal HAOS 18.3, Core 2026.10.2). Ochrana kritických entit aktivní.
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
      </div>

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

                  {/* Attributes snippet */}
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
