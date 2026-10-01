import { test, expect, type Page } from "@playwright/test";

// Checkout now requires an actual signed-in session (2026-10-02 - see
// DECISIONS.md): the old embedded "Verify Email" OTP step turned out to
// just be the sign-in OTP under a different URL, so it's gone, and a
// guest can no longer reach the checkout form at all. Mint a real session
// the same way signed-in-checkout.spec.ts does, rather than reimplementing
// backend/auth/crypto.ts's signing here too.
async function signIn(page: Page, email: string) {
  const response = await page.request.post("/api/dev/mint-session", {
    data: { email },
  });
  expect(response.ok(), "mint-session failed - is AUTH_TEST_SESSION_SEAM=true set in .dev.vars?").toBeTruthy();
}

// The cart drawer is intentionally auth-gated (cart-drawer.tsx's
// SignedOutCart - "Your Stick Hive cart is tied to your account so only
// you can see it"), not a bug: view-cart-without-signing-in never worked
// and isn't supposed to. These tests don't attempt to fabricate a session
// (that would mean reimplementing backend/auth/crypto.ts's signing in the
// test harness, a real but separate test-infra gap - see BACKLOG.md) - they
// verify the actual guest experience instead of the pre-auth-gate
// assumption the old versions of these tests made.
test.describe("Cart", () => {
  test("adding a product as a guest opens the cart drawer with a sign-in prompt", async ({ page }) => {
    await page.goto("/shop");

    const firstProduct = page.locator('a[href^="/shop/"]').first();
    await firstProduct.click();

    await page.getByRole("button", { name: /add to cart/i }).click();

    // Scoped to the drawer's dialog role: the navbar behind it also has its
    // own "Sign in" trigger button with the same accessible name.
    const cartDialog = page.getByRole("dialog", { name: /shopping cart/i });
    await expect(cartDialog.getByRole("heading", { name: /your hive/i })).toBeVisible();
    await expect(cartDialog.getByRole("heading", { name: /sign in to view your cart/i })).toBeVisible();
    await expect(cartDialog.getByRole("button", { name: /sign in/i })).toBeVisible();
  });

  test("cart persists across a page reload (localStorage)", async ({ page }) => {
    await page.goto("/shop");
    const firstProduct = page.locator('a[href^="/shop/"]').first();
    await firstProduct.click();
    await page.getByRole("button", { name: /add to cart/i }).click();

    await page.reload();

    const cartIndicator = page.locator("[data-cart-count], header button[aria-label*='cart' i]");
    await expect(cartIndicator.first()).toBeVisible();
  });

  test("empty cart shows an empty state at checkout", async ({ page, context }) => {
    await context.clearCookies();
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.goto("/checkout");

    await expect(page.getByText(/cart is empty/i)).toBeVisible();
  });
});

test.describe("Checkout form validation", () => {
  // These exercise the delivery-address fields, which are unrelated to
  // auth - but reaching the checkout form at all now requires a real
  // signed-in session (see this file's top-of-file comment), so each test
  // signs in first instead of visiting /checkout as a guest.
  test.beforeEach(async ({ page }) => {
    await signIn(page, `e2e-checkout-form-${test.info().workerIndex}-${Date.now()}@example.com`);
    await page.goto("/shop");
    await page.locator('a[href^="/shop/"]').first().click();
    await page.getByRole("button", { name: /add to cart/i }).click();
    await page.goto("/checkout");
  });

  // Scoped to the checkout form (data-testid="checkout-form" on
  // customer-form.tsx's root <section>) rather than the whole page: the
  // site-wide footer also renders a newsletter email input and a mailto
  // "Email" link on every page including /checkout, so an unscoped
  // getByLabel(/email/i) matches 2-3 elements and throws a strict-mode
  // violation instead of finding the checkout form's own field.
  function checkoutForm(page: import("@playwright/test").Page) {
    return page.getByTestId("checkout-form");
  }

  test("rejects a PIN code that doesn't exist", async ({ page }) => {
    const pincodeInput = checkoutForm(page).getByLabel(/pin code/i);
    // "000000" fails the *format* check (must start 1-9) before the lookup
    // ever runs, so it can't exercise this "doesn't exist" message -
    // "999999" is 6 digits and format-valid, but isn't a real Indian PIN
    // code (confirmed against the live India Post API: Status "Error",
    // "No records found"), so it actually reaches the not-found branch.
    await pincodeInput.fill("999999");

    await expect(page.getByText(/doesn.t seem to exist|invalid pin/i)).toBeVisible({
      timeout: 8000,
    });
  });

  test("auto-fills city and state for a real PIN code", async ({ page }) => {
    const pincodeInput = checkoutForm(page).getByLabel(/pin code/i);
    await pincodeInput.fill("110001");

    await expect(checkoutForm(page).getByLabel(/city/i)).not.toHaveValue("", { timeout: 8000 });
    await expect(checkoutForm(page).getByLabel(/state/i)).not.toHaveValue("", { timeout: 8000 });
  });

  test("email field shows the signed-in account's address, locked and already verified", async ({ page }) => {
    // Checkout no longer has its own email-verify step (nor an editable
    // email field) - signed-in-checkout.spec.ts covers this in depth; this
    // just confirms the "Checkout form validation" describe block's own
    // signed-in fixture produces the same, not a separate regression.
    const emailInput = checkoutForm(page).getByLabel(/email/i);
    await expect(emailInput).toBeDisabled();
    await expect(checkoutForm(page).getByText(/verified/i)).toBeVisible();
  });
});
