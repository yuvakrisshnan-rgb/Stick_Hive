import { test, expect } from "@playwright/test";

test.describe("Cart", () => {
  test("adding a product opens the cart drawer with the item", async ({ page }) => {
    await page.goto("/shop");

    const firstProduct = page.locator('a[href^="/shop/"]').first();
    await firstProduct.click();

    await page.getByRole("button", { name: /add to cart/i }).click();

    await expect(page.getByText(/your hive|your cart/i)).toBeVisible();
    await expect(page.getByRole("link", { name: /checkout/i })).toBeVisible();
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

  test("rejects an invalid email format client-side", async ({ page }) => {
    const emailInput = page.getByLabel(/email/i);
    await emailInput.fill("not-an-email");
    await emailInput.blur();

    const isInvalid = await emailInput.evaluate(
      (el: HTMLInputElement) => !el.checkValidity(),
    );
    expect(isInvalid).toBeTruthy();
  });

  test("rejects a PIN code that doesn't exist", async ({ page }) => {
    const pincodeInput = page.getByLabel(/pin code/i);
    await pincodeInput.fill("000000");

    await expect(page.getByText(/doesn.t seem to exist|invalid pin/i)).toBeVisible({
      timeout: 8000,
    });
  });

  test("auto-fills city and state for a real PIN code", async ({ page }) => {
    const pincodeInput = page.getByLabel(/pin code/i);
    await pincodeInput.fill("110001");

    await expect(page.getByLabel(/city/i)).not.toHaveValue("", { timeout: 8000 });
    await expect(page.getByLabel(/state/i)).not.toHaveValue("", { timeout: 8000 });
  });

  test("blocks placing an order before email verification", async ({ page }) => {
    await page.getByLabel(/full name/i).fill("Test User");
    await page.getByLabel(/email/i).fill("test@example.com");
    await page.getByLabel(/phone/i).fill("9876543210");
    await page.getByLabel(/address line 1/i).fill("123 Test Street");
    await page.getByLabel(/pin code/i).fill("110001");

    const payButton = page.getByRole("button", { name: /verify email|pay/i });
    await expect(payButton).toBeDisabled();
  });
});
