import * as fs from "fs";
import { extractChangedSymbols } from "../utils/diffParser.js";
import { scanDocFile, DocSection } from "../utils/docScanner.js";

export type Confidence = "high" | "medium" | "low";

export interface StaleDocMatch {
  section: string;
  matched_symbols: string[];
  confidence: Confidence;
  snippet: string;
}

/**
 * Returns true if `symbol` appears as a whole word in `text`.
 */
function containsWholeWord(text: string, symbol: string): boolean {
  const escaped = symbol.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`\\b${escaped}\\b`);
  return regex.test(text);
}

/**
 * Heuristic confidence scoring:
 *  - high: symbol appears in the section heading itself, or 2+ symbols matched
 *  - medium: single symbol match inside a code block or inline code (`symbol`)
 *  - low: single symbol match in plain prose
 */
function computeConfidence(section: DocSection, matchedSymbols: string[]): Confidence {
  if (matchedSymbols.length === 0) {
    return "low";
  }

  const headingMatch = matchedSymbols.some((s) => containsWholeWord(section.heading, s));
  if (headingMatch || matchedSymbols.length >= 2) {
    return "high";
  }

  const inlineCodeMatch = matchedSymbols.some((s) => {
    const escaped = s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp("`[^`]*\\b" + escaped + "\\b[^`]*`");
    return regex.test(section.content);
  });

  return inlineCodeMatch ? "medium" : "low";
}

export interface DetectStaleDocsInput {
  code_diff: string;
  doc_file: string;
}

export function detectStaleDocs(input: DetectStaleDocsInput): StaleDocMatch[] {
  const { code_diff, doc_file } = input;

  if (!fs.existsSync(doc_file)) {
    throw new Error(`doc_file not found: ${doc_file}`);
  }

  const changedSymbols = extractChangedSymbols(code_diff);
  if (changedSymbols.size === 0) {
    return [];
  }

  const sections = scanDocFile(doc_file);
  const results: StaleDocMatch[] = [];

  for (const section of sections) {
    const matched = [...changedSymbols].filter((symbol) => containsWholeWord(section.content, symbol));

    if (matched.length > 0) {
      results.push({
        section: section.heading,
        matched_symbols: matched,
        confidence: computeConfidence(section, matched),
        snippet: section.content.trim(),
      });
    }
  }

  return results;
}
