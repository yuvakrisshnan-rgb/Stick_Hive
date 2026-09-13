import { test, expect } from "@playwright/test";

test.describe("Public pages load without errors", () => {
  test("homepage renders hero and CTA", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    await page.goto("/");

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(
      page.getByRole("link", { name: /create your sticker/i }),
    ).toBeVisible();

    expect(errors, `Console/page errors on homepage:\n${errors.join("\n")}`).toEqual([]);
  });

  test("about page renders and bees animate without crashing", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await page.goto("/about");
    await expect(page.getByText(/from a classroom idea/i)).toBeVisible();
    await page.waitForTimeout(1000);

    expect(errors).toEqual([]);
  });

  test("shop page lists products", async ({ page }) => {
    await page.goto("/shop");
    const productLinks = page.locator('a[href^="/shop/"]');
    await expect(productLinks.first()).toBeVisible({ timeout: 10_000 });
    expect(await productLinks.count()).toBeGreaterThan(0);
  });

  test("shop product detail page opens from the catalog", async ({ page }) => {
    await page.goto("/shop");
    const firstProduct = page.locator('a[href^="/shop/"]').first();
    await firstProduct.click();
    await expect(page).toHaveURL(/\/shop\/.+/);
    await expect(page.getByRole("button", { name: /add to cart/i })).toBeVisible();
  });

  test("footer legal pages are reachable", async ({ page }) => {
    for (const path of ["/privacy", "/terms", "/returns", "/shipping", "/faq"]) {
      await page.goto(path);
      await expect(page.locator("main")).not.toBeEmpty();
    }
  });

  test("404 page shows for an unknown route", async ({ page }) => {
    const response = await page.goto("/this-route-does-not-exist-xyz");
    expect(response?.status()).toBe(404);
  });
});
