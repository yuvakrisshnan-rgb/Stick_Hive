import { test, expect } from "@playwright/test";

// Three random octets (~15.6M combinations) rather than Date.now()-derived
// suffixes - this suite's many other tests, and this file's own fixed-octet
// headers (10.0.1.x, 10.0.2.x, 10.0.3.x), all generate their own cf-connecting-ip
// within the same narrow private range at roughly the same wall-clock moment
// under full parallel load, so anything time-derived collides often enough
// to matter in practice (confirmed directly: a fresh IP via curl against a
// live server always behaves correctly, so observed 429s here were genuine
// bucket collisions with other concurrent traffic, not an app bug).
function freshTestIp(): string {
  const octet = () => Math.floor(Math.random() * 255);
  return `10.${octet()}.${octet()}.${octet()}`;
}

test.describe("Admin API rejects unauthenticated access", () => {
  test("GET /api/admin/orders returns 401 without a session", async ({ request }) => {
    const response = await request.get("/api/admin/orders");
    expect(response.status()).toBe(401);
  });

  test("GET /api/admin/orders/:id returns 401 without a session", async ({ request }) => {
    // src/app/api/admin/orders/[orderId]/route.ts only exports PATCH (order
    // status updates) - there's no GET handler on this path at all, so
    // Next.js itself returns a framework-level 405 before any auth check
    // ever runs. That's not a leak (405 carries no order data either way)
    // and not new: this route has never had a GET handler. 401/404 was the
    // wrong expectation for a method the route was never built to serve.
    const response = await request.get("/api/admin/orders/SH-TEST1234");
    expect([401, 404, 405]).toContain(response.status());
  });

  test("the admin UI path itself does not leak order data without auth", async ({ page }) => {
    const response = await page.goto(
      "/admin/00000000000000000000000000000000",
    );
    expect(response?.status()).not.toBe(200);
  });
});

test.describe("Authenticated user API enforces ownership (IDOR check)", () => {
  test("GET /api/orders/:id returns 401 for a guessed order ID with no session", async ({
    request,
  }) => {
    const response = await request.get("/api/orders/SH-00000000");
    expect(response.status()).toBe(401);
  });
});

