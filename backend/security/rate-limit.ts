// Rate limiting with two tiers:
//
// 1. In-memory (always available, no setup) — correct for a single running
//    server instance only. Counts live in process memory, so a serverless/
//    edge deployment that spins up separate instances (this app is deployed
//    on Vercel) would each track their own counts and let the real per-IP
//    limit multiply across instances.
// 2. Upstash Redis (opt-in, cross-instance-correct) — activates
//    automatically once UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
//    are set. This is the one that's actually correct on Vercel.
//
// Nothing regresses if Upstash isn't configured: every call falls back to
// the in-memory limiter rather than no-op'ing rate limiting entirely, so
// routes stay at least as protected as before this file existed. Only the
// Upstash-specific upgrade no-ops (falls back, with a one-time warning) if
// its env vars are absent.

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

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

/** Synchronous, single-instance in-memory check — used directly, or as the fallback when Upstash isn't configured. */
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

function isUpstashConfigured(): boolean {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL?.trim() && process.env.UPSTASH_REDIS_REST_TOKEN?.trim());
}

let upstashRedis: Redis | undefined;
const upstashLimiters = new Map<string, Ratelimit>();
let hasWarnedUpstashUnavailable = false;
let hasWarnedUpstashError = false;

function getUpstashLimiter(bucket: string, maxRequests: number, windowMs: number): Ratelimit {
  const cacheKey = `${bucket}:${maxRequests}:${windowMs}`;
  let limiter = upstashLimiters.get(cacheKey);
  if (limiter) return limiter;

  if (!upstashRedis) {
    upstashRedis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
  }

  limiter = new Ratelimit({
    redis: upstashRedis,
    limiter: Ratelimit.slidingWindow(maxRequests, `${Math.max(1, Math.ceil(windowMs / 1000))} s`),
    prefix: `stickhive-ratelimit:${bucket}`,
  });
  upstashLimiters.set(cacheKey, limiter);
  return limiter;
}

/**
 * The rate limiter routes should actually call. Uses Upstash (cross-instance
 * correct) when UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN are set;
 * otherwise falls back to the in-memory limiter (still real protection, just
 * single-instance) rather than disabling rate limiting outright. If Upstash
 * is configured but a request to it fails (network blip, bad credentials),
 * also fails back to the in-memory limiter rather than either crashing the
 * route or failing open with no limit at all.
 */
export async function rateLimit(key: string, maxRequests: number, windowMs: number): Promise<boolean> {
  if (!isUpstashConfigured()) {
    if (!hasWarnedUpstashUnavailable) {
      hasWarnedUpstashUnavailable = true;
      console.warn(
        "[rate-limit] UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN not set — using single-instance in-memory rate limiting. " +
          "Set both to get correct limits across multiple server instances (e.g. on Vercel).",
      );
    }
    return checkRateLimit(key, maxRequests, windowMs);
  }

  try {
    const [bucket] = key.split(":");
    const limiter = getUpstashLimiter(bucket, maxRequests, windowMs);
    const result = await limiter.limit(key);
    return result.success;
  } catch (error) {
    if (!hasWarnedUpstashError) {
      hasWarnedUpstashError = true;
      console.warn("[rate-limit] Upstash request failed, falling back to in-memory rate limiting:", error instanceof Error ? error.message : error);
    }
    return checkRateLimit(key, maxRequests, windowMs);
  }
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
