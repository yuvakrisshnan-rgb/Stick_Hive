# Stick Hive backend — Auth phase

The `backend/` directory contains server-only application logic. Next.js route handlers in `src/app/api/` are thin adapters over this layer.

## Current scope

- MongoDB Atlas persistence
- Email OTP issuance + verification
- OTP expiry, attempt limit, resend cooldown
- Session creation with an HttpOnly cookie
- Session lookup + logout
- OpenAPI spec + Swagger UI

## Endpoints

- `POST /api/auth/send-otp`
- `POST /api/auth/verify-otp`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `GET /api/docs`
- `GET /api/docs/openapi.json`

The older `/api/send-email-otp` and `/api/verify-email-otp` routes are retained as compatibility adapters for the current frontend. No frontend code is modified in this phase.

## Storage

Custom sticker artwork uses the S3-compatible storage API exposed by Floci locally.

- `POST /api/storage/upload-url` — creates a presigned PUT URL for PNG/JPEG/WebP artwork (max 5 MB).
- `GET /api/storage/health` — checks the configured bucket.

Local environment uses `S3_ENDPOINT=http://localhost:4566` and bucket `stick-hive`.


## Checkout + Payments

- `POST /api/orders` creates the MongoDB order from server-validated product/custom-sticker inputs. Custom artwork is finalized from `custom-art/temp/...` into `custom-art/orders/<orderId>/...` with S3 object metadata tagging the order, custom line, and user.
- `GET /api/orders/{orderId}` returns the authenticated user's order for the success screen.
- `POST /api/payments/stripe/checkout` creates a hosted Stripe Checkout Session using the server-calculated order total.
- `POST /api/payments/stripe/webhook` verifies Stripe signatures and marks orders paid/failed/cancelled.
- UPI remains supported as a manual confirmation path.

Stripe is optional until `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` are configured.
