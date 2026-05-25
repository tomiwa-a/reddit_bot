import { config } from "./config.js";
import { scan } from "./scanner.js";
import { getCsvPath } from "./csv-logger.js";

async function main() {
  console.log(`🚀 Ellomas Reddit Scanner starting at ${new Date().toISOString()}`);
  console.log(`   Target subreddits: ${config.subreddits.join(", ")}`);
  console.log(`   Search terms: ${config.searchTerms.join(", ")}`);

  const leads = await scan();

  console.log(`\n📊 Scanned ${config.subreddits.length} subreddit(s), found ${leads.length} lead(s).`);
  console.log(`   Leads saved to ${getCsvPath()}`);
  console.log(`   Run 'npm run post-queued' to review and post queued comments.`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
