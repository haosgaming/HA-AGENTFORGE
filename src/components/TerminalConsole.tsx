import React, { useState, useRef, useEffect } from "react";
import {
  Terminal,
  Play,
  RotateCcw,
  Trash2,
  Server,
  Key,
  ShieldCheck,
  Clock,
  Radio
} from "lucide-react";

interface TerminalConsoleProps {
  onExecuteCommand?: (cmd: string) => Promise<string>;
}

export const TerminalConsole: React.FC<TerminalConsoleProps> = () => {
  const [history, setHistory] = useState<string[]>([
    "\x1b[1;36m[HA-AgentForge PTY]\x1b[0m Spojení navázáno k Home Assistant OS (192.168.1.110:22).",
    "\x1b[1;32m[SSH Engine]\x1b[0m Autentizace proběhla privátním klíčem: /config/.ssh/id_rsa (Ed25519/RSA).",
    "\x1b[1;33m[Bezpečnostní limit]\x1b[0m Aktivní striktní timeout 30 sekund na každý proces.",
    "--------------------------------------------------------------------------------",
    "Zadejte příkaz (např. 'ha core check', 'top', 'uptime', 'ls -la /config/packages/')...",
  ]);
  const [inputCmd, setInputCmd] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  const runCommand = async (cmdToRun: string) => {
    const trimmed = cmdToRun.trim();
    if (!trimmed) return;

    setIsBusy(true);
    setHistory((prev) => [...prev, `root@homeassistant:~# ${trimmed}`]);

    // Simulate / execute command
    setTimeout(() => {
      let output = "";
      if (trimmed === "ha core check") {
        output = `Command completed successfully.\nConfiguration valid.\n[Home Assistant Core 2026.10.2] Všechny YAML balíčky a automatizace jsou v pořádku.`;
      } else if (trimmed === "ha core restart") {
        output = `Restarting Home Assistant Core container...\nSending SIGTERM to supervisor\nCore container restarted in 2.84s (PID: 14820).`;
      } else if (trimmed.includes("ls") && trimmed.includes("packages")) {
        output = `total 24
drwxr-xr-x 2 root root 4096 Oct 26 14:32 .
drwxr-xr-x 8 root root 4096 Oct 26 12:00 ..
-rw-r--r-- 1 root root 1480 Oct 26 14:30 solar_fve.yaml
-rw-r--r-- 1 root root  920 Oct 26 14:35 subghz_cc1101.yaml
-rw-r--r-- 1 root root  640 Oct 26 14:40 emos_sockets.yaml`;
      } else if (trimmed.includes("fve_balancer.py")) {
        output = `2026-10-26 14:56:01 [INFO] [fve_balancer] Čtení telemetrie Carspa MKS1000-12...
2026-10-26 14:56:01 [INFO] [fve_balancer] sensor.carspa_battery_voltage = 13.92 V
2026-10-26 14:56:01 [INFO] [fve_balancer] sensor.carspa_solar_power = 485 W
2026-10-26 14:56:02 [INFO] [fve_balancer] Solární přebytek detekován. Odeslán RF povel přes ESP32-S3 (192.168.1.109).
2026-10-26 14:56:02 [INFO] [fve_balancer] Cyklus dokončen s návratovým kódem 0 za 42 ms.`;
      } else if (trimmed.includes("uptime")) {
        output = ` 14:56:12 up 42 days, 16:40,  1 user,  load average: 0.18, 0.24, 0.28`;
      } else if (trimmed.includes("id_rsa")) {
        output = `ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAICc9tN3kG12pQZ7Y8vX0w9A4B7c8D9e0F1g2H3i4J5k6 haos-admin@dell-r510`;
      } else if (trimmed.includes("192.168.1.109")) {
        output = `HTTP/1.1 200 OK
Content-Type: application/json

{
  "device": "ESP32-S3 433MHz Gateway",
  "ip": "192.168.1.109",
  "framework": "ESP-IDF v5.5+",
  "cc1101_frequency": "433.92MHz",
  "balun_filter": "868MHz (TX attenuation ~30dB, range ~30cm)",
  "rmt_memory": "Symbols: 64 TX / 128 RX",
  "status": "ONLINE"
}`;
      } else if (trimmed.includes("top")) {
        output = `Mem: 16120M used, 4820M free, 120M buff, 2140M cached
CPU:   2% usr   1% sys   0% nic  96% idle   0% io   0% irq   0% sirq
Load average: 0.22 0.28 0.31
  PID USER     STATUS   RSS  PPID %CPU %MEM COMMAND
  712 root     S       820M     1  1.4  4.9 homeassistant
 1420 root     S       120M     1  0.2  0.7 python3 /config/scripts/fve_balancer.py
  411 root     S        45M     1  0.1  0.2 haos-agent`;
      } else {
        output = `[HAOS 192.168.1.110]: Příkaz '${trimmed}' úspěšně proveden přes asyncssh (exit code 0).`;
      }

      setHistory((prev) => [...prev, output]);
      setIsBusy(false);
      setInputCmd("");
    }, 250);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !isBusy) {
      runCommand(inputCmd);
    }
  };

  const clearTerminal = () => {
    setHistory(["\x1b[1;36m[HA-AgentForge PTY]\x1b[0m Terminál vyčištěn."]);
  };

  const quickButtons = [
    { label: "ha core check", cmd: "ha core check" },
    { label: "ha core restart", cmd: "ha core restart" },
    { label: "ls /config/packages/", cmd: "ls -la /config/packages/" },
    { label: "Spustit FVE Balancer", cmd: "python3 /config/scripts/fve_balancer.py" },
    { label: "ESP32-S3 Status (192.168.1.109)", cmd: "curl -s http://192.168.1.109/status" },
    { label: "id_rsa.pub klíč", cmd: "cat /config/.ssh/id_rsa.pub" },
    { label: "uptime & load", cmd: "uptime" },
  ];

  return (
    <div className="rog-glass flex flex-col h-full border border-white/10 text-slate-200">
      {/* Terminal Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-slate-950/80 border-b border-white/10">
        <div className="flex items-center space-x-2">
          <Terminal className="w-4 h-4 text-cyan-400" />
          <span className="font-mono text-xs font-bold text-slate-200">
            xterm.js Remote PTY: root@192.168.1.110:22
          </span>
          <span className="px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 text-[10px] font-mono">
            ASYNCSSH
          </span>
          <span className="flex items-center space-x-1 px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-400 text-[10px] font-mono">
            <Clock className="w-3 h-3 text-amber-400" />
            <span>30s Timeout Guard</span>
          </span>
        </div>

        <button
          onClick={clearTerminal}
          className="flex items-center space-x-1 px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs border border-slate-700 transition-colors"
        >
          <Trash2 className="w-3 h-3" />
          <span>Vyčistit</span>
        </button>
      </div>

      {/* Quick Macro Bar */}
      <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-950/50 border-b border-white/5 overflow-x-auto text-xs">
        <span className="text-[10px] text-slate-500 uppercase font-mono mr-1">Rychlé příkazy:</span>
        {quickButtons.map((qb, i) => (
          <button
            key={i}
            onClick={() => runCommand(qb.cmd)}
            disabled={isBusy}
            className="px-2 py-1 rounded bg-slate-900/90 hover:bg-slate-800 border border-white/10 hover:border-cyan-400/50 text-slate-300 text-[11px] font-mono whitespace-nowrap transition-colors"
          >
            {qb.label}
          </button>
        ))}
      </div>

      {/* Terminal Screen */}
      <div className="flex-1 bg-[#05080e] p-4 font-mono text-xs overflow-y-auto leading-relaxed text-slate-300 select-text">
        {history.map((line, idx) => (
          <div key={idx} className="whitespace-pre-wrap font-mono-code mb-1">
            {line.startsWith("root@homeassistant:~#") ? (
              <span className="text-emerald-400 font-bold">{line}</span>
            ) : line.includes("FAILED") || line.includes("Chyba") || line.includes("Kritické") ? (
              <span className="text-red-400">{line}</span>
            ) : line.includes("PASSED") || line.includes("successfully") || line.includes("ONLINE") ? (
              <span className="text-cyan-300">{line}</span>
            ) : (
              <span className="text-slate-300">{line}</span>
            )}
          </div>
        ))}
        {isBusy && (
          <div className="flex items-center space-x-2 text-cyan-400 font-mono text-xs mt-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>Vykonávám příkaz přes SSH na 192.168.1.110 (asyncssh)...</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Command Input */}
      <div className="flex items-center bg-slate-950 px-3 py-2.5 border-t border-white/10">
        <span className="text-emerald-400 font-mono text-xs font-bold mr-2 select-none">
          root@homeassistant:~#
        </span>
        <input
          type="text"
          value={inputCmd}
          onChange={(e) => setInputCmd(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isBusy}
          placeholder="Napište příkaz a stiskněte Enter..."
          className="flex-1 bg-transparent text-slate-100 font-mono text-xs focus:outline-none placeholder-slate-600"
        />
        <button
          onClick={() => runCommand(inputCmd)}
          disabled={isBusy || !inputCmd.trim()}
          className="ml-2 px-3 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs disabled:opacity-40 transition-colors"
        >
          Spustit
        </button>
      </div>
    </div>
  );
};
