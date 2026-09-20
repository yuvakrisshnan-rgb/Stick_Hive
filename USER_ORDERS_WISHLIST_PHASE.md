# Stick Hive — User Orders & Wishlist Phase

Implemented without wiring checkout/payment yet.

> **Outdated:** "MongoDB" below now means Cloudflare D1 - the persistence
> layer was migrated after this doc was written. See `migrations/` for
> the schema and `backend/db/d1.ts` for the accessor. The described
> behavior (guest localStorage, merge-on-login, auth-scoped queries)
> is still accurate.

## User wishlist
- Guests keep wishlist in localStorage.
- Authenticated users get a MongoDB-backed wishlist.
- On login, local wishlist is merged into the account wishlist.
- Toggling/removing/clearing while authenticated persists to MongoDB.

## User orders
- `/orders` now requires an authenticated session.
- It loads orders from `GET /api/orders` instead of trusting localStorage.
- The endpoint scopes data by the authenticated user's MongoDB user ID.
- The page is ready for the upcoming checkout/order service to create MongoDB order documents.

## Swagger
New documented endpoints:
- `GET /api/orders`
- `GET /api/wishlist`
- `PUT /api/wishlist`

## Not changed yet
- Checkout/order creation
- Payment
- S3 custom artwork
- Frontend checkout integration
