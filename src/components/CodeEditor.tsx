import React, { useState } from "react";
import {
  Code2,
  Play,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Save,
  GitCommit,
  Radio,
  FileCode,
  Shield,
  Layers
} from "lucide-react";
import { AstValidationResult, AstFinding } from "../types";

interface CodeEditorProps {
  code: string;
  setCode: (code: string) => void;
  codeType: "python" | "yaml";
  isStreaming: boolean;
  astResult: AstValidationResult;
  affectedEntities: string[];
  systemNotes: string;
  onValidate: () => void;
  onDeploy: () => void;
  onSaveRevision: () => void;
  onCommitGit: () => void;
  isDeploying: boolean;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  code,
  setCode,
  codeType,
  isStreaming,
  astResult,
  affectedEntities,
  systemNotes,
  onValidate,
  onDeploy,
  onSaveRevision,
  onCommitGit,
  isDeploying,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<"code" | "entities" | "notes" | "ast">("code");
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = code.split("\n");
  const criticalCount = astResult.findings.filter((f) => f.severity === "CRITICAL").length;
  const warningCount = astResult.findings.filter((f) => f.severity === "WARNING").length;

  return (
    <div className="rog-glass flex flex-col h-full border border-white/10 text-slate-200">
      {/* Editor Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-slate-950/70 border-b border-white/10">
        <div className="flex items-center space-x-2">
          <FileCode className="w-4 h-4 text-cyan-400" />
          <span className="font-mono text-xs font-bold text-slate-200">
            {codeType === "python" ? "agent_script.py" : "solar_fve.yaml"}
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
            {lines.length} řádků
          </span>

          {/* AST Status Badge */}
          {astResult.valid ? (
            <span className="flex items-center space-x-1 px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-[10px] font-bold glow-green">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>AST VALIDNÍ</span>
            </span>
          ) : (
            <span className="flex items-center space-x-1 px-2 py-0.5 rounded bg-red-950/80 border border-red-500/50 text-red-300 text-[10px] font-bold glow-crimson">
              <AlertTriangle className="w-3 h-3 text-red-400" />
              <span>{criticalCount} BLOKOVANÝCH CHYB</span>
            </span>
          )}

          {isStreaming && (
            <span className="flex items-center space-x-1 px-2 py-0.5 rounded bg-purple-950 border border-purple-500 text-purple-300 text-[10px] font-mono animate-pulse">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
              <span>SSE STREAMING...</span>
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onValidate}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
            <span>AST Kontrola</span>
          </button>

          <button
            onClick={onSaveRevision}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            <Save className="w-3.5 h-3.5 text-blue-400" />
            <span>Uložit Revizi</span>
          </button>

          <button
            onClick={onCommitGit}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            <GitCommit className="w-3.5 h-3.5 text-purple-400" />
            <span>Commit na GitHub</span>
          </button>

          <button
            onClick={handleCopy}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
            <span>{copied ? "Zkopírováno" : "Kopírovat"}</span>
          </button>

          <button
            onClick={onDeploy}
            disabled={isDeploying || !astResult.valid}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-md ${
              !astResult.valid
                ? "bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed"
                : isDeploying
                ? "bg-amber-900/60 text-amber-200 border border-amber-500/50 cursor-wait animate-pulse"
                : "bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black glow-green"
            }`}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isDeploying ? "NASAZUJI (SSH)..." : "NASADIT DO HA (192.168.1.110)"}</span>
          </button>
        </div>
      </div>

      {/* Sub Tabs: Code / Entities / Notes / AST */}
      <div className="flex border-b border-white/10 bg-slate-950/40 px-4 text-xs">
        <button
          onClick={() => setActiveSubTab("code")}
          className={`py-2 px-3 border-b-2 font-semibold transition-colors ${
            activeSubTab === "code"
              ? "border-cyan-400 text-cyan-300"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          Editor Kódu
        </button>
        <button
          onClick={() => setActiveSubTab("entities")}
          className={`py-2 px-3 border-b-2 font-semibold transition-colors flex items-center space-x-1.5 ${
            activeSubTab === "entities"
              ? "border-cyan-400 text-cyan-300"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <span>Dotčené Entity</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-cyan-300 font-mono">
            {affectedEntities.length}
          </span>
        </button>
        <button
          onClick={() => setActiveSubTab("notes")}
          className={`py-2 px-3 border-b-2 font-semibold transition-colors ${
            activeSubTab === "notes"
              ? "border-cyan-400 text-cyan-300"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          Systémové Poznámky
        </button>
        <button
          onClick={() => setActiveSubTab("ast")}
          className={`py-2 px-3 border-b-2 font-semibold transition-colors flex items-center space-x-1.5 ${
            activeSubTab === "ast"
              ? "border-cyan-400 text-cyan-300"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <span>AST &amp; Bezpečnost</span>
          {(criticalCount > 0 || warningCount > 0) && (
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                criticalCount > 0 ? "bg-red-950 text-red-300 border border-red-500/50" : "bg-amber-950 text-amber-300"
              }`}
            >
              {criticalCount > 0 ? criticalCount : warningCount}
            </span>
          )}
        </button>
      </div>

      {/* Main View Area */}
      <div className="flex-1 relative overflow-hidden bg-[#070a12] p-0 font-mono-code text-xs">
        {activeSubTab === "code" && (
          <div className="flex h-full overflow-auto">
            {/* Line numbers gutter */}
            <div className="select-none py-3 px-3 text-right bg-slate-950/80 border-r border-white/5 text-slate-600 font-mono text-[11px] leading-6 min-w-[3.5rem]">
              {lines.map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>

            {/* Editable code text */}
            <div className="flex-1 relative p-3">
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                spellCheck={false}
                className="w-full h-full bg-transparent text-slate-200 resize-none focus:outline-none font-mono text-xs leading-6 selection:bg-cyan-900/50"
              />
              {isStreaming && (
                <span className="inline-block w-2 h-4 bg-cyan-400 animate-pulse ml-0.5 align-middle" />
              )}
            </div>
          </div>
        )}

        {/* Affected Entities View */}
        {activeSubTab === "entities" && (
          <div className="p-4 overflow-y-auto h-full">
            <h3 className="text-xs font-bold text-slate-300 mb-3 uppercase tracking-wider">
              Identifikované Home Assistant Entity v tomto skriptu:
            </h3>
            {affectedEntities.length === 0 ? (
              <p className="text-slate-500 italic text-xs">Žádné specifické entity nebyly detekovány.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {affectedEntities.map((ent, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/80 border border-white/10"
                  >
                    <div className="flex items-center space-x-2">
                      <Radio className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="font-mono text-xs text-cyan-200">{ent}</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                      {ent.startsWith("switch") ? "AKČNÍ ČLEN" : "TELEMETRIE"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* System Notes View */}
        {activeSubTab === "notes" && (
          <div className="p-4 overflow-y-auto h-full text-slate-300 text-xs leading-relaxed">
            <h3 className="text-xs font-bold text-slate-200 mb-2 uppercase tracking-wider">
              Technický Rozbor &amp; Bezpečnostní Doporučení:
            </h3>
            <div className="p-3.5 rounded-xl bg-slate-900/70 border border-white/10 whitespace-pre-wrap font-sans text-xs">
              {systemNotes || "Pro tento skript nejsou k dispozici žádné dodatečné systémové poznámky."}
            </div>
          </div>
        )}

        {/* AST & Linter Findings View */}
        {activeSubTab === "ast" && (
          <div className="p-4 overflow-y-auto h-full">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                AST Inspekce (ast.parse, ruff, bandit, CSafeLoader):
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">
                Počet AST uzlů: {astResult.ast_node_count || lines.length * 2}
              </span>
            </div>

            {astResult.findings.length === 0 ? (
              <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center space-x-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <p className="font-bold">Kód je 100% čistý a splňuje bezpečnostní politiku HAOS.</p>
                  <p className="text-[11px] text-emerald-400/80">
                    Nenalezena žádná zakázaná volání os.system, neomezený subprocess ani zranitelné funkce eval().
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {astResult.findings.map((f, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-lg border text-xs flex items-start space-x-3 ${
                      f.severity === "CRITICAL"
                        ? "bg-red-950/50 border-red-500/60 text-red-200"
                        : f.severity === "WARNING"
                        ? "bg-amber-950/50 border-amber-500/60 text-amber-200"
                        : "bg-blue-950/50 border-blue-500/60 text-blue-200"
                    }`}
                  >
                    <AlertTriangle
                      className={`w-4 h-4 shrink-0 mt-0.5 ${
                        f.severity === "CRITICAL"
                          ? "text-red-400"
                          : f.severity === "WARNING"
                          ? "text-amber-400"
                          : "text-blue-400"
                      }`}
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-mono font-bold text-[11px] px-1.5 py-0.2 rounded bg-black/40">
                          Řádek {f.line}:{f.col}
                        </span>
                        <span className="font-mono text-[10px] opacity-80">[{f.code}]</span>
                        <span className="font-bold text-[10px] tracking-wide uppercase">{f.severity}</span>
                      </div>
                      <p className="font-sans text-xs">{f.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
