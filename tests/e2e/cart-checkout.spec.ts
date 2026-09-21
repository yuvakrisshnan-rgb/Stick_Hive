import { test, expect } from "@playwright/test";

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
  test.beforeEach(async ({ page }) => {
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

  test("rejects an invalid email format client-side", async ({ page }) => {
    const emailInput = checkoutForm(page).getByLabel(/email/i);
    await emailInput.fill("not-an-email");
    await emailInput.blur();

    const isInvalid = await emailInput.evaluate(
      (el: HTMLInputElement) => !el.checkValidity(),
    );
    expect(isInvalid).toBeTruthy();
  });

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

  test("blocks placing an order before email verification", async ({ page }) => {
    const form = checkoutForm(page);
    await form.getByLabel(/full name/i).fill("Test User");
    await form.getByLabel(/email/i).fill("test@example.com");
    await form.getByLabel(/phone/i).fill("9876543210");
    await form.getByLabel(/address line 1/i).fill("123 Test Street");
    await form.getByLabel(/pin code/i).fill("110001");

    // Was /verify email|pay/i, unscoped - the checkout page's Razorpay
    // payment-method list also has a button (accessible name starting
    // "₹ UPI (direct) You'll get a...") that this loose alternation
    // apparently also matched, causing a strict-mode violation against 2
    // elements. The actual disabled-until-verified button - "Verify Email
    // To Continue" - lives in src/app/checkout/page.tsx itself, outside
    // customer-form.tsx's checkout-form section, so it isn't scoped to
    // `form` like the fields above.
    const payButton = page.getByRole("button", { name: /verify email to continue/i });
    await expect(payButton).toBeDisabled();
  });
});