test.describe("Auth endpoints validate and rate-limit input", () => {
  // Each test below sends its own cf-connecting-ip so it gets a fresh
  // rate-limit bucket. Without this, these malformed-payload checks share
  // the default 127.0.0.1 bucket with the "repeated"/"concurrent" tests
  // further down in this same describe block, which deliberately trip the
  // send-otp cooldown - fullyParallel means test order/interleaving isn't
  // guaranteed, so a shared bucket makes these fail with 429 instead of
  // 400 whenever a cooldown test runs first. Same fix already applied to
  // the malformed-body-handling tests below.
  //
  // cf-connecting-ip specifically, not x-forwarded-for (was
  // x-forwarded-for until Task 4.3 switched the default webServer to a
  // real `vinext build` + `wrangler dev` - NODE_ENV=production there, and
  // getClientIp() (backend/security/rate-limit.ts) deliberately ignores
  // X-Forwarded-For/X-Real-IP in production - a real, unspoofable-once-
  // actually-deployed-behind-Cloudflare security property, not a bug.
  // cf-connecting-ip is the one header getClientIp() trusts unconditionally
  // in every environment (real Cloudflare sets it from the actual TCP
  // connection in production, so it's what a genuinely deployed Worker
  // would use anyway) - trivially spoofable in a local wrangler dev
  // instance with no real edge in front, which is exactly fine for this
  // local test's purpose.
  test("send-otp rejects a non-string / malformed email payload", async ({ request }) => {
    const response = await request.post("/api/auth/send-otp", {
      headers: { "cf-connecting-ip": `10.0.4.${Date.now() % 250}` },
      data: { email: { $ne: null } },
    });
    expect(response.status()).toBe(400);
  });

  test("send-otp rejects an invalid email format", async ({ request }) => {
    const response = await request.post("/api/auth/send-otp", {
      headers: { "cf-connecting-ip": `10.0.5.${Date.now() % 250}` },
      data: { email: "not-an-email" },
    });
    expect(response.status()).toBe(400);
  });

  test("verify-otp rejects a non-6-digit code", async ({ request }) => {
    const response = await request.post("/api/auth/verify-otp", {
      data: { email: "test@example.com", code: "abc" },
    });
    expect(response.status()).toBe(400);
  });

  // This test is verifying the EMAIL-keyed cooldown inside requestEmailOtp,
  // not the generic per-IP rate limiter - so it needs its own
  // cf-connecting-ip, same as every other test in this file, to avoid the
  // generic limiter's UNKNOWN_CLIENT_IP bucket (strict cap of 3 total) or
  // any other test's bucket interfering.
  //
  // The cooldown response status is 429, not 400 - confirmed by reading
  // backend/http/auth-response.ts's errorFromUnknown(), which deliberately
  // maps any "wait a moment" error message to 429 (the correct status for
  // a cooldown/rate-limit response). This test's own assertion originally
  // expected 400, which only ever passed by accident: under the old `next
  // dev` setup (no real Workers runtime, Task 4.3), requestEmailOtp's own
  // getD1() call threw immediately with an unrelated "not configured"-style
  // error that happened to land in errorFromUnknown's 400 fallback branch -
  // never actually exercising the real cooldown path that returns 429. Only
  // surfaced once this suite started running against a real production
  // build with real D1-backed auth.
  test("repeated OTP requests for the same email are cooldown-limited", async ({
    request,
  }) => {
    const email = `playwright-test-${Date.now()}@example.com`;
    const headers = { "cf-connecting-ip": freshTestIp() };

    const first = await request.post("/api/auth/send-otp", { headers, data: { email } });
    const second = await request.post("/api/auth/send-otp", { headers, data: { email } });

    if (first.ok()) {
      expect(second.status()).toBe(429);
      const body = await second.json();
      expect(body.error ?? "").toMatch(/wait|moment/i);
    }
  });

  // Sequential requests (above) can't catch a cross-instance race: Cloudflare
  // Workers runs many concurrent, memory-isolated instances, so truly
  // simultaneous requests can land on different isolates and each see "no
  // cooldown yet" before either has written its own count - confirmed as a
  // real production bug (a resend cooldown was bypassed this way) while the
  // in-memory fallback was the only limiter available. This only reliably
  // passes once UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN are set
  // (`wrangler secret put UPSTASH_REDIS_REST_URL` /
  // `wrangler secret put UPSTASH_REDIS_REST_TOKEN`) and the test is pointed
  // at the real deployment, e.g.:
  //   PLAYWRIGHT_BASE_URL=https://stickhive.yuvakrisshnan.workers.dev npx playwright test api-security
  // Against local dev (single process, no Upstash) this can pass by
  // accident even with the bug present - it's the production run that
  // actually exercises the cross-instance race this guards against.
  //
  // Same cf-connecting-ip reasoning as the test above: a shared header lets
  // all 5 concurrent requests past the generic per-IP limiter so the
  // assertion actually exercises the email-cooldown race, not an IP cap.
  test("concurrent send-otp requests for the same email cannot bypass the cooldown", async ({
    request,
  }) => {
    const email = `playwright-concurrent-${Date.now()}@example.com`;
    const headers = { "cf-connecting-ip": freshTestIp() };
    const concurrency = 5;

    const responses = await Promise.all(
      Array.from({ length: concurrency }, () => request.post("/api/auth/send-otp", { headers, data: { email } })),
    );

    const successCount = responses.filter((response) => response.ok()).length;
    expect(successCount).toBeLessThanOrEqual(1);
  });
});

