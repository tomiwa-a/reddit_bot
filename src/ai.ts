import OpenAI from "openai";
import type { Resource } from "./resources.js";
import { config } from "./config.js";
import { buildPrompt } from "./prompts.js";

const DEEPSEEK_BASE_URL = "https://api.deepseek.com";

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!client) {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      throw new Error(
        "DEEPSEEK_API_KEY not set in .env. " +
        "Get yours at https://platform.deepseek.com",
      );
    }
    client = new OpenAI({
      baseURL: DEEPSEEK_BASE_URL,
      apiKey,
    });
  }
  return client;
}

export interface AiReplyResult {
  text: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  costEstimate: number;
}

const INPUT_COST_PER_1M = 0.14;
const OUTPUT_COST_PER_1M = 0.28;

export async function generateAiReply(
  resource: Resource,
  postText: string,
  subreddit?: string,
): Promise<AiReplyResult> {
  const c = getClient();
  const { system, user } = buildPrompt(resource, postText, subreddit);

  const response = await c.chat.completions.create({
    model: config.ai?.model || "deepseek-chat",
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    temperature: config.ai?.temperature ?? 0.7,
    max_tokens: config.ai?.maxTokens ?? 500,
  });

  const text = response.choices[0]?.message?.content?.trim() || "";
  const usage = response.usage;
  const inputTokens = usage?.prompt_tokens || 0;
  const outputTokens = usage?.completion_tokens || 0;

  const costEstimate =
    (inputTokens / 1_000_000) * INPUT_COST_PER_1M +
    (outputTokens / 1_000_000) * OUTPUT_COST_PER_1M;

  return { text, model: "deepseek-chat", inputTokens, outputTokens, costEstimate };
}
