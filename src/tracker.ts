import { appendFileSync, existsSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const TRACKER_PATH = join(__dirname, "..", "data", "replies.csv");

function escapeCsv(value: string): string {
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function trackReply(
  parentId: string,
  author: string,
  postTitle: string,
  postUrl: string,
  resourceTitle: string,
  resourceUrl: string,
): void {
  if (!existsSync(TRACKER_PATH)) {
    writeFileSync(
      TRACKER_PATH,
      "date,parent_id,author,post_title,post_url,resource_title,resource_url\n",
    );
  }

  const line = [
    new Date().toISOString(),
    parentId,
    author,
    postTitle,
    postUrl,
    resourceTitle,
    resourceUrl,
  ]
    .map(escapeCsv)
    .join(",") + "\n";

  appendFileSync(TRACKER_PATH, line);
}
