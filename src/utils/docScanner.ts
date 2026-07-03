import * as fs from "fs";

export interface DocSection {
  heading: string;
  content: string;
  startLine: number;
}

/**
 * Reads a Markdown file and splits it into sections by headings (# or ##, etc).
 * Each section's `content` includes the heading line itself plus everything
 * up to (not including) the next heading of the same or higher level start.
 */
export function scanDocFile(filePath: string): DocSection[] {
  if (!fs.existsSync(filePath)) {
    return [];
  }

  const text = fs.readFileSync(filePath, "utf-8");
  return splitIntoSections(text);
}

export function splitIntoSections(text: string): DocSection[] {
  const lines = text.split(/\r?\n/);
  const headingRegex = /^(#{1,6})\s+(.+)$/;

  const sections: DocSection[] = [];
  let current: DocSection | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(headingRegex);

    if (match) {
      if (current) {
        sections.push(current);
      }
      current = {
        heading: match[2].trim(),
        content: line + "\n",
        startLine: i + 1,
      };
    } else if (current) {
      current.content += line + "\n";
    } else {
      // Content before the first heading — group under an implicit "Preamble" section
      current = { heading: "Preamble", content: line + "\n", startLine: i + 1 };
    }
  }

  if (current) {
    sections.push(current);
  }

  return sections;
}
