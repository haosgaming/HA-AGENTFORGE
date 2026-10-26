import asyncio
import logging
import os
import psutil
from datetime import datetime
from typing import Dict, Any, List, Optional
import httpx

logger = logging.getLogger("ha_agentforge.agent_manager")

LOG_MAX_CHARS = 10000


class AgentManager:
    def __init__(self):
        self.active_tasks: Dict[int, asyncio.Task] = {}
        self.ha_base_url = "http://192.168.1.110:8123"
        self.default_webhook_id = "agentforge_alert_webhook"
        self.ws_subscribers: List[Any] = []

    def register_ws_client(self, websocket: Any):
        self.ws_subscribers.append(websocket)

    def unregister_ws_client(self, websocket: Any):
        if websocket in self.ws_subscribers:
            self.ws_subscribers.remove(websocket)

    async def broadcast_ws(self, event_type: str, data: Dict[str, Any]):
        payload = {"type": event_type, "timestamp": datetime.utcnow().isoformat(), "payload": data}
        for ws in list(self.ws_subscribers):
            try:
                await ws.send_json(payload)
            except Exception:
                self.unregister_ws_client(ws)

    def truncate_log(self, current_log: str, new_chunk: str) -> str:
        """Appends new log and keeps the buffer strictly under 10,000 characters."""
        combined = (current_log + "\n" + new_chunk).strip()
        if len(combined) > LOG_MAX_CHARS:
            excess = len(combined) - LOG_MAX_CHARS
            trimmed = combined[excess:]
            # Ensure we start at a clean line break if possible
            first_nl = trimmed.find("\n")
            if first_nl != -1:
                return "[...log zkrácen na 10 000 znaků...]\n" + trimmed[first_nl + 1:]
            return trimmed
        return combined

    async def send_ha_webhook_alert(self, title: str, message: str, agent_id: int):
        """Sends immediate alert to Home Assistant mobile app via webhook."""
        webhook_url = f"{self.ha_base_url}/api/webhook/{self.default_webhook_id}"
        payload = {
            "title": f"🚨 HA-AgentForge Výstraha: Agent #{agent_id}",
            "message": message,
            "data": {
                "agent_id": agent_id,
                "timestamp": datetime.utcnow().isoformat(),
                "priority": "high",
                "tag": f"agent_{agent_id}"
            }
        }
        async with httpx.AsyncClient() as client:
            try:
                resp = await client.post(webhook_url, json=payload, timeout=4.0)
                logger.info(f"Odeslán HA Webhook alert ({resp.status_code})")
            except Exception as e:
                logger.warning(f"Nelze doručit HA Webhook alert: {e}")

    async def send_gotify_alert(self, title: str, message: str, gotify_url: Optional[str] = None, token: Optional[str] = None):
        """Sends push notification to Gotify instance if configured."""
        if not gotify_url or not token:
            return
        async with httpx.AsyncClient() as client:
            try:
                await client.post(
                    f"{gotify_url}/message",
                    headers={"X-Gotify-Key": token},
                    json={"title": title, "message": message, "priority": 8},
                    timeout=4.0
                )
            except Exception as e:
                logger.warning(f"Gotify alert selhal: {e}")

    def collect_system_metrics(self) -> Dict[str, Any]:
        """Collects host CPU, RAM and disk usage."""
        return {
            "cpu_percent": psutil.cpu_percent(interval=None),
            "memory_percent": psutil.virtual_memory().percent,
            "memory_used_mb": round(psutil.virtual_memory().used / (1024 * 1024), 1),
            "timestamp": datetime.utcnow().isoformat()
        }


agent_manager = AgentManager()
