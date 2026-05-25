import OpenAI from "openai";
import type { Resource } from "./resources.js";

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
): Promise<AiReplyResult> {
  const c = getClient();

  const systemPrompt = [
    "You are a senior infrastructure engineer at Ellomas Technologies.",
    "Your job is to write helpful, natural replies to Reddit users who are discussing technical problems.",
    "Reference the Ellomas article when it's genuinely relevant to their question.",
    "Rules:",
    "- Be genuinely helpful, not salesy",
    "- Never mention you are an AI or a bot",
    "- Keep replies concise (2-4 paragraphs max)",
    "- Use a natural, conversational tone",
    "- Only reference the article if it actually relates to what they're asking",
  ].join("\n");

  const userPrompt = [
    `Ellomas article: "${resource.title}"`,
    `Article URL: ${resource.url}`,
    "",
    "Reddit user is saying:",
    postText,
    "",
    "Write a helpful reply that addresses their question or comment.",
    "If the Ellomas article is relevant, mention it naturally.",
    "If it's not relevant, just give helpful advice without mentioning the article.",
  ].join("\n");

  const response = await c.chat.completions.create({
    model: "deepseek-chat",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 500,
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
