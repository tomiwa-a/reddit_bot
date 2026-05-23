import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CACHE_PATH = join(__dirname, "..", "data", "cache.json");
const TTL_MS = 30 * 24 * 60 * 60 * 1000;

interface CacheEntry {
  timestamp: number;
}

interface Cache {
  [key: string]: CacheEntry;
}

function loadCache(): Cache {
  if (!existsSync(CACHE_PATH)) return {};
  try {
    return JSON.parse(readFileSync(CACHE_PATH, "utf-8"));
  } catch {
    return {};
  }
}

function saveCache(cache: Cache): void {
  writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));
}

export function isAlreadyProcessed(id: string): boolean {
  const cache = loadCache();
  const entry = cache[id];
  if (!entry) return false;
  const age = Date.now() - entry.timestamp;
  if (age > TTL_MS) {
    delete cache[id];
    saveCache(cache);
    return false;
  }
  return true;
}

export function markProcessed(id: string): void {
  const cache = loadCache();
  cache[id] = { timestamp: Date.now() };
  saveCache(cache);
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function randomDelay(min: number, max: number): Promise<void> {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min;
  return delay(ms);
}
