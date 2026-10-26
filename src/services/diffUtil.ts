export interface DiffLine {
  type: "added" | "removed" | "unchanged";
  oldLineNumber?: number;
  newLineNumber?: number;
  content: string;
}

export interface DiffSummary {
  additions: number;
  deletions: number;
  unchanged: number;
  lines: DiffLine[];
  unifiedPatch: string;
}

/**
 * Computes line-by-line diff using Longest Common Subsequence (LCS).
 */
export function computeLineDiff(oldText: string, newText: string): DiffSummary {
  const oldLines = oldText.split("\n");
  const newLines = newText.split("\n");

  const m = oldLines.length;
  const n = newLines.length;

  // DP table for LCS
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldLines[i - 1] === newLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to find diff
  let i = m;
  let j = n;
  const rawDiff: DiffLine[] = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      rawDiff.push({
        type: "unchanged",
        oldLineNumber: i,
        newLineNumber: j,
        content: oldLines[i - 1],
      });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      rawDiff.push({
        type: "added",
        newLineNumber: j,
        content: newLines[j - 1],
      });
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      rawDiff.push({
        type: "removed",
        oldLineNumber: i,
        content: oldLines[i - 1],
      });
      i--;
    }
  }

  rawDiff.reverse();

  let additions = 0;
  let deletions = 0;
  let unchanged = 0;

  const patchLines: string[] = [
    "--- a/revision_history",
    "+++ b/current_editor_code",
    `@@ -1,${m} +1,${n} @@`,
  ];

  for (const item of rawDiff) {
    if (item.type === "added") {
      additions++;
      patchLines.push(`+ ${item.content}`);
    } else if (item.type === "removed") {
      deletions++;
      patchLines.push(`- ${item.content}`);
    } else {
      unchanged++;
      patchLines.push(`  ${item.content}`);
    }
  }

  return {
    additions,
    deletions,
    unchanged,
    lines: rawDiff,
    unifiedPatch: patchLines.join("\n"),
  };
}
