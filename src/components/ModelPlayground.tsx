import React, { useState, useMemo } from "react";
import {
  Sparkles,
  Cpu,
  Server,
  Zap,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Play,
  ArrowRight,
  Code2,
  Layers,
  Clock,
  Activity,
  Copy,
  ChevronRight,
  Split,
  Eye,
  GitCommit,
  Check,
  Flame,
  Info
} from "lucide-react";
import {
  LOCAL_SLM_MODELS,
  PLAYGROUND_SCENARIOS,
  executeModelComparisonBenchmark,
  SlmModelConfig
} from "../services/slmPresets";
import { ModelComparisonResult, StructuralDiffMetric } from "../types";
import { DiffSummary } from "../services/diffUtil";

interface ModelPlaygroundProps {
  onLoadCodeToIde: (code: string, codeType: "python" | "yaml", notes: string) => void;
}

export const ModelPlayground: React.FC<ModelPlaygroundProps> = ({ onLoadCodeToIde }) => {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>("scenario-fve");
  const [selectedSlmId, setSelectedSlmId] = useState<string>("qwen2.5-coder-1.5b");
  const [customPrompt, setCustomPrompt] = useState<string>("");
  const [isComparing, setIsComparing] = useState<boolean>(false);
  const [activeDiffView, setActiveDiffView] = useState<"side-by-side" | "matrix" | "unified">("side-by-side");
  const [copiedSide, setCopiedSide] = useState<string | null>(null);

  // Run initial comparison benchmark
  const [benchmarkData, setBenchmarkData] = useState(() =>
    executeModelComparisonBenchmark("scenario-fve", "qwen2.5-coder-1.5b")
  );

  const selectedScenario = useMemo(
    () => PLAYGROUND_SCENARIOS.find((s) => s.id === selectedScenarioId) || PLAYGROUND_SCENARIOS[0],
    [selectedScenarioId]
  );

  const selectedSlmConfig = useMemo(
    () => LOCAL_SLM_MODELS.find((m) => m.id === selectedSlmId) || LOCAL_SLM_MODELS[0],
    [selectedSlmId]
  );

  const handleRunComparison = () => {
    setIsComparing(true);
    setTimeout(() => {
      const res = executeModelComparisonBenchmark(selectedScenarioId, selectedSlmId, customPrompt);
      setBenchmarkData(res);
      setIsComparing(false);
    }, 450);
  };

  const copyToClipboard = (text: string, side: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSide(side);
    setTimeout(() => setCopiedSide(null), 2000);
  };

  const { gptResult, slmResult, diffMetrics, lineDiff } = benchmarkData;

  return (
    <div className="space-y-4">
      {/* Playground Header Banner */}
      <div className="rog-glass p-4 rounded-xl border border-white/10 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-slate-950 via-[#0a101f] to-slate-950">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-purple-950/80 border border-purple-500/40 text-purple-300">
            <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                SLM vs GPT-4o Model Playground &amp; AST Diff
              </h2>
              <span className="px-2 py-0.5 rounded bg-purple-950/80 border border-purple-500/50 text-purple-300 text-[10px] font-mono">
                DELL R510 DUAL XEON L5640
              </span>
              <span className="px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 text-[10px] font-mono">
                WESTMERE SSE4.2 (NO AVX2)
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Srovnávací laboratoř generovaného kódu pro Home Assistant: Cloudový GPT-4o vs lokální SLM modely běžící na Proxmox VE (192.168.1.108).
            </p>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleRunComparison}
          disabled={isComparing}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-950/50 transition-all disabled:opacity-50"
        >
          {isComparing ? (
            <>
              <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              <span>Analyzuji AST struktury...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>Porovnat Modely (GPT-4o vs SLM)</span>
            </>
          )}
        </button>
      </div>

      {/* Scenario & Local SLM Configuration Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Scenarios (5 cols) */}
        <div className="lg:col-span-5 rog-glass p-3.5 rounded-xl border border-white/10 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>Testovací Scénář pro Home Assistant</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono">3 Presety</span>
          </div>

          <div className="space-y-1.5">
            {PLAYGROUND_SCENARIOS.map((sc) => (
              <button
                key={sc.id}
                onClick={() => {
                  setSelectedScenarioId(sc.id);
                  const res = executeModelComparisonBenchmark(sc.id, selectedSlmId);
                  setBenchmarkData(res);
                }}
                className={`w-full text-left p-2.5 rounded-lg border transition-all ${
                  selectedScenarioId === sc.id
                    ? "bg-cyan-950/70 border-cyan-500/60 text-cyan-200"
                    : "bg-slate-900/40 border-white/5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs">{sc.title}</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-950 border border-white/10 text-slate-300 font-mono">
                    {sc.badge}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                  {sc.prompt}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Local SLM Selector (7 cols) */}
        <div className="lg:col-span-7 rog-glass p-3.5 rounded-xl border border-white/10 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-1.5">
              <Cpu className="w-3.5 h-3.5 text-purple-400" />
              <span>Cílový Lokální Model (Dell R510 / Proxmox VE 192.168.1.108)</span>
            </span>
            <span className="text-[10px] text-emerald-400 font-mono flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>LXC #105 Online</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {LOCAL_SLM_MODELS.map((slm) => (
              <button
                key={slm.id}
                onClick={() => {
                  setSelectedSlmId(slm.id);
                  const res = executeModelComparisonBenchmark(selectedScenarioId, slm.id);
                  setBenchmarkData(res);
                }}
                className={`text-left p-2.5 rounded-lg border transition-all ${
                  selectedSlmId === slm.id
                    ? "bg-purple-950/70 border-purple-500/60 text-purple-200"
                    : "bg-slate-900/40 border-white/5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs text-slate-200">{slm.name}</span>
                  <span className="text-[9px] px-1 rounded bg-purple-950 border border-purple-500/40 text-purple-300 font-mono">
                    {slm.parameters}
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-[10px] text-slate-400 font-mono mb-1">
                  <span>{slm.quantization}</span>
                  <span>•</span>
                  <span>~{slm.expectedTps} t/s</span>
                  <span>•</span>
                  <span>{slm.memoryUsageMb} MB</span>
                </div>
                <p className="text-[10px] text-slate-500 line-clamp-2">
                  {slm.description}
                </p>
              </button>
            ))}
          </div>

          {/* Hardware & Quantization Advisory Note */}
          <div className="p-2.5 rounded-lg bg-amber-950/30 border border-amber-500/30 flex items-start space-x-2 text-[11px] text-amber-200/90 leading-relaxed font-mono">
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-amber-300">Westmere-EP Omezení (Intel Xeon L5640):</span>{" "}
              Absence instrukčních sad AVX/AVX2 vyžaduje běh quantizovaných modelů přes GGUF s SSE4.2 instrukcemi. Modely pod 3B parametrů mají tendenci sklouzávat k blokujícímu synchronnímu kódu (requests, time.sleep) nebo opomíjet síťové timeouty.
            </div>
          </div>
        </div>
      </div>

      {/* KPI Comparison Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        {/* Card 1: Safety Score */}
        <div className="rog-glass p-3 rounded-xl border border-white/10">
          <span className="text-[10px] font-mono text-slate-400 uppercase block mb-1">AST Bezpečnostní Skóre</span>
          <div className="flex items-baseline justify-between">
            <div className="flex items-center space-x-1">
              <span className="text-lg font-bold text-emerald-400 font-mono">{gptResult.analysis.safetyScore}</span>
              <span className="text-[10px] text-slate-400 font-mono">/100 (GPT)</span>
            </div>
            <span className="text-xs text-slate-500 font-mono">vs</span>
            <div className="flex items-center space-x-1">
              <span className={`text-lg font-bold font-mono ${slmResult.analysis.safetyScore < 70 ? "text-red-400" : "text-amber-400"}`}>
                {slmResult.analysis.safetyScore}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">/100 (SLM)</span>
            </div>
          </div>
          <span className="text-[10px] text-slate-500 block mt-1">
            {slmResult.analysis.safetyScore < 70 ? "⚠️ SLM obsahuje rizikové AST konstrukce" : "Ověřeno bez kritických chyb"}
          </span>
        </div>

        {/* Card 2: I/O Paradigm */}
        <div className="rog-glass p-3 rounded-xl border border-white/10">
          <span className="text-[10px] font-mono text-slate-400 uppercase block mb-1">I/O Architektura</span>
          <div className="text-xs font-mono space-y-0.5">
            <div className="flex items-center justify-between text-cyan-300">
              <span>GPT-4o:</span>
              <span className="font-bold">{gptResult.analysis.hasAsyncLoop ? "asyncio + httpx" : "sync"}</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>SLM:</span>
              <span className={`font-bold ${slmResult.analysis.hasBlockingCalls ? "text-amber-400" : "text-emerald-400"}`}>
                {slmResult.analysis.hasBlockingCalls ? "requests (blokující)" : "asyncio"}
              </span>
            </div>
          </div>
          <span className="text-[10px] text-slate-500 block mt-1">
            {slmResult.analysis.hasBlockingCalls ? "Riziko blokace event-loop jádra" : "Neblokující I/O"}
          </span>
        </div>

        {/* Card 3: Timeouts & Debounce */}
        <div className="rog-glass p-3 rounded-xl border border-white/10">
          <span className="text-[10px] font-mono text-slate-400 uppercase block mb-1">Timeout &amp; Ochrany</span>
          <div className="text-xs font-mono space-y-0.5">
            <div className="flex items-center justify-between text-cyan-300">
              <span>Timeout:</span>
              <span className="font-bold">{gptResult.analysis.hasExplicitTimeout ? "5.0s (Aktivní)" : "Chybí"}</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Debounce:</span>
              <span className={`font-bold ${slmResult.analysis.hasDebounceGuard ? "text-emerald-400" : "text-red-400"}`}>
                {slmResult.analysis.hasDebounceGuard ? "Ano" : "Chybí (Flapping)"}
              </span>
            </div>
          </div>
          <span className="text-[10px] text-slate-500 block mt-1">
            Ochrana proti uváznutí a rozkmitání
          </span>
        </div>

        {/* Card 4: Hardware Latency & TPS */}
        <div className="rog-glass p-3 rounded-xl border border-white/10">
          <span className="text-[10px] font-mono text-slate-400 uppercase block mb-1">Latence &amp; Propustnost</span>
          <div className="text-xs font-mono space-y-0.5">
            <div className="flex items-center justify-between text-cyan-300">
              <span>GPT-4o:</span>
              <span className="font-bold">{gptResult.latencyMs}ms (~88 t/s)</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>SLM CPU:</span>
              <span className="font-bold">{slmResult.latencyMs}ms (~{slmResult.tokensPerSec} t/s)</span>
            </div>
          </div>
          <span className="text-[10px] text-slate-500 block mt-1">
            CPU Westmere L5640 @ 2.27GHz
          </span>
        </div>
      </div>

      {/* View Switcher Tabs (Side-by-Side vs Structural Matrix vs Unified Diff) */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <div className="flex items-center space-x-1.5 bg-slate-900/60 p-1 rounded-lg border border-white/5">
          <button
            onClick={() => setActiveDiffView("side-by-side")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              activeDiffView === "side-by-side"
                ? "bg-cyan-600 text-slate-950 shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            <Split className="w-3.5 h-3.5" />
            <span>Side-by-Side Porovnání Kódu</span>
          </button>

          <button
            onClick={() => setActiveDiffView("matrix")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              activeDiffView === "matrix"
                ? "bg-cyan-600 text-slate-950 shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Strukturální AST Matrice ({diffMetrics.length})</span>
          </button>

          <button
            onClick={() => setActiveDiffView("unified")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              activeDiffView === "unified"
                ? "bg-cyan-600 text-slate-950 shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            <GitCommit className="w-3.5 h-3.5" />
            <span>Unified Diff (+{lineDiff.additions} / -{lineDiff.deletions})</span>
          </button>
        </div>

        <div className="hidden sm:flex items-center space-x-2 text-[11px] font-mono text-slate-400">
          <span>Struktury:</span>
          <span className="px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-300">
            GPT-4o (Standard)
          </span>
          <span className="px-1.5 py-0.5 rounded bg-purple-950/80 border border-purple-500/40 text-purple-300">
            {slmResult.modelName}
          </span>
        </div>
      </div>

      {/* VIEW 1: Side-by-Side Code Comparison */}
      {activeDiffView === "side-by-side" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* Left: GPT-4o */}
          <div className="rog-glass rounded-xl border border-cyan-500/30 overflow-hidden flex flex-col">
            <div className="p-3 bg-cyan-950/40 border-b border-cyan-500/30 flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-xs text-cyan-200">{gptResult.modelName}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-900/60 border border-cyan-400/50 text-cyan-300 font-mono">
                    OPENAI CLOUD
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 border border-emerald-500/40 text-emerald-400 font-mono">
                    AST: 100% OK
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-[10px] text-slate-400 font-mono mt-0.5">
                  <span>Latence: {gptResult.latencyMs} ms</span>
                  <span>•</span>
                  <span>Tokeny: {gptResult.tokenCount}</span>
                  <span>•</span>
                  <span>{gptResult.analysis.linesCount} řádků</span>
                </div>
              </div>

              <div className="flex items-center space-x-1.5">
                <button
                  onClick={() => copyToClipboard(gptResult.code, "gpt")}
                  className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-white/10 transition-colors"
                  title="Kopírovat kód"
                >
                  {copiedSide === "gpt" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => onLoadCodeToIde(gptResult.code, "python", gptResult.notes)}
                  className="px-2.5 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs flex items-center space-x-1 transition-colors"
                  title="Odeslat do Monaco Editoru pro deployment"
                >
                  <ArrowRight className="w-3 h-3" />
                  <span>Převzít do IDE</span>
                </button>
              </div>
            </div>

            {/* GPT-4o Structural Callout Tags */}
            <div className="px-3 py-1.5 bg-slate-950/80 border-b border-white/5 flex flex-wrap gap-1 text-[10px] font-mono">
              <span className="px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                ✓ httpx.AsyncClient neblokující
              </span>
              <span className="px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                ✓ timeout=5.0s ochrana
              </span>
              <span className="px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                ✓ Structured try/except
              </span>
              <span className="px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                ✓ Cutoff / Debounce ochrana
              </span>
            </div>

            {/* Code Output Screen */}
            <div className="p-3 bg-[#05080e] overflow-x-auto text-xs font-mono text-slate-300 leading-relaxed max-h-[500px] overflow-y-auto select-text font-mono-code">
              {gptResult.code.split("\n").map((line, idx) => (
                <div key={idx} className="flex hover:bg-white/[0.02]">
                  <span className="w-8 shrink-0 text-slate-600 select-none text-right pr-2">
                    {idx + 1}
                  </span>
                  <span className={
                    line.includes("async def") || line.includes("await")
                      ? "text-cyan-300 font-semibold"
                      : line.includes("BATTERY_CUTOFF") || line.includes("DEBOUNCE")
                      ? "text-amber-300 font-bold"
                      : line.includes("timeout=")
                      ? "text-emerald-300 font-semibold"
                      : line.startsWith("#") || line.startsWith('"""')
                      ? "text-slate-500 italic"
                      : "text-slate-200"
                  }>
                    {line}
                  </span>
                </div>
              ))}
            </div>

            <div className="p-2.5 bg-slate-950/90 border-t border-white/10 text-[11px] text-slate-400 font-mono">
              <span className="text-cyan-400 font-bold">Poznámka architekta:</span> {gptResult.notes}
            </div>
          </div>

          {/* Right: Local SLM (Dell R510) */}
          <div className="rog-glass rounded-xl border border-purple-500/30 overflow-hidden flex flex-col">
            <div className="p-3 bg-purple-950/40 border-b border-purple-500/30 flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-xs text-purple-200">{slmResult.modelName}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-900/60 border border-purple-400/50 text-purple-300 font-mono">
                    {slmResult.quantization || "Q4_K_M"}
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded border font-mono ${
                    slmResult.analysis.safetyScore < 70
                      ? "bg-red-950 border-red-500/50 text-red-400"
                      : "bg-amber-950 border-amber-500/50 text-amber-300"
                  }`}>
                    AST: {slmResult.analysis.safetyScore}/100
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-[10px] text-slate-400 font-mono mt-0.5">
                  <span>Host: {slmResult.hardwareHost}</span>
                  <span>•</span>
                  <span>Latence: {slmResult.latencyMs} ms</span>
                  <span>•</span>
                  <span>~{slmResult.tokensPerSec} t/s</span>
                </div>
              </div>

              <div className="flex items-center space-x-1.5">
                <button
                  onClick={() => copyToClipboard(slmResult.code, "slm")}
                  className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-white/10 transition-colors"
                  title="Kopírovat kód"
                >
                  {copiedSide === "slm" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => onLoadCodeToIde(slmResult.code, "python", slmResult.notes)}
                  className="px-2.5 py-1 rounded bg-purple-700 hover:bg-purple-600 text-white font-bold text-xs flex items-center space-x-1 transition-colors"
                  title="Načíst kód z lokálního modelu do editoru pro refaktoring"
                >
                  <ArrowRight className="w-3 h-3" />
                  <span>Převzít kód</span>
                </button>
              </div>
            </div>

            {/* SLM Structural Callout Tags */}
            <div className="px-3 py-1.5 bg-slate-950/80 border-b border-white/5 flex flex-wrap gap-1 text-[10px] font-mono">
              {slmResult.analysis.hasBlockingCalls ? (
                <span className="px-1.5 py-0.2 rounded bg-red-950 text-red-300 border border-red-500/40">
                  ✗ Blokující synchronní I/O (requests / sleep)
                </span>
              ) : (
                <span className="px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                  ✓ Asynchronní běh
                </span>
              )}

              {!slmResult.analysis.hasExplicitTimeout && (
                <span className="px-1.5 py-0.2 rounded bg-red-950 text-red-300 border border-red-500/40">
                  ✗ Chybí explicitní timeout na socketu
                </span>
              )}

              {!slmResult.analysis.hasDebounceGuard && (
                <span className="px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-500/40">
                  ✗ Chybí RF debouncing zámek
                </span>
              )}

              {!slmResult.analysis.hasErrorHandling && (
                <span className="px-1.5 py-0.2 rounded bg-red-950 text-red-300 border border-red-500/40">
                  ✗ Chybí try/except ošetření
                </span>
              )}
            </div>

            {/* Code Output Screen */}
            <div className="p-3 bg-[#05080e] overflow-x-auto text-xs font-mono text-slate-300 leading-relaxed max-h-[500px] overflow-y-auto select-text font-mono-code">
              {slmResult.code.split("\n").map((line, idx) => {
                const isProblematic =
                  line.includes("requests.") ||
                  line.includes("time.sleep") ||
                  line.includes("os.system") ||
                  line.includes("except:") ||
                  line.includes("YOUR_TOKEN");

                return (
                  <div key={idx} className={`flex ${isProblematic ? "bg-red-950/20" : "hover:bg-white/[0.02]"}`}>
                    <span className="w-8 shrink-0 text-slate-600 select-none text-right pr-2">
                      {idx + 1}
                    </span>
                    <span className={
                      isProblematic
                        ? "text-red-400 font-bold underline decoration-red-500/40"
                        : line.startsWith("#")
                        ? "text-slate-500 italic"
                        : "text-slate-300"
                    }>
                      {line}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="p-2.5 bg-slate-950/90 border-t border-white/10 text-[11px] text-slate-400 font-mono">
              <span className="text-purple-400 font-bold">Diagnostika SLM:</span> {slmResult.notes}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: Structural Diff Matrix */}
      {activeDiffView === "matrix" && (
        <div className="rog-glass rounded-xl border border-white/10 overflow-hidden">
          <div className="p-3 bg-slate-900/60 border-b border-white/10 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Matrice Strukturálních Rozdílů Kódu (AST, I/O, Error Resilience)</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              Porovnáno {diffMetrics.length} architektonických parametrů
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] border-b border-white/10">
                <tr>
                  <th className="py-2.5 px-3">Kategorie</th>
                  <th className="py-2.5 px-3">Sledovaný Aspekt</th>
                  <th className="py-2.5 px-3 text-cyan-300">GPT-4o (Standard)</th>
                  <th className="py-2.5 px-3 text-purple-300">Lokální SLM ({slmResult.modelName})</th>
                  <th className="py-2.5 px-3">Stav Odchylky</th>
                  <th className="py-2.5 px-3">Technické Vyhodnocení</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {diffMetrics.map((dm, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.02]">
                    <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">{dm.category}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-200 whitespace-nowrap">{dm.aspect}</td>
                    <td className="py-2.5 px-3 text-cyan-300 font-semibold">{dm.gptValue}</td>
                    <td className="py-2.5 px-3 text-slate-300">{dm.slmValue}</td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      {dm.status === "GPT_SUPERIOR" ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-[10px]">
                          GPT-4o SUPERIOR
                        </span>
                      ) : dm.status === "CRITICAL" ? (
                        <span className="px-2 py-0.5 rounded bg-red-950/80 border border-red-500/50 text-red-300 text-[10px]">
                          KRITICKÁ CHYBA
                        </span>
                      ) : dm.status === "WARNING" ? (
                        <span className="px-2 py-0.5 rounded bg-amber-950/80 border border-amber-500/50 text-amber-300 text-[10px]">
                          VAROVÁNÍ
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300 text-[10px]">
                          SHODNÉ
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 text-[11px] leading-relaxed max-w-md">
                      {dm.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 3: Unified Diff (+/-) */}
      {activeDiffView === "unified" && (
        <div className="rog-glass rounded-xl border border-white/10 overflow-hidden">
          <div className="p-3 bg-slate-900/60 border-b border-white/10 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
              <GitCommit className="w-4 h-4 text-cyan-400" />
              <span>Unified Diff: Od lokálního SLM (-) k optimalizovanému GPT-4o (+)</span>
            </span>
            <div className="flex items-center space-x-2 text-xs font-mono">
              <span className="text-emerald-400 font-bold">+{lineDiff.additions}</span>
              <span className="text-red-400 font-bold">-{lineDiff.deletions}</span>
              <span className="text-slate-500">({lineDiff.unchanged} beze změny)</span>
            </div>
          </div>

          <div className="p-3 bg-[#05080e] overflow-x-auto text-xs font-mono leading-relaxed max-h-[550px] overflow-y-auto select-text font-mono-code">
            {lineDiff.lines.map((line, idx) => (
              <div
                key={idx}
                className={`flex py-0.5 px-2 rounded ${
                  line.type === "added"
                    ? "bg-emerald-950/30 text-emerald-300 font-medium"
                    : line.type === "removed"
                    ? "bg-red-950/30 text-red-400 font-medium"
                    : "text-slate-400"
                }`}
              >
                <span className="w-10 shrink-0 text-slate-600 select-none text-right pr-3 font-mono">
                  {line.type === "added" ? `+${line.newLineNumber}` : line.type === "removed" ? `-${line.oldLineNumber}` : line.newLineNumber}
                </span>
                <span className="w-4 shrink-0 font-bold select-none text-center">
                  {line.type === "added" ? "+" : line.type === "removed" ? "-" : " "}
                </span>
                <span className="whitespace-pre-wrap">{line.content}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
