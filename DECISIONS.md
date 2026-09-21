# Decisions log

One entry per non-obvious judgment call, newest first. Only verified facts go here — see each entry's "Verified via" line.

## 2026-09-21 — Corrected: the tsc regression in 7312d5a was real, not pre-existing

I originally told the user this was "pre-existing" (present on HEAD before my changes), based on `git stash` + `tsc --noEmit`. That test was flawed: stashing only removes *uncommitted* changes, and HEAD at the time was already `db51b12` — nine commits downstream of `7312d5a`, the commit that *created* `tests/unit/get-client-ip.test.ts`. The "clean state" I tested against already contained the broken file.

**Verified via**:
- `git log --diff-filter=A --format="%h %s" -- tests/unit/get-client-ip.test.ts` → `7312d5a Fix getClientIp() trusting a client-spoofable X-Forwarded-For` (the file's only add-commit).
- GitHub commit-statuses API (`/repos/yuvakrisshnan-rgb/Stick_Hive/commits/<sha>/status`), which is Vercel's own public record, not something I can fabricate or an injected message can stage:
  - `7312d5a`: both `stick-hive` and `stick-hive-9k1a` → `failure` ("Deployment has failed").
  - `3d0568d` (my fix commit): `stick-hive` → `success`; `stick-hive-9k1a` → `failure`, but description is "Canceled from the Vercel Dashboard" (a manual cancel, not a build error) — so `3d0568d` is the first commit where the actual build passes.
  - Every commit in between (`751394c` through `db51b12`, the whole sticker-intake run plus the products-table migration) would have carried the same broken test file and the same failure, since `npm run build`'s tsc pass covers `tests/**` via `tsconfig.json`'s `include: ["**/*.ts", ...]`.

**Root cause**: `7312d5a` added the test file and I verified `tsc --noEmit` clean *before* writing it, then never re-ran the check after — carrying forward a stale "clean" result instead of re-verifying against the file I'd just added. Fixed in `3d0568d` (readonly `NODE_ENV` cast + `allowImportingTsExtensions`).

**Standing fix, not just this incident**: from now on, every push in this session runs `npx tsc --noEmit`, `npm run build`, the vinext build, and lint on touched files first — matching what Vercel's own two projects (`stick-hive`, `stick-hive-9k1a`) actually check on every push. Never push on a failure.

## 2026-09-21 — Category union: extend with no lossy merges

Decision: add all CSV categories that don't already exactly match an existing `Category` union value, using their exact source strings — not renamed, not collapsed into a similar-sounding existing value.

- `Anime` — already an exact match, no new value needed.
- `Bollywood`, `BTS`, `flower stickers`, `Meme stickers`, `Rick and Morty`, `Stickers with dialogues` — added verbatim.

Earlier (before this was escalated to "decide it yourself, no lossy merges") I'd proposed collapsing `Rick and Morty`→`Series`, `flower stickers`→`Nature`, `Stickers with dialogues`→`Memes`, and `BTS`→a generic `K-Pop`. Explicitly overridden by this instruction: the union now has to be lossless against what's actually stored in D1/CSV, since a lossy mapping would just force a translation layer back into existence at every consumer — the opposite of the point.

**Known cosmetic side effect**: this makes the union casing/spacing inconsistent (`"Nature"` Title-Case single-word vs. `"flower stickers"` lowercase-with-space) rather than normalizing everything to one style. Deliberate — exact fidelity to the real stored strings over cosmetic uniformity.
