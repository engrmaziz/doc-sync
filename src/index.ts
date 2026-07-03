#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { loadConfig } from "./utils/config.js";
import { detectStaleDocs } from "./tools/detectStaleDocs.js";
import { buildDocMaintainerPrompt } from "./prompts/docMaintainer.js";
import { computeDocCoverage } from "./resources/docCoverage.js";

const config = loadConfig(process.cwd());

const server = new McpServer({
  name: "docusync-mcp",
  version: "1.0.0",
});

// ---- Tool: detect_stale_docs ----
server.tool(
  "detect_stale_docs",
  "Detects Markdown documentation sections that may be out of sync with a given code diff.",
  {
    code_diff: z.string().describe("A unified diff (e.g. `git diff` output) of the code change."),
    doc_file: z.string().describe("Path to the Markdown documentation file to check, e.g. README.md."),
  },
  async ({ code_diff, doc_file }) => {
    try {
      const results = detectStaleDocs({ code_diff, doc_file });
      return {
        content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
      };
    } catch (err) {
      console.error(`[docusync] detect_stale_docs error: ${(err as Error).message}`);
      return {
        isError: true,
        content: [{ type: "text", text: `Error: ${(err as Error).message}` }],
      };
    }
  }
);

// ---- Prompt: doc-maintainer ----
server.prompt(
  "doc-maintainer",
  "Guides an AI assistant through reviewing and updating stale documentation for a code change.",
  {
    code_diff: z.string().describe("A unified diff of the code change."),
    doc_file: z.string().describe("Path to the Markdown documentation file to check."),
  },
  ({ code_diff, doc_file }) => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: buildDocMaintainerPrompt({ code_diff, doc_file }),
        },
      },
    ],
  })
);

// ---- Resource: doc-coverage:// ----
server.resource(
  "doc-coverage",
  "doc-coverage://",
  { description: "Documentation coverage metrics for the current project.", mimeType: "application/json" },
  async (uri) => {
    try {
      const report = await computeDocCoverage(config, process.cwd());
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "application/json",
            text: JSON.stringify(report, null, 2),
          },
        ],
      };
    } catch (err) {
      console.error(`[docusync] doc-coverage resource error: ${(err as Error).message}`);
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "application/json",
            text: JSON.stringify({ error: (err as Error).message }, null, 2),
          },
        ],
      };
    }
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[docusync] DocuSync MCP server running on stdio");
}

main().catch((err) => {
  console.error("[docusync] Fatal error starting server:", err);
  process.exit(1);
});
