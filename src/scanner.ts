import snoowrap from "snoowrap";
import { config } from "./config.js";
import { isAlreadyProcessed, markProcessed, randomDelay } from "./utils.js";
import type { Lead } from "./csv-logger.js";
import { logLead } from "./csv-logger.js";
import { matchPost } from "./matcher.js";
import { buildComment } from "./commentator.js";
import { generateAiReply } from "./ai.js";
import { enqueue } from "./queue.js";

let reddit: any;

export function getClient(): any {
  if (!reddit) {
    reddit = new snoowrap({
      userAgent: config.reddit.userAgent,
      clientId: config.reddit.clientId,
      clientSecret: config.reddit.clientSecret,
      username: config.reddit.username,
      password: config.reddit.password,
    });
  }
  return reddit;
}

function snippet(text: string, maxLen = 200): string {
  if (!text) return "";
  return text.length > maxLen ? text.slice(0, maxLen) + "..." : text;
}

function isBlacklisted(author: string, subreddit: string): boolean {
  const b = config.blacklist;
  if (b.users.some((u) => u.toLowerCase() === author.toLowerCase())) {
    console.log(`  ⏭️ Skipping blacklisted user: ${author}`);
    return true;
  }
  if (b.subreddits.some((s) => s.toLowerCase() === subreddit.toLowerCase())) {
    console.log(`  ⏭️ Skipping blacklisted subreddit: ${subreddit}`);
    return true;
  }
  return false;
}

async function generateCommentText(
  text: string,
  resource: import("./resources.js").Resource,
): Promise<{ comment: string; aiUsed: boolean }> {
  if (config.ai?.enabled !== false) {
    try {
      const result = await generateAiReply(resource, text);
      const costStr = result.costEstimate.toFixed(6);
      console.log(`  🤖 AI generated reply (${result.inputTokens} in / ${result.outputTokens} out — $${costStr})`);
      return { comment: result.text, aiUsed: true };
    } catch (err) {
      console.warn(`  ⚠️ AI generation failed: ${(err as Error).message}. Falling back to template.`);
    }
  }

  return { comment: buildComment(resource, config.commenting.template), aiUsed: false };
}

async function handlePostMatch(
  postId: string,
  text: string,
  author: string,
  postTitle: string,
  subreddit: string,
  postUrl: string,
): Promise<void> {
  if (isBlacklisted(author, subreddit)) return;

  const match = matchPost(text, "");
  if (!match) return;

  const { comment, aiUsed } = await generateCommentText(text, match.resource);

  enqueue({
    type: "post",
    parentId: postId,
    comment,
    resource: match.resource,
    author,
    postTitle,
    postUrl,
    matchedText: text,
    aiUsed,
  });
}

async function handleCommentMatch(
  commentId: string,
  text: string,
  author: string,
  postTitle: string,
  subreddit: string,
  postUrl: string,
): Promise<void> {
  if (isBlacklisted(author, subreddit)) return;

  const match = matchPost(text, "");
  if (!match) return;

  const { comment, aiUsed } = await generateCommentText(text, match.resource);

  enqueue({
    type: "comment",
    parentId: commentId,
    comment,
    resource: match.resource,
    author,
    postTitle,
    postUrl,
    matchedText: text,
    aiUsed,
  });
}

export async function scanPost(post: any, term: string): Promise<Lead | null> {
  const author = post.author?.name;
  if (!author || author === "[deleted]") return null;

  const id = `t3_${post.id}`;
  if (isAlreadyProcessed(id)) return null;

  markProcessed(id);

  return {
    author,
    postTitle: post.title || "",
    postUrl: `https://reddit.com${post.permalink}`,
    subreddit: post.subreddit?.display_name || "",
    matchedKeyword: term,
    contextSnippet: snippet(post.selftext || ""),
  };
}

export async function scanComment(comment: { id: string; body?: string; author?: { name: string }; permalink?: string; subreddit?: { display_name: string } }, term: string, postTitle: string): Promise<Lead | null> {
  const author = comment.author?.name;
  if (!author || author === "[deleted]") return null;

  const id = `t1_${comment.id}`;
  if (isAlreadyProcessed(id)) return null;

  markProcessed(id);

  return {
    author,
    postTitle,
    postUrl: `https://reddit.com${comment.permalink}`,
    subreddit: comment.subreddit?.display_name || "",
    matchedKeyword: term,
    contextSnippet: snippet(comment.body || ""),
  };
}

export async function scan(): Promise<Lead[]> {
  const r = getClient();
  const leads: Lead[] = [];
  const terms = config.searchTerms.map((t) => t.toLowerCase());

  for (const subName of config.subreddits) {
    console.log(`\n🔍 Scanning r/${subName}...`);

    try {
      const sub = r.getSubreddit(subName);
      const posts = await sub.getNew({ limit: config.scan.postsPerSubreddit });

      for (const post of posts) {
        const title = (post.title || "").toLowerCase();
        const body = (post.selftext || "").toLowerCase();
        const fullText = `${title} ${body}`;

        let matchedTerm: string | null = null;
        for (const term of terms) {
          if (fullText.includes(term)) {
            matchedTerm = term;
            break;
          }
        }

        if (matchedTerm) {
          const lead = await scanPost(post, matchedTerm);
          if (lead) {
            leads.push(lead);
            logLead(lead);
            console.log(`  ✅ Keyword match in post: "${post.title?.slice(0, 80)}" (keyword: "${matchedTerm}")`);

            const textForMatch = `${post.title || ""} ${post.selftext || ""}`;
            const postAuthor = post.author?.name || "unknown";
            const subName = post.subreddit?.display_name || "";
            await handlePostMatch(post.id, textForMatch, postAuthor, post.title || "", subName, lead.postUrl);
          }
        }

        if (post.num_comments && post.num_comments > 0) {
          try {
            const submission = await r.getSubmission(post.id);
            const rawComments: any[] = await submission.comments;
            const comments = rawComments.slice(0, config.scan.commentsPerPost);

            for (const comment of comments) {
              if (!comment || !comment.body) continue;
              const commentBody = comment.body.toLowerCase();

              let commentMatch: string | null = null;
              for (const term of terms) {
                if (commentBody.includes(term)) {
                  commentMatch = term;
                  break;
                }
              }

              if (commentMatch) {
                const lead = await scanComment(comment, commentMatch, post.title || "");
                if (lead) {
                  leads.push(lead);
                  logLead(lead);
                  console.log(`  ✅ Keyword match in comment by ${comment.author?.name} (keyword: "${commentMatch}")`);

                  const commentAuthor = comment.author?.name || "unknown";
                  const commentSub = comment.subreddit?.display_name || post.subreddit?.display_name || "";
                  await handleCommentMatch(comment.id, comment.body || "", commentAuthor, post.title || "", commentSub, lead.postUrl);
                }
              }
            }
          } catch {
            // Comment fetching errors are non-fatal per-post
          }
        }

        await randomDelay(1000, 2000);
      }
    } catch (err) {
      console.error(`  ❌ Error scanning r/${subName}:`, (err as Error).message);
    }
  }

  return leads;
}
