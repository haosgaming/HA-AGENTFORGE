import asyncio
import json
import logging
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from backend.models import (
    init_db,
    AsyncSessionLocal,
    Project,
    Prompt,
    CodeRevision,
    DeploymentLog,
    AgentInstance,
    AgentStatus,
)
from backend.services.ast_validator import validate_python_code, validate_yaml_automation
from backend.services.ai_service import AIService
from backend.services.ha_ssh_engine import HaSshEngine, CRITICAL_ENTITIES
from backend.services.github_service import GitHubService
from backend.services.agent_manager import agent_manager

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("ha_agentforge.main")

app = FastAPI(
    title="HA-AgentForge API",
    description="Orchestrátor, IDE a exekuční prostředí pro Home Assistant Core (HAOS 18.3 / Core 2026.10.2)",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ai_service = AIService()
ssh_engine = HaSshEngine(host="192.168.1.110", port=22, username="root")
github_service = GitHubService()


@app.on_event("startup")
async def on_startup():
    await init_db()
    logger.info("Databáze SQLite inicializována v režimu WAL.")


# Schemas
class PromptStreamRequest(BaseModel):
    prompt: str = Field(..., description="Zadání automatizace v přirozeném jazyce")
    context_type: str = Field(default="python", description="'python' nebo 'yaml'")
    model: str = Field(default="gpt-4o")
    temperature: float = Field(default=0.2)


class ValidateCodeRequest(BaseModel):
    code: str
    code_type: str = "python"


class DeployRequest(BaseModel):
    project_id: int = 1
    code_type: str
    content: str
    filename: str = "agentforge_package.yaml"
    user_confirmed_critical: bool = False


class ServiceCallRequest(BaseModel):
    domain: str
    service: str
    service_data: Dict[str, Any]
    user_confirmed: bool = False


class GitCommitRequest(BaseModel):
    token: str
    owner: str
    repo: str
    branch: str = "main"
    file_path: str = "packages/agentforge_automation.yaml"
    file_content: str
    commit_message: str


# 1. SSE Endpoint for Real-time Streaming into Editor
@app.post("/api/ai/stream-optimize")
async def stream_optimize(request: PromptStreamRequest):
    """
    Server-Sent Events endpoint streaming GPT-4o generation chunks
    directly into Monaco Editor.
    """
    stream_generator = ai_service.stream_optimize_prompt(
        prompt=request.prompt,
        context_type=request.context_type,
        model=request.model,
        temperature=request.temperature
    )
    return StreamingResponse(
        stream_generator,
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )


# 2. Multi-tier AST and Security Validation
@app.post("/api/validate")
async def validate_code(req: ValidateCodeRequest):
    if req.code_type == "python":
        res = validate_python_code(req.code)
    else:
        res = validate_yaml_automation(req.code)
    return res


# 3. Deployment Engine to HA Core
@app.post("/api/deploy")
async def deploy_to_ha(req: DeployRequest):
    # Validate code first
    if req.code_type == "python":
        v_res = validate_python_code(req.content)
    else:
        v_res = validate_yaml_automation(req.content)

    if not v_res["valid"]:
        raise HTTPException(
            status_code=400,
            detail={"message": "Kód neprošel bezpečnostní kontrolou AST!", "findings": v_res["findings"]}
        )

    # Check critical entities
    for crit in CRITICAL_ENTITIES:
        if crit in req.content and not req.user_confirmed_critical:
            return {
                "success": False,
                "blocked": True,
                "requires_confirmation": True,
                "critical_entity": crit,
                "message": f"Detekován zásah do kritické entity '{crit}'. Vyžadováno explicitní potvrzení!"
            }

    # Deploy via SSH engine
    deploy_res = await ssh_engine.deploy_package_file(req.filename, req.content)
    return deploy_res


# 4. Home Assistant Service Calling
@app.post("/api/ha/service")
async def call_ha_service(req: ServiceCallRequest):
    return await ssh_engine.call_ha_service(
        domain=req.domain,
        service=req.service,
        service_data=req.service_data,
        user_confirmed=req.user_confirmed
    )


# 5. GitHub Branch & Commit
@app.post("/api/git/commit")
async def commit_to_github(req: GitCommitRequest):
    res = await github_service.commit_and_push_file(
        token=req.token,
        owner=req.owner,
        repo=req.repo,
        branch=req.branch,
        file_path=req.file_path,
        file_content=req.file_content,
        commit_message=req.commit_message
    )
    return res


# 6. WebSocket PTY / Shell Terminal to HA Core
@app.websocket("/ws/terminal/{agent_id}")
async def websocket_terminal(websocket: WebSocket, agent_id: str):
    await websocket.accept()
    agent_manager.register_ws_client(websocket)
    await websocket.send_text(
        f"\x1b[1;36m[HA-AgentForge PTY]\x1b[0m Spojení navázáno k Home Assistant OS (192.168.1.110).\r\n"
        f"Zadejte příkaz (např. 'ha core check', 'top', 'uptime', 'fve-status')...\r\n"
        f"\x1b[1;32mroot@homeassistant:~#\x1b[0m "
    )

    try:
        while True:
            data = await websocket.receive_text()
            cmd = data.strip()
            if not cmd:
                await websocket.send_text("\r\n\x1b[1;32mroot@homeassistant:~#\x1b[0m ")
                continue

            # Execute command with 30s timeout
            result = await ssh_engine.run_ssh_command(cmd, timeout=30.0)
            output = result.get("stdout") or result.get("stderr") or ""
            formatted = output.replace("\n", "\r\n")

            await websocket.send_text(f"\r\n{formatted}\r\n\x1b[1;32mroot@homeassistant:~#\x1b[0m ")

    except WebSocketDisconnect:
        agent_manager.unregister_ws_client(websocket)
        logger.info(f"WebSocket terminál agenta {agent_id} byl odpojen.")


# 7. System Health & Inventory Metrics
@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "ha_host": "192.168.1.110",
        "proxmox_host": "192.168.1.108",
        "subghz_gateway": "192.168.1.109",
        "router": "192.168.1.1",
        "adguard_dns": "192.168.1.50",
        "system_metrics": agent_manager.collect_system_metrics()
    }
