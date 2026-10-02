import { test, expect, type Page } from "@playwright/test";

// ============================================================================
// SIGNED-IN CART/CHECKOUT — Task 4.2
// ============================================================================
//
// cart-checkout.spec.ts's own header comment explains why every test there
// only covers the guest experience: there was no way to reach a real
// signed-in session in the test harness without reimplementing
// backend/auth/crypto.ts's signing (see BACKLOG.md's "Test infrastructure"
// note). That gap is closed here via POST /api/dev/mint-session
// (backend/auth/service.ts's mintTestSession) - a dev-only seam, gated on
// AUTH_TEST_SESSION_SEAM=true (set in .dev.vars, never in wrangler.jsonc's
// committed vars, so never reachable on the real deployed site), that
// creates a real user row + a real sessions-table row + the real httpOnly
// cookie - the exact same end state verifyEmailOtp() produces, just
// without the OTP round-trip.
//
// This suite therefore needs the real Worker runtime behind it (D1, the
// auth tables) - playwright.config.ts's webServer now serves the actual
// `vinext build` output via `wrangler dev` (Task 4.3) specifically so
// this is reachable through the normal `npm run test:e2e` command, not
// just via a manually-started `dev:vinext`.
//
// Checkout no longer runs its own email-verification step - that changed
// 2026-10-02 (see DECISIONS.md). Checkout's "Verify Email" step turned out
// to just be the sign-in OTP under a different URL, so it's gone: a
// shopper now has to already be signed in (mint-session here, the real
// navbar OTP flow for a human) before checkout/page.tsx will even render
// the form, and the email field is then a read-only display of the
// session's own address. Direct UPI (QR code + deep link, paid straight
// to the store's own VPA, no payment gateway) is the only payment method
// - it needs STICKHIVE_UPI_ID set in .dev.vars, but unlike Razorpay there's
// no enablement flag gating the "Continue to Payment" button itself.

async function signIn(page: Page, email: string) {
  const response = await page.request.post("/api/dev/mint-session", {
    data: { email },
  });
  expect(response.ok(), "mint-session failed - is AUTH_TEST_SESSION_SEAM=true set in .dev.vars?").toBeTruthy();
}

