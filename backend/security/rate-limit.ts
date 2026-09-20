// Rate limiting with two tiers:
//
// 1. In-memory (always available, no setup) — correct for local dev only.
//    Counts live in the isolate's own memory, so Cloudflare Workers'
//    many concurrent, memory-isolated instances would each track their own
//    counts and let the real per-key limit multiply across instances -
//    confirmed in production: a resend-OTP cooldown was bypassed under
//    light concurrent load specifically because of this.
// 2. Upstash Redis (opt-in, cross-instance-correct) — activates
//    automatically once UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
//    are set. This is the one that's actually correct on Cloudflare Workers.
//
// Nothing regresses if Upstash isn't configured: every call falls back to
// the in-memory limiter rather than no-op'ing rate limiting entirely, so
// routes stay at least as protected as before this file existed - but that
// fallback is only actually correct in local dev. In production it's a real
// gap, so the warning below is loud and unmissable specifically when
// NODE_ENV is "production", rather than firing routinely during normal
// `vinext dev` usage.

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
  // Collapse the shared "unknown IP" bucket (see getClientIp()) onto a
  // strict cap regardless of what the caller asked for - a request with no
  // trustworthy IP must never get the same generous limit as a real,
  // distinguishable client.
  if (key.endsWith(`:${UNKNOWN_CLIENT_IP}`)) {
    maxRequests = Math.min(maxRequests, UNKNOWN_IP_MAX_REQUESTS);
  }

  if (!isUpstashConfigured()) {
    if (!hasWarnedUpstashUnavailable) {
      hasWarnedUpstashUnavailable = true;
      if (process.env.NODE_ENV === "production") {
        console.error(
          "[rate-limit] PRODUCTION MISCONFIGURATION: UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN are not set. " +
            "Falling back to single-instance in-memory rate limiting, which is NOT correct across Cloudflare Workers' " +
            "many concurrent isolates - limits (including the OTP resend cooldown) can be bypassed under concurrent " +
            "requests. Run `wrangler secret put UPSTASH_REDIS_REST_URL` and `wrangler secret put UPSTASH_REDIS_REST_TOKEN` " +
            "to fix this. This warning logs once per isolate, not once per request.",
        );
      } else {
        console.warn(
          "[rate-limit] UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN not set — using single-instance in-memory rate " +
            "limiting. Expected and fine for local dev; must be set before relying on rate limits in production.",
        );
      }
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
let hasWarnedMissingCfConnectingIp = false;

// Sentinel returned by getClientIp() when running in production with no
// trustworthy IP available. Every caller composes its rate-limit key as
// `${bucket}:${ip}` (see the 9 call sites across src/app/api/**), so a
// request landing here collapses into one shared, strictly-limited bucket
// per route instead of getting its own uncapped bucket - see UNKNOWN_IP_MAX
// below, enforced in rateLimit().
export const UNKNOWN_CLIENT_IP = "unknown";

// A request lacking a trustworthy IP still needs *some* limit, or it
// becomes an unlimited loophole the moment an attacker omits every IP
// header. Deliberately tighter than any legitimate per-route limit (the
// tightest today is send-otp's 5/10min) since many unrelated real users
// could collide into this one bucket - capping hard here trades a little
// false-positive risk (on the "should never happen for real Cloudflare
// traffic" branch) for closing the loophole.
const UNKNOWN_IP_MAX_REQUESTS = 3;

/**
 * Resolves the client IP to key rate limits off. Trust model:
 *
 * 1. CF-Connecting-IP, when present - set by Cloudflare's edge itself from
 *    the real TCP connection, not copied from any client-supplied header,
 *    so it cannot be spoofed by a request's own headers. Used whenever
 *    present, in any environment.
 * 2. X-Forwarded-For / X-Real-IP, but ONLY outside production (i.e. only
 *    when CF-Connecting-IP is absent AND we're not running on Cloudflare -
 *    local `next dev` has no edge in front to set/strip these, so they're
 *    only ever a developer convenience on your own machine, never trusted
 *    for a real deployment). NEVER consulted in production - Cloudflare
 *    passes through whatever X-Forwarded-For value the client sent without
 *    stripping it, so trusting it in production would let any caller reset
 *    their own rate-limit bucket per request just by changing the header.
 * 3. In production with no CF-Connecting-IP (shouldn't happen for genuine
 *    Cloudflare-routed traffic - defense in depth for the case where it
 *    somehow doesn't), returns the UNKNOWN_CLIENT_IP sentinel rather than
 *    falling back to a client-suppliable header or failing open.
 */
export function getClientIp(request: Request): string | null {
  const cfConnectingIp = request.headers.get("cf-connecting-ip");
  if (cfConnectingIp?.trim()) {
    return cfConnectingIp.trim();
  }

  const isProduction = process.env.NODE_ENV === "production";

  if (!isProduction) {
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
        "[rate-limit] Neither cf-connecting-ip, x-forwarded-for, nor x-real-ip is set on this request. " +
          "Rate limiting will fail open (allow all requests) until one is present. Expected on a bare " +
          "local dev server with no proxy in front; check your setup if you see this elsewhere.",
      );
    }

    return null;
  }

  if (!hasWarnedMissingCfConnectingIp) {
    hasWarnedMissingCfConnectingIp = true;
    console.error(
      "[rate-limit] PRODUCTION: request had no CF-Connecting-IP header. This should not happen for traffic " +
        "actually routed through Cloudflare - falling back to the shared, strictly-limited 'unknown' bucket " +
        "rather than trusting any client-supplied header (X-Forwarded-For is not consulted in production).",
    );
  }

  return UNKNOWN_CLIENT_IP;
}
