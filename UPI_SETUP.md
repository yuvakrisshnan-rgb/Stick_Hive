# Stick Hive Manual UPI Setup

Launch checkout uses one receiving UPI ID and creates an order-specific UPI payment URI containing the exact order total and order reference.

## Local `.env.local`

Copy `.env.example` to `.env.local`, then set:

```env
STICKHIVE_UPI_ID=yourupi@bank
STICKHIVE_UPI_NAME=Stick Hive
```

Keep the UPI ID server-side. Do not prefix these variables with `NEXT_PUBLIC_`; the server builds the payment URI after the order is created.

## Payment flow

1. Customer completes checkout.
2. Stick Hive creates the order on the server and calculates the authoritative total.
3. The order success page receives a UPI URI containing `pa`, `pn`, `am`, `cu`, `tr`, and `tn`.
4. The browser turns that URI into a QR image using the existing `qrcode` dependency.
5. Customer pays through a UPI app.
6. Customer clicks **I've Paid — Confirm Payment**.
7. Stick Hive changes the order to `pending_confirmation`.
8. Admin verifies the payment in the receiving UPI account and later marks the order as paid.

## Local S3

For Floci, keep `AWS_REGION=us-east-1` and `S3_ENDPOINT=http://localhost:4566`. Production AWS will use `AWS_REGION=ap-south-1` and no local endpoint.

## Launch payment/order state

UPI orders are created as `awaiting_payment` with `paymentStatus=pending_confirmation`. The customer first pays and then taps the confirmation button. The order remains unconfirmed until an authorized Stick Hive admin changes the payment status to `paid`. That admin action automatically changes `awaiting_payment` to `placed` (Order Confirmed).

Set `STICKHIVE_ADMIN_EMAILS` to the comma-separated email addresses that are allowed to use `/admin`.
