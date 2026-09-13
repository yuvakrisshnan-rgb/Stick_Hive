StickHive --- AI Project Context

Version: 1.0 Last updated: 2026-08-31

Purpose

This is the primary AI handoff document for StickHive. Read it before
modifying the project. Use it with the actual repository; the repository
code is the final source of truth.

1. Project

StickHive is a creative sticker e-commerce brand. The idea began as a
classroom business activity where students brainstormed a business
concept. StickHive is about stickers as small pieces of personality:
emotions, interests, fandoms, humor, creativity and individuality.

The brand should feel fun, premium, modern, creative, friendly,
interactive and student-built---not generic or corporate.

2. Stack

Next.js

React

TypeScript

Tailwind CSS

Motion / motion/react

lucide-react

react-icons

Inter

Space Grotesk

3. Brand palette

Cream/background: #fff8ed

Foreground: #111111

Hive yellow: #ffd43b

Honey orange: #ff8a00

Honey dark: #e66f00

Mint: #b8f2d0

Footer green: #123F3A

Border: #f1dfc5

Muted: #6b6b6b

4. Design direction

Use rounded cards, soft shadows, cream backgrounds, yellow/orange
accents, dark green footer, bold typography, playful bee elements and
subtle motion.

Avoid excessive empty space, visual clutter, excessive gradients, overly
complicated animations, sharp decorative paths, generic corporate
layouts, and unnecessary redesigns of working sections.

5. Global layout

The root layout currently uses: - ShopProvider - IntroWrapper -
AnnouncementBar - Navbar - page content - CartDrawer

Fonts loaded in the root layout are Inter and Space Grotesk.

6. Main navigation

Primary links: - Shop - Custom Stickers - About

Navbar also has search, cart and account controls.

Custom Stickers must point to an existing route. About points to
/about.

7. Home page

Known major sections: - Hero - Trending stickers - Category showcase -
Other product/marketing sections - Footer

8. Trending stickers

Current requirements: - 8 sticker cards - automatic horizontal
scrolling - infinite marquee - continuous movement without manual
interaction - subtle individual card floating/pop motion - seamless
loop - prefers-reduced-motion support

The marquee previously failed and was fixed using a duplicated
track/group. Do not replace the working implementation unnecessarily.

The small black category indicator dots were intentionally removed. Do
not reintroduce them unless explicitly requested.

9. About page

Route: /about

The story must remain authentic and student-focused: - It began as a
classroom activity. - Students brainstormed a business idea. - StickHive
emerged from that process. - The aim is to make stickers that express
personality, emotions, interests and fun. - The classroom project
gradually became a serious business idea. - The team experimented with
designs and personal/student experiences. - The journey is about
learning while building something real.

Do not turn this into generic corporate copy.

10. About anchors

The page uses: - /about#story - /about#journey -
/about#why-stickhive

Our Story

Introduces the classroom origin.

Our Journey

Shows progression from classroom idea → brainstorming → design
experimentation → building a real brand.

Why StickHive

Explains that stickers can represent moods, memories, inside jokes,
fandoms, interests or personality, and that StickHive wants
self-expression to feel simple, creative and fun. It also emphasizes
that students are learning while building.

11. About bee animation

The About page has a scroll-linked bee journey.

Current bee is 🐝 because the actual logo asset is not currently
available.

Rules: - Bee position follows page scrolling. - Bee uses an SVG path. -
Scrolling down → bee faces right. - Scrolling up → bee faces left. - Bee
has subtle floating motion. - Bee does not continuously rotate. - Bee
must not race independently of scroll. - Path should be smooth, rounded,
simple and spacious. - Avoid sharp corners and messy loops.

Implementation uses SVG path length / getPointAtLength().

Keep these types separate:

type ScrollDirection = "up" | "down";
type BeeDirection = "left" | "right";

12. About photos

Real journey/team photos are not available yet. Use large, clean,
premium rounded placeholders suitable for later replacement. Avoid tiny
generic empty boxes.

13. About spacing

The page was shortened after excessive empty space was noticed. Maintain
compact but comfortable spacing, enough room for the bee path, and
larger photo areas. Decorative background elements may be used to avoid
dead space.

14. Footer

Known file: src/components/layout/footer.tsx

The footer uses a dark green background, cream curved top, bee mark,
StickHive branding, navigation, newsletter, social links and legal
links.

Shop

All Stickers

Trending

Categories

Custom Stickers

New Drops

Help

Contact Us

FAQ

Shipping

Returns & Refunds

About

Our Story

Our Journey

Why StickHive

About links:

/about#story
/about#journey
/about#why-stickhive

15. Newsletter

Current frontend behavior:

Enter email
→ Subscribe
→ You're in!
→ Welcome to the Hive! 🐝
→ email clears
→ after ~2.5 seconds
→ Subscribe

It is frontend-only. It does not currently save subscribers, send email,
create discount codes, or call a backend.

Do not claim that a user has been added to a real mailing list until a
backend/provider is implemented.

16. Social icons

Use react-icons for Instagram and LinkedIn:

import { FaInstagram, FaLinkedinIn } from "react-icons/fa";

