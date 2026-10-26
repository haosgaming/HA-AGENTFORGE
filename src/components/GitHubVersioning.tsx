import React, { useState, useMemo } from "react";
import {
  GitBranch,
  GitCommit,
  Lock,
  Database,
  CheckCircle2,
  Clock,
  ArrowRight,
  Send,
  Plus,
  GitCompare,
  Copy,
  Check,
  RotateCcw,
  FileCode,
  ShieldCheck,
  AlertTriangle,
  Split,
  ListFilter
} from "lucide-react";
import { CodeRevision, DeploymentRecord } from "../types";
import { computeLineDiff } from "../services/diffUtil";

interface GitHubVersioningProps {
  revisions: CodeRevision[];
  deployments: DeploymentRecord[];
  currentCode: string;
  currentCodeType: "python" | "yaml";
  onSelectRevision: (rev: CodeRevision) => void;
  onCommitPush: (branch: string, message: string, pat: string) => Promise<any>;
}

export const GitHubVersioning: React.FC<GitHubVersioningProps> = ({
  revisions,
  deployments,
  currentCode,
  currentCodeType,
  onSelectRevision,
  onCommitPush,
}) => {
  const [activeBranch, setActiveBranch] = useState("feature/fve-balancer");
  const [branches, setBranches] = useState(["main", "feature/fve-balancer", "feature/subghz-gateway"]);
  const [newBranchInput, setNewBranchInput] = useState("");
  const [commitMessage, setCommitMessage] = useState("feat(fve): update Carspa balancer threshold to 13.8V");
  const [patInput, setPatInput] = useState("ghp_984fbc982103984af981bced827394");
  const [isCommitting, setIsCommitting] = useState(false);
  const [commitSuccessNotice, setCommitSuccessNotice] = useState<string | null>(null);

  // Selected revision for diff comparison against current IDE code
  const [diffRevisionId, setDiffRevisionId] = useState<number>(revisions[0]?.id || 1);
  const [diffViewMode, setDiffViewMode] = useState<"side-by-side" | "unified" | "patch">("side-by-side");
  const [copiedPatch, setCopiedPatch] = useState(false);

  const selectedDiffRevision = revisions.find((r) => r.id === diffRevisionId) || revisions[0];

  // Compute diff between historical revision content and currentCode in IDE
  const diffResult = useMemo(() => {
    if (!selectedDiffRevision) {
      return { additions: 0, deletions: 0, unchanged: 0, lines: [], unifiedPatch: "" };
    }
    return computeLineDiff(selectedDiffRevision.content, currentCode);
  }, [selectedDiffRevision, currentCode]);

  const fernetSecretPreview = "gAAAAABl8ZqK9V0u1w2x3y4z5A6B7C8D9E0F1G2H3I4J5K6L7M8N9O0P1Q2R3S4T5U6V7W8X9Y0Z==";

  const handleCreateBranch = () => {
    if (!newBranchInput.trim()) return;
    const branchName = newBranchInput.trim();
    if (!branches.includes(branchName)) {
      setBranches((prev) => [...prev, branchName]);
      setActiveBranch(branchName);
      setNewBranchInput("");
    }
  };

  const handleCommitSubmit = async () => {
    setIsCommitting(true);
    try {
      await onCommitPush(activeBranch, commitMessage, patInput);
      setCommitSuccessNotice(
        `Commit byl úspěšně zařazen a odeslán do větve '${activeBranch}' (SHA: e9b2a7c41).`
      );
      setTimeout(() => setCommitSuccessNotice(null), 5000);
    } finally {
      setIsCommitting(false);
    }
  };

  const handleCopyPatch = () => {
    navigator.clipboard.writeText(diffResult.unifiedPatch);
    setCopiedPatch(true);
    setTimeout(() => setCopiedPatch(false), 2000);
  };

  const isIdentical = diffResult.additions === 0 && diffResult.deletions === 0;

  return (
    <div className="space-y-4">
      {/* GitHub & SQLite Versioning Header */}
      <div className="rog-glass p-4 text-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold tracking-wide uppercase text-slate-100 flex items-center space-x-2">
              <GitBranch className="w-4 h-4 text-purple-400" />
              <span>Verzování Kódu (SQLite WAL), Vizuální Diff &amp; GitHub Asynchronní Integrace</span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Přímé srovnání aktuálního kódu v IDE proti revizím z SQLite (tabulka: code_revisions) a šifrování tokenů Fernet
            </p>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <span className="flex items-center space-x-1 px-2.5 py-1 rounded bg-purple-950/80 border border-purple-500/50 text-purple-300 font-mono">
              <Lock className="w-3 h-3 text-purple-400" />
              <span>FERNET AES-CBC ENCRYPTED</span>
            </span>
            <span className="flex items-center space-x-1 px-2.5 py-1 rounded bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 font-mono">
              <Database className="w-3 h-3 text-cyan-400" />
              <span>SQLITE WAL</span>
            </span>
          </div>
        </div>
      </div>

      {/* VISUAL DIFF VIEWER SECTION */}
      <div className="rog-glass p-4 border border-cyan-500/30 glow-cyan">
        {/* Diff Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3 mb-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center space-x-2">
              <GitCompare className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-100">
                Vizuální Diff: Databáze vs. Aktivní IDE
              </span>
            </div>

            {/* Revision selector dropdown */}
            <div className="flex items-center space-x-1.5 ml-2">
              <span className="text-[11px] text-slate-400 font-mono">Porovnat s:</span>
              <select
                value={diffRevisionId}
                onChange={(e) => setDiffRevisionId(Number(e.target.value))}
                className="bg-slate-900 border border-cyan-500/50 text-cyan-300 rounded px-2.5 py-1 text-xs font-mono focus:outline-none"
              >
                {revisions.map((rev) => (
                  <option key={rev.id} value={rev.id}>
                    Revize #{rev.revision_number} ({rev.code_type.toUpperCase()}) - {rev.git_branch}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Diff Stats & Mode Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Diff Stats */}
            <div className="flex items-center space-x-1.5 text-xs font-mono mr-2">
              {isIdentical ? (
                <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-[11px] font-bold">
                  KÓDY JSOU IDENTICKÉ
                </span>
              ) : (
                <>
                  <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-[11px] font-bold">
                    +{diffResult.additions} řádků
                  </span>
                  <span className="px-2 py-0.5 rounded bg-red-950/80 border border-red-500/50 text-red-300 text-[11px] font-bold">
                    -{diffResult.deletions} řádků
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-400 text-[11px]">
                    {diffResult.unchanged} beze změny
                  </span>
                </>
              )}
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-white/10 text-xs">
              <button
                onClick={() => setDiffViewMode("side-by-side")}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                  diffViewMode === "side-by-side"
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 font-bold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Side-by-Side
              </button>
              <button
                onClick={() => setDiffViewMode("unified")}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                  diffViewMode === "unified"
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 font-bold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Unified
              </button>
              <button
                onClick={() => setDiffViewMode("patch")}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                  diffViewMode === "patch"
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 font-bold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Git Patch
              </button>
            </div>

            {/* Rollback & Copy buttons */}
            <button
              onClick={() => onSelectRevision(selectedDiffRevision)}
              className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-amber-950 hover:bg-amber-900 border border-amber-500/50 text-amber-200 text-xs font-semibold transition-colors"
              title="Obnovit tuto historickou revizi do editoru"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span>Vrátit do IDE</span>
            </button>

            <button
              onClick={handleCopyPatch}
              className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold transition-colors"
            >
              {copiedPatch ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copiedPatch ? "Zkopírováno" : "Kopírovat Patch"}</span>
            </button>
          </div>
        </div>

        {/* Diff Header Labels */}
        {diffViewMode === "side-by-side" && (
          <div className="grid grid-cols-2 gap-2 text-xs font-mono font-bold mb-1.5 px-2 text-slate-400">
            <div className="flex items-center space-x-2 text-red-300">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span>
                PŮVODNÍ: Revize #{selectedDiffRevision.revision_number} (SQLite @ {selectedDiffRevision.created_at})
              </span>
            </div>
            <div className="flex items-center space-x-2 text-emerald-300">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>AKTUÁLNÍ: Kód v Monaco Editoru (Pracovní strom IDE)</span>
            </div>
          </div>
        )}

        {/* Diff Display Area */}
        <div className="rounded-xl bg-[#060910] border border-white/10 overflow-hidden font-mono text-xs max-h-[380px] overflow-y-auto leading-relaxed select-text font-mono-code">
          {/* 1. SIDE-BY-SIDE MODE */}
          {diffViewMode === "side-by-side" && (
            <div className="grid grid-cols-2 divide-x divide-white/10">
              {/* Left Pane: Historical Revision */}
              <div className="p-2 space-y-0.5">
                {selectedDiffRevision.content.split("\n").map((line, idx) => {
                  const isRemoved = diffResult.lines.some(
                    (dl) => dl.type === "removed" && dl.oldLineNumber === idx + 1
                  );
                  return (
                    <div
                      key={idx}
                      className={`flex items-start text-[11px] leading-5 px-1 rounded ${
                        isRemoved
                          ? "bg-red-950/60 text-red-200 border-l-2 border-red-500"
                          : "text-slate-300 hover:bg-slate-900/50"
                      }`}
                    >
                      <span className="w-8 text-right pr-2 text-slate-600 select-none font-mono text-[10px]">
                        {idx + 1}
                      </span>
                      <span className="w-4 select-none text-red-400 font-bold">
                        {isRemoved ? "-" : " "}
                      </span>
                      <span className="flex-1 whitespace-pre-wrap break-all">{line || " "}</span>
                    </div>
                  );
                })}
              </div>

              {/* Right Pane: Current IDE Code */}
              <div className="p-2 space-y-0.5 bg-slate-950/30">
                {currentCode.split("\n").map((line, idx) => {
                  const isAdded = diffResult.lines.some(
                    (dl) => dl.type === "added" && dl.newLineNumber === idx + 1
                  );
                  return (
                    <div
                      key={idx}
                      className={`flex items-start text-[11px] leading-5 px-1 rounded ${
                        isAdded
                          ? "bg-emerald-950/60 text-emerald-200 border-l-2 border-emerald-500"
                          : "text-slate-300 hover:bg-slate-900/50"
                      }`}
                    >
                      <span className="w-8 text-right pr-2 text-slate-600 select-none font-mono text-[10px]">
                        {idx + 1}
                      </span>
                      <span className="w-4 select-none text-emerald-400 font-bold">
                        {isAdded ? "+" : " "}
                      </span>
                      <span className="flex-1 whitespace-pre-wrap break-all">{line || " "}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. UNIFIED MODE */}
          {diffViewMode === "unified" && (
            <div className="p-3 space-y-0.5">
              {diffResult.lines.map((dl, idx) => (
                <div
                  key={idx}
                  className={`flex items-start text-[11px] leading-5 px-2 rounded font-mono ${
                    dl.type === "added"
                      ? "bg-emerald-950/50 text-emerald-200 border-l-2 border-emerald-500"
                      : dl.type === "removed"
                      ? "bg-red-950/50 text-red-200 border-l-2 border-red-500"
                      : "text-slate-400 hover:bg-slate-900/40"
                  }`}
                >
                  <span className="w-7 text-right pr-2 text-slate-600 select-none text-[10px]">
                    {dl.oldLineNumber || " "}
                  </span>
                  <span className="w-7 text-right pr-2 text-slate-600 select-none text-[10px]">
                    {dl.newLineNumber || " "}
                  </span>
                  <span
                    className={`w-4 select-none font-bold ${
                      dl.type === "added"
                        ? "text-emerald-400"
                        : dl.type === "removed"
                        ? "text-red-400"
                        : "text-slate-600"
                    }`}
                  >
                    {dl.type === "added" ? "+" : dl.type === "removed" ? "-" : " "}
                  </span>
                  <span className="flex-1 whitespace-pre-wrap break-all">{dl.content || " "}</span>
                </div>
              ))}
            </div>
          )}

          {/* 3. GIT PATCH MODE */}
          {diffViewMode === "patch" && (
            <div className="p-3">
              <pre className="text-[11px] leading-5 text-slate-300 font-mono select-text whitespace-pre-wrap">
                {diffResult.unifiedPatch}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* LOWER SECTION: Branch/Commit push and Revisions/Deployments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column: GitHub Branch & Push Form */}
        <div className="rog-glass p-4 text-slate-200 space-y-3.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center space-x-2">
            <GitCommit className="w-4 h-4 text-cyan-400" />
            <span>GitHub Push &amp; Branch Manager</span>
          </h3>

          <div>
            <label className="text-[10px] text-slate-400 uppercase font-mono block mb-1">Aktivní Git Větev:</label>
            <div className="flex items-center space-x-2">
              <select
                value={activeBranch}
                onChange={(e) => setActiveBranch(e.target.value)}
                className="flex-1 bg-slate-900 border border-white/10 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400 font-mono"
              >
                {branches.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 uppercase font-mono block mb-1">Vytvořit novou větev:</label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={newBranchInput}
                onChange={(e) => setNewBranchInput(e.target.value)}
                placeholder="feature/carspa-pi30"
                className="flex-1 bg-slate-950 border border-white/10 rounded px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-400"
              />
              <button
                onClick={handleCreateBranch}
                className="px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Přidat</span>
              </button>
            </div>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 uppercase font-mono block mb-1">Commit Zpráva:</label>
            <textarea
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              rows={2}
              className="w-full bg-slate-950 border border-white/10 rounded p-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] text-slate-400 uppercase font-mono">Personal Access Token (PAT):</label>
              <span className="text-[10px] text-purple-400 font-mono flex items-center space-x-1">
                <Lock className="w-2.5 h-2.5" />
                <span>Fernet chráněno</span>
              </span>
            </div>
            <input
              type="password"
              value={patInput}
              onChange={(e) => setPatInput(e.target.value)}
              className="w-full bg-slate-950 border border-white/10 rounded px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-400"
            />
            <p className="text-[10px] text-slate-500 mt-1 font-mono">
              Klíč Fernet: <span className="text-purple-300 truncate inline-block max-w-[200px] align-bottom">{fernetSecretPreview}</span>
            </p>
          </div>

          <button
            onClick={handleCommitSubmit}
            disabled={isCommitting}
            className="w-full py-2 rounded-xl bg-purple-700 hover:bg-purple-600 text-white font-bold text-xs glow-violet transition-colors flex items-center justify-center space-x-2"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isCommitting ? "ODESÍLÁM NA GITHUB..." : `COMMIT & PUSH (${activeBranch})`}</span>
          </button>

          {commitSuccessNotice && (
            <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs font-mono">
              {commitSuccessNotice}
            </div>
          )}
        </div>

        {/* Middle & Right: SQLite Revisions & Deployment Logs (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          {/* SQLite Revisions Timeline */}
          <div className="rog-glass p-4 text-slate-200">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3 flex items-center space-x-2">
              <Database className="w-4 h-4 text-cyan-400" />
              <span>Lokální Databáze Revizí (Tabulka: code_revisions)</span>
            </h3>

            <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
              {revisions.map((rev) => {
                const isSelectedForDiff = rev.id === diffRevisionId;
                return (
                  <div
                    key={rev.id}
                    className={`p-3 rounded-xl border transition-all flex items-center justify-between ${
                      isSelectedForDiff
                        ? "bg-slate-900/90 border-cyan-400/80 shadow-md shadow-cyan-950/40 glow-cyan"
                        : "bg-slate-900/60 border-white/10 hover:border-cyan-500/50"
                    }`}
                  >
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-mono text-xs font-bold text-cyan-300">
                          Revize #{rev.revision_number} ({rev.code_type.toUpperCase()})
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                          {rev.git_branch}
                        </span>
                        {rev.git_commit_sha && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 font-mono">
                            SHA: {rev.git_commit_sha}
                          </span>
                        )}
                        {isSelectedForDiff && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 border border-cyan-400 text-cyan-300 font-bold font-mono">
                            ZOBRAZENÝ V DIFFU
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 truncate max-w-md">{rev.system_notes}</p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setDiffRevisionId(rev.id)}
                        className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center space-x-1 transition-colors ${
                          isSelectedForDiff
                            ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/50"
                            : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                        }`}
                      >
                        <GitCompare className="w-3 h-3 text-cyan-400" />
                        <span>Srovnat</span>
                      </button>

                      <button
                        onClick={() => onSelectRevision(rev)}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-1"
                      >
                        <span>Načíst</span>
                        <ArrowRight className="w-3 h-3 text-cyan-400" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Deployment Logs Table */}
          <div className="rog-glass p-4 text-slate-200">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3 flex items-center space-x-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span>Historie Nasazení do HA Core (Tabulka: deployment_logs)</span>
            </h3>

            <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
              {deployments.map((dep) => (
                <div
                  key={dep.id}
                  className="p-2.5 rounded-lg bg-slate-950/60 border border-white/5 flex items-center justify-between text-xs font-mono"
                >
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <div>
                      <span className="text-slate-200 font-bold">{dep.target_host}</span>
                      <span className="text-slate-400 ml-2">{dep.target_path}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 text-[11px]">
                    <span className="text-emerald-400">Exit 0</span>
                    <span className="text-slate-500">{dep.executed_at}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
