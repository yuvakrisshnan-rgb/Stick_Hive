// In-memory IP rate limiter. Only correct for a single running server
// instance — counts live in process memory, so multiple instances (or a
// serverless/edge deployment that spins up separate processes) would each
// track their own counts and let the real per-IP limit multiply. Move to
// Redis/Upstash (or similar shared store) before running more than one
// instance.

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const store = new Map<string, RateLimitEntry>();

const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanupAt = 0;

function cleanupExpired(now: number): void {
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) store.delete(key);
  }
}

export function checkRateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();

  if (now - lastCleanupAt > CLEANUP_INTERVAL_MS) {
    cleanupExpired(now);
    lastCleanupAt = now;
  }

  const entry = store.get(key);
  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= maxRequests) {
    return false;
  }

  entry.count += 1;
  return true;
}

let hasWarnedMissingIpHeader = false;

// Returns null when neither proxy header is present, instead of a placeholder
// like "unknown" — callers must skip rate limiting (fail open) in that case
// rather than keying every request off the same placeholder value, which
// would silently merge every visitor into one shared bucket and let a
// handful of requests lock out the whole site. Blocking real users because a
// proxy header is missing is worse than temporarily having no per-IP limit
// for that edge case. Revisit once the hosting platform (Vercel or
// otherwise) is confirmed to reliably inject x-forwarded-for/x-real-ip in
// production, at which point this fallback should no longer trigger.
export function getClientIp(request: Request): string | null {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const [firstIp] = forwardedFor.split(",");
    if (firstIp?.trim()) return firstIp.trim();
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp?.trim()) return realIp.trim();

  if (!hasWarnedMissingIpHeader) {
    hasWarnedMissingIpHeader = true;
    console.warn(
      "[rate-limit] Neither x-forwarded-for nor x-real-ip is set on this request. " +
        "Rate limiting will fail open (allow all requests) until a proxy header is present. " +
        "Check that the hosting platform/reverse proxy forwards the client IP.",
    );
  }

  return null;
}