Do not switch these to lucide-react. Do not invent real social URLs.

17. Known routes

Known/created/worked-on: - / - /shop - /custom-sticker -
/about - /contact - /faq - /shipping - /returns - /privacy -
/terms

Verify the actual repository before inventing any additional route.

18. Development rules

Preserve working functionality.

Modify only what the user requested.

Inspect the current component before replacing it.

Do not invent assets or routes.

Do not create images unless explicitly requested.

Keep the brand palette and typography.

Preserve responsive behavior.

Keep animation subtle and accessible.

Check TypeScript imports and types.

Use react-icons for Instagram/LinkedIn.

Do not reintroduce removed category dots.

Do not make the bee animation independent of scroll.

Do not make the bee continuously rotate.

Avoid excessive empty space.

Keep the student story authentic.

19. User workflow preference

The user prefers iterative development: - one suggestion at a time -
test the result - then move to the next suggestion - exact file path -
full replacement code when requested

When asked for full code, provide the complete file and tell them
exactly where to paste it.

20. Current completed work

Confirmed work during development: - Trending section expanded to 8
cards. - Trending automatic marquee fixed. - Trending card floating
animation. - Category indicator dots removed. - About page developed. -
About story, journey and Why StickHive sections. - Scroll-linked bee
animation. - Bee direction changes with scroll direction. - Curved
buzzing path. - Journey photo placeholders. - Footer. - Footer
navigation. - Newsletter frontend interaction. - Instagram/LinkedIn via
react-icons. - Contact, FAQ, Shipping, Returns, Privacy and Terms pages
worked on. - Custom Stickers navigation fixed after a 404 issue.

21. Current limitations

Newsletter has no production backend.

Real social URLs may still need configuration.

Real journey/team photos are pending.

Real StickHive logo asset is pending; About bee uses 🐝.

22. Latest confirmed update

The footer newsletter now temporarily shows You're in!, displays
Welcome to the Hive! 🐝, clears the email field, and returns the
button to Subscribe after approximately 2.5 seconds.

23. AI working protocol

Before changing anything: 1. Read this document. 2. Inspect the relevant
source file. 3. Identify what currently works. 4. Identify the exact
requested change. 5. Change only the relevant area. 6. Check TypeScript.
7. Check responsive behavior. 8. Check animations on desktop/mobile when
relevant. 9. Verify routes when navigation changes. 10. If full code is
requested, provide the complete file. 11. Update this document/change
log after major confirmed changes.

24. Final instruction

You are continuing an existing project, not starting a new generic
website. Preserve continuity. The actual repository is the final source
of truth.
---

## Session Update — Security & Bug Audit (Claude Chat, this session)

### Context
A full codebase audit was performed on the `rebuild-commerce` branch after
merging in a friend's (vishal-dev) backend work — MongoDB auth/sessions,
Stripe, S3 storage, admin panel, Delhivery shipping integration.

### 🔴 Critical bugs found and FIXED locally (not yet committed/pushed as of
this write-up — verify with `git status` / `git log` before assuming done)

1. **Broken relative import paths** in three Stripe payment routes — they
   were one folder deeper than sibling routes but still used the shallower
   `../../../../../backend/...` (5 levels) instead of the required 6:
   - `src/app/api/payments/stripe/webhook/route.ts`
   - `src/app/api/payments/stripe/checkout/route.ts`
   - `src/app/api/payments/stripe/status/route.ts`
   Fix applied: added one more `../` to every `backend/` import in each file.

2. **Wrong function name imported** in
   `src/app/api/admin/orders/[orderId]/payment-proof/route.ts` — imported
   `createPaymentProofUrl`, which doesn't exist. The real export in
   `backend/storage/downloads.ts` is `createArtworkDownloadUrl`.
   Fix applied: renamed the import to match the real export.

3. **Other real type errors found via `npx tsc --noEmit`** (may still need
   fixing — check current state):
   - `src/app/admin/admin-client.tsx:421` — `lineTotal` doesn't exist on
     `OrderItem` type
   - `src/app/order-success/page.tsx:259` — `"cancelled"` not comparable to
     `OrderStatus`
   - `src/app/order-success/page.tsx:738` — `paymentVerification` doesn't
     exist on `StoredOrder`
   - `src/app/order-success/page.tsx:911` — `Loader2` used but not imported
   - `src/app/shop/page.tsx:26` — `searchQuery` prop doesn't exist on the
     target component (pre-existing, unrelated to the merge)

   These suggest the order/payment data model was refactored (renamed
   fields to `upiPayment`/`paymentVerification`) without updating every
   consumer to match.

### 🟠 Dependency vulnerabilities (`npm audit`, run again to check current
state after any `npm install`)

| Package | Severity | Fix |
|---|---|---|
| `next` (16.0.0–16.3.2) | Critical — unauthenticated RCE (Windows-hosted servers; AVIF image optimization) | `npm install next@16.3.4` |
| `jspdf` (≤4.2.0, used by invoice generator) | Critical — path traversal, PDF/JS injection, DoS | `npm install jspdf@4.2.1` (semver-major, re-check `src/lib/invoice-generator.ts` after) |
| `sharp` (<0.35.4) | High — libheif CVEs | `npm audit fix` |
| `js-yaml` (transitive via google-auth-library) | High — CPU exhaustion | `npm audit fix` |
| `uuid` / `gaxios` (transitive) | Moderate | `npm audit fix` |