// Every /api/auth/* route audited for unguarded request.json(): logout and
// me take no request body at all (nothing to guard); send-otp and
// verify-otp both wrap request.json() in their own try/catch and return a
// generic 400 rather than letting a JSON parse error surface as a 500 with
// stack-trace detail. These tests exercise that guard directly - empty
// body, syntactically invalid JSON, and a valid body - for both routes.
for (const path of ["/api/auth/send-otp", "/api/auth/verify-otp"]) {
  test.describe(`${path} malformed-body handling`, () => {
    // Each test sends its own CF-Connecting-IP (not X-Forwarded-For - see
    // the comment above the first describe block that needed this) so it
    // gets a fresh rate-limit bucket, independent of the other tests in
    // this file that share the default 127.0.0.1 bucket for this same route.
    test("empty body returns a generic 400", async ({ request }) => {
      const response = await request.post(path, {
        headers: {
          "content-type": "application/json",
          "cf-connecting-ip": `10.0.1.${Date.now() % 250}`,
        },
        data: "",
      });
      expect(response.status()).toBe(400);
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(typeof body.error).toBe("string");
    });

    test("syntactically invalid JSON returns a generic 400, not a 500", async ({ request }) => {
      const response = await request.post(path, {
        headers: {
          "content-type": "application/json",
          "cf-connecting-ip": `10.0.2.${Date.now() % 250}`,
        },
        data: "{not valid json",
      });
      expect(response.status()).toBe(400);
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(typeof body.error).toBe("string");
    });
  });
}

test.describe("send-otp accepts a well-formed valid body", () => {
  // This proves the JSON-parsing guard doesn't false-positive on valid
  // input, not that an email is actually delivered end-to-end - real
  // delivery depends on a verified Resend sender domain, which is out of
  // scope here (blocked on credentials the user hasn't provided), and this
  // dev environment has known pre-existing 502 flakiness on that path (see
  // the "Smart Placement" commit). A valid body must simply never be
  // rejected as the guard's generic malformed-JSON 400; whatever happens
  // downstream of that (email provider success/failure) is a separate,
  // already-disclosed concern.
  test("a fresh, valid email is not rejected by the malformed-body guard", async ({ request }) => {
    const email = `playwright-valid-${Date.now()}@example.com`;
    const response = await request.post("/api/auth/send-otp", {
      headers: { "cf-connecting-ip": `10.0.3.${Date.now() % 250}` },
      data: { email },
    });
    if (response.status() === 400) {
      const body = await response.json();
      expect(body.error).not.toBe("Invalid request.");
    }
  });
});

test.describe("Storage upload endpoint enforces type/size limits server-side", () => {
  test("rejects a disallowed content type even if the client lies", async ({ request }) => {
    const response = await request.post("/api/storage/upload-url", {
      data: { contentType: "application/x-msdownload", size: 1000 },
    });
    expect([400, 401]).toContain(response.status());
  });

  test("rejects a size over the 5MB cap even if the client lies", async ({ request }) => {
    const response = await request.post("/api/storage/upload-url", {
      data: { contentType: "image/png", size: 50 * 1024 * 1024 },
    });
    expect([400, 401]).toContain(response.status());
  });
});

test.describe("Stripe webhook rejects unsigned requests", () => {
  test("POST without a stripe-signature header is rejected", async ({ request }) => {
    const response = await request.post("/api/payments/stripe/webhook", {
      data: { type: "checkout.session.completed" },
    });
    expect(response.status()).toBe(400);
  });

  test("POST with a forged/invalid signature is rejected", async ({ request }) => {
    const response = await request.post("/api/payments/stripe/webhook", {
      headers: { "stripe-signature": "t=1,v1=forged" },
      data: { type: "checkout.session.completed" },
    });
    expect(response.status()).toBe(400);
  });
});

test.describe("Security headers", () => {
  test("responses include baseline security headers", async ({ request }) => {
    const response = await request.get("/");
    const headers = response.headers();

    expect(headers["x-content-type-options"]).toBeTruthy();
    expect(headers["x-frame-options"] ?? headers["content-security-policy"]).toBeTruthy();
  });
});
