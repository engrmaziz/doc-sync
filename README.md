# DocuSync MCP

![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)
![npm version](https://img.shields.io/npm/v/docusync-mcp.svg)

> AI-powered documentation that never rots. Automatically detects stale docs when your code changes and suggests updates right inside your chat.

## Quick Start

```bash
git clone https://github.com/yourname/docusync-mcp.git
cd docusync-mcp
npm install
npm run build
```

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "docusync-mcp": {
      "command": "node",
      "args": ["/absolute/path/to/docusync-mcp/dist/index.js"]
    }
  }
}
```

Restart Claude Desktop, then ask it something like:

> "Check if README.md is out of sync with this diff: <paste your git diff>"

That's it — Claude will call the `detect_stale_docs` tool and walk you through any stale sections.

---

## Features

- **`detect_stale_docs` (tool)** — Given a code diff and a Markdown file, finds sections that mention symbols changed in the diff, with a confidence score (high/medium/low) for each match.
- **`doc-maintainer` (prompt)** — A guided prompt that has the connected AI call `detect_stale_docs` and then propose concrete Markdown updates for any stale sections.
- **`doc-coverage://` (resource)** — Reports how many exported symbols in your source code are mentioned anywhere in your docs, and lists exactly which ones are undocumented.

DocuSync never calls any AI API itself — it only extracts and structures information. All the reasoning (deciding *what* to write) is done by whichever LLM client (Claude, etc.) is connected to it. No API keys, no network calls, $0 cost.

## Installation

```bash
git clone https://github.com/yourname/docusync-mcp.git
cd docusync-mcp
npm install
npm run build
```

## Configuration

Create a `.docusync.json` in your project root (a sensible default ships with this repo):

```json
{
  "docFiles": ["README.md", "docs/**/*.md"],
  "sourceFiles": ["src/**/*.ts", "src/**/*.js", "src/**/*.py"],
  "excludePatterns": ["node_modules", "dist", ".git"]
}
```

If this file is missing, DocuSync falls back to the defaults above automatically.

## Usage

### Connect to Claude Desktop

Edit your `claude_desktop_config.json` (Settings → Developer → Edit Config in Claude Desktop) and add:

```json
{
  "mcpServers": {
    "docusync-mcp": {
      "command": "node",
      "args": ["/absolute/path/to/docusync-mcp/dist/index.js"]
    }
  }
}
```

Restart Claude Desktop. You should see DocuSync's tool, prompt, and resource available in a new chat.

### Manual testing (stdio)

DocuSync communicates over stdio using JSON-RPC (the MCP transport), so you can't just curl it. To test manually:

```bash
node dist/index.js
```

The process will sit waiting for JSON-RPC messages on stdin and reply on stdout — logs go to stderr so they don't corrupt the protocol stream. For interactive testing, use the [MCP Inspector](https://github.com/modelcontextprotocol/inspector):

```bash
npx @modelcontextprotocol/inspector node dist/index.js
```

## Testing

```bash
npm test
```

Runs the Jest unit test suite (`ts-jest`) covering the diff parser, doc scanner, symbol extractor, `detect_stale_docs`, and `doc-coverage`.

## Publishing

```bash
npm login
npm publish --access public
```

Then tag a GitHub release:

```bash
git tag v1.0.0
git push origin v1.0.0
```

and create the release notes on GitHub from the tag.

## Roadmap

- **v1.0** — Regex-based symbol detection for TS/JS/Python, section-level staleness flags, doc coverage resource.
- **v2.0** — AST-based symbol extraction (via `ts-morph` / Python `ast`) for far fewer false positives; support for JSDoc/docstring cross-referencing.
- **v3.0** — Multi-repo / monorepo awareness, GitHub Action integration to comment on PRs automatically, VS Code extension.

## Contributing

Contributions are welcome! Please open an issue to discuss significant changes before submitting a PR. Run `npm test` and `npm run lint` before submitting.

## Learn more

- [Model Context Protocol documentation](https://modelcontextprotocol.io)

## License

MIT
