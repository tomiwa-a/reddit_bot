import { resources, type Resource } from "./resources.js";

export interface MatchResult {
  resource: Resource;
  score: number;
  matchedTags: string[];
}

export function findBestMatch(text: string): MatchResult | null {
  const lower = text.toLowerCase();
  let best: MatchResult | null = null;

  for (const resource of resources) {
    const matchedTags: string[] = [];
    for (const tag of resource.tags) {
      if (lower.includes(tag.toLowerCase())) {
        matchedTags.push(tag);
      }
    }
    if (matchedTags.length > 0) {
      const score = matchedTags.length;
      if (!best || score > best.score) {
        best = { resource, score, matchedTags };
      }
    }
  }

  return best;
}

export function matchPost(
  title: string,
  body: string,
  commentBody?: string,
): MatchResult | null {
  const text = [title, body, commentBody].filter(Boolean).join(" ");
  return findBestMatch(text);
}

export function formatTags(tags: string[]): string {
  if (tags.length === 0) return "—";
  return tags.slice(0, 5).join(", ");
}
