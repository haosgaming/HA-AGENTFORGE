import { AgentInstance, HaEntity, NetworkNode, CodeRevision, DeploymentRecord, CronTask } from "../types";

export const INVENTORY_NODES: NetworkNode[] = [
  { name: "ROUTERBE3600 (OpenWrt)", ip: "192.168.1.1", role: "Gateway / L3 Router", status: "ONLINE" },
  { name: "AdGuard Home (CT 103)", ip: "192.168.1.50", role: "Primary DNS / Filter", status: "ONLINE" },
  { name: "PC (2.5G PCIe)", ip: "192.168.1.82", role: "High-perf LAN (Metric 10)", metric: 10, status: "ONLINE" },
  { name: "PC (1G LAN)", ip: "192.168.1.81", role: "Secondary LAN (Metric 20)", metric: 20, status: "STANDBY" },
  { name: "Proxmox (Dell R510)", ip: "192.168.1.108", role: "Hypervisor PVE 7.4 (2x Xeon L5640)", mac: "78:2B:CB:19:0D:FD", status: "ONLINE" },
  { name: "ESP32-S3 433MHz Gateway", ip: "192.168.1.109", role: "CC1101 RF Gateway (ESP-IDF v5.5+)", mac: "30:ED:A0:BD:31:F4", status: "ONLINE" },
  { name: "Home Assistant Bare-metal", ip: "192.168.1.110", role: "HAOS 18.3 | Core 2026.10.2", mac: "B0:5C:DA:3B:05:A9", status: "ONLINE" },
  { name: "truenas2 (TrueNAS SCALE 27.0)", ip: "192.168.1.115", role: "ZFS Storage Server", status: "ONLINE" },
];

export const INITIAL_ENTITIES: HaEntity[] = [
  {
    entity_id: "sensor.carspa_battery_voltage",
    friendly_name: "Carspa Akumulátor (Napětí)",
    domain: "sensor",
    state: "13.92",
    unit_of_measurement: "V",
    attributes: { device_class: "voltage", protocol: "Voltronic PI30", baud: 2400 },
    last_updated: "před 2 s",
  },
  {
    entity_id: "sensor.carspa_solar_power",
    friendly_name: "Carspa PV Solární Výkon",
    domain: "sensor",
    state: "485",
    unit_of_measurement: "W",
    attributes: { device_class: "power", state_class: "measurement" },
    last_updated: "před 2 s",
  },
  {
    entity_id: "sensor.carspa_inverter_load",
    friendly_name: "Carspa Zátěž Střídače",
    domain: "sensor",
    state: "22",
    unit_of_measurement: "%",
    attributes: { rated_va: 1000 },
    last_updated: "před 5 s",
  },
  {
    entity_id: "switch.emos_socket_1",
    friendly_name: "Zásuvka EMOS P0065 #1 (Přebytky FVE)",
    domain: "switch",
    state: "on",
    attributes: { rf_protocol: "EV1527", code: "0x3A5B12", cc1101_repeat: 16 },
    last_updated: "před 1 min",
  },
  {
    entity_id: "switch.emos_socket_2",
    friendly_name: "Zásuvka EMOS P0065 #2 (Topení)",
    domain: "switch",
    state: "off",
    attributes: { rf_protocol: "EV1527", code: "0x3A5B14", cc1101_repeat: 16 },
    last_updated: "před 15 min",
  },
  {
    entity_id: "switch.subghz_gateway_433",
    friendly_name: "ESP32-S3 CC1101 RF Gateway",
    domain: "switch",
    state: "on",
    attributes: { ip: "192.168.1.109", frequency: "433.92MHz", tx_power: "10 dBm", balun: "868MHz filter" },
    last_updated: "před 10 s",
  },
  {
    entity_id: "sensor.cc1101_last_received_code",
    friendly_name: "CC1101 RF Přijatý Kód",
    domain: "sensor",
    state: "0x2F2F44",
    attributes: { button: "A", protocol: 1, debounced_ms: 650 },
    last_updated: "před 35 s",
  },
  {
    entity_id: "sensor.proxmox_cpu_usage",
    friendly_name: "Dell PowerEdge R510 CPU Zátěž",
    domain: "sensor",
    state: "34.8",
    unit_of_measurement: "%",
    attributes: { cpus: "2x Xeon L5640 (12C/24T)", no_avx: true },
    last_updated: "před 4 s",
  },
  {
    entity_id: "sensor.adguard_dns_queries",
    friendly_name: "AdGuard Home DNS Dotazy (24h)",
    domain: "sensor",
    state: "14820",
    unit_of_measurement: "req",
    attributes: { upstream: "Starlink / 1.1.1.1" },
    last_updated: "před 10 s",
  },
  {
    entity_id: "switch.main_breaker",
    friendly_name: "Hlavní PDU / Jistič Rozvaděče",
    domain: "switch",
    state: "on",
    attributes: { rack: "42U Server Room", critical_lock: true },
    last_updated: "před 3 dny",
    is_critical: true,
  },
  {
    entity_id: "switch.server_rack_power",
    friendly_name: "Napájení Serverového Racku",
    domain: "switch",
    state: "on",
    attributes: { pdu_slot: 1, current_amp: 4.8 },
    last_updated: "před 5 dny",
    is_critical: true,
  },
];

