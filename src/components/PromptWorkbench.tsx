import React, { useState } from "react";
import {
  Sparkles,
  Zap,
  Cpu,
  ShieldCheck,
  Flame,
  Radio,
  Sun,
  AlertTriangle,
  Sliders,
  RotateCcw
} from "lucide-react";

interface PromptWorkbenchProps {
  onStreamGenerate: (prompt: string, contextType: "python" | "yaml", model: string, temp: number) => void;
  isStreaming: boolean;
  tokenCount: number;
}

export const PromptWorkbench: React.FC<PromptWorkbenchProps> = ({
  onStreamGenerate,
  isStreaming,
  tokenCount
}) => {
  const [promptText, setPromptText] = useState(
    "Vytvoř autonomní Python skript, který monitoruje napětí akumulátoru střídače Carspa MKS1000-12 (sensor.carspa_battery_voltage). Pokud napětí stoupne nad 13.8V a solární výkon (sensor.carspa_solar_power) překročí 250W, sepni RF zásuvku EMOS P0065 #1 (switch.emos_socket_1) přes ESP32-S3 bránu (192.168.1.109). Při poklesu napětí pod 12.4V zátěž okamžitě odpoj."
  );
  const [contextType, setContextType] = useState<"python" | "yaml">("python");
  const [model, setModel] = useState<string>("gpt-4o");
  const [temperature, setTemperature] = useState<number>(0.2);

  const presets = [
    {
      label: "FVE Carspa + EMOS RF Zásuvka",
      icon: Sun,
      type: "python" as const,
      text: "Vytvoř autonomní Python skript, který monitoruje napětí akumulátoru střídače Carspa MKS1000-12 (sensor.carspa_battery_voltage). Pokud napětí stoupne nad 13.8V a solární výkon (sensor.carspa_solar_power) překročí 250W, sepni RF zásuvku EMOS P0065 #1 (switch.emos_socket_1) přes ESP32-S3 bránu (192.168.1.109). Při poklesu napětí pod 12.4V zátěž okamžitě odpoj.",
    },
    {
      label: "ESP32-S3 CC1101 Keyfob Debounce",
      icon: Radio,
      type: "python" as const,
      text: "Vytvoř agenta obsluhujícího RF klíčenku k CC1101 (senzor sensor.cc1101_last_received_code). Při příjmu kódu tlačítka A (0x2F2F44) proveď bistabilní přepnutí (toggle) zásuvky EMOS P0065 #2 s časovým zámkem hystereze 650 ms proti rozkmitání stavu.",
    },
    {
      label: "YAML Balíček pro /config/packages/",
      icon: Cpu,
      type: "yaml" as const,
      text: "Vygeneruj kompletní YAML package pro Home Assistant /config/packages/solar_fve.yaml s automatizací spínající relé podle stavu baterie Carspa MKS1000-12 a telemetrie z Proxmox Dell R510 (sensor.proxmox_cpu_usage < 85%).",
    },
    {
      label: "Test AST Bezpečnostního Blokování",
      icon: AlertTriangle,
      type: "python" as const,
      text: "Zkus napsat skript, který volá os.system('reboot') a subprocess.Popen(['cat', '/etc/shadow'], shell=True) a eval('__import__(\"os\")') pro otestování AST validátoru a Bandit filtru.",
    },
  ];

  return (
    <div className="rog-glass p-4 text-slate-200">
      <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2.5">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-bold tracking-wide uppercase text-slate-100">
            Prompt Engineering &amp; AI Asistent
          </h2>
        </div>
        <div className="flex items-center space-x-3 text-xs">
          <span className="text-slate-400 font-mono text-[11px]">
            Token Budget: <strong className="text-cyan-300 font-semibold">{tokenCount}</strong> / 128k
          </span>
          <span className="px-2 py-0.5 rounded bg-purple-950/70 border border-purple-500/40 text-purple-300 text-[10px] font-bold">
            PROMPT CACHED
          </span>
        </div>
      </div>

      {/* Preset Chips */}
      <div className="mb-3">
        <label className="text-[11px] font-semibold text-slate-400 block mb-1.5 uppercase tracking-wider">
          Šablony z inventáře (Dell R510, HAOS, ESP32-S3, Carspa MKS1000-12):
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {presets.map((preset, idx) => {
            const Icon = preset.icon;
            return (
              <button
                key={idx}
                onClick={() => {
                  setPromptText(preset.text);
                  setContextType(preset.type);
                }}
                className="flex items-center space-x-2 p-2 rounded-lg bg-slate-900/60 hover:bg-slate-800/80 border border-white/5 hover:border-cyan-500/40 text-left text-xs transition-colors group"
              >
                <Icon className="w-3.5 h-3.5 text-cyan-400 shrink-0 group-hover:scale-110 transition-transform" />
                <span className="truncate text-slate-300 group-hover:text-cyan-200">{preset.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Prompt Textarea */}
      <div className="mb-3">
        <textarea
          value={promptText}
          onChange={(e) => setPromptText(e.target.value)}
          rows={4}
          className="w-full rounded-xl bg-[#0b101c] border border-white/10 p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400/80 focus:ring-1 focus:ring-cyan-400/40 transition-all font-mono leading-relaxed"
          placeholder="Zadejte přesný požadavek na Home Assistant automatizaci v přirozeném jazyce..."
        />
      </div>

      {/* Controls Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/50 p-2.5 rounded-xl border border-white/5">
        <div className="flex flex-wrap items-center gap-3">
          {/* Format Toggle */}
          <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-lg border border-white/10 text-xs">
            <button
              onClick={() => setContextType("python")}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                contextType === "python" ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/50" : "text-slate-400"
              }`}
            >
              Python (.py)
            </button>
            <button
              onClick={() => setContextType("yaml")}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                contextType === "yaml" ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/50" : "text-slate-400"
              }`}
            >
              YAML Package
            </button>
          </div>

          {/* Model Selector */}
          <div className="flex items-center space-x-1.5 text-xs text-slate-400">
            <span>Model:</span>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="bg-slate-900 border border-white/10 text-slate-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-cyan-400"
            >
              <option value="gpt-4o">gpt-4o (Structured)</option>
              <option value="gpt-4o-mini">gpt-4o-mini (Speed)</option>
            </select>
          </div>

          {/* Temperature Slider */}
          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <span>Temp: {temperature}</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-20 accent-cyan-400 h-1"
            />
          </div>
        </div>

        {/* Generate Button */}
        <button
          onClick={() => onStreamGenerate(promptText, contextType, model, temperature)}
          disabled={isStreaming}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg ${
            isStreaming
              ? "bg-purple-900/60 text-purple-200 border border-purple-500/50 cursor-not-allowed animate-pulse"
              : "bg-gradient-to-r from-cyan-500 via-blue-600 to-cyan-500 hover:from-cyan-400 hover:to-blue-500 text-slate-950 glow-cyan font-black"
          }`}
        >
          {isStreaming ? (
            <>
              <RotateCcw className="w-3.5 h-3.5 animate-spin text-purple-300" />
              <span>STREAMOVÁNÍ SSE...</span>
            </>
          ) : (
            <>
              <Zap className="w-3.5 h-3.5 text-slate-950 fill-current" />
              <span>GENEROVAT KÓD (SSE)</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
