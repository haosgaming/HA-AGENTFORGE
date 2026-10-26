import ast
import json
import logging
import subprocess
import tempfile
import os
from typing import List, Dict, Any, Tuple
import yaml

try:
    from yaml import CSafeLoader as SafeLoader
except ImportError:
    from yaml import SafeLoader

logger = logging.getLogger("ha_agentforge.ast_validator")

# Critical blocked calls and modules in HA user scripts
BLOCKED_CALLS = {
    ("os", "system"),
    ("os", "popen"),
    ("os", "spawnlp"),
    ("os", "spawnlpe"),
    ("os", "execv"),
    ("os", "execve"),
    ("pty", "spawn"),
}

RESTRICTED_SUBPROCESS = {
    "Popen",
    "call",
    "check_call",
    "check_output",
    "run",
}

BLOCKED_BUILTINS = {"eval", "exec", "__import__", "compile"}


class SecurityASTVisitor(ast.NodeVisitor):
    def __init__(self):
        self.violations: List[Dict[str, Any]] = []
        self.imported_modules: Dict[str, str] = {}  # alias -> original

    def visit_Import(self, node: ast.Import):
        for alias in node.names:
            name = alias.name
            asname = alias.asname or name
            self.imported_modules[asname] = name
        self.generic_visit(node)

    def visit_ImportFrom(self, node: ast.ImportFrom):
        mod = node.module or ""
        for alias in node.names:
            full_name = f"{mod}.{alias.name}" if mod else alias.name
            asname = alias.asname or alias.name
            self.imported_modules[asname] = full_name
            if full_name in ["os.system", "pty.spawn"]:
                self.violations.append({
                    "severity": "CRITICAL",
                    "line": node.lineno,
                    "col": node.col_offset,
                    "code": "SEC001",
                    "message": f"Striktně zakázaný přímý import nebezpečného symbolu '{full_name}'."
                })
        self.generic_visit(node)

    def visit_Call(self, node: ast.Call):
        # Check direct functions like eval(), exec()
        if isinstance(node.func, ast.Name):
            func_name = node.func.id
            if func_name in BLOCKED_BUILTINS:
                self.violations.append({
                    "severity": "CRITICAL",
                    "line": node.lineno,
                    "col": node.col_offset,
                    "code": "SEC002",
                    "message": f"Použití zakázaného vestavěného interpretu '{func_name}()'."
                })

        # Check attribute calls e.g. os.system() or subprocess.run(..., shell=True)
        elif isinstance(node.func, ast.Attribute):
            attr_name = node.func.attr
            if isinstance(node.func.value, ast.Name):
                module_alias = node.func.value.id
                actual_mod = self.imported_modules.get(module_alias, module_alias)

                if (actual_mod, attr_name) in BLOCKED_CALLS:
                    self.violations.append({
                        "severity": "CRITICAL",
                        "line": node.lineno,
                        "col": node.col_offset,
                        "code": "SEC003",
                        "message": f"Detekováno zakázané volání '{actual_mod}.{attr_name}()'."
                    })

                if actual_mod == "subprocess" and attr_name in RESTRICTED_SUBPROCESS:
                    # Check if shell=True is passed
                    for kw in node.keywords:
                        if kw.arg == "shell" and isinstance(kw.value, ast.Constant) and kw.value.value is True:
                            self.violations.append({
                                "severity": "CRITICAL",
                                "line": node.lineno,
                                "col": node.col_offset,
                                "code": "SEC004",
                                "message": f"Nebezpečné volání subprocess.{attr_name} s parametrem 'shell=True'."
                            })

        self.generic_visit(node)


def validate_python_code(code: str) -> Dict[str, Any]:
    """
    Validates Python script via AST analysis, syntax checking,
    and security policy enforcement.
    """
    try:
        tree = ast.parse(code, filename="<agent_script>")
    except SyntaxError as se:
        return {
            "valid": False,
            "error_type": "SyntaxError",
            "findings": [{
                "severity": "CRITICAL",
                "line": se.lineno or 1,
                "col": se.offset or 1,
                "code": "SYNTAX_ERR",
                "message": f"Chyba syntaxe Pythonu: {se.msg}"
            }]
        }

    visitor = SecurityASTVisitor()
    visitor.visit(tree)

    # Optional local linter passes (Ruff and Bandit)
    external_findings = run_linters_on_code(code)
    all_findings = visitor.violations + external_findings

    has_critical = any(f["severity"] == "CRITICAL" for f in all_findings)

    return {
        "valid": not has_critical,
        "error_type": None if not has_critical else "SecurityViolation",
        "findings": all_findings,
        "ast_node_count": len(list(ast.walk(tree)))
    }


