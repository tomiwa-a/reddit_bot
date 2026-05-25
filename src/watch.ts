import { config } from "./config.js";
import { scan } from "./scanner.js";
import { getCsvPath } from "./csv-logger.js";

const INTERVAL_MS = (config.schedule?.intervalMinutes ?? 120) * 60 * 1000;

async function runCycle(): Promise<void> {
  console.log(`\n🚀 Scan cycle at ${new Date().toISOString()}`);
  console.log(`   Next scan in ${(INTERVAL_MS / 60000).toFixed(0)} minutes.`);

  const leads = await scan();

  console.log(`\n📊 Found ${leads.length} lead(s). Saved to ${getCsvPath()}.`);
}

async function main() {
  console.log(`⏰ Ellomas Reddit Watch started at ${new Date().toISOString()}`);
  console.log(`   Interval: ${(INTERVAL_MS / 60000).toFixed(0)} minutes`);
  console.log(`   Press Ctrl+C to stop.\n`);

  await runCycle();

  setInterval(runCycle, INTERVAL_MS);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