test.describe("Signed-in cart/checkout", () => {
  // A unique CF-Connecting-IP per test, on every request in this file (not
  // just the OTP ones) - see api-security.spec.ts's comment for the full
  // reason: getClientIp() (backend/security/rate-limit.ts) only trusts
  // CF-Connecting-IP in production (which the real webServer this suite
  // now runs against genuinely is - NODE_ENV=production, Task 4.3), and
  // with no header at all every request collapses into the same
  // UNKNOWN_CLIENT_IP bucket (capped at 3 total requests) shared with
  // every other spec file's send-otp-family calls. Three random octets
  // (~15.6M combinations), not a Date.now()-derived suffix - under full
  // parallel load, many tests across the suite generate their own IP at
  // roughly the same wall-clock moment, so anything time-derived collides
  // often enough in practice to matter (same fix as api-security.spec.ts's
  // freshTestIp(), confirmed the hard way there).
  test.beforeEach(async ({ page }) => {
    const octet = () => Math.floor(Math.random() * 255);
    await page.context().setExtraHTTPHeaders({
      "cf-connecting-ip": `10.${octet()}.${octet()}.${octet()}`,
    });
  });

  test("a signed-in shopper sees real cart contents in the drawer, not the sign-in prompt", async ({ page }) => {
    await signIn(page, `e2e-cart-${test.info().workerIndex}-${Date.now()}@example.com`);

    await page.goto("/shop");
    const firstProduct = page.locator('a[href^="/shop/"]').first();
    const productName = await firstProduct.locator("h3, h2").first().textContent().catch(() => null);
    await firstProduct.click();

    await page.getByRole("button", { name: /add to cart/i }).click();

    const cartDialog = page.getByRole("dialog", { name: /shopping cart/i });
    await expect(cartDialog.getByRole("heading", { name: /your hive/i })).toBeVisible();
    // The real thing this test proves: no "Sign in to view your cart" gate,
    // and the actual line item (not a placeholder) renders.
    await expect(cartDialog.getByRole("heading", { name: /sign in to view your cart/i })).toHaveCount(0);
    await expect(cartDialog.getByText(/^1 item$/)).toBeVisible();
    if (productName) {
      await expect(cartDialog.getByText(productName.trim())).toBeVisible();
    }
  });

  test("a signed-in shopper's email is already filled in and locked at checkout", async ({ page }) => {
    await signIn(page, `e2e-locked-email-${test.info().workerIndex}-${Date.now()}@example.com`);

    await page.goto("/shop");
    await page.locator('a[href^="/shop/"]').first().click();
    await page.getByRole("button", { name: /add to cart/i }).click();
    await page.goto("/checkout");

    // No "Sign in to checkout" gate, and no "Verify" button - the email
    // field just shows the signed-in session's own address, read-only.
    await expect(page.getByRole("heading", { name: /sign in to checkout/i })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /^verify$/i })).toHaveCount(0);

    const form = page.getByTestId("checkout-form");
    const emailField = form.getByLabel(/email/i);
    await expect(emailField).toBeDisabled();
    await expect(emailField).toHaveValue(/@example\.com$/);
    await expect(form.getByText(/verified/i)).toBeVisible();
  });

  test("a visitor who isn't signed in is asked to sign in before checkout, not shown an email-verify step", async ({ page }) => {
    await page.goto("/shop");
    await page.locator('a[href^="/shop/"]').first().click();
    await page.getByRole("button", { name: /add to cart/i }).click();
    await page.goto("/checkout");

    await expect(page.getByRole("heading", { name: /sign in to checkout/i })).toBeVisible();
    await expect(page.getByTestId("checkout-form")).toHaveCount(0);
  });

  test("a signed-in shopper can place an order that goes straight to the UPI payment screen", async ({ page }) => {
    await signIn(page, `e2e-checkout-${test.info().workerIndex}-${Date.now()}@example.com`);

    await page.goto("/shop");
    await page.locator('a[href^="/shop/"]').first().click();
    await page.getByRole("button", { name: /add to cart/i }).click();
    await page.goto("/checkout");

    const form = page.getByTestId("checkout-form");
    await form.getByLabel(/full name/i).fill("Test User");
    // Not 9876543210 - src/lib/address-validation.ts's isLikelyValidIndianMobile
    // deliberately rejects that exact sequential-descending number as an
    // obviously-fake phone number (found the hard way: this test originally
    // used it and silently failed validateCustomer(), leaving "Place Order"
    // clickable but a no-op - the existing guest test in cart-checkout.spec.ts
    // also uses 9876543210 but never submits far enough to hit this check).
    await form.getByLabel(/phone/i).fill("9123456780");
    await form.getByLabel(/address line 1/i).fill("123 Test Street");
    await form.getByLabel(/pin code/i).fill("110001");
    // City/state are plain editable fields (customer-form.tsx) that the
    // PIN-code lookup merely pre-fills as a convenience - they're not
    // read-only, so filling them directly here doesn't depend on that lookup
    // actually succeeding. It shouldn't: lookupPincode() (address-validation.ts)
    // calls the real third-party api.postalpincode.in directly from the
    // browser, and that API's CORS behavior turned out to be inconsistent -
    // confirmed via a standalone debug script that its OPTIONS preflight
    // response omits Access-Control-Allow-Origin even though plain GETs (and
    // a bare same-page fetch with no app code involved) get `*` - a third-
    // party reliability gap, not anything in this app, and orthogonal to
    // what this test actually verifies (a signed-in checkout completes).
    await form.getByLabel(/city/i).fill("New Delhi");
    await form.getByLabel(/state/i).selectOption("Delhi");

    // Direct UPI is the only (and un-chosen, since there's nothing left to
    // choose) payment method shown - no Razorpay card option anymore.
    await expect(page.getByText(/^UPI$/)).toBeVisible();
    await expect(page.getByText(/cards, upi apps & more \(razorpay\)/i)).toHaveCount(0);

    const orderResponsePromise = page.waitForResponse(
      (response) => response.url().includes("/api/orders") && response.request().method() === "POST",
    );

    await page.getByRole("button", { name: /continue to payment/i }).click();

    const orderResponse = await orderResponsePromise;
    // The real thing this test proves, beyond UI navigation: the server
    // actually accepted and created the order (status() lets a real
    // rejection - e.g. a regression in the D1 product-validation path
    // checkout was rewired to, see DECISIONS.md's 2026-09-21 entry - fail
    // the test loudly instead of the UI silently stalling.
    //
    // Status only, not the response body: checkout/page.tsx's own
    // window.location.href navigation (a pre-existing, deliberately-
    // untouched issue - see BACKLOG.md) fires the instant its own fetch
    // resolves, and wins the race against Playwright's CDP body-fetch
    // every time - confirmed directly with a standalone debug script that
    // even reading the body as the very next statement after this still
    // throws "Response body is not available for a response that was
    // navigated away from." The order's real paymentMethod is verified
    // below instead, from localStorage (written synchronously by
    // handlePlaceOrder() before it navigates - see checkout/page.tsx) and
    // from order-success's own rendered UI, both unaffected by the race.
    expect(orderResponse.status()).toBe(201);

    // Lands on order-success, which shows the UPI QR/deep-link payment
    // screen immediately rather than an "order received" message - it's
    // not "confirmed" at this point, only "created" (see
    // backend/orders/service.ts's awaiting_payment state). The order is
    // only confirmed once an admin verifies the payment, so this test
    // just confirms the order exists and the payment screen is what's
    // shown next, not that a real payment completes.
    await expect(page).toHaveURL(/\/order-success\?orderId=/, { timeout: 15000 });

    const lastOrder = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("stickhive:last-order") ?? "null"),
    );
    expect(lastOrder?.paymentMethod).toBe("upi");

    await expect(page.getByText(/order id/i).first()).toBeVisible();
    await expect(page.getByText(/pay .* via upi/i)).toBeVisible();
  });
});
