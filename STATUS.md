# Status

Snapshot of where this session's task list stands. Update this alongside the work, not after - it should always describe the current commit, not a plan.

## Branch: `Yuva---Dev`

Two Vercel projects (`stick-hive`, `stick-hive-9k1a`) build every push to this branch as a type-check/build gate; production deploys go through Cloudflare (vinext), not Vercel - see DEPLOY_CHECKLIST.md's Vercel note. D1 bindings don't exist on Vercel, which is exactly why the shop rewire below needed a flag-gated fallback rather than a hard cutover.

## Task 0 - pre-push gate: **standing, every push**

`npx tsc --noEmit`, `npm run build`, `npm run build:vinext`, `npx eslint` on touched files. Never push on failure. See DECISIONS.md's 2026-09-21 entry for the one incident that made this mandatory.

## Task 1 - Category union extension: **done, pushed (`7b79853`)**

All 7 sticker-intake categories covered (`Anime` already matched; 6 added verbatim, no lossy merges). Not yet surfaced in the shop's filter UI or home-page showcase - documented as deliberate in DECISIONS.md, will need revisiting once D1 categories have real products behind them in the live catalogue.

## Task 2 - Bug hunt + full test pass: **done, committed**

- `npm run test:unit` - 13/13 passing.
- `npx playwright test` (chromium + mobile-safari) - 74/74 passing.
- Full list of what was found and fixed: DECISIONS.md's 2026-09-21 "Bug hunt" entry.
- Route/module review (getClientIp, rate limiting, cron cleanup, seed/intake scripts, `/dev/product-preview`) - covered incidentally via the bug hunt above; no separate dedicated pass was run.
- Pre-existing lint debt found but deliberately deferred (not blocking this push, not in scope for it): BACKLOG.md.

## Task 3 - D1 shop rewire: **done, committed - server side AND client side**

Found already substantially built (uncommitted) from before a context-compaction boundary this session; the flag-gated fallback and force-dynamic fix landed first. Checkout and the client-side cart/wishlist were a separate, later fix - full account in DECISIONS.md.

- `/api/products` (`GET`, public) now exists - wraps `backend/products/catalog.ts`'s `listShopProducts()`, the same flag-gated source `/shop`'s Server Components call directly.
- Active-only, AND not-needs-review: `backend/products/service.ts`'s D1 queries filter `status = 'active' AND needs_review = 0` explicitly (was status-only).
- Checkout (`backend/orders/service.ts`'s `createOrderFromCheckout`) now validates catalog-product line items against `getShopProductBySlug` instead of the old static-array-only `PRODUCT_BY_ID` map. Custom-sticker line items untouched.
- Client-side cart/wishlist (`store-provider.tsx`) now resolve products against the same dynamic, flag-gated catalog instead of the static array alone - was a hard blocker (`addToCart` silently no-op'd for any D1 product) found and fixed during this task's own verification pass, not asked for up front.
- Old-ID-to-slug mapping: not applicable - the two catalogues are disjoint product sets, see BACKLOG.md.
- Static array as flag-gated fallback: done and unchanged (`PRODUCTS_SOURCE` env var, defaults to static; a D1 read failure at runtime also falls back rather than erroring).
- **Verified end-to-end**, not just locally-exercised: real signed-in Playwright run against `dev:vinext` with `PRODUCTS_SOURCE=d1` - added a real D1-only product to cart through the actual UI, checked out, order created (`201`) with correct server-computed price; a draft/needs_review product and an unknown product id both correctly rejected (`400`) at the same checkout path. Still only run locally against *local* D1 - the remote migration/seed/R2 upload in DEPLOY_CHECKLIST.md are still unexecuted, so production still has no D1 product data to serve and `PRODUCTS_SOURCE` stays unset everywhere real.

## Task 4 - AI shopping assistant: **not started**

Full scope in BACKLOG.md.

## Task 5 - BACKLOG.md / STATUS.md / DECISIONS.md: **ongoing**

All three exist and are current as of this commit. Keep updating them alongside future work, not after.

## Immediate next step

Nothing blocking locally. Next real task is either Task 4 (AI assistant, not started) or picking one of BACKLOG.md's items (pre-existing lint debt, the dead wishlist implementation in store-provider.tsx, or the e2e signed-in-session test-infra gap). Remote D1/R2/deploy steps in DEPLOY_CHECKLIST.md remain unexecuted and un-pushed per the standing stop-before-remote rule.
