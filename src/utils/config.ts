import * as fs from "fs";
import * as path from "path";

export interface DocuSyncConfig {
  docFiles: string[];
  sourceFiles: string[];
  excludePatterns: string[];
}

export const DEFAULT_CONFIG: DocuSyncConfig = {
  docFiles: ["README.md", "docs/**/*.md"],
  sourceFiles: ["src/**/*.ts", "src/**/*.js", "src/**/*.py"],
  excludePatterns: ["node_modules", "dist", ".git"],
};

/**
 * Loads .docusync.json from the given root directory (defaults to cwd).
 * Falls back to DEFAULT_CONFIG if the file is missing or invalid.
 */
export function loadConfig(rootDir: string = process.cwd()): DocuSyncConfig {
  const configPath = path.join(rootDir, ".docusync.json");

  if (!fs.existsSync(configPath)) {
    return { ...DEFAULT_CONFIG };
  }

  try {
    const raw = fs.readFileSync(configPath, "utf-8");
    const parsed = JSON.parse(raw);
    return {
      docFiles: Array.isArray(parsed.docFiles) ? parsed.docFiles : DEFAULT_CONFIG.docFiles,
      sourceFiles: Array.isArray(parsed.sourceFiles) ? parsed.sourceFiles : DEFAULT_CONFIG.sourceFiles,
      excludePatterns: Array.isArray(parsed.excludePatterns)
        ? parsed.excludePatterns
        : DEFAULT_CONFIG.excludePatterns,
    };
  } catch (err) {
    console.error(`[docusync] Failed to parse .docusync.json, using defaults: ${(err as Error).message}`);
    return { ...DEFAULT_CONFIG };
  }
}
