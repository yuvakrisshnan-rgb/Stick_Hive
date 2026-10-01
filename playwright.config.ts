import { defineConfig, devices } from "@playwright/test";

// Previously the suite ran against whatever `next dev` happened to be
// running, started by hand outside Playwright entirely. Two real problems
// with that (see BACKLOG.md's "Test infrastructure" note, Task 4.3):
//   1. Plain `next dev` aliases `cloudflare:workers` to a no-op shim (see
//      next.config.ts), so getD1() throws - no real D1, meaning no real
//      auth, no real product catalog beyond the static PRODUCTS array
//      fallback. A signed-in test (cart/checkout, Task 4.2's new coverage)
//      is simply not reachable there.
//   2. 4 parallel workers against a cold `next dev` process produced
//      ~30s timeouts from Turbopack on-demand-compile contention, not
//      real app slowness (see DECISIONS.md's 2026-09-21 bug-hunt entry) -
//      a flakiness class structural to `next dev`, not this app.
// `webServer` below now builds the real production artifact (`vinext
// build`) and serves it via the real Workers runtime (`wrangler dev`,
// local D1/R2 - same command `npm run start:vinext` already used for
// manual smoke-testing), on its default port 8787. This is a genuinely
// pre-built, already-compiled server - no on-demand compilation, so the
// contention class in (2) can't occur here either.
//
// Plain http, deliberately, not https - tried switching to
// `wrangler dev --local-protocol https` first (a real, if self-signed,
// TLS listener), motivated by a genuine bug it does fix: this server runs
// with NODE_ENV=production (confirmed: /dev/* 404s here, matching real
// prod), and backend/auth/service.ts's session cookie sets
// `secure: NODE_ENV === "production"` - correct for the real deployment,
// but over plain HTTP locally it silently broke WebKit specifically
// (Chromium has an undocumented "Secure cookies work on localhost over
// HTTP anyway" exception that WebKit doesn't implement, so the mint-
// session cookie was set but never sent back on mobile-safari). Reverted
// anyway: the self-signed TLS handshake overhead under this suite's full
// parallel load measurably destabilized the rest of the suite (21
// failures vs. 11 on plain http, including previously-solid tests like
// custom-sticker.spec.ts and public-pages.spec.ts) - a worse trade than
// the one bug it fixed, and it didn't even fully fix that bug (mobile-
// safari's signed-in checkout test still failed, just differently). See
// BACKLOG.md's test-infrastructure note: mobile-safari's signed-in e2e
// coverage is a known, understood gap, not a mystery - chromium's is
// real and passing.
const PRODUCTION_BUILD_URL = "http://127.0.0.1:8787";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["html", { open: "never" }], ["list"]],

  webServer: {
    command: "npm run build:vinext && npm run start:vinext",
    url: PRODUCTION_BUILD_URL,
    // Building the production artifact first adds real time beyond a dev
    // server's instant startup - generous but not unbounded.
    timeout: 180_000,
    // Reuse a server the developer already has running (e.g. from a
    // manual `npm run start:vinext`) locally, but never in CI - CI must
    // always start from a known-clean build.
    reuseExistingServer: !process.env.CI,
  },

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? PRODUCTION_BUILD_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile-safari",
      use: { ...devices["iPhone 13"] },
    },
  ],
});
