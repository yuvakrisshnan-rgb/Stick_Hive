import type { NextConfig } from "next";

// Site-wide CSP. Starts permissive enough to cover every external resource
// this app actually loads client-side, then should be tightened over time:
//
// - script-src 'unsafe-inline': needed for Next.js App Router's own inline
//   RSC-streaming bootstrap scripts (the `self.__next_f.push(...)` tags it
//   injects for every page). Removing this requires nonce-based CSP via
//   middleware, which this project doesn't have yet - a real follow-up,
//   not done here.
// - script-src blob: 'wasm-unsafe-eval': the ML background-removal library
//   (onnxruntime-web) loads its WASM inference worker from a blob: URL it
//   constructs at runtime, and browsers require the narrower
//   'wasm-unsafe-eval' (not full 'unsafe-eval') to compile/instantiate
//   WebAssembly at all under CSP. Both found by actually exercising the
//   custom sticker upload flow, not something you'd guess from the
//   dependency list alone.
// - style-src 'unsafe-inline': this app uses React inline `style={{...}}`
//   attributes throughout (animations, canvas positioning) - much lower
//   risk than script 'unsafe-inline', but still worth tightening later via
//   nonces if that inline-script work happens.
// - img-src data: blob:: custom sticker uploads are read as data: URIs
//   client-side before upload, and the Razorpay/UPI QR codes are rendered
//   as data: URIs from the `qrcode` package.
// - connect-src includes the S3 upload endpoint (browser PUTs artwork
//   directly to a presigned S3 URL), Razorpay's API/analytics hosts,
//   staticimgly.com (found by actually testing the custom sticker upload
//   flow — @imgly/background-removal fetches its WASM segmentation model
//   from there, not from this app's own origin), and blob: (its inference
//   worker also fetches its own module code back from a blob: URL it
//   creates itself, a separate CSP directive from script-src's blob:).
//   connect-src also needs data: — the sticker editor converts its
//   canvas-rendered artwork to a Blob via fetch(dataUrl) before uploading.
//   api.postalpincode.in: the checkout form's PIN-code lookup
//   (src/lib/address-validation.ts) calls this directly from the browser
//   to auto-fill city/state - without it here the fetch is silently
//   CSP-blocked and lookupPincode()'s catch block reports a generic
//   "check your connection" error instead of ever reaching the real
//   valid/invalid response, so the PIN field never autofills for anyone.
//   Found via the Playwright suite (cart-checkout.spec.ts's PIN tests).
// - frame-src/script-src include Razorpay's checkout domain for its JS
//   Checkout widget (order-success page).
//
// Deliberately NOT added: 'unsafe-eval'. Under this CSP, the ML
// background-removal step (@imgly/background-removal) intermittently hits
// an internal `eval`/`new Function` call in one of its execution-provider
// code paths and fails — but that feature was already built to fail soft
// (see the "Wire automatic ML background removal" commit): it falls back
// to the original uploaded image and the rest of the editor keeps working.
// 'unsafe-eval' would re-enable arbitrary string-to-JS evaluation
// site-wide, a much bigger XSS-mitigation trade-off than anything else in
// this policy, just for one optional convenience feature's edge case.
// Left out on purpose - revisit only if that degraded fallback turns out
// to be unacceptable in practice.
const S3_CONNECT_SRC =
  process.env.S3_ENDPOINT?.trim() || "https://*.amazonaws.com";

const CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "form-action 'self'",
  `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' blob: https://checkout.razorpay.com`,
  `style-src 'self' 'unsafe-inline'`,
  `font-src 'self'`,
  `img-src 'self' data: blob: https:`,
  `connect-src 'self' blob: data: ${S3_CONNECT_SRC} https://api.razorpay.com https://lumberjack.razorpay.com https://staticimgly.com https://api.postalpincode.in`,
  `frame-src 'self' https://api.razorpay.com https://checkout.razorpay.com`,
].join("; ");

// Plain Next.js/Turbopack (the `dev`/`build`/`start` scripts) has no Workers
// runtime and can't resolve the real "cloudflare:workers" built-in that
// backend/db/d1.ts imports - see backend/db/cloudflare-workers-shim.ts for
// why a local no-op stand-in is aliased in for that path only.
//
// This alias must NOT apply when vinext reads this same next.config.ts
// (`dev:vinext`/`build:vinext`) - vinext also honors turbopack.resolveAlias
// to replicate Turbopack config for its own Vite/Rolldown resolution, which
// would silently substitute this empty shim for the REAL workerd-provided
// "cloudflare:workers" module, making every binding (D1 included) look
// unconfigured. `npm_lifecycle_event` (set by npm to the running script's
// name) distinguishes the two cases without needing a separate config file.
const isVinextScript = (process.env.npm_lifecycle_event ?? "").includes("vinext");

const nextConfig: NextConfig = {
  /* config options here */

  ...(isVinextScript
    ? {}
    : {
        turbopack: {
          resolveAlias: {
            "cloudflare:workers": "./backend/db/cloudflare-workers-shim.ts",
          },
        },
      }),

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Content-Security-Policy", value: CSP },
        ],
      },
      {
        // /api/docs (Swagger UI) loads its bundle + stylesheet from unpkg
        // and runs an inline bootstrap script - permissive override scoped
        // to just this internal docs page rather than weakening the CSP
        // everywhere else. Defined after the general rule so it wins for
        // this exact path.
        source: "/api/docs",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' https://unpkg.com; style-src 'self' 'unsafe-inline' https://unpkg.com; img-src 'self' data: https:; connect-src 'self'",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
