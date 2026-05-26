import { appendFileSync, existsSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CSV_PATH = join(__dirname, "..", "data", "leads.csv");

const HEADER = "date,author,post_title,post_url,subreddit,matched_keyword,context_snippet\n";

export interface Lead {
  author: string;
  postTitle: string;
  postUrl: string;
  subreddit: string;
  matchedKeyword: string;
  contextSnippet: string;
}

function escapeCsv(value: string): string {
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function logLead(lead: Lead): void {
  if (!existsSync(CSV_PATH)) {
    writeFileSync(CSV_PATH, HEADER);
  }

  const date = new Date().toISOString();
  const line = [
    date,
    lead.author,
    lead.postTitle,
    lead.postUrl,
    lead.subreddit,
    lead.matchedKeyword,
    lead.contextSnippet,
  ].map(escapeCsv).join(",") + "\n";

  appendFileSync(CSV_PATH, line);
  console.log(`  📝 Logged: ${lead.author} — "${lead.postTitle.slice(0, 60)}"`);
}

export function getCsvPath(): string {
  return CSV_PATH;
}
