import { test, expect } from "@playwright/test";

// Regression coverage for the bug where the UPI QR on order-success
// rendered as a broken image for every buyer, on every device: a
// client-generated data:image/png;base64,... src passed into next/image's
// <Image> without `unoptimized` gets routed through
// /_next/image?url=data:..., which 400s ("Invalid image optimization
// parameters") since the optimizer doesn't handle inline data URIs.
//
// Every prior verification pass in this effort checked that checkout/order
// creation succeeded - never whether the QR actually rendered - which is
// exactly how this shipped unnoticed. This test asserts the rendered <img>
// actually loaded (non-zero natural dimensions, no broken-image state) and
// that /_next/image was never hit for it, against
// src/app/dev/qr-render-check/page.tsx - a fixture that mirrors
// order-success's real <Image> usage exactly (same qrcode package call,
// same props), since driving the real authenticated checkout flow isn't
// possible in this harness (see cart-checkout.spec.ts's header comment).
//
// MUST run against `npm run dev:vinext` (port 3001), not plain `npm run
// dev` - confirmed directly: plain Next.js dev's built-in image optimizer
// tolerates a data: URI fine even without `unoptimized`, so this test
// passes there regardless of whether the real fix is present and would
// have missed this bug entirely. The 400 only reproduces against vinext's
// own Cloudflare Workers image-optimization implementation, which is what
// production actually runs - same "test under dev:vinext, not plain dev"
// rule this codebase already applies elsewhere (see DEPLOY_CHECKLIST.md /
// prior dev-preview work). Run explicitly with:
//   PLAYWRIGHT_BASE_URL=http://localhost:3001 npx playwright test tests/e2e/qr-render-check.spec.ts
test.describe("QR code rendering via next/image", () => {
  test("a data-URI QR image loads successfully and bypasses the image optimizer", async ({ page }) => {
    // Scoped to requests optimizing a data: URI specifically - the page's
    // own navbar/footer logos are legitimately optimized static images and
    // hit /_next/image too; only a request for our data: URI would prove
    // the bug (the optimizer routing a data URI through itself, which 400s).
    const dataUriOptimizeRequests: string[] = [];
    page.on("request", (request) => {
      const url = request.url();
      if (url.includes("/_next/image") && url.includes("url=data%3A")) dataUriOptimizeRequests.push(url);
    });

    await page.goto("/dev/qr-render-check");

    const qrImage = page.getByTestId("qr-render-check-image");
    await expect(qrImage).toBeVisible();
    // toBeVisible() only proves a non-zero layout box - it resolves before
    // the browser has actually finished loading/decoding the image data
    // (this genuinely raced on WebKit locally), so wait for the browser to
    // settle the image one way or the other before reading natural
    // dimensions. Waiting on "load" alone would hang forever in the broken
    // case this test exists to catch - a failed data-URI load fires "error",
    // never "load" - so both are handled, letting the dimension assertions
    // below fail with a clear message instead of a vague timeout.
    await qrImage.evaluate(
      (el: HTMLImageElement) =>
        el.complete
          ? undefined
          : new Promise<void>((resolve) => {
              el.addEventListener("load", () => resolve(), { once: true });
              el.addEventListener("error", () => resolve(), { once: true });
            }),
    );

    const naturalSize = await qrImage.evaluate((el: HTMLImageElement) => ({
      complete: el.complete,
      naturalWidth: el.naturalWidth,
      naturalHeight: el.naturalHeight,
    }));

    // el.complete becomes true once the browser has settled the image
    // either way (load or error) - it does not by itself distinguish
    // success from failure. naturalWidth/naturalHeight are what actually
    // distinguish "loaded successfully" from "broken-image icon" (0x0),
    // which is exactly the state this bug left the real QR in.
    expect(naturalSize.complete).toBe(true);
    expect(naturalSize.naturalWidth).toBeGreaterThan(0);
    expect(naturalSize.naturalHeight).toBeGreaterThan(0);

    // The root cause this guards against: without `unoptimized`, next/image
    // would have issued a /_next/image?url=data:... request (which 400s for
    // data URIs). Zero such requests proves the optimizer was bypassed, not
    // merely that some image happened to load.
    expect(dataUriOptimizeRequests).toHaveLength(0);
  });
});
