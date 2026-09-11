import { GoogleAuth } from "google-auth-library";
import { ObjectId } from "mongodb";
import { getCollection } from "../db/mongodb";
import { getCurrentUser } from "../auth/service";

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

  const collection = await getCollection<any>("orders");
  const filter = ObjectId.isValid(user.id)
    ? { orderId, userId: new ObjectId(user.id) }
    : { orderId };
  const order = await collection.findOne(filter);
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
    const now = new Date();
    const verification = {
      transactionId: data.googleTransactionId || order.upiPayment.transactionReference,
      utr: data.upiTransactionReferenceNumber,
      paidAmount: amount,
      paidAt: now,
      verifiedAt: now,
      verifiedBy: "google-pay-api",
      note: "Automatically verified using Google Pay transaction-status API.",
    };
    await collection.updateOne(
      { _id: order._id, paymentStatus: { $ne: "paid" } },
      { $set: { paymentStatus: "paid", status: order.status === "awaiting_payment" ? "placed" : order.status, paymentVerification: verification, updatedAt: now } },
    );
    return { status: data.transactionStatus, paid: true, order: await collection.findOne({ _id: order._id }) };
  }

  return { status: data.transactionStatus ?? "IN_PROGRESS", paid: false, amount, order };
}
