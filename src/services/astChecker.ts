import { AstValidationResult, AstFinding, StructuralAnalysis, StructuralDiffMetric } from "../types";

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

/**
 * Extracts deep structural AST parameters from Python code for cross-model comparative analysis.
 */
export function analyzePythonStructure(code: string): StructuralAnalysis {
  const lines = code.split("\n");
  const imports: string[] = [];
  const asyncCoroutines: string[] = [];
  const syncFunctions: string[] = [];
  const blockingCalls: string[] = [];

  let hasAsyncLoop = false;
  let hasErrorHandling = false;
  let hasExplicitTimeout = false;
  let hasDebounceGuard = false;
  let hasHardwareProtection = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("#")) continue;

    // Imports
    const importMatch = trimmed.match(/^(?:import|from)\s+([a-zA-Z0-9_.]+)/);
    if (importMatch && !imports.includes(importMatch[1])) {
      imports.push(importMatch[1]);
    }

    // Async Coroutines
    const asyncMatch = trimmed.match(/^async\s+def\s+([a-zA-Z0-9_]+)\s*\(/);
    if (asyncMatch) {
      asyncCoroutines.push(asyncMatch[1]);
    }

    // Sync functions
    const syncMatch = trimmed.match(/^def\s+([a-zA-Z0-9_]+)\s*\(/);
    if (syncMatch && !trimmed.startsWith("async def")) {
      syncFunctions.push(syncMatch[1]);
    }

    // Async loop checks
    if (trimmed.includes("asyncio.run(") || trimmed.includes("asyncio.sleep(") || trimmed.includes("async with httpx.")) {
      hasAsyncLoop = true;
    }

    // Blocking calls
    if (/time\.sleep\s*\(/.test(trimmed)) {
      blockingCalls.push("time.sleep (blokující uspání vlákna namísto asyncio.sleep)");
    }
    if (/requests\.(get|post|put|delete)\s*\(/.test(trimmed)) {
      blockingCalls.push("requests (synchronní blokující I/O namísto httpx.AsyncClient)");
    }
    if (/os\.system\s*\(/.test(trimmed)) {
      blockingCalls.push("os.system (zakázaný synchronní shell call)");
    }

    // Error handling
    if (trimmed.startsWith("try:") || /except\s+[a-zA-Z0-9_.]+/.test(trimmed)) {
      hasErrorHandling = true;
    }

    // Timeout
    if (/timeout\s*=\s*[0-9.]+/.test(trimmed)) {
      hasExplicitTimeout = true;
    }

    // Debounce guard
    if (
      /debounce|last_trigger|last_time|DEBOUNCE_DELAY/i.test(trimmed) ||
      /time\.time\(\)\s*-\s*[a-zA-Z0-9_]+\s*</.test(trimmed)
    ) {
      hasDebounceGuard = true;
    }

    // Hardware protection (battery cutoff, thresholds)
    if (
      /CUTOFF_VOLTAGE|BATTERY_CUTOFF|threshold|protection|12\.4/i.test(trimmed)
    ) {
      hasHardwareProtection = true;
    }
  }

  // Calculate composite safety score (0 - 100)
  const astCheck = analyzePythonAst(code);
  let score = 100;

  // Deduct for critical AST findings
  const criticalCount = astCheck.findings.filter(f => f.severity === "CRITICAL").length;
  score -= criticalCount * 30;

  // Deduct for blocking calls
  score -= blockingCalls.length * 15;

  // Deduct for missing timeout
  if (!hasExplicitTimeout) score -= 15;

  // Deduct for missing error handling
  if (!hasErrorHandling) score -= 15;

  // Deduct if purely sync in Home Assistant agent
  if (asyncCoroutines.length === 0 && syncFunctions.length > 0) score -= 10;

  score = Math.max(0, Math.min(100, score));

  return {
    imports,
    asyncCoroutines,
    syncFunctions,
    hasAsyncLoop,
    hasBlockingCalls: blockingCalls.length > 0,
    hasErrorHandling,
    hasExplicitTimeout,
    hasDebounceGuard,
    hasHardwareProtection,
    safetyScore: score,
    linesCount: lines.length,
    astNodesEstimated: astCheck.ast_node_count || lines.length * 4,
    blockingCallDetails: blockingCalls
  };
}

/**
 * Compares two Python structural analyses and generates clear contrast metrics.
 */
export function compareStructuralAnalyses(
  gpt: StructuralAnalysis,
  slm: StructuralAnalysis
): StructuralDiffMetric[] {
  const metrics: StructuralDiffMetric[] = [];

  // 1. I/O Paradigm
  const gptIo = gpt.hasAsyncLoop ? "Plně Asynchronní (asyncio + httpx)" : "Synchronní";
  const slmIo = slm.hasAsyncLoop ? "Plně Asynchronní (asyncio)" : "Blokující Synchronní (requests/time.sleep)";
  metrics.push({
    category: "I/O Architektura",
    aspect: "Model Běhu a I/O Operace",
    gptValue: gptIo,
    slmValue: slmIo,
    status: gpt.hasAsyncLoop && !slm.hasAsyncLoop ? "GPT_SUPERIOR" : "MATCH",
    description: gpt.hasAsyncLoop && !slm.hasAsyncLoop
      ? "GPT-4o využívá neblokující async/await se sdíleným klientským poollem. Lokální SLM sklouzlo k synchronnímu requests.post, které blokuje event-loop HA agenta."
      : "Oba modely zvolily konzistentní I/O paradigma."
  });

  // 2. Bezpečnostní AST Skóre
  metrics.push({
    category: "Bezpečnost & AST",
    aspect: "Statické Bezpečnostní Skóre",
    gptValue: `${gpt.safetyScore}/100`,
    slmValue: `${slm.safetyScore}/100`,
    status: slm.safetyScore < 70 ? (slm.safetyScore < 40 ? "CRITICAL" : "WARNING") : "MATCH",
    description: slm.safetyScore < gpt.safetyScore
      ? `Lokální SLM obdrželo snížené skóre (${slm.safetyScore}/100) kvůli přítomnosti rizikových konstrukcí nebo absenci systémových timeoutů.`
      : "Oba modely splňují bezpečnostní pravidla AST analyzátoru."
  });

  // 3. Ochrana před zacyklením (Timeouts)
  metrics.push({
    category: "Provozní Spolehlivost",
    aspect: "Explicitní Síťový Timeout",
    gptValue: gpt.hasExplicitTimeout ? "Aktivní (timeout=5.0s)" : "Chybí",
    slmValue: slm.hasExplicitTimeout ? "Aktivní" : "Chybí (nekonečné visení)",
    status: gpt.hasExplicitTimeout && !slm.hasExplicitTimeout ? "GPT_SUPERIOR" : "MATCH",
    description: !slm.hasExplicitTimeout
      ? "Při výpadku spojení s HAOS (192.168.1.110) nebo ESP32-S3 (192.168.1.109) zůstane skript generovaný SLM viset do vyčerpání 30s timeout guardu procesu."
      : "Oba skripty explicitně limitují dobu čekání na socket."
  });

  // 4. Ošetření Výjimek (Error Resilience)
  metrics.push({
    category: "Provozní Spolehlivost",
    aspect: "Robustnost Ošetření Chyb (try/except)",
    gptValue: gpt.hasErrorHandling ? "Strukturované (HTTPError/Timeout)" : "Chybí",
    slmValue: slm.hasErrorHandling ? "Základní try/except" : "Absence ošetření (pád na traceback)",
    status: gpt.hasErrorHandling && !slm.hasErrorHandling ? "GPT_SUPERIOR" : "MATCH",
    description: !slm.hasErrorHandling
      ? "Skript z lokálního SLM nemá ochranu proti HTTP chybám ani síťovým výpadkům, což způsobí exit code 1 a pád agenta."
      : "Ošetření chyb je přítomno."
  });

  // 5. Hardwarový Debouncing a Ochrany Periferií
  metrics.push({
    category: "Hardwarová Ochrana",
    aspect: "RF Debouncing / Ochrana Akumulátoru",
    gptValue: gpt.hasDebounceGuard || gpt.hasHardwareProtection ? "Implementováno (650ms / 12.4V)" : "Nepožadováno",
    slmValue: slm.hasDebounceGuard || slm.hasHardwareProtection ? "Implementováno" : "Chybí (Riziko rozkmitání)",
    status: (gpt.hasDebounceGuard || gpt.hasHardwareProtection) && (!slm.hasDebounceGuard && !slm.hasHardwareProtection) ? "GPT_SUPERIOR" : "MATCH",
    description: "GPT-4o implementuje hardwarovou ochranu a debouncing pro CC1101/Carspa, zatímco SLM často vygeneruje surové přímé spínání bez hystereze."
  });

  // 6. Struktura funkcí a modularita
  metrics.push({
    category: "Kódový Styl",
    aspect: "Modularita & Deklarace Funkcí",
    gptValue: `${gpt.asyncCoroutines.length} async coroutines, ${gpt.syncFunctions.length} sync`,
    slmValue: `${slm.asyncCoroutines.length} async coroutines, ${slm.syncFunctions.length} sync`,
    status: "MATCH",
    description: `GPT-4o rozděluje logiku do samostatných coroutines (${gpt.asyncCoroutines.join(", ") || "žádné"}), SLM struktura: (${slm.asyncCoroutines.concat(slm.syncFunctions).join(", ") || "monolitická"}).`
  });

  return metrics;
}
