import { test, expect } from "@playwright/test";

// next.config.ts's CSP deliberately omits 'unsafe-eval' (documented there:
// re-enabling it site-wide is a bigger XSS trade-off than the one dev-mode
// convenience it would restore). The unavoidable side effect, confirmed by
// the message's own text ("React will never use eval() in production
// mode"), is that React's dev-only debugging eval() calls log this exact
// console error on every single page load under `next dev` - it's not
// present in production and isn't a real per-page defect, so it's
// filtered out here rather than either weakening the CSP or asserting
// against a message this suite can never actually keep clean under dev.
const KNOWN_DEV_ONLY_NOISE = /eval\(\) is not supported in this environment/;

test.describe("Public pages load without errors", () => {
  test("homepage renders hero and CTA", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    page.on("console", (msg) => {
      if (msg.type() === "error" && !KNOWN_DEV_ONLY_NOISE.test(msg.text())) {
        errors.push(msg.text());
      }
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
    // Current copy (src/app/about/page.tsx:227) is "began as a classroom
    // idea", not "from a classroom idea" - this regex was checking for
    // wording the page has never actually had in this session's history.
    await expect(page.getByText(/classroom idea/i).first()).toBeVisible();
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