def run_linters_on_code(code: str) -> List[Dict[str, Any]]:
    """Runs ruff and bandit on temporary file if tools are present."""
    findings: List[Dict[str, Any]] = []

    with tempfile.NamedTemporaryFile("w", suffix=".py", delete=False) as tf:
        tf.write(code)
        temp_path = tf.name

    try:
        # Run ruff check
        try:
            ruff_proc = subprocess.run(
                ["ruff", "check", "--output-format=json", temp_path],
                capture_output=True,
                text=True,
                timeout=5
            )
            if ruff_proc.stdout.strip():
                ruff_data = json.loads(ruff_proc.stdout)
                for item in ruff_data:
                    findings.append({
                        "severity": "WARNING" if item.get("fix") else "INFO",
                        "line": item.get("location", {}).get("row", 1),
                        "col": item.get("location", {}).get("column", 1),
                        "code": item.get("code", "RUFF"),
                        "message": f"[Ruff] {item.get('message', '')}"
                    })
        except (FileNotFoundError, subprocess.TimeoutExpired, json.JSONDecodeError):
            pass

        # Run bandit security check
        try:
            bandit_proc = subprocess.run(
                ["bandit", "-f", "json", "-q", temp_path],
                capture_output=True,
                text=True,
                timeout=5
            )
            if bandit_proc.stdout.strip():
                bandit_data = json.loads(bandit_proc.stdout)
                for res in bandit_data.get("results", []):
                    findings.append({
                        "severity": "CRITICAL" if res.get("issue_severity") == "HIGH" else "WARNING",
                        "line": res.get("line_number", 1),
                        "col": 1,
                        "code": res.get("test_id", "BANDIT"),
                        "message": f"[Bandit] {res.get('issue_text', '')}"
                    })
        except (FileNotFoundError, subprocess.TimeoutExpired, json.JSONDecodeError):
            pass

    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

    return findings


def validate_yaml_automation(yaml_content: str) -> Dict[str, Any]:
    """
    Parses and validates Home Assistant YAML configuration / package
    using SafeLoader with scheme validation.
    """
    try:
        parsed = yaml.load(yaml_content, Loader=SafeLoader)
    except yaml.YAMLError as ye:
        line = getattr(ye, "problem_mark", None)
        return {
            "valid": False,
            "error_type": "YAMLError",
            "findings": [{
                "severity": "CRITICAL",
                "line": line.line + 1 if line else 1,
                "col": line.column + 1 if line else 1,
                "code": "YAML_PARSE_ERR",
                "message": f"Chyba syntaxe YAML: {str(ye)}"
            }]
        }

    findings = []
    if not isinstance(parsed, dict):
        findings.append({
            "severity": "CRITICAL",
            "line": 1,
            "col": 1,
            "code": "YAML_SCHEMA_ERR",
            "message": "Kořenový prvek balíčku Home Assistant musí být mapování (klíč: hodnota)."
        })
        return {"valid": False, "findings": findings}

    # Verify standard HA automation / package keys
    recognized_keys = {
        "automation", "script", "sensor", "binary_sensor", "switch",
        "homeassistant", "input_boolean", "input_number", "input_select",
        "template", "rest_command", "shell_command"
    }

    found_keys = set(parsed.keys())
    unknown_keys = found_keys - recognized_keys
    if unknown_keys:
        findings.append({
            "severity": "INFO",
            "line": 1,
            "col": 1,
            "code": "YAML_UNKNOWN_KEY",
            "message": f"Nekonvenční kořenové klíče v balíčku: {', '.join(unknown_keys)}"
        })

    return {
        "valid": True,
        "findings": findings,
        "parsed_keys": list(found_keys)
    }
