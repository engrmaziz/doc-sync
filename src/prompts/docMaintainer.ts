export interface DocMaintainerArgs {
  code_diff: string;
  doc_file: string;
}

/**
 * Builds the doc-maintainer prompt text. The MCP server does no reasoning itself;
 * this prompt instructs the connected client LLM on how to use the
 * `detect_stale_docs` tool and what to do with its output.
 */
export function buildDocMaintainerPrompt(args: DocMaintainerArgs): string {
  const { code_diff, doc_file } = args;

  return `You are maintaining documentation accuracy for a software project.

A code change has been made. Your job is to find and fix any documentation in
"${doc_file}" that is now out of date because of this change.

Steps to follow:
1. Call the \`detect_stale_docs\` tool with:
   - code_diff: the diff shown below
   - doc_file: "${doc_file}"
2. The tool will return a JSON array of sections that mention symbols changed
   in the diff, each with a "confidence" level (high/medium/low) and the
   current section text ("snippet").
3. For each returned section, read the snippet and the diff carefully, then:
   - If the documentation text is now inaccurate, misleading, or references
     removed/renamed code, propose the exact replacement Markdown for that
     section.
   - If the section is still accurate despite the symbol match (e.g. it's
     just an example that still holds), explicitly say "No changes needed"
     for that section and briefly explain why.
4. If the tool returns an empty array, tell the user that no documentation
   sections appear affected by this change.
5. Present your findings section-by-section, clearly labeled, so the user can
   review and apply each suggested edit individually.

--- CODE DIFF ---
${code_diff}
--- END CODE DIFF ---`;
}