export const INITIAL_AGENTS: AgentInstance[] = [
  {
    id: 1,
    name: "Agent-FVE-Balancer",
    status: "RUNNING",
    interval_seconds: 30,
    last_run_at: "2026-10-26 14:55:12",
    cpu_percent: 1.8,
    memory_mb: 28.4,
    current_script_path: "/config/scripts/fve_balancer.py",
    log_buffer: `[2026-10-26 14:54:42] [INFO] Spuštěn cyklus #412 na HA Core (192.168.1.110:8123)
[2026-10-26 14:54:42] [INFO] Stav Carspa: U=13.92V (>13.8V), PV=485W (>250W)
[2026-10-26 14:54:43] [INFO] Solární přebytek potvrzen. RF povel switch.turn_on -> switch.emos_socket_1
[2026-10-26 14:55:12] [INFO] Cyklus dokončen za 0.04s. Bezpečnostní status: NOMINAL`,
  },
  {
    id: 2,
    name: "Agent-SubGHz-Sentinel",
    status: "RUNNING",
    interval_seconds: 15,
    last_run_at: "2026-10-26 14:55:20",
    cpu_percent: 0.9,
    memory_mb: 22.1,
    current_script_path: "/config/scripts/subghz_watcher.py",
    log_buffer: `[2026-10-26 14:55:00] [INFO] Spojení s ESP32-S3 Gateway (192.168.1.109:80) aktivní.
[2026-10-26 14:55:05] [INFO] Zachycen RF rámec EV1527: 0x2F2F44 (Keyfob Button A).
[2026-10-26 14:55:05] [INFO] Aplikován debouncing zámek 650ms. Stav: Odbaveno bez kolize s RMT bufferem.`,
  },
  {
    id: 3,
    name: "Agent-Proxmox-Guard",
    status: "IDLE",
    interval_seconds: 120,
    last_run_at: "2026-10-26 14:54:00",
    cpu_percent: 0.0,
    memory_mb: 18.5,
    current_script_path: "/config/scripts/proxmox_guard.py",
    log_buffer: `[2026-10-26 14:54:00] [INFO] Proxmox VE 7.4 (Dell R510, 192.168.1.108) telemetrie OK.
[2026-10-26 14:54:00] [INFO] Teplota Dual Xeon L5640: 42°C / 44°C. ZFS Pooly: ONLINE.`,
  },
];

