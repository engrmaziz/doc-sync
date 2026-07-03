import * as path from "path";
import { computeDocCoverage } from "../resources/docCoverage";
import { extractSymbolsFromSource } from "../utils/symbolExtractor";
import { DocuSyncConfig } from "../utils/config";

const FIXTURES = path.join(__dirname, "fixtures");

describe("extractSymbolsFromSource", () => {
  it("extracts exported function and const symbols, ignoring non-exported ones", () => {
    const src = `
export function authenticateUser(u: string, p: string) {}
export const MAX_LOGIN_ATTEMPTS = 5;
function internalHelper() {}
`;
    const symbols = extractSymbolsFromSource(src, "sample.ts");
    expect(symbols.has("authenticateUser")).toBe(true);
    expect(symbols.has("MAX_LOGIN_ATTEMPTS")).toBe(true);
    expect(symbols.has("internalHelper")).toBe(false);
  });

  it("extracts public python def/class, ignoring underscore-prefixed ones", () => {
    const src = `
def public_func():
    pass

def _private_func():
    pass

class PublicClass:
    pass
`;
    const symbols = extractSymbolsFromSource(src, "sample.py");
    expect(symbols.has("public_func")).toBe(true);
    expect(symbols.has("PublicClass")).toBe(true);
    expect(symbols.has("_private_func")).toBe(false);
  });
});

describe("computeDocCoverage", () => {
  it("computes coverage using fixture source and doc files", async () => {
    const config: DocuSyncConfig = {
      sourceFiles: ["sample.ts"],
      docFiles: ["sample.md"],
      excludePatterns: [],
    };

    const report = await computeDocCoverage(config, FIXTURES);

    expect(report.total_symbols).toBeGreaterThan(0);
    // MAX_LOGIN_ATTEMPTS is not mentioned in sample.md -> should be missing
    expect(report.missing_docs).toContain("MAX_LOGIN_ATTEMPTS");
  });
});
