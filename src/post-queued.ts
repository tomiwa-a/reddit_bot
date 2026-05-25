import { getClient } from "./scanner.js";
import { getPending, markPosted, removePosted } from "./queue.js";
import { trackReply } from "./tracker.js";
import { withRetry } from "./retry.js";
import { config } from "./config.js";

async function main() {
  const pending = getPending();

  if (pending.length === 0) {
    console.log("📭 No queued comments to post.");
    return;
  }

  console.log(`📋 Found ${pending.length} queued comment(s). Posting...\n`);
  const r = getClient();

  for (const item of pending) {
    console.log(`[${item.id}] ${item.type} by ${item.author} — "${item.resource.title}"`);

    try {
      if (item.type === "post") {
        await withRetry(
          () => r.getSubmission(item.parentId).reply(item.comment),
          { label: `post reply t3_${item.parentId}` },
        );
      } else {
        await withRetry(
          () => r.getComment(item.parentId).reply(item.comment),
          { label: `comment reply t1_${item.parentId}` },
        );
      }

      markPosted(item.id);

      trackReply(
        item.parentId,
        item.author,
        item.postTitle,
        item.postUrl,
        item.resource.title,
        item.resource.url,
      );

      console.log(`  ✅ Posted — "${item.resource.title}"`);
    } catch (err) {
      console.error(`  ❌ Failed to post: ${(err as Error).message}`);
    }

    const delay = config.commenting.delayBetweenMs || 5000;
    await new Promise((r) => setTimeout(r, delay));
  }

  removePosted();
  console.log(`\n✅ Done. Posted ${pending.length} comment(s).`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
