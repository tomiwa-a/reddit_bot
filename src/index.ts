import { config } from "./config.js";
import { scan } from "./scanner.js";
import { logLead, getCsvPath } from "./csv-logger.js";

async function main() {
  console.log(`🚀 Ellomas Reddit Scanner starting at ${new Date().toISOString()}`);
  console.log(`   Target subreddits: ${config.subreddits.join(", ")}`);
  console.log(`   Search terms: ${config.searchTerms.join(", ")}`);

  const leads = await scan();

  if (leads.length === 0) {
    console.log("\n📭 No leads found this scan.");
  } else {
    console.log(`\n📊 Found ${leads.length} lead(s). Writing to CSV...`);
    for (const lead of leads) {
      logLead(lead);
    }
    console.log(`\n✅ Done. Leads saved to ${getCsvPath()}`);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
