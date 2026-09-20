# Stick Hive — Checkout, Custom Artwork & Stripe Phase

> **Outdated:** "MongoDB" below now means Cloudflare D1 - the persistence
> layer was migrated after this doc was written. See `migrations/` for
> the schema and `backend/db/d1.ts` for the accessor.

## What is now wired

- `POST /api/orders` accepts the checkout payload and recomputes product/custom pricing on the server.
- Customers must have an active Stick Hive email-OTP session, and the order email must match the verified session email.
- Custom sticker thumbnails are uploaded from the browser to the S3-compatible `stick-hive` bucket using a presigned PUT URL under `custom-art/temp/<userId>/...`.
- On successful order creation, custom artwork is copied to `custom-art/orders/<orderId>/<cartLineId>.<ext>` and the final S3 object is tagged with `order-id`, `custom-line-id`, `user-id`, and a purpose value.
- MongoDB stores the order snapshot, payment state, and private artwork object key.
- `POST /api/payments/stripe/checkout` creates a hosted Stripe Checkout Session using the server-calculated order total.
- `POST /api/payments/stripe/webhook` verifies Stripe signatures and updates payment state.
- UPI remains available as the launch fallback.

## Local Floci setup

Run `npm run storage:local-cors` from WSL after the local `stick-hive` bucket exists. This configures the bucket for browser PUTs from `http://localhost:3000`.

## Stripe

Stripe is optional until the account is configured. Add `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` to `.env.local`. GitHub Student Developer Pack currently advertises waived Stripe transaction fees on the first $1,000 in revenue processed, but Stripe says new India accounts are invite-only and subject to its onboarding/KYC process.
