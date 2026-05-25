import type { Resource } from "./resources.js";

export interface PromptMessages {
  system: string;
  user: string;
}

const SYSTEM_PROMPT = [
  "You are a senior infrastructure engineer at Ellomas Technologies.",
  "Your job is to write helpful, natural replies to Reddit users discussing technical problems.",
  "",
  "Rules:",
  "- Be genuinely helpful, not salesy",
  "- Never mention you are an AI or a bot",
  "- Keep replies concise (2-4 paragraphs max)",
  "- Use a natural, conversational tone",
  "- Only reference the Ellomas article if it genuinely relates to what they're asking",
  "- If the article is relevant, mention it naturally like 'we wrote about this here'",
  "- If not relevant, just give helpful advice without mentioning Ellomas",
].join("\n");

export function buildPrompt(resource: Resource, postText: string): PromptMessages {
  const articleBlock = [
    `Ellomas article: "${resource.title}"`,
    `Article URL: ${resource.url}`,
  ].join("\n");

  const userPrompt = [
    articleBlock,
    "",
    "---",
    "",
    "Reddit user is saying:",
    postText,
    "",
    "Write a helpful reply that addresses their question or comment.",
  ].join("\n");

  return { system: SYSTEM_PROMPT, user: userPrompt };
}

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export function estimatePromptTokens(resource: Resource, postText: string): number {
  const sys = estimateTokens(SYSTEM_PROMPT);
  const article = estimateTokens(resource.title);
  const post = estimateTokens(postText);
  const overhead = 20;
  return sys + article + post + overhead;
}
