import "dotenv/config";

export const config = {
  reddit: {
    userAgent: process.env.REDDIT_USER_AGENT || "ellomas-reddit-bot/0.1",
    clientId: process.env.REDDIT_CLIENT_ID || "",
    clientSecret: process.env.REDDIT_CLIENT_SECRET || "",
    username: process.env.REDDIT_USERNAME || "",
    password: process.env.REDDIT_PASSWORD || "",
  },

  subreddits: [
    "devops",
    "ExperiencedDevs",
    "sysadmin",
  ],

  searchTerms: [
    "infrastructure",
    "cloud migration",
    "system design",
  ],

  scan: {
    postsPerSubreddit: 25,
    commentsPerPost: 10,
  },

  commenting: {
    enabled: true,
    dryRun: true,
    delayBetweenMs: 5000,
  },
};

function validateConfig(): void {
  const missing: string[] = [];
  const c = config.reddit;
  if (!c.clientId) missing.push("REDDIT_CLIENT_ID");
  if (!c.clientSecret) missing.push("REDDIT_CLIENT_SECRET");
  if (!c.username) missing.push("REDDIT_USERNAME");
  if (!c.password) missing.push("REDDIT_PASSWORD");
  if (missing.length > 0) {
    console.error(`Missing required env vars: ${missing.join(", ")}`);
    console.error("Copy .env.example to .env and fill in your credentials.");
    process.exit(1);
  }
}

validateConfig();
