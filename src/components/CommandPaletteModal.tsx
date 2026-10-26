import React, { useState, useEffect, useRef } from "react";
import {
  Search,
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
  ShieldCheck,
  HardDrive,
  Play,
  RotateCcw,
  ArrowRight,
  X
} from "lucide-react";

interface CommandItem {
  id: string;
  title: string;
  description: string;
  category: "Navigace" | "AI & Modely" | "SSH Příkazy" | "Správa Entit";
  icon: React.ElementType;
  action: () => void;
  badge?: string;
}

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tabId: string) => void;
  onOpenLlmConfig: () => void;
  onRunSshCommand?: (cmd: string) => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  onSelectTab,
  onOpenLlmConfig,
  onRunSshCommand
}) => {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const commands: CommandItem[] = [
    // Navigation
    {
      id: "nav-ide",
      title: "Přejít: AI Vývojové Studio & Editor Kódu",
      description: "Monaco IDE, AST validace, Grep vyhledávač revizí",
      category: "Navigace",
      icon: Code2,
      action: () => {
        onSelectTab("ide");
        onClose();
      },
      badge: "Kód"
    },
    {
      id: "nav-playground",
      title: "Přejít: Srovnávací Laboratoř Modelů (SLM vs GPT-4o)",
      description: "Porovnání kódu lokálních modelů na Dell R510 proti cloudovému GPT-4o",
      category: "Navigace",
      icon: Sparkles,
      action: () => {
        onSelectTab("playground");
        onClose();
      },
      badge: "SLM"
    },
    {
      id: "nav-agents",
      title: "Přejít: Orchestrátor Agentů & Telemetrie",
      description: "Dohled nad běžícími agenty, D3.js 24h heatmapa, rotace logů",
      category: "Navigace",
      icon: Activity,
      action: () => {
        onSelectTab("agents");
        onClose();
      },
      badge: "Běh"
    },
    {
      id: "nav-entities",
      title: "Přejít: HA Core & Správa Entit",
      description: "Entity 192.168.1.110, plánovač úloh Cron, manuální spínání",
      category: "Navigace",
      icon: Radio,
      action: () => {
        onSelectTab("entities");
        onClose();
      },
      badge: "Entity"
    },
    {
      id: "nav-terminal",
      title: "Přejít: SSH Vzdálená Konzole (PTY)",
      description: "Konzole root@192.168.1.110:22 s knihovnou 20 rychlých příkazů",
      category: "Navigace",
      icon: Terminal,
      action: () => {
        onSelectTab("terminal");
        onClose();
      },
      badge: "SSH"
    },
    {
      id: "nav-git",
      title: "Přejít: Verzování & GitHub Revize",
      description: "Vizuální Side-by-Side diff, správa větví, Fernet šifrování",
      category: "Navigace",
      icon: GitBranch,
      action: () => {
        onSelectTab("git");
        onClose();
      },
      badge: "Git"
    },
    {
      id: "nav-arch",
      title: "Přejít: Architektura Systému & Docker Compose",
      description: "Zobrazení Docker stacku a produkčních souborů backendu",
      category: "Navigace",
      icon: Layers,
      action: () => {
        onSelectTab("architecture");
        onClose();
      },
      badge: "Docker"
    },

    // AI & Configuration
    {
      id: "act-llm-config",
      title: "Nastavení: Lokální LLM Poskytovatel (Ollama / vLLM)",
      description: "Připojení k lokálnímu inferenčnímu uzlu na Dell R510 (192.168.1.108:11434)",
      category: "AI & Modely",
      icon: Cpu,
      action: () => {
        onOpenLlmConfig();
        onClose();
      },
      badge: "Konfigurace"
    },

    // SSH Fast Commands
    {
      id: "ssh-core-check",
      title: "SSH: Validace YAML Konfigurace (ha core check)",
      description: "Spustí ověření integrity konfigurace na 192.168.1.110",
      category: "SSH Příkazy",
      icon: ShieldCheck,
      action: () => {
        onSelectTab("terminal");
        onRunSshCommand?.("ha core check");
        onClose();
      },
      badge: "SSH Povel"
    },
    {
      id: "ssh-core-logs",
      title: "SSH: Zobrazit Protokoly Core (ha core logs -n 50)",
      description: "Vypíše posledních 50 řádků protokolu jádra Home Assistant",
      category: "SSH Příkazy",
      icon: Terminal,
      action: () => {
        onSelectTab("terminal");
        onRunSshCommand?.("ha core logs -n 50");
        onClose();
      },
      badge: "SSH Povel"
    },
    {
      id: "ssh-supervisor-restart",
      title: "SSH: Restart Dohledového Démona (ha supervisor restart)",
      description: "Restartuje kontejner hassio_supervisor na HAOS",
      category: "SSH Příkazy",
      icon: RotateCcw,
      action: () => {
        onSelectTab("terminal");
        onRunSshCommand?.("ha supervisor restart");
        onClose();
      },
      badge: "SSH Povel"
    },
    {
      id: "ssh-filesystem",
      title: "SSH: Kontrola Souborového Systému (fsck.ext4 -n /dev/sda8)",
      description: "Bezpečná read-only kontrola integrity diskového oddílu",
      category: "SSH Příkazy",
      icon: HardDrive,
      action: () => {
        onSelectTab("terminal");
        onRunSshCommand?.("fsck.ext4 -n /dev/sda8");
        onClose();
      },
      badge: "SSH Povel"
    },
    {
      id: "ssh-fve-balancer",
      title: "SSH: Spustit Solární Balancer (fve_balancer.py)",
      description: "Manuální exekuce bilančního cyklu pro Carspa MKS1000-12",
      category: "SSH Příkazy",
      icon: Zap,
      action: () => {
        onSelectTab("terminal");
        onRunSshCommand?.("python3 /config/scripts/fve_balancer.py");
        onClose();
      },
      badge: "SSH Povel"
    }
  ];

  const filteredCommands = commands.filter((c) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      c.title.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q)
    );
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filteredCommands.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredCommands.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].action();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="rog-glass border border-cyan-500/30 rounded-2xl w-full max-w-xl flex flex-col shadow-2xl overflow-hidden glow-cyan">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-white/10 bg-slate-950/90 space-x-3">
          <Search className="w-5 h-5 text-cyan-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Napište název funkce, sekce, příkazu (např. 'editor', 'ollama', 'logs')..."
            className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none font-sans"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Command List Results */}
        <div className="max-h-[380px] overflow-y-auto p-2 space-y-1">
          {filteredCommands.length === 0 ? (
            <div className="p-6 text-center text-slate-500 text-xs font-mono">
              Žádná funkce ani příkaz neodpovídá hledání "{query}".
            </div>
          ) : (
            filteredCommands.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={item.id}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full text-left p-2.5 rounded-xl flex items-center justify-between transition-colors ${
                    isSelected
                      ? "bg-cyan-950/80 border border-cyan-500/50 text-cyan-200"
                      : "hover:bg-slate-900/60 border border-transparent text-slate-300"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`p-2 rounded-lg ${
                        isSelected
                          ? "bg-cyan-900/60 text-cyan-300"
                          : "bg-slate-900 text-slate-400"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-xs text-slate-100">{item.title}</span>
                        {item.badge && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-950 border border-white/10 text-slate-400 font-mono">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <ArrowRight
                    className={`w-4 h-4 shrink-0 transition-transform ${
                      isSelected ? "text-cyan-400 translate-x-0.5" : "text-transparent"
                    }`}
                  />
                </button>
              );
            })
          )}
        </div>

        {/* Command Palette Footer */}
        <div className="px-4 py-2 bg-slate-950/90 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-500 font-mono">
          <div className="flex items-center space-x-3">
            <span>↑↓ Pohyb</span>
            <span>↵ Potvrdit</span>
            <span>ESC Zavřít</span>
          </div>
          <span>HA-AgentForge Rychlá Navigace</span>
        </div>
      </div>
    </div>
  );
};
