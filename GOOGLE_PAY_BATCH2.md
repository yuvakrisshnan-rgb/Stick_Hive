# Google Pay payment-status integration

Stick Hive now contains a server-side integration for Google Pay India's NBU Payments API. It expects production merchant onboarding/allowlisting, a Google Merchant ID, and a Google service account with the `https://www.googleapis.com/auth/nbupaymentsmerchants` scope.

Environment variables:

```env
GOOGLE_PAY_MERCHANT_ID=your-google-merchant-id
GOOGLE_PAY_SERVICE_ACCOUNT_JSON={...service-account-json...}
```

The customer order page polls `POST /api/orders/:orderId/payment-sync` while an unpaid UPI order is open. When Google returns `SUCCESS` and the amount matches the order total, the server records the payment as paid and moves an awaiting-payment order to placed.

Google's production documentation requires business/merchant verification, bank/PSP payment-status capability, Google allowlisting, and API enablement. Do not enable the production flow until those prerequisites are complete.
