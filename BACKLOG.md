# Backlog

Open items discovered or deliberately deferred during this session. Not a roadmap - a list of specific, real gaps with enough context to pick each one up cold. See STATUS.md for what's currently done, DECISIONS.md for why things were built the way they were.

## Pre-existing lint debt (deferred from the 2026-09-21 bug hunt)

Confirmed via `git diff` to be outside every line touched this session - not introduced by this work, just surfaced by linting the files it touched.

- `src/components/shop/shop-catalog.tsx:196` - `setSearch(urlSearch)` called directly inside a bare `useEffect` (`react-hooks/set-state-in-effect`).
- `src/components/custom-sticker/sticker-editor-shell.tsx:61` - `setSheetExpanded(true)` called directly inside a bare `useEffect`, same rule.
- `src/components/checkout/customer-form.tsx:255,292` - two `@typescript-eslint/no-explicit-any` errors.
- `src/components/cart/cart-drawer.tsx:541,610,916` - one `no-location-assign-relative-destination` warning (`window.location.href` for an internal nav - should be `useRouter().push()`), two `no-unused-expressions` warnings.

## Test infrastructure

- **No way to run an e2e test as a signed-in user.** `cart-checkout.spec.ts`'s "Cart" tests only cover the guest experience (cart drawer is deliberately auth-gated - see DECISIONS.md) because there's no test-harness path to a valid session: real auth is OTP-over-email, and faking a session cookie would mean reimplementing `backend/auth/crypto.ts`'s signing in the test harness. Whoever picks this up should decide between (a) a dev-only test-seam that mints a real signed session server-side behind an env-gated route, or (b) driving the real OTP flow against a test inbox. Either way, this unblocks real cart-content and full-checkout-flow test coverage, not just the sign-in-prompt check that exists today.
- **`playwright.config.ts` has no `webServer`/production-build config** - the suite runs against whatever `next dev` happens to be running. This session found that 4 parallel workers against a cold `next dev` process produces ~30s timeouts from Turbopack on-demand-compile contention, not real app slowness (see DECISIONS.md's 2026-09-21 bug-hunt entry) - `--workers=1` against the same dev server eliminated them entirely. Pointing the suite at `next build && next start` (or `vinext build`/`vinext start`) instead would remove this flakiness class structurally and let `fullyParallel` actually help instead of hurt.

## Product images / content

- **29 of the 30 static `PRODUCTS` array entries never had real image files** (see DECISIONS.md - `/stickers/*.png` paths that were never committed, confirmed via `git log --diff-filter=A` across full history). Fixed this session by falling back to each product's `emoji` field everywhere images are rendered, rather than fabricating artwork - the shop no longer 400s, but it also has no real product photography. The real fix is what the rest of this session's work already built toward: the D1 `products` table + R2 image pipeline (`scripts/optimize-product-images.mjs`, `scripts/upload-product-images-r2.mjs`) - see DEPLOY_CHECKLIST.md for the remaining steps to actually go live on that path.
- Once `PRODUCTS_SOURCE=d1` is live in production (see DEPLOY_CHECKLIST.md), the static `PRODUCTS` array and its 30 entries become dead code for the live shop - worth a deliberate decision then about whether to delete it outright or keep it only as the emergency fallback `backend/products/catalog.ts` already treats it as.

## Product catalogue continuity

- The D1 catalogue (from `stickers.csv`/sticker-intake) and the static `PRODUCTS` array are **entirely disjoint product sets** - different slugs, different items, no real correspondence between them. "Map old product IDs to slugs" (an earlier task instruction) isn't achievable as a literal 1:1 mapping because there's nothing to map to. What actually protects existing local carts/orders is `PRODUCTS_SOURCE` defaulting to static until D1 is verified live (see DECISIONS.md) - but once flipped, any cart referencing an old static-array product ID will have no matching D1 row. Worth checking `store-provider.tsx`'s resilience to a cart line whose product can no longer be found (not audited this session) before flipping the flag in production.

## AI shopping assistant (Task 4 - not started)

`POST /api/chat`, Anthropic API via `claude-haiku-4-5-20251001`, `ANTHROPIC_API_KEY` from env, read-only tools (`search_products`, `get_product`) over `status='active'` D1 rows only, guardrails (input length cap, max turns/output tokens, per-IP/session rate limits fail-closed, daily spend cap, sticker-topics-only system prompt, no order/account access, no payment/delivery-date promises), a floating chat widget matching the existing design system. Not started this session - full scope as given, nothing built yet.
