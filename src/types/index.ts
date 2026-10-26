export type AgentStatusType = "IDLE" | "RUNNING" | "ERROR" | "BLOCKED";

export interface AgentInstance {
  id: number;
  name: string;
  status: AgentStatusType;
  interval_seconds: number;
  last_run_at: string;
  cpu_percent: number;
  memory_mb: number;
  current_script_path: string;
  log_buffer: string;
}

export interface AstFinding {
  severity: "CRITICAL" | "WARNING" | "INFO";
  line: number;
  col: number;
  code: string;
  message: string;
}

export interface AstValidationResult {
  valid: boolean;
  error_type: string | null;
  findings: AstFinding[];
  ast_node_count?: number;
}

export interface CodeRevision {
  id: number;
  revision_number: number;
  code_type: "python" | "yaml";
  content: string;
  ast_valid: boolean;
  ast_findings: AstFinding[];
  affected_entities: string[];
  system_notes: string;
  git_commit_sha?: string;
  git_branch: string;
  created_at: string;
}

export interface DeploymentRecord {
  id: number;
  target_host: string;
  target_path: string;
  status: "SUCCESS" | "FAILED" | "TIMEOUT";
  exit_code: number;
  ha_core_check_passed: boolean;
  stdout: string;
  stderr: string;
  executed_at: string;
}

export interface HaEntity {
  entity_id: string;
  friendly_name: string;
  domain: string;
  state: string;
  unit_of_measurement?: string;
  attributes: Record<string, any>;
  last_updated: string;
  is_critical?: boolean;
}

export interface NetworkNode {
  name: string;
  ip: string;
  role: string;
  metric?: number;
  mac?: string;
  status: "ONLINE" | "STANDBY" | "WARNING";
}

export interface CronTask {
  id: string;
  name: string;
  entity_id: string;
  action: "toggle" | "turn_on" | "turn_off";
  cron_expression: string;
  human_readable: string;
  is_active: boolean;
  last_run: string | null;
  next_run: string;
  execution_count: number;
  last_status: "SUCCESS" | "FAILED" | "PENDING";
  created_at: string;
}

// Konfigurace LLM Poskytovatele (Lokální Ollama / vLLM vs Cloud OpenAI)
export type LlmProviderType = "local_ollama" | "local_v1" | "openai";

export interface LlmProviderConfig {
  providerType: LlmProviderType;
  baseUrl: string;
  apiKey: string;
  modelName: string;
  contextWindow: number;
  temperature: number;
  isConnected: boolean;
  detectedModels: string[];
  latencyMs: number | null;
  lastTestedAt: string | null;
}

// SLM vs GPT-4o Model Playground Types
export interface StructuralAnalysis {
  imports: string[];
  asyncCoroutines: string[];
  syncFunctions: string[];
  hasAsyncLoop: boolean;
  hasBlockingCalls: boolean;
  hasErrorHandling: boolean;
  hasExplicitTimeout: boolean;
  hasDebounceGuard: boolean;
  hasHardwareProtection: boolean;
  safetyScore: number;
  linesCount: number;
  astNodesEstimated: number;
  blockingCallDetails?: string[];
}

export interface ModelComparisonResult {
  modelId: string;
  modelName: string;
  provider: "OpenAI Cloud" | "Local SLM (Dell R510 Proxmox)";
  quantization?: string;
  hardwareHost: string;
  latencyMs: number;
  tokensPerSec: number;
  tokenCount: number;
  code: string;
  analysis: StructuralAnalysis;
  astResult: AstValidationResult;
  notes: string;
}

export interface StructuralDiffMetric {
  category: string;
  aspect: string;
  gptValue: string;
  slmValue: string;
  status: "MATCH" | "GPT_SUPERIOR" | "SLM_SUPERIOR" | "WARNING" | "CRITICAL";
  description: string;
}
