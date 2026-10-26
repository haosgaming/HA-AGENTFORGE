import React, { useState, useMemo } from "react";
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
  Search,
  X,
  RotateCcw,
  ArrowRight,
  Database,
  Terminal,
  Tag,
  Hash
} from "lucide-react";
import { AstValidationResult, AstFinding, CodeRevision } from "../types";

interface CodeEditorProps {
  code: string;
  setCode: (code: string) => void;
  codeType: "python" | "yaml";
  isStreaming: boolean;
  astResult: AstValidationResult;
  affectedEntities: string[];
  systemNotes: string;
  revisions?: CodeRevision[];
  onLoadRevision?: (rev: CodeRevision) => void;
  onValidate: () => void;
  onDeploy: () => void;
  onSaveRevision: () => void;
  onCommitGit: () => void;
  isDeploying: boolean;
}

interface GrepMatch {
  revisionId: number;
  revisionNumber: number;
  branch: string;
  commitSha?: string;
  createdAt: string;
  codeType: string;
  revisionContent: string;
  matches: {
    lineNumber: number;
    lineText: string;
    highlightStart: number;
    highlightLength: number;
  }[];
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  code,
  setCode,
  codeType,
  isStreaming,
  astResult,
  affectedEntities,
  systemNotes,
  revisions = [],
  onLoadRevision,
  onValidate,
  onDeploy,
  onSaveRevision,
  onCommitGit,
  isDeploying,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<"code" | "entities" | "notes" | "ast" | "grep">("code");
  const [copied, setCopied] = useState(false);

  // Grep Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [isCaseSensitive, setIsCaseSensitive] = useState(false);
  const [isRegex, setIsRegex] = useState(false);
  const [isGrepBarOpen, setIsGrepBarOpen] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = code.split("\n");
  const criticalCount = astResult.findings.filter((f) => f.severity === "CRITICAL").length;
  const warningCount = astResult.findings.filter((f) => f.severity === "WARNING").length;

  const quickSearchPresets = [
    "sensor.carspa_battery_voltage",
    "switch.emos_socket_1",
    "httpx.AsyncClient",
    "BATTERY_RESUME_VOLTAGE",
    "0x2F2F44",
    "trigger_rf_socket",
    "os.system",
  ];

  // Grep through all saved revisions
  const grepResults = useMemo<GrepMatch[]>(() => {
    if (!searchQuery.trim()) return [];

    const query = searchQuery.trim();
    let regex: RegExp;

    try {
      if (isRegex) {
        regex = new RegExp(query, isCaseSensitive ? "g" : "gi");
      } else {
        const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        regex = new RegExp(escaped, isCaseSensitive ? "g" : "gi");
      }
    } catch (_) {
      return [];
    }

    const results: GrepMatch[] = [];

    // Also include current working buffer as "Pracovní strom (Active Editor)"
    const allRevisionsToSearch: { rev: CodeRevision; label?: string }[] = [
      ...revisions.map((r) => ({ rev: r })),
    ];

    allRevisionsToSearch.forEach(({ rev }) => {
      const revLines = rev.content.split("\n");
      const revMatches: GrepMatch["matches"] = [];

      revLines.forEach((lineText, lineIdx) => {
        regex.lastIndex = 0;
        const match = regex.exec(lineText);
        if (match) {
          revMatches.push({
            lineNumber: lineIdx + 1,
            lineText,
            highlightStart: match.index,
            highlightLength: match[0].length,
          });
        }
      });

      if (revMatches.length > 0) {
        results.push({
          revisionId: rev.id,
          revisionNumber: rev.revision_number,
          branch: rev.git_branch,
          commitSha: rev.git_commit_sha,
          createdAt: rev.created_at,
          codeType: rev.code_type,
          revisionContent: rev.content,
          matches: revMatches,
        });
      }
    });

    return results;
  }, [searchQuery, isCaseSensitive, isRegex, revisions]);

  const totalMatchesCount = grepResults.reduce((acc, r) => acc + r.matches.length, 0);

  const handleApplyPreset = (preset: string) => {
    setSearchQuery(preset);
    setIsGrepBarOpen(true);
    setActiveSubTab("grep");
  };

