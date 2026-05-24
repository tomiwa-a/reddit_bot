import snoowrap from "snoowrap";
import { config } from "./config.js";
import { isAlreadyProcessed, markProcessed, randomDelay } from "./utils.js";
import type { Lead } from "./csv-logger.js";
import { logLead } from "./csv-logger.js";
import { matchPost } from "./matcher.js";
import { prepareComment, type CommentConfig } from "./commentator.js";

let reddit: any;

function getClient(): any {
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

const commentCfg: CommentConfig = {
  enabled: config.commenting.enabled,
  dryRun: config.commenting.dryRun,
  delayBetweenMs: config.commenting.delayBetweenMs,
};

async function handlePostMatch(
  postId: string,
  text: string,
  author: string,
  postTitle: string,
  postUrl: string,
  r: any,
): Promise<void> {
  const match = matchPost(text, "");
  if (!match) return;

  const comment = await prepareComment(
    match.resource,
    author,
    postTitle,
    postUrl,
    commentCfg,
  );
  if (!comment) return;

  if (!commentCfg.dryRun && commentCfg.enabled) {
    try {
      await r.getSubmission(postId).reply(comment);
      console.log(`  💬 Replied to post t3_${postId} — "${match.resource.title}"`);
    } catch (err) {
      console.error(`  ❌ Failed to reply to post t3_${postId}:`, (err as Error).message);
    }
  } else {
    console.log(`  🏜️ [DRY RUN] Would reply to post t3_${postId} — "${match.resource.title}"`);
  }
}

async function handleCommentMatch(
  commentId: string,
  text: string,
  author: string,
  postTitle: string,
  postUrl: string,
  r: any,
): Promise<void> {
  const match = matchPost(text, "");
  if (!match) return;

  const comment = await prepareComment(
    match.resource,
    author,
    postTitle,
    postUrl,
    commentCfg,
  );
  if (!comment) return;

  if (!commentCfg.dryRun && commentCfg.enabled) {
    try {
      await r.getComment(commentId).reply(comment);
      console.log(`  💬 Replied to comment t1_${commentId} — "${match.resource.title}"`);
    } catch (err) {
      console.error(`  ❌ Failed to reply to comment t1_${commentId}:`, (err as Error).message);
    }
  } else {
    console.log(`  🏜️ [DRY RUN] Would reply to comment t1_${commentId} — "${match.resource.title}"`);
  }
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

  console.log(`   Commenting: ${commentCfg.dryRun ? "🔴 DRY RUN (no actual posts)" : "🟢 LIVE"}`);

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
            console.log(`  ✅ Match in post: "${post.title?.slice(0, 80)}" (keyword: "${matchedTerm}")`);

            const textForMatch = `${post.title || ""} ${post.selftext || ""}`;
            const postAuthor = post.author?.name || "unknown";
            await handlePostMatch(post.id, textForMatch, postAuthor, post.title || "", lead.postUrl, r);
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
                  console.log(`  ✅ Match in comment by ${comment.author?.name} (keyword: "${commentMatch}")`);

                  const commentAuthor = comment.author?.name || "unknown";
                  await handleCommentMatch(comment.id, comment.body || "", commentAuthor, post.title || "", lead.postUrl, r);
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
