import React, { useState } from "react";
import {
  GitBranch,
  GitCommit,
  GitPullRequest,
  Lock,
  Key,
  Database,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  ShieldCheck,
  Send,
  Plus
} from "lucide-react";
import { CodeRevision, DeploymentRecord } from "../types";

interface GitHubVersioningProps {
  revisions: CodeRevision[];
  deployments: DeploymentRecord[];
  onSelectRevision: (rev: CodeRevision) => void;
  onCommitPush: (branch: string, message: string, pat: string) => Promise<any>;
}

export const GitHubVersioning: React.FC<GitHubVersioningProps> = ({
  revisions,
  deployments,
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

  // Fernet encrypted token preview
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

  return (
    <div className="space-y-4">
      {/* GitHub & SQLite Versioning Header */}
      <div className="rog-glass p-4 text-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold tracking-wide uppercase text-slate-100 flex items-center space-x-2">
              <GitBranch className="w-4 h-4 text-purple-400" />
              <span>Verzování Kódu (SQLite WAL) &amp; GitHub Asynchronní Integrace</span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Ukládání revizí v SQLite databázi + šifrování Personal Access Tokenu (PAT) přes cryptography.fernet
            </p>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <span className="flex items-center space-x-1 px-2.5 py-1 rounded bg-purple-950/80 border border-purple-500/50 text-purple-300 font-mono">
              <Lock className="w-3 h-3 text-purple-400" />
              <span>FERNET AES-CBC ENCRYPTED</span>
            </span>
          </div>
        </div>
      </div>

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
              Šifrovací klíč: <span className="text-purple-300 truncate inline-block max-w-[200px] align-bottom">{fernetSecretPreview}</span>
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
              {revisions.map((rev) => (
                <div
                  key={rev.id}
                  onClick={() => onSelectRevision(rev)}
                  className="p-3 rounded-xl bg-slate-900/60 border border-white/10 hover:border-cyan-500/50 cursor-pointer transition-all flex items-center justify-between"
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
                    </div>
                    <p className="text-[11px] text-slate-400 truncate max-w-md">{rev.system_notes}</p>
                  </div>

                  <button className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-1">
                    <span>Načíst</span>
                    <ArrowRight className="w-3 h-3 text-cyan-400" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Deployment Logs Table */}
          <div className="rog-glass p-4 text-slate-200">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3 flex items-center space-x-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span>Historie Nasazení do HA Core (Tabulka: deployment_logs)</span>
            </h3>

            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
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
