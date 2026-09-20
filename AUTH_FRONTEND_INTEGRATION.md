# Stick Hive — Auth Frontend Integration

This archive contains the Stick Hive source supplied for this integration, with email-OTP authentication connected to the frontend.

## Auth flow

- `AuthProvider` checks `/api/auth/me` on app load.
- Navbar account menu opens the email-OTP sign-in dialog.
- `POST /api/auth/send-otp` requests a code.
- `POST /api/auth/verify-otp` verifies the code and establishes the HttpOnly session.
- `POST /api/auth/logout` ends the session.
- `/account/settings` shows the authenticated email and sign-out control.
- No cart, order, payment, product, or wishlist APIs are wired in this phase.

## Required environment

> **Outdated:** persistence moved from MongoDB to Cloudflare D1 after this
> doc was written - there's no connection-string env var to set anymore.
> D1 is a binding, configured in `wrangler.jsonc`'s `d1_databases` (local
> dev reads `.dev.vars`; production secrets are set via `wrangler secret
> put`, not `.env.local`). See `migrations/` for the schema and
> `backend/db/d1.ts` for the accessor.

Create `.env.local` in the project root:

RESEND_API_KEY=...
AUTH_FROM_EMAIL=Stick Hive <noreply@stickhive.app>

## Important

The supplied `backend.zip` did not contain the root package.json/Next.js config files, so those original project configuration files were preserved as an external dependency rather than reconstructed with guessed versions. Merge the `src/`, `public/`, and `backend/` contents into the working project root that already contains your package.json and Next.js configuration.


## Email sender
Use `RESEND_FROM_EMAIL="Stick Hive <noreply@stickhive.app>"` in `.env.local`.
