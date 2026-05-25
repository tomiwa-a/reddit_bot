export async function withRetry<T>(
  fn: () => Promise<T>,
  options?: {
    maxAttempts?: number;
    baseDelayMs?: number;
    label?: string;
  },
): Promise<T> {
  const maxAttempts = options?.maxAttempts ?? 3;
  const baseDelay = options?.baseDelayMs ?? 2000;
  const label = options?.label ?? "operation";

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const isLast = attempt === maxAttempts;
      const msg = (err as Error)?.message ?? String(err);

      if (isLast) {
        console.error(`  ❌ ${label} failed after ${maxAttempts} attempts: ${msg}`);
        throw err;
      }

      const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
      console.warn(`  ⚠️ ${label} attempt ${attempt}/${maxAttempts} failed: ${msg}. Retrying in ${Math.round(delay)}ms...`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }

  throw new Error(`${label} failed (unreachable)`);
}
