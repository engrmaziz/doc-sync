/**
 * Extracts likely changed symbol names (function/class/const/let/var, Python def/class)
 * from a unified diff string.
 */

const TS_JS_PATTERNS: RegExp[] = [
  /function\s+(\w+)/,
  /class\s+(\w+)/,
  /(?:export\s+)?(?:default\s+)?(?:async\s+)?function\s+(\w+)/,
  /(?:const|let|var)\s+(\w+)\s*=/,
  /interface\s+(\w+)/,
  /type\s+(\w+)\s*=/,
];

const PY_PATTERNS: RegExp[] = [/def\s+(\w+)/, /class\s+(\w+)/];

const ALL_PATTERNS = [...TS_JS_PATTERNS, ...PY_PATTERNS];

export function extractChangedSymbols(diff: string): Set<string> {
  const symbols = new Set<string>();

  if (!diff || typeof diff !== "string") {
    return symbols;
  }

  const lines = diff.split(/\r?\n/);

  for (const line of lines) {
    // Only consider actual added/removed content lines, not diff metadata (+++/---)
    if (!/^[+-]/.test(line) || /^(\+\+\+|---)/.test(line)) {
      continue;
    }

    const content = line.slice(1);

    for (const pattern of ALL_PATTERNS) {
      const match = content.match(pattern);
      if (match && match[1]) {
        symbols.add(match[1]);
      }
    }
  }

  return symbols;
}
