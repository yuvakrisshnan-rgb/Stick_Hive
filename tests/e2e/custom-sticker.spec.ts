import { test, expect } from "@playwright/test";

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
});
