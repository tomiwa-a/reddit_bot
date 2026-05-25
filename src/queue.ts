import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { Resource } from "./resources.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const QUEUE_PATH = join(__dirname, "..", "data", "queue.json");

export interface QueueItem {
  id: string;
  type: "post" | "comment";
  parentId: string;
  comment: string;
  resource: Resource;
  author: string;
  postTitle: string;
  postUrl: string;
  matchedText: string;
  createdAt: string;
  posted: boolean;
}

function loadQueue(): QueueItem[] {
  if (!existsSync(QUEUE_PATH)) return [];
  try {
    return JSON.parse(readFileSync(QUEUE_PATH, "utf-8"));
  } catch {
    return [];
  }
}

function saveQueue(queue: QueueItem[]): void {
  writeFileSync(QUEUE_PATH, JSON.stringify(queue, null, 2));
}

let idCounter = 0;

export function enqueue(item: Omit<QueueItem, "id" | "createdAt" | "posted">): void {
  const queue = loadQueue();
  queue.push({
    ...item,
    id: `q_${Date.now()}_${++idCounter}`,
    createdAt: new Date().toISOString(),
    posted: false,
  });
  saveQueue(queue);
  console.log(`  📋 Queued for review: reply to ${item.type} by ${item.author}`);
}

export function getPending(): QueueItem[] {
  return loadQueue().filter((i) => !i.posted);
}

export function markPosted(id: string): void {
  const queue = loadQueue();
  const item = queue.find((i) => i.id === id);
  if (item) {
    item.posted = true;
    saveQueue(queue);
  }
}

export function removePosted(): void {
  const queue = loadQueue().filter((i) => !i.posted);
  saveQueue(queue);
}
