export type ResourceCategory = "article" | "news" | "report";

export interface Resource {
  slug: string;
  url: string;
  title: string;
  category: ResourceCategory;
  tags: string[];
}

export const resources: Resource[] = [
  // ── Articles ─────────────────────────────────────────────
  {
    slug: "ai-multi-tenant-loan-saas",
    url: "https://ellomas.com/resources/articles/ai-multi-tenant-loan-saas",
    title: "How We Built a Multi-Tenant Loan Platform 10x Faster with AI",
    category: "article",
    tags: [
      "ai", "multi-tenant", "loan", "saas", "fintech", "lending",
      "platform", "tenant", "loan management", "credit platform",
    ],
  },
  {
    slug: "api-contracts-versioning",
    url: "https://ellomas.com/resources/articles/api-contracts-versioning",
    title: "API Contracts: Versioning & Schema Discipline",
    category: "article",
    tags: [
      "api", "contracts", "versioning", "schema", "api design",
      "openapi", "rest", "api gateway", "backward compatibility",
    ],
  },
  {
    slug: "concurrency-decoded",
    url: "https://ellomas.com/resources/articles/concurrency-decoded",
    title: "Concurrency Decoded: Threads, Processes, and the Runtime Battle",
    category: "article",
    tags: [
      "concurrency", "threads", "processes", "go", "golang",
      "c#", "node.js", "runtime", "async", "parallelism",
      "goroutines", "multi-threading",
    ],
  },
  {
    slug: "database-indexes",
    url: "https://ellomas.com/resources/articles/database-indexes",
    title: "Database Indexing: A Practical Guide",
    category: "article",
    tags: [
      "database", "indexing", "indexes", "sql", "performance",
      "query optimization", "postgresql", "mysql", "nosql",
    ],
  },
  {
    slug: "observability-in-practice",
    url: "https://ellomas.com/resources/articles/observability-in-practice",
    title: "Observability in Practice: Logs, Traces, and Metrics",
    category: "article",
    tags: [
      "observability", "logging", "tracing", "metrics",
      "monitoring", "opentelemetry", "alerting", "sre",
      "incident response", "telemetry",
    ],
  },
  {
    slug: "payment-anatomy",
    url: "https://ellomas.com/resources/articles/payment-anatomy",
    title: "The Anatomy of a Payment",
    category: "article",
    tags: [
      "payment", "payments", "fintech", "transaction",
      "payment gateway", "processing", "settlement",
      "payment rails", "stripe", "payout",
    ],
  },
  {
    slug: "resilience-patterns",
    url: "https://ellomas.com/resources/articles/resilience-patterns",
    title: "Resilience Patterns That Keep Critical Systems Online",
    category: "article",
    tags: [
      "resilience", "fault tolerance", "high availability",
      "reliability", "circuit breaker", "retry", "timeout",
      "bulkhead", "chaos engineering", "degradation",
    ],
  },
  {
    slug: "saga-pattern-production",
    url: "https://ellomas.com/resources/articles/saga-pattern-production",
    title: "The Saga Pattern in Production",
    category: "article",
    tags: [
      "saga", "distributed transactions", "microservices",
      "eventual consistency", "orchestration", "choreography",
      "compensation", "transaction management",
    ],
  },

  // ── News ─────────────────────────────────────────────────
  {
    slug: "knowledge-repository-launch",
    url: "https://ellomas.com/resources/news/knowledge-repository-launch",
    title: "Announcing Our Knowledge Repository",
    category: "news",
    tags: [
      "engineering blog", "technical writing", "knowledge base",
      "documentation", "learning resources",
    ],
  },
  {
    slug: "nigeria-fintech-infrastructure",
    url: "https://ellomas.com/resources/news/nigeria-fintech-infrastructure",
    title: "Nigeria's Fintech Infrastructure",
    category: "news",
    tags: [
      "nigeria", "fintech", "infrastructure", "africa",
      "financial services", "payments", "digital banking",
    ],
  },
  {
    slug: "open-banking-nigeria-2026",
    url: "https://ellomas.com/resources/news/open-banking-nigeria-2026",
    title: "Open Banking in Nigeria: The Rails That Exist",
    category: "news",
    tags: [
      "open banking", "nigeria", "fintech", "api banking",
      "financial inclusion", "psd2", "banking api",
    ],
  },
  {
    slug: "what-we-look-for-in-a-technical-audit",
    url: "https://ellomas.com/resources/news/what-we-look-for-in-a-technical-audit",
    title: "What We Look for in a Technical Audit",
    category: "news",
    tags: [
      "audit", "technical audit", "code review",
      "architecture review", "best practices", "technical debt",
    ],
  },
  {
    slug: "why-we-chose-go",
    url: "https://ellomas.com/resources/news/why-we-chose-go",
    title: "Why We Chose Go",
    category: "news",
    tags: [
      "go", "golang", "programming language", "backend",
      "performance", "concurrency", "language choice",
    ],
  },

  // ── Reports ──────────────────────────────────────────────
  {
    slug: "credit-gap-nigeria",
    url: "https://ellomas.com/resources/reports/credit-gap-nigeria",
    title: "The Credit Gap: Why 85% of Nigerian Adults Are Credit Invisible",
    category: "report",
    tags: [
      "credit", "nigeria", "fintech", "financial inclusion",
      "lending", "credit scoring", "africa", "credit bureau",
      "underbanked", "credit report",
    ],
  },
];

export function findBestResource(text: string): Resource | null {
  const lower = text.toLowerCase();
  let best: Resource | null = null;
  let bestScore = 0;

  for (const resource of resources) {
    let score = 0;
    for (const tag of resource.tags) {
      if (lower.includes(tag.toLowerCase())) {
        score++;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      best = resource;
    }
  }

  return best;
}
