import { appendFileSync, existsSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { Resource } from "./resources.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const LOG_PATH = join(__dirname, "..", "data", "comments.csv");

const MAX_COMMENT_LENGTH = 10000;

export interface CommentConfig {
  dryRun: boolean;
  enabled: boolean;
  delayBetweenMs: number;
  template?: string;
}

export interface CommentLog {
  date: string;
  action: "would_post" | "posted" | "skipped";
  author: string;
  postTitle: string;
  postUrl: string;
  resourceTitle: string;
  resourceUrl: string;
  commentText: string;
  reason?: string;
}

export const DEFAULT_TEMPLATE =
  "Great question — we published a detailed breakdown on this at Ellomas. " +
  "Check it out: {title} — {url}";

export function buildComment(resource: Resource, template?: string): string {
  const tpl = template || DEFAULT_TEMPLATE;
  let comment = tpl
    .replace(/\{title\}/g, resource.title)
    .replace(/\{url\}/g, resource.url);
  if (comment.length > MAX_COMMENT_LENGTH) {
    comment = comment.slice(0, MAX_COMMENT_LENGTH - 3) + "...";
  }
  return comment;
}

function ensureLogHeader(): void {
  if (!existsSync(LOG_PATH)) {
    writeFileSync(
      LOG_PATH,
      "date,action,author,post_title,post_url,resource_title,resource_url,reason\n",
    );
  }
}

function escapeCsv(value: string): string {
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function prepareComment(
  resource: Resource,
  author: string,
  postTitle: string,
  postUrl: string,
  config: CommentConfig,
  template?: string,
): Promise<string | null> {
  const comment = buildComment(resource, template);

  ensureLogHeader();

  const logEntry: CommentLog = {
    date: new Date().toISOString(),
    action: config.dryRun ? "would_post" : "posted",
    author,
    postTitle,
    postUrl,
    resourceTitle: resource.title,
    resourceUrl: resource.url,
    commentText: comment,
  };

  const line = [
    logEntry.date,
    logEntry.action,
    logEntry.author,
    logEntry.postTitle,
    logEntry.postUrl,
    logEntry.resourceTitle,
    logEntry.resourceUrl,
    "",
  ]
    .map(escapeCsv)
    .join(",") + "\n";

  appendFileSync(LOG_PATH, line);

  return comment;
}
