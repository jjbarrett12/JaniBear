/**
 * One retry with jitter for transient RPC/query failures.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  opts?: { maxAttempts?: number; baseMs?: number }
): Promise<T> {
  const maxAttempts = opts?.maxAttempts ?? 2;
  const baseMs = opts?.baseMs ?? 100;
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (e) {
      lastError = e;
      if (attempt < maxAttempts) {
        const jitter = Math.random() * baseMs;
        await new Promise((r) => setTimeout(r, baseMs + jitter));
      }
    }
  }
  throw lastError;
}
