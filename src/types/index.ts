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
