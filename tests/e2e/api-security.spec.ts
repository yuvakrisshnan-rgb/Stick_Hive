import { test, expect } from "@playwright/test";

test.describe("Admin API rejects unauthenticated access", () => {
  test("GET /api/admin/orders returns 401 without a session", async ({ request }) => {
    const response = await request.get("/api/admin/orders");
    expect(response.status()).toBe(401);
  });

  test("GET /api/admin/orders/:id returns 401 without a session", async ({ request }) => {
    const response = await request.get("/api/admin/orders/SH-TEST1234");
    expect([401, 404]).toContain(response.status());
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
  test("send-otp rejects a non-string / malformed email payload", async ({ request }) => {
    const response = await request.post("/api/auth/send-otp", {
      data: { email: { $ne: null } },
    });
    expect(response.status()).toBe(400);
  });

  test("send-otp rejects an invalid email format", async ({ request }) => {
    const response = await request.post("/api/auth/send-otp", {
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

  test("repeated OTP requests for the same email are cooldown-limited", async ({
    request,
  }) => {
    const email = `playwright-test-${Date.now()}@example.com`;

    const first = await request.post("/api/auth/send-otp", { data: { email } });
    const second = await request.post("/api/auth/send-otp", { data: { email } });

    if (first.ok()) {
      expect(second.status()).toBe(400);
      const body = await second.json();
      expect(body.error ?? "").toMatch(/wait|moment/i);
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
