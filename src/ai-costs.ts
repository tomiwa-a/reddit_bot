import { getAiUsageSummary } from "./cost-tracker.js";

function main() {
  const summary = getAiUsageSummary();

  console.log("📊 AI Usage Summary");
  console.log("─".repeat(40));
  console.log(`  AI calls:    ${summary.totalCalls}`);
  console.log(`  Tokens in:   ${summary.totalInputTokens.toLocaleString()}`);
  console.log(`  Tokens out:  ${summary.totalOutputTokens.toLocaleString()}`);
  console.log(`  Total cost:  $${summary.totalCost.toFixed(6)}`);
  console.log(`  Avg per call: $${summary.totalCalls > 0 ? (summary.totalCost / summary.totalCalls).toFixed(8) : "0.00"}`);
}

main();
