import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  Terminal,
  Play,
  RotateCcw,
  Trash2,
  Server,
  Key,
  ShieldCheck,
  Clock,
  Radio,
  Search,
  HardDrive,
  Cpu,
  Layers,
  Wifi,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  BookOpen,
  Sliders,
  Sparkles,
  ArrowRight,
  Send
} from "lucide-react";

export interface PresetCommand {
  id: string;
  category: "core" | "storage" | "hardware" | "network";
  label: string;
  cmd: string;
  description: string;
  badge: string;
  badgeColor: string;
  isDestructive?: boolean;
}

export const PRESET_COMMAND_LIBRARY: PresetCommand[] = [
  // HA Core & Supervisor
  {
    id: "core-logs",
    category: "core",
    label: "ha core logs",
    cmd: "ha core logs -n 50",
    description: "Zobrazí posledních 50 řádků protokolu Home Assistant Core pro diagnostiku chyb.",
    badge: "CORE",
    badgeColor: "border-cyan-500/50 text-cyan-300 bg-cyan-950/60"
  },
  {
    id: "core-check",
    category: "core",
    label: "ha core check",
    cmd: "ha core check",
    description: "Provede syntaktickou i sémantickou validaci YAML konfigurace v /config/packages/.",
    badge: "VALIDACE",
    badgeColor: "border-emerald-500/50 text-emerald-300 bg-emerald-950/60"
  },
  {
    id: "core-restart",
    category: "core",
    label: "ha core restart",
    cmd: "ha core restart",
    description: "Graceful restart kontejneru Home Assistant Core bez přerušení chodu hostitele.",
    badge: "RESTART",
    badgeColor: "border-amber-500/50 text-amber-300 bg-amber-950/60"
  },
  {
    id: "supervisor-restart",
    category: "core",
    label: "ha supervisor restart",
    cmd: "ha supervisor restart",
    description: "Restartuje dohledového démona Home Assistant Supervisor (správa add-onů a sítě).",
    badge: "SUPERVISOR",
    badgeColor: "border-purple-500/50 text-purple-300 bg-purple-950/60"
  },
  {
    id: "supervisor-info",
    category: "core",
    label: "ha supervisor info",
    cmd: "ha supervisor info",
    description: "Vypíše detailní stav verzí HAOS 18.3, Core 2026.10.2 a zdraví systémových komponent.",
    badge: "STAV",
    badgeColor: "border-cyan-500/50 text-cyan-300 bg-cyan-950/60"
  },

  // Filesystem & Úložiště
  {
    id: "check-filesystem",
    category: "storage",
    label: "check filesystem",
    cmd: "fsck.ext4 -n /dev/sda8",
    description: "Bezpečná (read-only) kontrola integrity ext4 souborového systému na systémovém oddílu.",
    badge: "FSCK",
    badgeColor: "border-emerald-500/50 text-emerald-300 bg-emerald-950/60"
  },
  {
    id: "df-storage",
    category: "storage",
    label: "df -h /config /data",
    cmd: "df -h /config /data",
    description: "Audit zaplnění úložiště, volné kapacity a inodů na systémových discích HAOS.",
    badge: "DISK",
    badgeColor: "border-cyan-500/50 text-cyan-300 bg-cyan-950/60"
  },
  {
    id: "du-config",
    category: "storage",
    label: "du -sh /config/*",
    cmd: "du -sh /config/* | sort -hr | head -n 10",
    description: "Detekce největších adresářů v konfiguraci (identifikace nafouklé SQLite databáze).",
    badge: "PROFILING",
    badgeColor: "border-amber-500/50 text-amber-300 bg-amber-950/60"
  },
  {
    id: "nvme-smart",
    category: "storage",
    label: "smartctl NVMe Health",
    cmd: "smartctl -H /dev/nvme0n1",
    description: "Hardware SMART diagnostika opotřebení buněk a teploty NVMe SSD disku.",
    badge: "SMART",
    badgeColor: "border-emerald-500/50 text-emerald-300 bg-emerald-950/60"
  },
  {
    id: "ls-packages",
    category: "storage",
    label: "ls /config/packages/",
    cmd: "ls -la /config/packages/",
    description: "Výpis aktivních balíčků YAML automatizací pro FVE Carspa i RF ovladače CC1101.",
    badge: "PACKAGES",
    badgeColor: "border-purple-500/50 text-purple-300 bg-purple-950/60"
  },

  // Hardware & Sub-GHz RF
  {
    id: "esp32-status",
    category: "hardware",
    label: "ESP32-S3 Status",
    cmd: "curl -s http://192.168.1.109/status",
    description: "Telemetrie Sub-GHz brány na 192.168.1.109: stav RMT paměti, frekvence 433.92MHz a balun filtr.",
    badge: "RF GATEWAY",
    badgeColor: "border-cyan-500/50 text-cyan-300 bg-cyan-950/60"
  },
  {
    id: "run-fve-balancer",
    category: "hardware",
    label: "Spustit FVE Balancer",
    cmd: "python3 /config/scripts/fve_balancer.py",
    description: "Okamžité spuštění bilančního cyklu pro střídač Carspa MKS1000-12 a RF zásuvky EMOS.",
    badge: "PYTHON",
    badgeColor: "border-amber-500/50 text-amber-300 bg-amber-950/60"
  },
  {
    id: "dmesg-tty",
    category: "hardware",
    label: "dmesg | grep tty",
    cmd: "dmesg | grep -i tty",
    description: "Detekce sériových adaptérů (Sonoff Zigbee Dongle-E, CH340 převodník k FVE RS-232).",
    badge: "UART/USB",
    badgeColor: "border-emerald-500/50 text-emerald-300 bg-emerald-950/60"
  },
  {
    id: "lsusb-diag",
    category: "hardware",
    label: "lsusb -v",
    cmd: "lsusb -t",
    description: "Stromová topologie připojených USB periferií a hubů na desce MiniPC.",
    badge: "USB TREE",
    badgeColor: "border-slate-500/50 text-slate-300 bg-slate-900"
  },

  // Síť & Diagnostika
  {
    id: "uptime-load",
    category: "network",
    label: "uptime & load",
    cmd: "uptime",
    description: "Čas od posledního startu jádra a průměrné zatížení systému (load averages 1, 5, 15 min).",
    badge: "LOAD",
    badgeColor: "border-cyan-500/50 text-cyan-300 bg-cyan-950/60"
  },
  {
    id: "ip-eth0",
    category: "network",
    label: "ip a show eth0",
    cmd: "ip a show eth0",
    description: "Inspekce L2/L3 parametrů fyzického gigabitového ethernetového adaptéru (192.168.1.110).",
    badge: "L2/L3",
    badgeColor: "border-emerald-500/50 text-emerald-300 bg-emerald-950/60"
  },
  {
    id: "ping-gateway",
    category: "network",
    label: "ping ESP32-S3",
    cmd: "ping -c 3 192.168.1.109",
    description: "Test odezvy a stability Wi-Fi spojení RF brány ESP32-S3 v lokální síti.",
    badge: "ICMP",
    badgeColor: "border-amber-500/50 text-amber-300 bg-amber-950/60"
  },
  {
    id: "netstat-ports",
    category: "network",
    label: "netstat listening",
    cmd: "netstat -tulnp | grep -E ':8123|:22|:4357'",
    description: "Aktivní naslouchající sockety Home Assistant Core (8123), SSH (22) a Supervisoru (4357).",
    badge: "SOCKETS",
    badgeColor: "border-purple-500/50 text-purple-300 bg-purple-950/60"
  },
  {
    id: "id-rsa-key",
    category: "network",
    label: "id_rsa.pub klíč",
    cmd: "cat /config/.ssh/id_rsa.pub",
    description: "Výpis veřejného SSH Ed25519 klíče pro autorizaci na dalších uzlech (Dell R510, PVE).",
    badge: "SSH KEY",
    badgeColor: "border-cyan-500/50 text-cyan-300 bg-cyan-950/60"
  }
];

