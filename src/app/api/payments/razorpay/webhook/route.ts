import { NextResponse } from "next/server";
import { verifyRazorpayWebhookSignature } from "../../../../../../backend/payments/razorpay";
import { setRazorpayPaymentState } from "../../../../../../backend/orders/service";
import { sendOrderConfirmationEmail } from "../../../../../../backend/shipping/notifications";

export const runtime = "nodejs";

type RazorpayWebhookPayload = {
  event?: string;
  payload?: {
    payment?: {
      entity?: {
        id?: string;
        order_id?: string;
        error_description?: string;
      };
    };
  };
};

export async function POST(request: Request) {
  // Signature MUST be checked against the raw, unparsed body — read text()
  // first, never request.json() before verification.
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature");

  if (!verifyRazorpayWebhookSignature(rawBody, signature)) {
    console.error("Razorpay webhook rejected: missing or invalid signature.");
    return new NextResponse("Invalid signature.", { status: 400 });
  }

  let body: RazorpayWebhookPayload;
  try {
    body = JSON.parse(rawBody) as RazorpayWebhookPayload;
  } catch {
    return new NextResponse("Invalid payload.", { status: 400 });
  }

  const payment = body.payload?.payment?.entity;
  const razorpayOrderId = payment?.order_id;

  try {
    switch (body.event) {
      case "payment.captured": {
        if (!razorpayOrderId || !payment?.id) break;
        const result = await setRazorpayPaymentState({
          razorpayOrderId,
          paymentStatus: "paid",
          razorpayPaymentId: payment.id,
        });
        // Only send the confirmation email the first time this order
        // actually transitions to paid - a retried webhook delivery for an
        // already-processed event must not re-send it.
        if (result.matched && !result.alreadyProcessed && result.order) {
          const order = result.order;
          try {
            await sendOrderConfirmationEmail({
              to: order.customer.email,
              customerName: order.customer.name,
              orderId: order.orderId,
              items: order.items.map((item) => ({ name: item.productName, quantity: item.quantity, lineTotal: item.lineTotal })),
              subtotal: order.subtotal,
              shipping: order.shipping,
              platformFee: order.platformFee,
              total: order.total,
            });
          } catch (emailError) {
            console.error("Failed to send order confirmation email:", emailError);
          }
        }
        break;
      }

      case "payment.failed": {
        // Deliberately does not touch paymentStatus - the order stays
        // "pending" so the customer can simply retry Razorpay checkout for
        // the same order rather than being dead-ended. Logged for visibility.
        console.warn(`Razorpay payment failed for order ${razorpayOrderId ?? "unknown"}: ${payment?.error_description ?? "no reason given"}`);
        break;
      }

      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Razorpay webhook processing failed:", error);
    // 500 (not 200) so Razorpay retries the delivery - processing is
    // idempotent (see setRazorpayPaymentState), so a retry after a
    // transient failure (e.g. a DB blip) is safe and desirable here.
    return NextResponse.json({ received: false }, { status: 500 });
  }
}
