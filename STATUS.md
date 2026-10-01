# Status

Snapshot of where the live app actually stands. Update this alongside the work, not after - it should always describe the current commit and what's actually running in production, not a plan or a historical log (that's DECISIONS.md).

## Branch: `Yuva---Dev`

The only branch that deploys. `main` and `vishal-dev` never trigger a deploy. Every push to `Yuva---Dev` runs `.github/workflows/deploy.yml`: checks required config (`scripts/check-required-config.mjs`), builds (`npm run build:vinext`), then deploys straight to Cloudflare Workers (`npm run deploy:vinext`) - no staging step, no manual approval. **Vercel has been dropped entirely** - the two Vercel projects mentioned in this file's older history no longer exist/deploy; Cloudflare is the single deployment target.

D1 migrations are deliberately **not** run by the workflow - `wrangler d1 migrations apply --remote` stays a manual command, run by hand, never auto-applied by a push (see DEPLOY_CHECKLIST.md).

## Pre-push gate: standing, every push

`npx tsc --noEmit`, `npm run build`, `npm run build:vinext`, `npx eslint` on touched files. Never push on failure - see DECISIONS.md's 2026-09-21 entry for the incident that made this mandatory.

## What's live in production right now

**D1 + R2 have been live since 2026-09-21** - `PRODUCTS_SOURCE=d1` is set in `wrangler.jsonc`'s committed `vars` block (not a flag waiting to be flipped), and every active product has a real `image_url`/`thumbnail_url` pointing at the `stickhive-product-images` R2 bucket's public `pub-*.r2.dev` domain. `/shop`, `/shop/[id]`, checkout, the homepage, and - as of 2026-09-30 - the navbar's quick search and `about/page.tsx`'s catalogue-size stat all read the real D1 catalogue. The static `PRODUCTS` array (`src/lib/product-data.ts`) stays as the deliberate fallback for a D1 read failure at runtime (`backend/products/catalog.ts`, `store-provider.tsx`'s first-paint seed) - see DECISIONS.md - but every other live read of it has been removed.

**Wishlist**: one real implementation (`src/components/wishlist/wishlist-provider.tsx`'s `useWishlist()`, server-synced via `/api/wishlist`) - `store-provider.tsx`'s separate, parallel, localStorage-only wishlist was deleted 2026-09-30 after confirming (and fixing) its one real consumer (`product-details.tsx`, since rewired to `useWishlist()` too). See DECISIONS.md.

**Catalogue size** (remote D1, checked directly): **298 products** - 211 `status='active'` (live, purchasable, all with real R2 images), 87 `status='draft', needs_review=1` (pending review, no images uploaded yet - see BACKLOG.md's review-queue note). Schema: `migrations/0001` through `0006`, no migration added since `0006_products.sql`.

**Checkout**: D1-backed end to end, and now requires a signed-in session (added 2026-10-02 - checkout's old "Verify Email To Continue" step turned out to just be the sign-in OTP under a different URL, now gone; the email field shows the session's own address, locked). `createOrderFromCheckout` validates catalog-product line items against real D1 product rows (`status='active' AND needs_review=0`); custom-sticker line items validate their own shape. **Razorpay is the only payment method new checkouts can choose** (it already offers UPI apps/cards/netbanking inside its own checkout, confirmed via signed webhook) - placing an order now launches the Razorpay payment portal automatically rather than landing on a manual "Pay Now" screen. The old hand-rolled UPI-direct flow (QR code, manual admin verification) is gone from the checkout UI; Stripe remains live as a separate payment method. See DECISIONS.md.

**Custom sticker editor** (`/custom-sticker`): full-featured - real ML background removal (`@imgly/background-removal`, automatic on upload) with a Fast/High-precision re-run option and post-processing (erode/feather/decontaminate), a manual eraser (Erase/Soft Erase/Restore + zoom), real die-cut contour detection, and **all four shape modes (Circle/Square/Rounded/Die-cut) now genuinely clip the artwork** - both on-screen and in the exported print PNG (fixed 2026-09-29; previously "shape" was purely decorative and every export was a flat opaque square regardless of shape - see DECISIONS.md). Real drag-and-drop upload onto the canvas. "My Designs" lists and reopens the user's own custom stickers already in cart (not a separate saved-design library - none exists in the schema; see DECISIONS.md for why that was the honest scope).

**Admin dashboard** (hashed `/admin/<key>` path - `/admin` itself deliberately 404s; run `npm run admin:path` to get the real URL): three tabs - **Order desk** (payment verification, fulfillment, Delhivery shipping), **Analytics** (revenue trend, orders by location, top products, status breakdowns), **Insights** (added 2026-09-30 - three automated alert conditions: stuck UPI payments unverified 24h+, review-queue backlog growth, order-volume shift vs. a 7-day baseline; see DECISIONS.md for exactly what each one checks and why).

**Homepage**: hero, "New Arrivals" (renamed from the non-functional "Trending" - see DECISIONS.md 2026-09-25), and a category showcase now covering all 7 real sticker-intake categories (Anime, Bollywood, BTS, flower stickers, Meme stickers, Rick and Morty, Stickers with dialogues - added 2026-09-30).

**Shop** (`/shop`): paginated (24 per page + infinite scroll, added 2026-09-25 once the catalogue grew past 200 products), real URL-addressable `?category=` filter.

**Customer invoice** (`order-success`'s "Download Invoice" button, `src/lib/invoice-generator.ts`): redesigned 2026-10-02 - real brand palette/typography, a payment-status badge that actually reflects the order's real status (was hardcoded "confirmed" regardless), product thumbnails in the line-item table with a graceful fallback when one fails to load, a real functional QR linking to the order's track-order page (was a dead placeholder image), multi-page-safe (totals/QR/footer never run off the page edge on a long order), and a much smaller file size (logo was previously embedded at full 1024x1024 resolution). See DECISIONS.md for the full list of bugs this surfaced and fixed.

## Known gaps / explicitly not done

- **Review queue has no image-serving path** - the 87 `needs_review=1` rows have no `image_url` (R2 upload only runs for `status='active'` rows). A review-queue admin UI needs this solved first - see BACKLOG.md.
- **Cloudflare Web Analytics is not enabled** - no traffic/visitor data exists anywhere in the app. A prerequisite for any future "Traffic" admin section, not yet turned on.
- **AI shopping assistant** - not started. Full scope in BACKLOG.md.
- **No real signed-in e2e coverage** for cart/checkout - `cart-checkout.spec.ts` only covers the guest experience. BACKLOG.md has the two options (a dev-only session-minting test seam, or driving the real OTP flow against a test inbox).

## Where to look for more detail

- **DECISIONS.md** - one entry per non-obvious judgment call, newest first, each with a "Verified via" line. The actual history of *why* things are built the way they are.
- **BACKLOG.md** - specific, real, deliberately-deferred gaps with enough context to pick each one up cold.
- **DEPLOY_CHECKLIST.md** - the manual, non-automated steps (remote D1 migrations, R2 bucket operations) that a push never runs on its own.
