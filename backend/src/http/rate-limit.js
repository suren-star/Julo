export function createFixedWindowRateLimiter({ limit = 10, windowMs = 60_000, now = () => Date.now() } = {}) {
  const buckets = new Map();
  return {
    consume(key) {
      const current = now();
      let bucket = buckets.get(key);
      if (!bucket || current >= bucket.resetAt) {
        bucket = { count: 0, resetAt: current + windowMs };
        buckets.set(key, bucket);
      }
      bucket.count += 1;
      return { allowed: bucket.count <= limit, remaining: Math.max(0, limit - bucket.count), resetAt: bucket.resetAt };
    },
    clear() { buckets.clear(); },
  };
}