### 🟡 Hardening gaps (not broken, but not yet addressed)

- **No security headers configured** — `next.config.ts` is still the
  default empty config. No CSP, `X-Frame-Options`, `X-Content-Type-Options`,
  `Strict-Transport-Security`.
- **No `middleware.ts`** and **no IP-based rate limiting** anywhere — only
  a per-email OTP cooldown exists. An attacker could still spam
  `/api/auth/send-otp` with many different fake emails to burn Resend
  quota, since nothing throttles by IP.

### ✅ What's already solid (confirmed via manual code review, keep as-is)

- No secrets ever committed to git history (`.env.example` only,
  `.gitignore` correctly covers `.env*`).
- Real session auth: OTP codes + session tokens are SHA-256 hashed before
  storage, sessions expire server-side, cookies are `httpOnly` + `secure`
  (prod) + `sameSite: lax`.
- Admin access requires a real server-side check (session → email
  allowlist via `STICKHIVE_ADMIN_EMAILS`) — the hashed admin URL path is
  explicitly NOT the security boundary (see `backend/auth/admin-path.ts`
  comment).
- No price tampering possible — checkout only sends
  `productId`/`size`/`quantity`; server always computes price via
  `priceFor()`.
- IDOR-protected orders — `getMyOrder()` filters by
  `{ orderId, userId }`, not `orderId` alone.
- Zod validation on every API route checked, including blocking
  NoSQL-injection-style payloads (`{$ne: null}`) via `z.string()` type
  checks.
- Stripe webhook signature verification correctly uses the official SDK.
- No `dangerouslySetInnerHTML`, no `eval`, no hardcoded API keys anywhere.

### Playwright E2E test suite (added this session, not yet fully green)

Location: `tests/e2e/*.spec.ts`, config at `playwright.config.ts`.
Run with `npm run test:e2e:ui` (needs dev server running separately on
port 3000 first: `npm run dev`).

Files:
- `public-pages.spec.ts` — homepage, about, shop, legal pages, 404
- `cart-checkout.spec.ts` — add to cart, cart persistence, checkout
  validation (PIN auto-fill, email-verification gating)
- `custom-sticker.spec.ts` — canvas loads, add text/undo-redo, upload
  size/type rejection
- `api-security.spec.ts` — hits API routes directly: admin 401 checks,
  IDOR checks, NoSQL-injection payload rejection, Stripe webhook signature
  rejection, upload-url server-side limit enforcement

Known issue hit during the last run: a request to
`GET /api/admin/orders/[orderId]` (a route that only exports `PATCH`, no
`GET`) hung for the full 30s test timeout instead of failing fast — this
coincided with Turbopack being stuck on the fatal Stripe import errors
above. Re-run the full suite after confirming `npm run dev` starts clean
with zero build errors, since that may resolve on its own.

### Recommended next steps, in order
1. Confirm `npm run dev` / `npm run build` are both 100% clean (zero
   errors) after the fixes above.
2. Re-run `npm audit` and apply the `next`/`jspdf` version bumps.
3. Re-run the full Playwright suite (`npm run test:e2e:ui`) and triage any
   remaining failures.
4. Add `headers()` to `next.config.ts` for basic security headers.
5. Add basic IP-based rate limiting in front of `send-otp`/`verify-otp`/
   `upload-url` (a `middleware.ts` is the natural place for this).

---

## Session Update — Fraunces Headline Font (Claude Chat, this session)

Replaced an earlier Clash Display setup (tried, then rejected before ever
being committed) with **Fraunces**, installed via
`@fontsource-variable/fraunces` — the same self-hosted Google Fonts
pattern already used for Playfair Display/Poppins/Caveat/Inter, imported
in `src/app/layout.tsx`.

The existing `.font-display` class was left untouched in meaning (bold
sans) but given a real definition for the first time:
`--font-display: "Space Grotesk", Arial, sans-serif` in `globals.css`. It
previously had no matching Tailwind theme token at all, so every usage was
silently falling back to the page's default Arial. A new `.font-headline`
class (`--font-headline: "Fraunces Variable", Georgia, serif`) was added
alongside it rather than repurposing `.font-display`, since a handful of
its usages are small UI text where a serif would look cramped.

14 large hero/section headlines were migrated to `.font-headline`: the
homepage hero, the About page's two section headings, the FAQ/Shop/
Wishlist page heroes, all four legal pages plus Contact (identical hero
pattern), the "You might also like" related-products heading, the
trending/product section heading, and the giant decorative background
numeral in the category showcase.

Four usages were deliberately kept on `.font-display` (sans): the shop and
wishlist empty-state messages ("No stickers found.", "Your hive is
empty.") and the cart drawer title ("Your Hive") are small/secondary UI
text, not marketing headlines; the animated brand-reveal component that
letters out "StickHive" one character at a time was kept sans regardless
of its size, since it's the logo/wordmark treatment itself rather than
page content.