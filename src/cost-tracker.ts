import { appendFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const USAGE_PATH = join(__dirname, "..", "data", "ai-usage.csv");

const HEADER = "date,resource_title,input_tokens,output_tokens,cost,model\n";

export function logAiUsage(
  resourceTitle: string,
  inputTokens: number,
  outputTokens: number,
  cost: number,
  model: string,
): void {
  if (!existsSync(USAGE_PATH)) {
    writeFileSync(USAGE_PATH, HEADER);
  }

  const date = new Date().toISOString();
  const line = [
    date,
    resourceTitle.replace(/,/g, ""),
    inputTokens,
    outputTokens,
    cost.toFixed(8),
    model,
  ].join(",") + "\n";

  appendFileSync(USAGE_PATH, line);
}

export interface AiUsageSummary {
  totalCalls: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCost: number;
}

export function getAiUsageSummary(): AiUsageSummary {
  if (!existsSync(USAGE_PATH)) {
    return { totalCalls: 0, totalInputTokens: 0, totalOutputTokens: 0, totalCost: 0 };
  }

  const lines = readFileSync(USAGE_PATH, "utf-8").trim().split("\n");
  const dataLines = lines.slice(1).filter(Boolean);

  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let totalCost = 0;

  for (const line of dataLines) {
    const parts = line.split(",");
    if (parts.length >= 5) {
      totalInputTokens += parseInt(parts[2], 10) || 0;
      totalOutputTokens += parseInt(parts[3], 10) || 0;
      totalCost += parseFloat(parts[4]) || 0;
    }
  }

  return {
    totalCalls: dataLines.length,
    totalInputTokens,
    totalOutputTokens,
    totalCost,
  };
}
