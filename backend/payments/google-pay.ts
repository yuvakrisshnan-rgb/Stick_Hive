import { GoogleAuth } from "google-auth-library";
import { getCurrentUser } from "../auth/service";
import { confirmUpiPaymentViaGooglePay, getMyOrder } from "../orders/service";
import { sendOrderConfirmationEmail } from "../shipping/notifications";

type GoogleTransactionResponse = {
  transactionStatus?: "SUCCESS" | "FAILURE" | "IN_PROGRESS" | "PAYMENT_NOT_INITIATED";
  paymentMode?: string;
  googleTransactionId?: string;
  transactionAmount?: { currencyCode?: string; units?: string; nanos?: number };
  upiTransactionReferenceNumber?: string;
};

function required(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not configured.`);
  return value;
}

function getGoogleMerchantId() {
  return required("GOOGLE_PAY_MERCHANT_ID");
}

async function getAccessToken() {
  const credentialsJson = required("GOOGLE_PAY_SERVICE_ACCOUNT_JSON");
  let credentials: Record<string, unknown>;
  try {
    credentials = JSON.parse(credentialsJson) as Record<string, unknown>;
  } catch {
    throw new Error("GOOGLE_PAY_SERVICE_ACCOUNT_JSON is not valid JSON.");
  }

  const auth = new GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/nbupaymentsmerchants"],
  });
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  if (!token.token) throw new Error("Unable to obtain Google Pay API access token.");
  return token.token;
}

function responseAmount(response: GoogleTransactionResponse): number | null {
  const units = Number(response.transactionAmount?.units ?? 0);
  const nanos = Number(response.transactionAmount?.nanos ?? 0);
  if (!Number.isFinite(units) || !Number.isFinite(nanos)) return null;
  return units + nanos / 1_000_000_000;
}

export async function checkGooglePayPayment(orderId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated.");

  // getMyOrder enforces ownership (order_id + the caller's own user_id) and
  // returns the same serialized shape everywhere else in the app uses,
  // upiPayment (computed at read time - see getUpiPaymentDetails) included.
  const order = await getMyOrder(orderId);
  if (!order) throw new Error("Order not found.");
  if (order.paymentMethod !== "upi") throw new Error("Google Pay verification is only available for UPI orders.");
  if (order.paymentStatus === "paid") {
    return { status: "SUCCESS", paid: true, order };
  }
  if (!order.upiPayment?.transactionReference) throw new Error("No Google Pay transaction reference is attached to this order.");

  const token = await getAccessToken();
  const endpoint = "https://nbupayments.googleapis.com/v1/merchantTransactions:get";
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      merchantInfo: { googleMerchantId: getGoogleMerchantId() },
      transactionIdentifier: { merchantTransactionId: order.upiPayment.transactionReference },
    }),
    cache: "no-store",
  });

  const data = (await response.json().catch(() => null)) as GoogleTransactionResponse | null;
  if (!response.ok || !data) throw new Error("Google Pay payment-status lookup failed.");

  const amount = responseAmount(data);
  const expected = Number(order.total);
  const paid = data.transactionStatus === "SUCCESS" && amount !== null && Math.abs(amount - expected) < 0.01;

  if (paid) {
    // Deliberate, explicit override of this function's original, more
    // conservative design (confirmed with the project owner - see
    // DECISIONS.md): Google's own merchant-transaction API is now trusted
    // to confirm payment directly, the same way the Razorpay webhook's
    // signed callback does, instead of only writing a suggestion for an
    // admin to review. Scoped to Google Pay specifically - any other UPI
    // app a customer might have paid with still has no automated
    // confirmation path and needs the existing manual admin-verification
    // flow (updateAdminOrder), unchanged.
    const result = await confirmUpiPaymentViaGooglePay({
      orderId,
      transactionId: data.googleTransactionId || order.upiPayment.transactionReference,
      utr: data.upiTransactionReferenceNumber,
      paidAmount: amount as number,
    });

    // Only send the confirmation email the first time this order actually
    // transitions to paid - a repeat poll hitting the same already-paid
    // order (the idempotency guard inside confirmUpiPaymentViaGooglePay)
    // must not re-send it. Mirrors the Razorpay webhook route's identical
    // alreadyProcessed check.
    if (result.matched && !result.alreadyProcessed && result.order) {
      const paidOrder = result.order;
      try {
        await sendOrderConfirmationEmail({
          to: paidOrder.customer.email,
          customerName: paidOrder.customer.name,
          orderId: paidOrder.orderId,
          items: paidOrder.items.map((item) => ({ name: item.productName, quantity: item.quantity, lineTotal: item.lineTotal })),
          subtotal: paidOrder.subtotal,
          shipping: paidOrder.shipping,
          total: paidOrder.total,
        });
      } catch (emailError) {
        console.error("Failed to send order confirmation email after an automated Google Pay confirmation:", emailError);
      }
    }

    return { status: data.transactionStatus, paid: true, order: await getMyOrder(orderId) };
  }

  return { status: data.transactionStatus ?? "IN_PROGRESS", paid: false, amount, order };
}
