import { test, expect } from "@playwright/test";
import sharp from "sharp";

test.describe("Custom sticker builder", () => {
  test("loads the canvas editor", async ({ page }) => {
    await page.goto("/custom-sticker");
    await expect(page.getByRole("button", { name: /add text/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /add image/i })).toBeVisible();
  });

  test("adding text creates a selectable layer", async ({ page }) => {
    await page.goto("/custom-sticker");
    await page.getByRole("button", { name: /add text/i }).click();

    await expect(page.getByLabel(/^text$/i)).toBeVisible();
  });

  test("undo/redo buttons respond to layer changes", async ({ page }) => {
    await page.goto("/custom-sticker");

    const undoButton = page.getByRole("button", { name: /undo/i });
    await expect(undoButton).toBeDisabled();

    await page.getByRole("button", { name: /add text/i }).click();
    await expect(undoButton).toBeEnabled();

    // Adding text opens the text-properties panel, which on a mobile
    // viewport is a bottom sheet tall enough (sticker-editor-shell.tsx) to
    // cover the toolbar underneath, including Undo/Redo - a real mobile
    // user has to close it first too. Desktop never shows this panel here,
    // so it's a no-op there.
    //
    // This is the small visible "X" inside the panel header, not the
    // full-viewport backdrop button (aria-label="Close panel") that sits
    // behind the panel - that backdrop's own center point is covered by
    // the panel itself, so clicking it here would hit the same
    // pointer-events interception this fix is for.
    const closePanel = page.getByRole("button", { name: /close panel and deselect/i });
    if (await closePanel.isVisible()) {
      await closePanel.click();
    }

    await undoButton.click();
    const redoButton = page.getByRole("button", { name: /redo/i });
    await expect(redoButton).toBeEnabled();
  });

  test("uploading an oversized image is rejected", async ({ page }) => {
    await page.goto("/custom-sticker");

    const bigBuffer = Buffer.alloc(6 * 1024 * 1024, 1);

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: "too-big.png",
      mimeType: "image/png",
      buffer: bigBuffer,
    });

    await expect(page.getByText(/smaller than 5mb/i)).toBeVisible();
  });

  test("uploading a disallowed file type is rejected", async ({ page }) => {
    await page.goto("/custom-sticker");

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: "not-an-image.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("hello"),
    });

    await expect(page.getByText(/png, jpg, or webp/i)).toBeVisible();
  });

  test("background-removal failure shows a fallback message and routes to the manual eraser", async ({ page }) => {
    // Forces the real failure path deterministically (blocking @imgly/
    // background-removal's model CDN makes its fetch reject) rather than
    // relying on the separately-tracked CSP/'unsafe-eval' issue to
    // reproduce on its own - this test is about the fallback UI, not that
    // specific root cause, and must pass regardless of whether that issue
    // is ever fixed.
    await page.route("https://staticimgly.com/**", (route) => route.abort());

    await page.goto("/custom-sticker");

    const buffer = await sharp({
      create: { width: 64, height: 64, channels: 4, background: { r: 200, g: 50, b: 50, alpha: 1 } },
    })
      .png()
      .toBuffer();

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({ name: "test.png", mimeType: "image/png", buffer });

    // The old, silent behavior was a console.warn only - nothing visible.
    // This is the actual regression test: a real user must see this.
    await expect(
      page.getByText(/Background removal isn't available right now/i),
    ).toBeVisible({ timeout: 20000 });

    const openEraserButton = page.getByRole("button", { name: /Open Manual Eraser/i });
    await expect(openEraserButton).toBeVisible();
    await openEraserButton.click();

    await expect(page.getByText(/Manual Erase/i)).toBeVisible();
  });
});
