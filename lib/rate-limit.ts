/**
 * Best-effort in-memory rate limiter for public API routes (§6 bot/abuse
 * protection). Note: this is per server instance — it raises the bar for
 * casual abuse on Vercel's free tier but is not a substitute for App Check /
 * Turnstile on the client form.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export function checkRateLimit(
  key: string,
  limit = 20,
  windowMs = 60_000
): boolean {
  const now = Date.now();
  const entry = buckets.get(key);

  if (!entry || now > entry.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    // Prevent unbounded growth in long-lived processes
    if (buckets.size > 10_000) {
      for (const [k, v] of buckets) {
        if (now > v.resetAt) buckets.delete(k);
        if (buckets.size <= 5_000) break;
      }
    }
    return true;
  }

  entry.count += 1;
  return entry.count <= limit;
}

export function clientKey(req: Request, scope: string): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip =
    forwarded?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  return `${scope}:${ip}`;
}
