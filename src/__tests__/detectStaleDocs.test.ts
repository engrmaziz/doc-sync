import * as fs from "fs";
import * as path from "path";
import { detectStaleDocs } from "../tools/detectStaleDocs";
import { extractChangedSymbols } from "../utils/diffParser";
import { splitIntoSections } from "../utils/docScanner";

const FIXTURES = path.join(__dirname, "fixtures");

describe("extractChangedSymbols", () => {
  it("extracts function, const, and renamed symbols from a diff", () => {
    const diff = fs.readFileSync(path.join(FIXTURES, "sample.diff"), "utf-8");
    const symbols = extractChangedSymbols(diff);

    expect(symbols.has("loginUser")).toBe(true);
    expect(symbols.has("authenticateUser")).toBe(true);
    expect(symbols.has("MAX_LOGIN_ATTEMPTS")).toBe(true);
  });

  it("returns an empty set for a diff with no symbol definitions", () => {
    const diff = "+ // just a comment\n- // another comment";
    expect(extractChangedSymbols(diff).size).toBe(0);
  });
});

describe("splitIntoSections", () => {
  it("splits markdown into sections by heading", () => {
    const md = "# Title\n\nintro\n\n## Section A\ncontent a\n\n## Section B\ncontent b\n";
    const sections = splitIntoSections(md);

    expect(sections.map((s) => s.heading)).toEqual(["Title", "Section A", "Section B"]);
  });
});

describe("detectStaleDocs", () => {
  it("flags sections mentioning changed symbols", () => {
    const diff = fs.readFileSync(path.join(FIXTURES, "sample.diff"), "utf-8");
    const docFile = path.join(FIXTURES, "sample.md");

    const results = detectStaleDocs({ code_diff: diff, doc_file: docFile });

    const sectionHeadings = results.map((r) => r.section);
    expect(sectionHeadings).toContain("Authentication");
    expect(sectionHeadings).not.toContain("Unrelated Section");

    const authSection = results.find((r) => r.section === "Authentication")!;
    expect(authSection.matched_symbols).toContain("loginUser");
    expect(authSection.confidence).toBeDefined();
  });

  it("throws if the doc file does not exist", () => {
    expect(() =>
      detectStaleDocs({ code_diff: "+function foo() {}", doc_file: "/nonexistent/path.md" })
    ).toThrow();
  });

  it("returns an empty array when the diff has no symbols", () => {
    const docFile = path.join(FIXTURES, "sample.md");
    const results = detectStaleDocs({ code_diff: "+ // comment only", doc_file: docFile });
    expect(results).toEqual([]);
  });
});
