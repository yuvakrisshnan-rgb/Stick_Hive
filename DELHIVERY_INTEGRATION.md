# Stick Hive × Delhivery

## What is implemented

The admin order desk can create a Delhivery prepaid shipment, receive its AWB, build an official Delhivery tracking URL, request a pickup, and manually sync the shipment status. A Delhivery scan-push webhook is also available at:

`POST /api/webhooks/delhivery`

The webhook maps Delhivery scans to Stick Hive fulfillment states and sends the customer a Resend email the first time a shipment reaches `Out for Delivery`.

## Environment variables

Set these server-side only:

- `DELHIVERY_ENV=staging` for integration testing or `production` for live shipments.
- `DELHIVERY_API_TOKEN` from Delhivery One API Setup. Keep it secret.
- `DELHIVERY_CLIENT_NAME` exactly as registered with Delhivery.
- `DELHIVERY_PICKUP_LOCATION` exactly as the registered pickup/warehouse name. The API treats this name as case-sensitive.
- `DELHIVERY_HSN_CODE` and `DELHIVERY_SELLER_GST_TIN` if your Delhivery account requires them in manifestation.
- Optional seller identity fields: `DELHIVERY_SELLER_NAME`, `DELHIVERY_SELLER_ADDRESS`, `DELHIVERY_SELLER_PIN`.
- `DELHIVERY_WEBHOOK_SECRET` for an authorization header shared with Delhivery's scan-push webhook configuration.

## Admin workflow

1. Open a paid order.
2. Edit Delivery & tracking and set the courier to `Delhivery`.
3. Enter the actual packed weight and dimensions.
4. Click **Create Delhivery Shipment**. The app creates a prepaid shipment and stores the assigned AWB.
5. Click **Request Delhivery Pickup**, choose the date/time, and expected package count.
6. After pickup/scan events, Delhivery can push scans to the webhook. During testing, the admin can also use **Sync** to pull the current tracking state from Delhivery.

Stick Hive does not expose `DELHIVERY_API_TOKEN` to the browser.

## Webhook setup

Delhivery's scan-push integration requires an open endpoint supplied by the client. Configure:

`https://YOUR-STICKHIVE-DOMAIN/api/webhooks/delhivery`

Share the agreed authorization header/secret configured on the Stick Hive server. Delhivery documents that a sample scan can be sent to validate the endpoint before live scan push is enabled.

## Important

Delhivery's current documentation requires the production client account information and pickup location to be set up before production manifestation. The pickup location name must match the registered warehouse exactly. Their production API base is `https://track.delhivery.com`; staging uses `https://staging-express.delhivery.com`.
