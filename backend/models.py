from datetime import datetime
from typing import Optional
from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    DateTime,
    ForeignKey,
    Boolean,
    Float,
    Enum as SQLEnum,
    event,
    Engine,
)
from sqlalchemy.orm import declarative_base, relationship
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
import enum

Base = declarative_base()


class AgentStatus(str, enum.Enum):
    IDLE = "IDLE"
    RUNNING = "RUNNING"
    ERROR = "ERROR"
    BLOCKED = "BLOCKED"


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(128), nullable=False, unique=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    prompts = relationship("Prompt", back_populates="project", cascade="all, delete-orphan")
    revisions = relationship("CodeRevision", back_populates="project", cascade="all, delete-orphan")
    deployments = relationship("DeploymentLog", back_populates="project", cascade="all, delete-orphan")
    agents = relationship("AgentInstance", back_populates="project", cascade="all, delete-orphan")


class Prompt(Base):
    __tablename__ = "prompts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    user_intent = Column(Text, nullable=False)
    system_prompt = Column(Text, nullable=False)
    model_name = Column(String(64), default="gpt-4o", nullable=False)
    temperature = Column(Float, default=0.2, nullable=False)
    token_usage_prompt = Column(Integer, default=0)
    token_usage_completion = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    project = relationship("Project", back_populates="prompts")
    revisions = relationship("CodeRevision", back_populates="prompt")


class CodeRevision(Base):
    __tablename__ = "code_revisions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    prompt_id = Column(Integer, ForeignKey("prompts.id"), nullable=True)
    revision_number = Column(Integer, nullable=False)
    code_type = Column(String(32), default="python", nullable=False)  # "python" or "yaml"
    content = Column(Text, nullable=False)
    ast_valid = Column(Boolean, default=False, nullable=False)
    ast_findings = Column(Text, nullable=True)  # JSON formatted violations
    affected_entities = Column(Text, nullable=True)  # JSON list of HA entities
    system_notes = Column(Text, nullable=True)
    git_commit_sha = Column(String(64), nullable=True)
    git_branch = Column(String(128), default="main", nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    project = relationship("Project", back_populates="revisions")
    prompt = relationship("Prompt", back_populates="revisions")
    deployments = relationship("DeploymentLog", back_populates="revision")


class DeploymentLog(Base):
    __tablename__ = "deployment_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    revision_id = Column(Integer, ForeignKey("code_revisions.id"), nullable=True)
    target_host = Column(String(64), default="192.168.1.110", nullable=False)
    target_path = Column(String(256), default="/config/packages/", nullable=False)
    status = Column(String(32), nullable=False)  # SUCCESS, FAILED, TIMEOUT
    exit_code = Column(Integer, nullable=True)
    ha_core_check_passed = Column(Boolean, default=False, nullable=False)
    stdout = Column(Text, nullable=True)
    stderr = Column(Text, nullable=True)
    executed_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    project = relationship("Project", back_populates="deployments")
    revision = relationship("CodeRevision", back_populates="deployments")


class AgentInstance(Base):
    __tablename__ = "agents"

    id = Column(Integer, primary_key=True, autoincrement=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    name = Column(String(128), nullable=False)
    status = Column(SQLEnum(AgentStatus), default=AgentStatus.IDLE, nullable=False)
    interval_seconds = Column(Integer, default=60, nullable=False)
    last_run_at = Column(DateTime, nullable=True)
    cpu_percent = Column(Float, default=0.0)
    memory_mb = Column(Float, default=0.0)
    current_script_path = Column(String(256), nullable=True)
    log_buffer = Column(Text, default="", nullable=False)  # Truncated to 10k chars
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    project = relationship("Project", back_populates="agents")


class GitHubCredential(Base):
    __tablename__ = "github_credentials"

    id = Column(Integer, primary_key=True, autoincrement=True)
    repository = Column(String(256), nullable=False)
    default_branch = Column(String(128), default="main", nullable=False)
    encrypted_token = Column(Text, nullable=False)
    author_name = Column(String(128), default="HA-AgentForge Admin", nullable=False)
    author_email = Column(String(128), default="haosgaming60@gmail.com", nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


DATABASE_URL = "sqlite+aiosqlite:////data/ha_agentforge.db"
engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)


@event.listens_for(Engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA journal_mode=WAL;")
    cursor.execute("PRAGMA synchronous=NORMAL;")
    cursor.execute("PRAGMA foreign_keys=ON;")
    cursor.close()


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
