# Status

Snapshot of where this session's task list stands. Update this alongside the work, not after - it should always describe the current commit, not a plan.

## Branch: `Yuva---Dev`

Two Vercel projects (`stick-hive`, `stick-hive-9k1a`) build every push to this branch as a type-check/build gate; production deploys go through Cloudflare (vinext), not Vercel - see DEPLOY_CHECKLIST.md's Vercel note. D1 bindings don't exist on Vercel, which is exactly why the shop rewire below needed a flag-gated fallback rather than a hard cutover.

## Task 0 - pre-push gate: **standing, every push**

`npx tsc --noEmit`, `npm run build`, `npm run build:vinext`, `npx eslint` on touched files. Never push on failure. See DECISIONS.md's 2026-09-21 entry for the one incident that made this mandatory.

## Task 1 - Category union extension: **done, pushed (`7b79853`)**

All 7 sticker-intake categories covered (`Anime` already matched; 6 added verbatim, no lossy merges). Not yet surfaced in the shop's filter UI or home-page showcase - documented as deliberate in DECISIONS.md, will need revisiting once D1 categories have real products behind them in the live catalogue.

## Task 2 - Bug hunt + full test pass: **done, not yet committed**

- `npm run test:unit` - 13/13 passing.
- `npx playwright test` (chromium + mobile-safari) - 74/74 passing.
- Full list of what was found and fixed: DECISIONS.md's 2026-09-21 "Bug hunt" entry.
- Route/module review (getClientIp, rate limiting, cron cleanup, seed/intake scripts, `/dev/product-preview`) - covered incidentally via the bug hunt above; no separate dedicated pass was run.
- Pre-existing lint debt found but deliberately deferred (not blocking this push, not in scope for it): BACKLOG.md.

## Task 3 - D1 shop rewire: **done, not yet committed**

Found already substantially built (uncommitted) from before a context-compaction boundary this session - see DECISIONS.md for the full account of what was found and what was still missing (the flag-gated fallback, and the resulting build/dev breakage).

- `/api/products` as such doesn't exist - instead, `backend/products/catalog.ts` (`listShopProducts()`/`getShopProductBySlug()`) is called directly from `/shop` and `/shop/[id]`'s Server Components, gated on `PRODUCTS_SOURCE=d1` (unset/default = static array).
- Active-only: `backend/products/service.ts`'s D1 queries already filter `WHERE status = 'active'`.
- Old-ID-to-slug mapping: not applicable - the two catalogues are disjoint product sets, see BACKLOG.md.
- Static array as flag-gated fallback: done (`PRODUCTS_SOURCE` env var, defaults to static; a D1 read failure at runtime also falls back rather than erroring).
- **Not yet verified**: this has only been exercised locally, with `PRODUCTS_SOURCE` unset (static fallback) and briefly with local D1 data present. It has never been run against real (remote) D1 data - see DEPLOY_CHECKLIST.md before ever setting `PRODUCTS_SOURCE=d1` anywhere real.

## Task 4 - AI shopping assistant: **not started**

Full scope in BACKLOG.md.

## Task 5 - BACKLOG.md / STATUS.md / DECISIONS.md: **in progress, this commit**

All three now exist and are current as of this commit. Keep updating them alongside future work, not after.

## Immediate next step

Commit everything currently uncommitted (Task 2 fixes + Task 3 rewire + these three docs), per DEPLOY_CHECKLIST.md's local-only scope - no remote D1 write, no production deploy, and no `PRODUCTS_SOURCE=d1` anywhere real has happened in this session.