export const INITIAL_REVISIONS: CodeRevision[] = [
  {
    id: 1,
    revision_number: 1,
    code_type: "python",
    content: `#!/usr/bin/env python3
"""
HA-AgentForge: Autonomní FVE Balancer pro Carspa MKS1000-12 a RF Zásuvky EMOS P0065
Cílový hostitel: 192.168.1.110:8123 | ESP32-S3 Gateway: 192.168.1.109
"""
import asyncio
import logging
import httpx

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("fve_balancer")

HA_BASE_URL = "http://192.168.1.110:8123/api"
HA_TOKEN = "SUPERVISOR_BEARER_TOKEN"
BATTERY_CUTOFF_VOLTAGE = 12.4
BATTERY_RESUME_VOLTAGE = 13.8

async def fetch_entity_state(client: httpx.AsyncClient, entity_id: str) -> dict:
    headers = {"Authorization": f"Bearer {HA_TOKEN}", "Content-Type": "application/json"}
    resp = await client.get(f"{HA_BASE_URL}/states/{entity_id}", headers=headers, timeout=5.0)
    resp.raise_for_status()
    return resp.json()

async def trigger_rf_socket(client: httpx.AsyncClient, service: str, entity_id: str):
    headers = {"Authorization": f"Bearer {HA_TOKEN}", "Content-Type": "application/json"}
    payload = {"entity_id": entity_id}
    resp = await client.post(f"{HA_BASE_URL}/services/switch/{service}", headers=headers, json=payload, timeout=5.0)
    resp.raise_for_status()
    logger.info(f"Odeslán RF požadavek: switch.{service} na {entity_id}")

async def run_fve_cycle():
    async with httpx.AsyncClient() as client:
        try:
            battery_state = await fetch_entity_state(client, "sensor.carspa_battery_voltage")
            pv_power_state = await fetch_entity_state(client, "sensor.carspa_solar_power")
            voltage = float(battery_state.get("state", 0.0))
            pv_watts = float(pv_power_state.get("state", 0.0))
            logger.info(f"FVE Telemetrie: U={voltage}V, P_pv={pv_watts}W")

            if voltage >= BATTERY_RESUME_VOLTAGE and pv_watts > 250:
                logger.info("Dostatek solární energie. Sepnutí přebytkové zásuvky EMOS (RF EV1527).")
                await trigger_rf_socket(client, "turn_on", "switch.emos_socket_1")
            elif voltage <= BATTERY_CUTOFF_VOLTAGE:
                logger.warning("Kritické napětí akumulátoru! Okamžité odpojení zátěže.")
                await trigger_rf_socket(client, "turn_off", "switch.emos_socket_1")
        except Exception as err:
            logger.error(f"Chyba cyklu FVE balanceru: {err}")

if __name__ == "__main__":
    asyncio.run(run_fve_cycle())
`,
    ast_valid: true,
    ast_findings: [],
    affected_entities: ["sensor.carspa_battery_voltage", "sensor.carspa_solar_power", "switch.emos_socket_1"],
    system_notes: "Bezpečnostní kontrola AST proběhla úspěšně. Využívá výhradně httpx.AsyncClient s timeoutem 5s a neobsahuje blokovaná volání os.system.",
    git_branch: "feature/fve-balancer",
    git_commit_sha: "e8a93bc2f",
    created_at: "2026-10-26 14:30:00",
  },
];

export const INITIAL_DEPLOYMENTS: DeploymentRecord[] = [
  {
    id: 1,
    target_host: "192.168.1.110",
    target_path: "/config/packages/fve_balancer.yaml",
    status: "SUCCESS",
    exit_code: 0,
    ha_core_check_passed: true,
    stdout: "Command completed successfully. Configuration valid. Home Assistant Core 2026.10.2 schema check PASSED.",
    stderr: "",
    executed_at: "2026-10-26 14:32:15",
  },
  {
    id: 2,
    target_host: "192.168.1.110",
    target_path: "/config/packages/subghz_gateway.yaml",
    status: "SUCCESS",
    exit_code: 0,
    ha_core_check_passed: true,
    stdout: "Command completed successfully. Configuration valid.",
    stderr: "",
    executed_at: "2026-10-26 14:40:02",
  },
];

export const INITIAL_CRON_TASKS: CronTask[] = [
  {
    id: "cron-1",
    name: "FVE Balancer Přebytky (EMOS #1)",
    entity_id: "switch.emos_socket_1",
    action: "toggle",
    cron_expression: "*/5 * * * *",
    human_readable: "Každých 5 minut",
    is_active: true,
    last_run: "2026-10-26 14:50:00",
    next_run: "2026-10-26 14:55:00",
    execution_count: 142,
    last_status: "SUCCESS",
    created_at: "2026-10-26 10:00:00",
  },
  {
    id: "cron-2",
    name: "ESP32-S3 CC1101 Heartbeat",
    entity_id: "switch.subghz_gateway_433",
    action: "turn_on",
    cron_expression: "0 * * * *",
    human_readable: "Každou hodinu",
    is_active: true,
    last_run: "2026-10-26 14:00:00",
    next_run: "2026-10-26 15:00:00",
    execution_count: 36,
    last_status: "SUCCESS",
    created_at: "2026-10-26 11:15:00",
  },
  {
    id: "cron-3",
    name: "Noční odpojení zásuvky topení (#2)",
    entity_id: "switch.emos_socket_2",
    action: "turn_off",
    cron_expression: "0 23 * * *",
    human_readable: "Denně ve 23:00",
    is_active: false,
    last_run: "2026-10-25 23:00:00",
    next_run: "2026-10-26 23:00:00",
    execution_count: 18,
    last_status: "SUCCESS",
    created_at: "2026-10-24 18:30:00",
  },
];
