# Deploy checklist

The manual, non-automated steps for this project - the ones `.github/workflows/deploy.yml` deliberately never runs on a push (remote D1 schema changes, R2 bucket/object operations, anything that touches real production data or infra). A push to `Yuva---Dev` only ever does: config check → `build:vinext` → `deploy:vinext` (the Worker code itself). Everything below is run by hand, when it's actually needed - this is a reference, not a one-time task list.

## Status: the original migration (D1 + R2 product pipeline) is done

`migrations/0006_products.sql` is live on remote D1, the `products` table has 298 rows (211 active, 87 pending review), every active row has a real R2 image, and `PRODUCTS_SOURCE=d1` has been set in `wrangler.jsonc`'s committed `vars` since 2026-09-21 - the shop, checkout, and homepage all read the real catalogue in production right now. See STATUS.md for the current live state, DECISIONS.md for the full history of how it got there. The two sections below are **kept as reusable instructions**, not something that needs re-running - use them the next time a migration or an R2 upload is actually needed.

## Vercel note

Vercel has been dropped entirely - Cloudflare (`vinext`) is the only deploy target now. Don't reintroduce a Vercel-based gate; the GitHub Actions workflow (`build:vinext` as a real build gate, before the deploy step) is what that role moved to.

## Applying a new D1 migration to remote

1. Add the migration file under `migrations/` (next number after the highest existing one - `0007_...sql` as of this writing).
2. Apply it locally first and verify against local D1:
   ```
   npx wrangler d1 migrations apply stickhive-db --local
   npx wrangler d1 execute stickhive-db --local --command "PRAGMA table_info(<table>)"
   ```
3. Apply to remote, by hand, never via CI:
   ```
   npx wrangler d1 migrations apply stickhive-db --remote
   ```
4. **Verify**: `npx wrangler d1 execute stickhive-db --remote --command "PRAGMA table_info(<table>)"` matches what the migration file defines.

Reminder from this session's own experience: `wrangler d1 execute --remote --file=<path>` does **not** return real `SELECT` row data - it treats the file as a bulk-import job and returns import statistics regardless of query content. Use `--command` for any read you actually need the results of, on both `--local` and `--remote`.

## Uploading new/changed product images to R2

The bucket (`stickhive-product-images`) and its public dev URL already exist - this is only needed when new products are added or existing images change.

```
node scripts/optimize-product-images.mjs --status active
CONFIRM_R2_UPLOAD=yes node scripts/upload-product-images-r2.mjs --confirm --db-target remote --public-base-url https://pub-8a6c62ba68f94cc09c8327319bffa53c.r2.dev
```

`upload-product-images-r2.mjs` is idempotent - it skips any row whose `image_url` already matches the expected key, so re-running it after ingesting a new batch only uploads what's actually new.

**Verify**: `npx wrangler d1 execute stickhive-db --remote --command "SELECT COUNT(*) FROM products WHERE status='active' AND image_url IS NOT NULL"` matches the active-row count.

## Production deploy

Normally just `git push origin Yuva---Dev` - the GitHub Actions workflow handles build + deploy. Only run these by hand if deploying outside that workflow for some reason:

```
npm run build:vinext
npm run deploy:vinext
```

**Verify**: hit the real deployed site, confirm `/shop` shows the current catalogue with working images. No established automated post-deploy smoke-check exists yet - don't rely on workflow silence alone as proof of a healthy deploy; do a real spot-check.

## Not covered here

- **Cloudflare Web Analytics** - not yet enabled on the site at all (prerequisite for any future admin "Traffic" section - see STATUS.md/BACKLOG.md). Turning it on is a Cloudflare dashboard step, not a `wrangler` command - not documented here because it hasn't been done yet.
- **AI shopping assistant** (not started) will need its own entries once built - at minimum `ANTHROPIC_API_KEY` as a secret, and whatever spend-cap/rate-limit infra it ends up needing (Upstash is already used for rate limiting elsewhere - `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` - likely the same path here).
