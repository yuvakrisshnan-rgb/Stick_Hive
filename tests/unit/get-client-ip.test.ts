// Run with: node --test tests/unit
//
// Plain Node built-in test runner (node:test) - no new dependency, and
// runs these as pure function calls against getClientIp()/rateLimit()
// directly, which is both faster and more precise than driving them
// through a real HTTP server: the production-vs-local-dev branch depends
// on process.env.NODE_ENV, which is easy to control here and impossible
// to flip on a running `next dev` server (always "development").
import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";

import { UNKNOWN_CLIENT_IP, checkRateLimit, getClientIp, rateLimit } from "../../backend/security/rate-limit.ts";

// Next.js declares NODE_ENV as readonly in its ambient global types
// (node_modules/next/types/global.d.ts) - true at runtime for `next
// build`'s own bundling, but these tests genuinely need to flip it to
// exercise both branches. Routing every assignment through a mutable-cast
// helper, rather than sprinkling `as any` at each call site.
function setNodeEnv(value: string | undefined): void {
  (process.env as { NODE_ENV?: string }).NODE_ENV = value;
}

let originalNodeEnv: string | undefined;

beforeEach(() => {
  originalNodeEnv = process.env.NODE_ENV;
});

afterEach(() => {
  setNodeEnv(originalNodeEnv);
});

function requestWithHeaders(headers: Record<string, string>): Request {
  return new Request("https://stickhive.example/api/auth/send-otp", { headers });
}

test("production: CF-Connecting-IP is used as the client IP", () => {
  setNodeEnv("production");
  const request = requestWithHeaders({ "cf-connecting-ip": "203.0.113.7" });
  assert.equal(getClientIp(request), "203.0.113.7");
});

test("production: a spoofed X-Forwarded-For is ignored - never used as the client IP", () => {
  setNodeEnv("production");
  const request = requestWithHeaders({ "x-forwarded-for": "6.6.6.6" });
  const ip = getClientIp(request);
  assert.notEqual(ip, "6.6.6.6");
  assert.equal(ip, UNKNOWN_CLIENT_IP);
});

test("production: CF-Connecting-IP wins even when a spoofed X-Forwarded-For is also present", () => {
  setNodeEnv("production");
  const request = requestWithHeaders({
    "cf-connecting-ip": "203.0.113.9",
    "x-forwarded-for": "6.6.6.6",
  });
  assert.equal(getClientIp(request), "203.0.113.9");
});

test("production: no CF-Connecting-IP and no X-Forwarded-For also falls back to the unknown sentinel", () => {
  setNodeEnv("production");
  const request = requestWithHeaders({});
  assert.equal(getClientIp(request), UNKNOWN_CLIENT_IP);
});

test("local dev: X-Forwarded-For is used when CF-Connecting-IP is absent", () => {
  setNodeEnv("development");
  const request = requestWithHeaders({ "x-forwarded-for": "198.51.100.4" });
  assert.equal(getClientIp(request), "198.51.100.4");
});

test("local dev: CF-Connecting-IP still wins over X-Forwarded-For when both are present", () => {
  setNodeEnv("development");
  const request = requestWithHeaders({
    "cf-connecting-ip": "203.0.113.11",
    "x-forwarded-for": "198.51.100.4",
  });
  assert.equal(getClientIp(request), "203.0.113.11");
});

test("local dev: no headers at all fails open (null), same as before", () => {
  setNodeEnv("development");
  const request = requestWithHeaders({});
  assert.equal(getClientIp(request), null);
});

test("rateLimit: the shared unknown-IP bucket is capped tighter than a caller's own limit", async () => {
  const key = `spoof-test-bucket-${Math.random()}:${UNKNOWN_CLIENT_IP}`;
  const generousLimit = 1000;

  // The unknown bucket is hard-capped (currently 3) regardless of the
  // generous limit the caller asked for - prove the cap actually bites by
  // driving it well past 3 and confirming it gets denied long before 1000.
  let allowedCount = 0;
  for (let i = 0; i < 10; i++) {
    if (await rateLimit(key, generousLimit, 60_000)) allowedCount += 1;
  }
  assert.ok(allowedCount <= 3, `expected the unknown-IP bucket to allow at most 3 requests, allowed ${allowedCount}`);
});

test("rateLimit: a real (non-unknown) bucket still gets its full requested limit", async () => {
  const key = `spoof-test-bucket:203.0.113.42:${Math.random()}`;
  const limit = 5;

  let allowedCount = 0;
  for (let i = 0; i < 10; i++) {
    if (await rateLimit(key, limit, 60_000)) allowedCount += 1;
  }
  assert.equal(allowedCount, limit);
});

test("checkRateLimit: spoofing X-Forwarded-For to a fresh value does not reset a real IP's bucket", () => {
  // Simulates the actual attack this fix closes: before, a caller could
  // change X-Forwarded-For per request in production and get a brand new
  // rate-limit bucket every time. Post-fix, production ignores XFF
  // entirely (covered above); this test locks in that the underlying
  // in-memory limiter itself still keys strictly off the string it's
  // given - i.e. two different XFF-derived strings really do produce two
  // different buckets, which is exactly why trusting a client-suppliable
  // value for that string was the bug.
  const bucket = `spoof-underlying-${Math.random()}`;
  for (let i = 0; i < 5; i++) {
    assert.equal(checkRateLimit(`${bucket}:same-ip`, 5, 60_000), true);
  }
  // The 6th request against the SAME key is correctly denied...
  assert.equal(checkRateLimit(`${bucket}:same-ip`, 5, 60_000), false);
  // ...but a request that could freely pick a NEW key (the old spoofing
  // bug) trivially bypasses it. This is the behavior getClientIp() now
  // prevents by refusing to let production requests choose their own key.
  assert.equal(checkRateLimit(`${bucket}:attacker-picks-a-new-ip`, 5, 60_000), true);
});