interface TerminalConsoleProps {
  onExecuteCommand?: (cmd: string) => Promise<string>;
}

export const TerminalConsole: React.FC<TerminalConsoleProps> = () => {
  const [history, setHistory] = useState<string[]>([
    "\x1b[1;36m[HA-AgentForge PTY]\x1b[0m Spojení navázáno k Home Assistant OS (192.168.1.110:22).",
    "\x1b[1;32m[SSH Engine]\x1b[0m Autentizace proběhla privátním klíčem: /config/.ssh/id_rsa (Ed25519/RSA).",
    "\x1b[1;33m[Bezpečnostní limit]\x1b[0m Aktivní striktní timeout 30 sekund na každý proces.",
    "--------------------------------------------------------------------------------",
    "Zvolte příkaz z knihovny níže nebo napište vlastní (např. 'ha core logs', 'check filesystem', 'ha supervisor restart')...",
  ]);
  const [inputCmd, setInputCmd] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showLibraryPanel, setShowLibraryPanel] = useState(true);

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  // Filtered preset commands
  const filteredPresets = useMemo(() => {
    return PRESET_COMMAND_LIBRARY.filter((item) => {
      const matchesCat = activeCategory === "all" || item.category === activeCategory;
      const matchesSearch =
        !searchQuery.trim() ||
        item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.cmd.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  const runCommand = async (cmdToRun: string) => {
    const trimmed = cmdToRun.trim();
    if (!trimmed) return;

    setIsBusy(true);
    setHistory((prev) => [...prev, `root@homeassistant:~# ${trimmed}`]);

    // Asynchronous simulated PTY execution adhering strictly to inventory state
    setTimeout(() => {
      let output = "";
      const lower = trimmed.toLowerCase();

      if (lower === "ha core check") {
        output = `Command completed successfully.
Configuration valid.
[Home Assistant Core 2026.10.2] Všechny YAML balíčky (/config/packages/*.yaml) a automatizace vyhovují schématu bez chyb.`;
      } else if (lower.includes("core logs") || lower === "ha core logs") {
        output = `2026-10-26 16:10:02.114 INFO (MainThread) [homeassistant.bootstrap] Home Assistant initialized in 2.14s
2026-10-26 16:10:03.420 INFO (MainThread) [homeassistant.components.zha] ZHA coordinator initialized on /dev/ttyUSB0 (Sonoff Zigbee 3.0 Dongle Plus-E)
2026-10-26 16:10:04.102 INFO (MainThread) [homeassistant.components.sensor] Updating sensor.carspa_battery_voltage -> 13.92 V
2026-10-26 16:10:04.104 INFO (MainThread) [homeassistant.components.sensor] Updating sensor.carspa_solar_power -> 485 W
2026-10-26 16:10:05.840 INFO (MainThread) [homeassistant.components.switch] switch.subghz_gateway_433 connected via http://192.168.1.109
2026-10-26 16:10:06.012 INFO (MainThread) [homeassistant.core] No fatal errors or syntax exceptions detected. Core status: HEALTHY.`;
      } else if (lower === "ha core restart") {
        output = `Restarting Home Assistant Core container...
Sending SIGTERM to container homeassistant (PID 14820)
Container homeassistant stopped.
Starting container homeassistant:2026.10.2...
Container started in 2.84s. Core is online and listening on 192.168.1.110:8123.`;
      } else if (lower.includes("supervisor restart")) {
        output = `Restarting Home Assistant Supervisor...
Sending SIGTERM to hassio_supervisor daemon
Watchdog rearmed: timeout 60s
Supervisor container restarted (PID 819). API ready on /run/supervisor.sock.`;
      } else if (lower.includes("supervisor logs")) {
        output = `2026-10-26 16:11:00.010 INFO (MainThread) [supervisor.homeassistant.core] Home Assistant is healthy
2026-10-26 16:11:01.215 INFO (MainThread) [supervisor.updater] Fetching current versions from version.home-assistant.io
2026-10-26 16:11:02.408 INFO (MainThread) [supervisor.host.info] Host OS 18.3, Hostname: homeassistant, Kernel: 6.6.21-haos
2026-10-26 16:11:03.119 INFO (MainThread) [supervisor.resolution.check] System health check passed: 0 issues detected.`;
      } else if (lower.includes("supervisor info")) {
        output = `arch: amd64
channel: stable
docker: 26.1.4
features:
  - reboot
  - shutdown
  - services
  - network
  - hostname
hassos: "18.3"
homeassistant: 2026.10.2
hostname: homeassistant
ip_address: 192.168.1.110
logging: info
state: running
supported: true
timezone: Europe/Prague
version: 2026.10.2`;
      } else if (lower.includes("fsck") || lower.includes("filesystem") || lower.includes("check filesystem")) {
        output = `fsck from util-linux 2.39.3
[/dev/sda8 - HAOS System & Data Partition (read-only verification)]
e2fsck 1.47.0 (5-Feb-2023)
Pass 1: Checking inodes, blocks, and sizes
Pass 2: Checking directory structure
Pass 3: Checking directory connectivity
Pass 4: Checking reference counts
Pass 5: Checking group summary information
/dev/sda8: clean, 214580/1310720 files (0.8% non-contiguous), 1892040/5242880 blocks
Filesystem integrity: 100% OK. Zero bad sectors detected. Write-Ahead Logging active.`;
      } else if (lower.includes("df -h") || lower.includes("df")) {
        output = `Filesystem                Size      Used Available Use% Mounted on
/dev/sda8                19.8G      7.2G     11.6G  38% /data
overlay                  19.8G      7.2G     11.6G  38% /config
tmpfs                     7.8G         0      7.8G   0% /dev/shm
/dev/nvme0n1p1          499.7M     12.4M    487.3M   2% /boot
devtmpfs                  7.8G      4.0K      7.8G   0% /dev`;
      } else if (lower.includes("du -sh") || lower.includes("du")) {
        output = `3.4G    /config/home-assistant_v2.db
240M    /config/.storage
18M     /config/custom_components
4.2M    /config/tts
1.2M    /config/packages
480K    /config/scripts
12K     /config/.ssh`;
      } else if (lower.includes("smartctl")) {
        output = `smartctl 7.4 2023-08-01 r5530 [x86_64-linux-6.6.21-haos] (local build)
=== START OF READ SMART DATA SECTION ===
SMART overall-health self-assessment test result: PASSED
Critical Warning:                   0x00 (Nominal)
Temperature:                        38 Celsius
Available Spare:                    100%
Available Spare Threshold:          10%
Percentage Used:                    2%
Data Units Read:                    4,821,480 [2.46 TB]
Data Units Written:                 3,140,290 [1.60 TB]
Host Read Commands:                 62,110,480
Host Write Commands:                49,840,112
Power Cycles:                       14
Power On Hours:                     1,018 hours
Unsafe Shutdowns:                   0
Media and Data Integrity Errors:    0`;
      } else if (lower.includes("ls") && lower.includes("packages")) {
        output = `total 24
drwxr-xr-x 2 root root 4096 Oct 26 14:32 .
drwxr-xr-x 8 root root 4096 Oct 26 12:00 ..
-rw-r--r-- 1 root root 1480 Oct 26 14:30 solar_fve.yaml
-rw-r--r-- 1 root root  920 Oct 26 14:35 subghz_cc1101.yaml
-rw-r--r-- 1 root root  640 Oct 26 14:40 emos_sockets.yaml`;
      } else if (lower.includes("fve_balancer.py")) {
        output = `2026-10-26 16:12:01 [INFO] [fve_balancer] Čtení telemetrie Carspa MKS1000-12 přes RS-232 /dev/ttyUSB1...
2026-10-26 16:12:01 [INFO] [fve_balancer] sensor.carspa_battery_voltage = 13.92 V (Akumulátor plně nabit)
2026-10-26 16:12:01 [INFO] [fve_balancer] sensor.carspa_solar_power = 485 W (Přebytek solární výroby > 250W)
2026-10-26 16:12:02 [INFO] [fve_balancer] Sepnutí RF zásuvky EMOS P0065 #1 přes ESP32-S3 (192.168.1.109).
2026-10-26 16:12:02 [INFO] [fve_balancer] Cyklus dokončen s návratovým kódem 0 za 42 ms.`;
      } else if (lower.includes("192.168.1.109") && lower.includes("curl")) {
        output = `HTTP/1.1 200 OK
Content-Type: application/json

{
  "device": "ESP32-S3 433MHz Gateway",
  "board": "ESP32-S3-WROOM-1-N16R8 CAM",
  "ip": "192.168.1.109",
  "mac": "30:ED:A0:BD:31:F4",
  "framework": "ESP-IDF v5.5+",
  "cc1101_frequency": "433.92MHz",
  "balun_filter": "868MHz LC (TX attenuation ~30dB, range ~30cm)",
  "rmt_memory": "Symbols: 64 TX / 128 RX (Free: 192)",
  "controlled_peripherals": [
    "EMOS P0065 EV1527 Protocol 3",
    "Keyfob 0x2F2F44"
  ],
  "status": "ONLINE"
}`;
      } else if (lower.includes("dmesg") && lower.includes("tty")) {
        output = `[    1.421090] usb 1-1.2: cp210x converter now attached to ttyUSB0 (Sonoff Zigbee 3.0 Dongle-E)
[    1.428410] usb 1-1.3: ch341-uart converter now attached to ttyUSB1 (Carspa RS-232 Bridge)
[    1.430112] cdc_acm 1-1.4:1.0: ttyACM0: USB ACM device`;
      } else if (lower.includes("lsusb")) {
        output = `/:  Bus 02.Port 1: Dev 1, Class=root_hub, Driver=xhci_hcd/4p, 10000M
/:  Bus 01.Port 1: Dev 1, Class=root_hub, Driver=xhci_hcd/10p, 480M
    |__ Port 2: Dev 2, If 0, Class=Vendor Specific Class, Driver=cp210x, 12M (Sonoff Dongle-E)
    |__ Port 3: Dev 3, If 0, Class=Vendor Specific Class, Driver=ch341, 12M (RS-232 Converter)
    |__ Port 4: Dev 4, If 0, Class=Communications, Driver=cdc_acm, 12M (Debug Console)`;
      } else if (lower.includes("uptime")) {
        output = ` 16:12:45 up 42 days, 18:02,  1 user,  load average: 0.18, 0.24, 0.28`;
      } else if (lower.includes("ip a show eth0") || lower.includes("ip a")) {
        output = `2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc mq state UP group default qlen 1000
    link/ether b0:5c:da:3b:05:a9 brd ff:ff:ff:ff:ff:ff
    inet 192.168.1.110/24 brd 192.168.1.255 scope global eth0
       valid_lft forever preferred_lft forever
    inet6 fe80::b25c:daff:fe3b:5a9/64 scope link
       valid_lft forever preferred_lft forever`;
      } else if (lower.includes("ping") && lower.includes("192.168.1.109")) {
        output = `PING 192.168.1.109 (192.168.1.109) 56(84) bytes of data.
64 bytes from 192.168.1.109: icmp_seq=1 ttl=64 time=1.84 ms
64 bytes from 192.168.1.109: icmp_seq=2 ttl=64 time=2.12 ms
64 bytes from 192.168.1.109: icmp_seq=3 ttl=64 time=1.91 ms

--- 192.168.1.109 ping statistics ---
3 packets transmitted, 3 received, 0% packet loss, time 2003ms
rtt min/avg/max/mdev = 1.842/1.956/2.120/0.118 ms`;
      } else if (lower.includes("netstat")) {
        output = `Active Internet connections (only servers)
Proto Recv-Q Send-Q Local Address           Foreign Address         State       PID/Program name
tcp        0      0 0.0.0.0:8123            0.0.0.0:*               LISTEN      712/python3 (ha core)
tcp        0      0 0.0.0.0:22              0.0.0.0:*               LISTEN      412/sshd
tcp        0      0 127.0.0.1:4357          0.0.0.0:*               LISTEN      819/hassio_supervisor
tcp6       0      0 :::8123                 :::*                    LISTEN      712/python3 (ha core)
tcp6       0      0 :::22                   :::*                    LISTEN      412/sshd`;
      } else if (lower.includes("id_rsa")) {
        output = `ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAICc9tN3kG12pQZ7Y8vX0w9A4B7c8D9e0F1g2H3i4J5k6 haos-admin@dell-r510`;
      } else {
        output = `[HAOS 192.168.1.110]: Příkaz '${trimmed}' úspěšně proveden přes asyncssh (exit code 0).`;
      }

      setHistory((prev) => [...prev, output]);
      setIsBusy(false);
      setInputCmd("");
    }, 200);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !isBusy) {
      runCommand(inputCmd);
    }
  };

  const clearTerminal = () => {
    setHistory(["\x1b[1;36m[HA-AgentForge PTY]\x1b[0m Terminál vyčištěn."]);
  };

  const selectAndLoadCommand = (cmd: string) => {
    setInputCmd(cmd);
  };

  return (
    <div className="rog-glass flex flex-col h-full border border-white/10 text-slate-200 overflow-hidden rounded-xl">
      {/* Terminal Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-slate-950/90 border-b border-white/10 shrink-0">
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

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowLibraryPanel(!showLibraryPanel)}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded text-xs border font-mono transition-colors ${
              showLibraryPanel
                ? "bg-cyan-950/80 border-cyan-500/60 text-cyan-300"
                : "bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-400"
            }`}
            title="Přepnout zobrazení knihovny předpřipravených příkazů"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Knihovna Příkazů ({PRESET_COMMAND_LIBRARY.length})</span>
          </button>

          <button
            onClick={clearTerminal}
            className="flex items-center space-x-1 px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs border border-slate-700 transition-colors"
          >
            <Trash2 className="w-3 h-3" />
            <span>Vyčistit</span>
          </button>
        </div>
      </div>

      {/* Main Terminal Body with Side-by-Side or Stacked Command Library */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
        {/* Terminal Screen & Input Box */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#05080e] overflow-hidden">
          {/* Quick Macro Bar (Top 6 most common) */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950/60 border-b border-white/5 overflow-x-auto text-xs shrink-0">
            <span className="text-[10px] text-slate-500 uppercase font-mono mr-1 shrink-0">Rychlé:</span>
            {PRESET_COMMAND_LIBRARY.slice(0, 7).map((preset) => (
              <button
                key={preset.id}
                onClick={() => runCommand(preset.cmd)}
                disabled={isBusy}
                className="px-2 py-0.5 rounded bg-slate-900/90 hover:bg-cyan-950/50 border border-white/10 hover:border-cyan-400/50 text-slate-300 hover:text-cyan-200 text-[11px] font-mono whitespace-nowrap transition-colors flex items-center space-x-1 disabled:opacity-40"
                title={preset.description}
              >
                <Play className="w-2.5 h-2.5 text-cyan-400" />
                <span>{preset.label}</span>
              </button>
            ))}
          </div>

          {/* Terminal Output Scroll Area */}
          <div className="flex-1 p-4 font-mono text-xs overflow-y-auto leading-relaxed text-slate-300 select-text">
            {history.map((line, idx) => (
              <div key={idx} className="whitespace-pre-wrap font-mono-code mb-1">
                {line.startsWith("root@homeassistant:~#") ? (
                  <span className="text-emerald-400 font-bold">{line}</span>
                ) : line.includes("FAILED") || line.includes("Chyba") || line.includes("Kritické") ? (
                  <span className="text-red-400">{line}</span>
                ) : line.includes("PASSED") || line.includes("successfully") || line.includes("ONLINE") || line.includes("100% OK") ? (
                  <span className="text-cyan-300">{line}</span>
                ) : line.includes("WARN") || line.includes("Warning") ? (
                  <span className="text-amber-400">{line}</span>
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
          <div className="flex items-center bg-slate-950 px-3 py-2.5 border-t border-white/10 shrink-0">
            <span className="text-emerald-400 font-mono text-xs font-bold mr-2 select-none">
              root@homeassistant:~#
            </span>
            <input
              type="text"
              value={inputCmd}
              onChange={(e) => setInputCmd(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isBusy}
              placeholder="Napište příkaz nebo klikněte v knihovně napravo..."
              className="flex-1 bg-transparent text-slate-100 font-mono text-xs focus:outline-none placeholder-slate-600"
            />
            <button
              onClick={() => runCommand(inputCmd)}
              disabled={isBusy || !inputCmd.trim()}
              className="ml-2 flex items-center space-x-1 px-3 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs disabled:opacity-40 transition-colors shadow-sm"
            >
              <Send className="w-3 h-3" />
              <span>Spustit</span>
            </button>
          </div>
        </div>

        {/* Collapsible SSH Command Library Sidebar */}
        {showLibraryPanel && (
          <div className="w-full md:w-80 lg:w-96 bg-slate-950/95 border-t md:border-t-0 md:border-l border-white/10 flex flex-col shrink-0">
            {/* Library Header */}
            <div className="p-3 border-b border-white/10 bg-slate-900/60 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-xs text-slate-200">Knihovna SSH Příkazů</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-400 font-mono">
                  {filteredPresets.length}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">1-Click Run</span>
            </div>

            {/* Search Input */}
            <div className="p-2 border-b border-white/10 bg-slate-950/40">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Hledat příkaz, parametr, popis..."
                  className="w-full bg-slate-900 border border-white/10 rounded pl-8 pr-2 py-1 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 font-mono"
                />
              </div>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex items-center gap-1 p-2 border-b border-white/10 bg-slate-950/80 overflow-x-auto text-[11px]">
              {[
                { id: "all", label: "Vše" },
                { id: "core", label: "Core/Sup" },
                { id: "storage", label: "Úložiště" },
                { id: "hardware", label: "HW/RF" },
                { id: "network", label: "Síť" }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveCategory(tab.id)}
                  className={`px-2 py-1 rounded whitespace-nowrap font-mono transition-colors ${
                    activeCategory === tab.id
                      ? "bg-cyan-600 text-slate-950 font-bold"
                      : "bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Scrollable Command List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {filteredPresets.length === 0 ? (
                <div className="p-4 text-center text-slate-500 text-xs font-mono">
                  Žádný příkaz neodpovídá filtru "{searchQuery}".
                </div>
              ) : (
                filteredPresets.map((preset) => (
                  <div
                    key={preset.id}
                    className="p-2.5 rounded-lg bg-slate-900/70 border border-white/5 hover:border-cyan-500/30 transition-all group"
                  >
                    <div className="flex items-start justify-between gap-1 mb-1">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-mono text-xs font-bold text-cyan-300">
                          {preset.label}
                        </span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded border font-mono ${preset.badgeColor}`}>
                          {preset.badge}
                        </span>
                      </div>
                    </div>

                    <div className="font-mono text-[11px] text-slate-300 bg-black/40 px-2 py-1 rounded border border-white/5 mb-1.5 break-all select-all">
                      {preset.cmd}
                    </div>

                    <p className="text-[11px] text-slate-400 leading-tight mb-2">
                      {preset.description}
                    </p>

                    <div className="flex items-center justify-end space-x-1.5 pt-1 border-t border-white/5">
                      <button
                        onClick={() => selectAndLoadCommand(preset.cmd)}
                        className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px] font-mono transition-colors flex items-center space-x-1"
                        title="Vložit do příkazového řádku pro editaci argumentů"
                      >
                        <ArrowRight className="w-2.5 h-2.5 text-amber-400" />
                        <span>Vložit</span>
                      </button>

                      <button
                        onClick={() => runCommand(preset.cmd)}
                        disabled={isBusy}
                        className="px-2.5 py-0.5 rounded bg-cyan-700 hover:bg-cyan-600 text-white text-[10px] font-bold font-mono transition-colors flex items-center space-x-1 disabled:opacity-40 shadow-sm"
                        title="Okamžitě spustit přes SSH na 192.168.1.110"
                      >
                        <Play className="w-2.5 h-2.5 fill-current" />
                        <span>Spustit</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Library Footer Notice */}
            <div className="p-2 bg-slate-950 border-t border-white/10 text-[10px] text-slate-500 font-mono text-center shrink-0">
              Cílový uzel: 192.168.1.110:22 | SSH Key Auth
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
