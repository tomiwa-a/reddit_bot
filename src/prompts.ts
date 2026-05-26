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
  "- Never mention you are an AI or a bot",
  "- Keep replies concise (1-3 short paragraphs, 100-150 words max)",
  "- Use standard punctuation only. No em dashes (—), no ellipses (...), no exclamation marks.",
  "- Be genuine — offer counterpoints or push back if the person has misconceptions",
  "- Don't just agree. Provide real technical insight or a different perspective.",
  "- Only reference the Ellomas article if it genuinely relates to what they're asking",
  "- If the article is relevant, mention it naturally like 'we wrote about this here'",
  "- If not relevant, just give helpful advice without mentioning Ellomas",
  "- Match the tone to the subreddit culture",
].join("\n");

const SUBREDDIT_TONES: Record<string, string> = {
  devops: "casual and direct, assumes hands-on experience",
  ExperiencedDevs: "detailed and thoughtful, assumes senior-level context",
  sysadmin: "pragmatic and no-nonsense, focused on real-world operations",
};

function getSubredditTone(subreddit: string): string {
  return SUBREDDIT_TONES[subreddit] || "conversational and technically grounded";
}

export function buildPrompt(resource: Resource, postText: string, subreddit?: string): PromptMessages {
  const articleBlock = [
    `Ellomas article: "${resource.title}"`,
    `Article URL: ${resource.url}`,
  ].join("\n");

  const toneGuidance = subreddit
    ? `This is on r/${subreddit}. Tone: ${getSubredditTone(subreddit)}.`
    : "Tone: conversational and technically grounded.";

  const userPrompt = [
    articleBlock,
    "",
    "---",
    "",
    "Reddit user is saying (from " + (subreddit ? "r/" + subreddit : "a thread") + "):",
    postText,
    "",
    toneGuidance,
    "Write a reply that addresses their question or comment.",
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
