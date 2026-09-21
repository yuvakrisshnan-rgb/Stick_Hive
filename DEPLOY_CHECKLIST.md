# Deploy checklist

Exact commands for everything this session's standing instructions say to stop before: remote D1 writes, production deploy, real R2/Cloudflare/Resend/Upstash changes or secrets, force-push, hard reset, deleting files outside build output. Nothing below has been run. Run each step, verify its own "Verify" line, before moving to the next.

## Vercel note

Two Vercel projects (`stick-hive`, `stick-hive-9k1a`) build every push to `Yuva---Dev` - they act as a type-check/build gate (see DECISIONS.md's 2026-09-21 entry for the one real regression this caught) but **production deploys go through Cloudflare (vinext), not Vercel**. D1 bindings don't exist on Vercel at all - anything that calls `getD1()` will always fail there, which is exactly why `/shop` and `/shop/[id]` needed `PRODUCTS_SOURCE`'s flag-gated fallback (see DECISIONS.md) rather than an unconditional D1 call.

## 1. Apply the products migration to remote D1

Local D1 already has this (`migrations/0006_products.sql`, applied and seeded locally - 194 rows, 107 active). Remote does not.

```
npx wrangler d1 migrations apply stickhive-db --remote
```

**Verify**: `npx wrangler d1 execute stickhive-db --remote --command "PRAGMA table_info(products)"` shows the same 14 columns as `migrations/0006_products.sql`.

## 2. Seed remote D1

```
node scripts/seed-products.mjs seed --db stickhive-db --remote
```

Check `scripts/seed-products.mjs`'s own `--help`/argument handling for the exact remote-target flag name before running - it was built and tested against `--local` this session; confirm the remote equivalent matches before running against real data.

**Verify**: `npx wrangler d1 execute stickhive-db --remote --command "SELECT COUNT(*) FROM products WHERE status='active'"` matches the local active count (107, unless the source CSV has changed since).

## 3. Create the R2 bucket and upload product images

Bucket doesn't exist yet - `scripts/upload-product-images-r2.mjs` was built this session but deliberately never run (see its own double-gate: requires both `--confirm` and `CONFIRM_R2_UPLOAD=yes`).

```
npx wrangler r2 bucket create stickhive-product-images
npx wrangler r2 bucket dev-url enable stickhive-product-images
npx wrangler types
node scripts/optimize-product-images.mjs --status active
CONFIRM_R2_UPLOAD=yes node scripts/upload-product-images-r2.mjs --confirm --db-target remote
```

**Verify**: `npx wrangler r2 object get stickhive-product-images/products/<any-active-slug>/main.webp` returns something; `SELECT image_url FROM products WHERE slug = '<that-slug>'` (remote) is no longer null.

## 4. Flip the live shop to D1

Only after steps 1-3 are done and verified. Set in the production environment (not `.env.local` - that's git-ignored dev-only):

```
PRODUCTS_SOURCE=d1
```

Where this is actually set depends on where StickHive's Cloudflare secrets/vars already live (check the existing `wrangler secret` usage this project already has for `RESEND_API_KEY` etc. as the precedent) - not something to guess at here.

**Verify**: hit the real deployed `/shop` URL, confirm it now shows the real sticker-intake catalogue (not the "Hive Original"/"Neon City"-style static demo names) with working images. Then re-run `npm run test:e2e` with `PLAYWRIGHT_BASE_URL` pointed at the real deployment (same pattern as the note already in `tests/e2e/api-security.spec.ts` about the concurrent-cooldown test needing a real deployment with Upstash configured) to catch anything the local/static-fallback runs couldn't.

## 5. Production deploy

```
npm run build:vinext
npm run deploy:vinext
```

**Verify**: whatever this project's existing post-deploy smoke-check process is (not established/documented in this session - check for one before relying on silence as success).

## Not covered here

Task 4 (the AI shopping assistant) will need its own entries once built - at minimum `ANTHROPIC_API_KEY` as a secret, and whatever spend-cap/rate-limit infra it ends up needing (Upstash is already used for rate limiting elsewhere in this project - see `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` in the rate-limit module - likely the same path here rather than something new).
