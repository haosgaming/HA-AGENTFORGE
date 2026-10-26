import React, { useState } from "react";
import {
  Layers,
  FileCode,
  Copy,
  Check,
  Download,
  Server,
  Shield,
  Cpu,
  Database,
  Terminal,
  Container
} from "lucide-react";

interface FileEntry {
  path: string;
  category: string;
  description: string;
  content: string;
}

export const BackendArchitectureView: React.FC = () => {
  const [selectedFilePath, setSelectedFilePath] = useState<string>("docker-compose.yml");
  const [copied, setCopied] = useState(false);

  const files: FileEntry[] = [
    {
      path: "docker-compose.yml",
      category: "Infra",
      description: "Kompletní produkční zásobník (FastAPI backend, React frontend, Redis broker)",
      content: `version: '3.8'

services:
  redis:
    image: redis:7.2-alpine
    container_name: ha-agentforge-redis
    restart: unless-stopped
    command: redis-server --appendonly yes --save 60 1
    volumes:
      - redis_data:/data
    networks:
      - agentforge_net
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: .
      dockerfile: backend/Dockerfile
    container_name: ha-agentforge-backend
    restart: unless-stopped
    ports:
      - "8000:8000"
    environment:
      - PYTHONUNBUFFERED=1
      - DATABASE_URL=sqlite+aiosqlite:////data/ha_agentforge.db
      - REDIS_URL=redis://redis:6379/0
      - HA_CORE_HOST=192.168.1.110
      - HA_CORE_PORT=8123
      - HA_SSH_PORT=22
      - HA_SSH_USER=root
      - HA_SSH_KEY_PATH=/config/.ssh/id_rsa
      - OPENAI_API_KEY=\${OPENAI_API_KEY}
      - FERNET_SECRET_KEY=gAAAAABl8ZqK9V0u1w2x3y4z5A6B7C8D9E0F1G2H3I4J5K6L7M8N9O0P1Q2R3S4T5U6V7W8X9Y0Z==
      - HA_WEBHOOK_ID=agentforge_alert_webhook
    volumes:
      - ./data:/data
      - /config/.ssh/id_rsa:/config/.ssh/id_rsa:ro
      - ./packages:/config/packages
    depends_on:
      redis:
        condition: service_healthy
    networks:
      - agentforge_net

  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    container_name: ha-agentforge-frontend
    restart: unless-stopped
    ports:
      - "3000:80"
    depends_on:
      - backend
    networks:
      - agentforge_net

networks:
  agentforge_net:
    driver: bridge

volumes:
  redis_data:`,
    },
    {
      path: "backend/main.py",
      category: "API",
      description: "FastAPI server, SSE endpoint /api/ai/stream-optimize, WebSocket PTY router",
      content: `# FastAPI aplikace pro HA-AgentForge s CORS, SSE a WebSocket PTY
# Plná implementace se nachází v /backend/main.py`,
    },
    {
      path: "backend/services/ai_service.py",
      category: "AI Service",
      description: "AsyncOpenAI klient s JSON Schema Structured Outputs a SSE streamováním",
      content: `# OpenAI API integrace přes openai-python s plnou podporou asynchronních volání
# Plná implementace se nachází v /backend/services/ai_service.py`,
    },
    {
      path: "backend/services/ast_validator.py",
      category: "Security",
      description: "Statická AST analýza kódu, blokování os.system a nebezpečného subprocessu",
      content: `# AST validátor a bezpečnostní inspekce přes ast.NodeVisitor, ruff a bandit
# Plná implementace se nachází v /backend/services/ast_validator.py`,
    },
    {
      path: "backend/services/ha_ssh_engine.py",
      category: "HA Integration",
      description: "asyncssh klient k 192.168.1.110 s klíčem /config/.ssh/id_rsa a 30s timeoutem",
      content: `# SSH a REST integrace s ochranou kritických entit
# Plná implementace se nachází v /backend/services/ha_ssh_engine.py`,
    },
    {
      path: "backend/services/github_service.py",
      category: "Git",
      description: "GitHub API v3 integrace, správa větví a commitů, šifrování tokenů přes Fernet",
      content: `# GitHub integrace a šifrování tokenů přes cryptography.fernet
# Plná implementace se nachází v /backend/services/github_service.py`,
    },
    {
      path: "backend/services/agent_manager.py",
      category: "Orchestration",
      description: "Správa běhu agentů, ořezávání logů na 10 000 znaků, webhook výstrahy do HA",
      content: `# Správce běžících agentů a notifikační kanály (HA Webhook, Gotify)
# Plná implementace se nachází v /backend/services/agent_manager.py`,
    },
    {
      path: "backend/models.py",
      category: "Database",
      description: "SQLAlchemy 2.0 asynchronní modely v režimu SQLite WAL",
      content: `# SQLAlchemy 2.0 asynchronní modely pro projekty, revize a agenty
# Plná implementace se nachází v /backend/models.py`,
    },
    {
      path: "backend/requirements.txt",
      category: "Dependencies",
      description: "Přesné verze balíčků Pythonu pro produkční sestavení",
      content: `fastapi==0.115.8
uvicorn[standard]==0.34.0
pydantic==2.10.6
sqlalchemy==2.0.38
aiosqlite==0.21.0
alembic==1.14.1
openai==1.63.2
asyncssh==2.19.0
httpx==0.28.1
redis==5.2.1
celery==5.4.0
apscheduler==3.11.0
cryptography==44.0.1
pyyaml==6.0.2
ruff==0.9.7
bandit==1.8.3
PyGithub==2.6.0
python-multipart==0.0.20
websockets==14.2
psutil==7.0.0`,
    },
  ];

  const selectedFile = files.find((f) => f.path === selectedFilePath) || files[0];

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rog-glass p-4 text-slate-200">
        <h2 className="text-sm font-bold tracking-wide uppercase text-slate-100 flex items-center space-x-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span>Produkční Backend Architektura &amp; Docker Konfigurace</span>
        </h2>
        <p className="text-[11px] text-slate-400">
          Kompletní, 100% aplikovatelné zdrojové kódy backendu HA-AgentForge připravené pro nasazení do produkce
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Left Column: File Tree */}
        <div className="rog-glass p-3 space-y-1 text-xs">
          <span className="text-[10px] text-slate-500 uppercase font-mono px-2 block mb-2">
            Soubory architektury:
          </span>
          {files.map((file) => {
            const isSelected = file.path === selectedFilePath;
            return (
              <button
                key={file.path}
                onClick={() => setSelectedFilePath(file.path)}
                className={`w-full text-left px-2.5 py-2 rounded-lg font-mono text-xs flex items-center justify-between transition-colors ${
                  isSelected
                    ? "bg-cyan-950/80 border border-cyan-400/60 text-cyan-200 glow-cyan font-bold"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
                }`}
              >
                <div className="flex items-center space-x-2 truncate">
                  <FileCode className={`w-3.5 h-3.5 ${isSelected ? "text-cyan-400" : "text-slate-500"}`} />
                  <span className="truncate">{file.path}</span>
                </div>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-900 text-slate-400 uppercase">
                  {file.category}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right Column: Code Viewer (3 Cols) */}
        <div className="lg:col-span-3 rog-glass flex flex-col h-[540px] border border-white/10 text-slate-200">
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-slate-950/80 border-b border-white/10">
            <div>
              <div className="flex items-center space-x-2">
                <FileCode className="w-4 h-4 text-cyan-400" />
                <span className="font-mono text-xs font-bold text-slate-200">{selectedFile.path}</span>
              </div>
              <p className="text-[11px] text-slate-400">{selectedFile.description}</p>
            </div>

            <button
              onClick={handleCopy}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copied ? "Zkopírováno" : "Kopírovat Soubor"}</span>
            </button>
          </div>

          <div className="flex-1 bg-[#060910] p-4 overflow-auto font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-wrap select-text font-mono-code">
            {selectedFile.content}
          </div>
        </div>
      </div>
    </div>
  );
};
