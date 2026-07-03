import * as fs from "fs";
import { glob } from "glob";
import { DocuSyncConfig } from "./config.js";

const EXPORT_PATTERNS: RegExp[] = [
  /export\s+(?:default\s+)?(?:async\s+)?function\s+(\w+)/g,
  /export\s+class\s+(\w+)/g,
  /export\s+(?:const|let|var)\s+(\w+)/g,
  /export\s+interface\s+(\w+)/g,
  /export\s+type\s+(\w+)/g,
];

const PY_PUBLIC_PATTERNS: RegExp[] = [/^def\s+(\w+)/gm, /^class\s+(\w+)/gm];

/**
 * Extracts "exported"/public symbols from a single source file's text,
 * based on its extension.
 */
export function extractSymbolsFromSource(fileText: string, filePath: string): Set<string> {
  const symbols = new Set<string>();

  if (filePath.endsWith(".py")) {
    for (const pattern of PY_PUBLIC_PATTERNS) {
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(fileText)) !== null) {
        // Skip "private" python symbols prefixed with underscore
        if (!match[1].startsWith("_")) {
          symbols.add(match[1]);
        }
      }
    }
    return symbols;
  }

  for (const pattern of EXPORT_PATTERNS) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(fileText)) !== null) {
      symbols.add(match[1]);
    }
  }

  return symbols;
}

/**
 * Scans all source files matching config.sourceFiles (excluding excludePatterns)
 * relative to rootDir, and returns a map of symbol -> list of files it was found in.
 */
export async function extractAllSymbols(
  config: DocuSyncConfig,
  rootDir: string = process.cwd()
): Promise<Map<string, string[]>> {
  const symbolMap = new Map<string, string[]>();

  const files = await glob(config.sourceFiles, {
    cwd: rootDir,
    ignore: config.excludePatterns,
    nodir: true,
    absolute: false,
  });

  for (const relativePath of files) {
    const fullPath = `${rootDir}/${relativePath}`;
    if (!fs.existsSync(fullPath)) continue;

    const text = fs.readFileSync(fullPath, "utf-8");
    const symbols = extractSymbolsFromSource(text, relativePath);

    for (const symbol of symbols) {
      const existing = symbolMap.get(symbol) ?? [];
      existing.push(relativePath);
      symbolMap.set(symbol, existing);
    }
  }

  return symbolMap;
}
