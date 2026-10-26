import { AstValidationResult, AstFinding } from "../types";

export function analyzePythonAst(code: string): AstValidationResult {
  const lines = code.split("\n");
  const findings: AstFinding[] = [];

  // 1. Scan for forbidden imports and calls
  lines.forEach((lineText: string, index: number) => {
    const lineNum = index + 1;
    const trimmed = lineText.trim();

    // Skip comments
    if (trimmed.startsWith("#")) return;

    // Direct os.system check
    if (/os\.system\s*\(/.test(lineText)) {
      findings.push({
        severity: "CRITICAL",
        line: lineNum,
        col: lineText.indexOf("os.system") + 1,
        code: "SEC003_OS_SYSTEM",
        message: "Striktně zakázané volání 'os.system()'. Ohrožení integrity HAOS jádra."
      });
    }

    // Subprocess with shell=True
    if (/subprocess\.(Popen|run|call|check_call|check_output)\s*\(.*shell\s*=\s*True/.test(lineText)) {
      findings.push({
        severity: "CRITICAL",
        line: lineNum,
        col: lineText.indexOf("shell=True") + 1,
        code: "SEC004_SHELL_TRUE",
        message: "Kritická zranitelnost: 'subprocess' s parametrem shell=True umožňuje injection útoky."
      });
    }

    // Unrestricted subprocess.Popen
    if (/subprocess\.Popen\s*\(/.test(lineText) && !/executable\s*=/.test(lineText)) {
      findings.push({
        severity: "WARNING",
        line: lineNum,
        col: lineText.indexOf("subprocess.Popen") + 1,
        code: "SEC005_POPEN_UNRESTRICTED",
        message: "Nekontrolovaný 'subprocess.Popen' bez explicitního omezení procesního kontextu."
      });
    }

    // eval / exec
    if (/\b(eval|exec|__import__)\s*\(/.test(lineText)) {
      findings.push({
        severity: "CRITICAL",
        line: lineNum,
        col: lineText.search(/\b(eval|exec|__import__)\s*\(/) + 1,
        code: "SEC002_BUILTIN_EXEC",
        message: "Použití dynamického interpretu (eval/exec) je v autonomních agentech zakázáno."
      });
    }

    // Hardcoded plain passwords
    if (/(password|secret|passwd)\s*=\s*["'][^"']+["']/i.test(lineText) && !lineText.includes("SUPERVISOR_BEARER_TOKEN")) {
      findings.push({
        severity: "WARNING",
        line: lineNum,
        col: 1,
        code: "SEC006_PLAINTEXT_SECRET",
        message: "Detekováno potenciální heslo v plaintextu. Využijte šifrování Fernet nebo HA Secrets."
      });
    }

    // Direct raw socket creation
    if (/socket\.socket\s*\(/.test(lineText)) {
      findings.push({
        severity: "WARNING",
        line: lineNum,
        col: lineText.indexOf("socket.socket") + 1,
        code: "SEC007_RAW_SOCKET",
        message: "Přímé vytváření surových soketů. Doporučeno použít oficiální Home Assistant REST/WS API."
      });
    }

    // Timeout check on httpx / requests
    if (/(httpx|requests)\.(get|post|put|delete)\s*\(/.test(lineText) && !lineText.includes("timeout=")) {
      findings.push({
        severity: "WARNING",
        line: lineNum,
        col: 1,
        code: "NET001_NO_TIMEOUT",
        message: "HTTP volání bez explicitního parametru 'timeout'. Riziko zablokování agenta."
      });
    }
  });

  const hasCritical = findings.some(f => f.severity === "CRITICAL");
  const estimatedNodeCount = code.split(/\s+/).filter(Boolean).length * 2;

  return {
    valid: !hasCritical,
    error_type: hasCritical ? "SecurityASTViolation" : null,
    findings,
    ast_node_count: estimatedNodeCount
  };
}

export function analyzeYamlPackage(yamlText: string): AstValidationResult {
  const lines = yamlText.split("\n");
  const findings: AstFinding[] = [];

  // Check colon spacing rule: "text: value" vs invalid YAML
  lines.forEach((lineText, idx) => {
    const lineNum = idx + 1;
    // Check tabs
    if (lineText.includes("\t")) {
      findings.push({
        severity: "CRITICAL",
        line: lineNum,
        col: lineText.indexOf("\t") + 1,
        code: "YAML001_TAB_INDENT",
        message: "Tabulátory nejsou v YAML povoleny. Použijte 2 mezery."
      });
    }

    // Check string colon rule
    if (lineText.includes(": ") && !lineText.trim().startsWith("#")) {
      const parts = lineText.split(": ");
      const val = parts.slice(1).join(": ").trim();
      if (val.includes(": ") && !val.startsWith('"') && !val.startsWith("'") && !val.startsWith("|") && !val.startsWith(">")) {
        findings.push({
          severity: "WARNING",
          line: lineNum,
          col: 1,
          code: "YAML002_COLON_STRING",
          message: "Hodnota obsahující dvojtečku s mezerou ': ' by měla být striktně v uvozovkách."
        });
      }
    }
  });

  const hasCritical = findings.some(f => f.severity === "CRITICAL");

  return {
    valid: !hasCritical,
    error_type: hasCritical ? "YamlSchemaViolation" : null,
    findings,
    ast_node_count: lines.length
  };
}
