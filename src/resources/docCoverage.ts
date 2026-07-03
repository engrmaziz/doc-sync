import * as fs from "fs";
import { glob } from "glob";
import { DocuSyncConfig } from "../utils/config.js";
import { extractAllSymbols } from "../utils/symbolExtractor.js";

export interface DocCoverageReport {
  total_symbols: number;
  documented_symbols: number;
  missing_docs: string[];
}

function containsWholeWord(text: string, symbol: string): boolean {
  const escaped = symbol.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`\\b${escaped}\\b`);
  return regex.test(text);
}

export async function computeDocCoverage(
  config: DocuSyncConfig,
  rootDir: string = process.cwd()
): Promise<DocCoverageReport> {
  const symbolMap = await extractAllSymbols(config, rootDir);
  const allSymbols = [...symbolMap.keys()];

  const docFilePaths = await glob(config.docFiles, {
    cwd: rootDir,
    ignore: config.excludePatterns,
    nodir: true,
    absolute: false,
  });

  let combinedDocsText = "";
  for (const relativePath of docFilePaths) {
    const fullPath = `${rootDir}/${relativePath}`;
    if (fs.existsSync(fullPath)) {
      combinedDocsText += fs.readFileSync(fullPath, "utf-8") + "\n";
    }
  }

  const missing: string[] = [];
  let documentedCount = 0;

  for (const symbol of allSymbols) {
    if (containsWholeWord(combinedDocsText, symbol)) {
      documentedCount++;
    } else {
      missing.push(symbol);
    }
  }

  return {
    total_symbols: allSymbols.length,
    documented_symbols: documentedCount,
    missing_docs: missing.sort(),
  };
}