  const handleLoadSelectedRevision = (revContent: string) => {
    setCode(revContent);
    setActiveSubTab("code");
  };

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
            onClick={() => {
              setIsGrepBarOpen(!isGrepBarOpen);
              if (!isGrepBarOpen) setActiveSubTab("grep");
            }}
            className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              isGrepBarOpen
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/60 glow-cyan"
                : "bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200"
            }`}
            title="Prohledat všechny uložené revize kódu"
          >
            <Search className="w-3.5 h-3.5 text-cyan-400" />
            <span>Grep v Revizích</span>
          </button>

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

      {/* GREP TOOLBAR / SEARCH BAR (WHEN OPEN OR IN GREP TAB) */}
      {(isGrepBarOpen || activeSubTab === "grep") && (
        <div className="bg-[#090d18] border-b border-cyan-500/30 p-2.5 space-y-2 animate-fade-in">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex-1 flex items-center bg-slate-950 border border-white/10 rounded-lg px-2.5 py-1.5 space-x-2 focus-within:border-cyan-400 focus-within:ring-1 focus-within:ring-cyan-400/40">
              <Search className="w-4 h-4 text-cyan-400 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Grep ve všech revizích (např. 'sensor.carspa_battery_voltage', 'httpx.AsyncClient', '0x2F2F44')..."
                className="w-full bg-transparent text-xs text-slate-100 font-mono focus:outline-none placeholder-slate-500"
                autoFocus
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="text-slate-400 hover:text-slate-200">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Modifier Toggles */}
            <div className="flex items-center space-x-1.5 text-xs font-mono">
              <button
                onClick={() => setIsCaseSensitive(!isCaseSensitive)}
                className={`px-2 py-1 rounded text-[11px] font-bold border transition-colors ${
                  isCaseSensitive
                    ? "bg-cyan-500/20 text-cyan-300 border-cyan-400/60"
                    : "bg-slate-900 text-slate-400 border-slate-800"
                }`}
                title="Rozlišovat velikost písmen (Match Case)"
              >
                Aa
              </button>
              <button
                onClick={() => setIsRegex(!isRegex)}
                className={`px-2 py-1 rounded text-[11px] font-bold border transition-colors ${
                  isRegex
                    ? "bg-purple-500/20 text-purple-300 border-purple-400/60"
                    : "bg-slate-900 text-slate-400 border-slate-800"
                }`}
                title="Regulární výraz (Regex mode)"
              >
                .*
              </button>

              {searchQuery && (
                <span className="px-2 py-1 rounded bg-slate-900 text-slate-300 text-[11px] font-mono border border-white/5">
                  {totalMatchesCount} nálezů v {grepResults.length} revizích
                </span>
              )}
            </div>
          </div>

          {/* Preset Search Chips */}
          <div className="flex items-center space-x-1.5 overflow-x-auto text-[11px] font-mono text-slate-400 pt-1">
            <span className="text-[10px] uppercase text-slate-500 shrink-0">Rychlý grep:</span>
            {quickSearchPresets.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => handleApplyPreset(preset)}
                className="px-2 py-0.5 rounded bg-slate-900/90 hover:bg-slate-800 border border-white/5 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-200 whitespace-nowrap transition-colors"
              >
                {preset}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Sub Tabs: Code / Entities / Notes / AST / Grep */}
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
          onClick={() => {
            setActiveSubTab("grep");
            setIsGrepBarOpen(true);
          }}
          className={`py-2 px-3 border-b-2 font-semibold transition-colors flex items-center space-x-1.5 ${
            activeSubTab === "grep"
              ? "border-cyan-400 text-cyan-300"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Search className="w-3.5 h-3.5 text-cyan-400" />
          <span>Grep v Revizích</span>
          {searchQuery && totalMatchesCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-cyan-950 border border-cyan-400/50 text-cyan-300 font-mono font-bold">
              {totalMatchesCount}
            </span>
          )}
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
        {/* TAB 1: CODE EDITOR */}
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

        {/* TAB 2: GREP SEARCH RESULTS */}
        {activeSubTab === "grep" && (
          <div className="p-4 overflow-y-auto h-full space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center space-x-2">
                <Search className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
                  Výsledky Grepu ve všech verzích SQLite
                </span>
                {searchQuery && (
                  <span className="text-cyan-300 font-mono font-bold">"{searchQuery}"</span>
                )}
              </div>
              <span className="text-slate-400 text-[11px]">
                {revisions.length} revizí v databázi
              </span>
            </div>

            {!searchQuery.trim() ? (
              <div className="p-8 text-center text-slate-500 space-y-2">
                <Search className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                <p className="font-sans text-xs">Zadejte hledaný název funkce, proměnné nebo entity do pole nahoře.</p>
                <p className="text-[11px] text-slate-600 font-mono">Vyhledávání probíhá okamžitě přes všechny uložené verze v SQLite.</p>
              </div>
            ) : grepResults.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <AlertTriangle className="w-8 h-8 mx-auto text-amber-500/60 mb-2" />
                <p className="font-sans text-xs">Pro řetězec "{searchQuery}" nebyly nalezeny žádné shody v uložených revizích.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {grepResults.map((res) => (
                  <div
                    key={res.revisionId}
                    className="p-3.5 rounded-xl bg-slate-900/80 border border-white/10 hover:border-cyan-500/40 transition-all space-y-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-cyan-300">
                          Revize #{res.revisionNumber} ({res.codeType.toUpperCase()})
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                          {res.branch}
                        </span>
                        {res.commitSha && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-purple-950 text-purple-300 font-mono">
                            SHA: {res.commitSha}
                          </span>
                        )}
                        <span className="text-[10px] text-slate-500 font-mono">{res.createdAt}</span>
                      </div>

                      <button
                        onClick={() => handleLoadSelectedRevision(res.revisionContent)}
                        className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs glow-cyan transition-colors"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Načíst do Editoru</span>
                      </button>
                    </div>

                    {/* Matching Lines List */}
                    <div className="space-y-1 pl-1">
                      {res.matches.map((m, mIdx) => {
                        const before = m.lineText.slice(0, m.highlightStart);
                        const matchText = m.lineText.slice(
                          m.highlightStart,
                          m.highlightStart + m.highlightLength
                        );
                        const after = m.lineText.slice(m.highlightStart + m.highlightLength);

                        return (
                          <div
                            key={mIdx}
                            className="flex items-start text-[11px] leading-5 font-mono group hover:bg-slate-950/80 p-1 rounded"
                          >
                            <span className="w-12 text-slate-500 font-bold select-none shrink-0">
                              L{m.lineNumber}:
                            </span>
                            <span className="flex-1 whitespace-pre-wrap break-all text-slate-300">
                              <span>{before}</span>
                              <span className="bg-cyan-500/30 text-cyan-300 font-bold px-1 rounded border border-cyan-400/50 glow-cyan">
                                {matchText}
                              </span>
                              <span>{after}</span>
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: AFFECTED ENTITIES */}
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

        {/* TAB 4: SYSTEM NOTES */}
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

        {/* TAB 5: AST & SECURITY FINDINGS */}
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
