import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "../../../../../../backend/auth/service";
import { getMyOrder, attachRazorpayOrder } from "../../../../../../backend/orders/service";
import { createRazorpayOrder, getRazorpayKeyId } from "../../../../../../backend/payments/razorpay";

export const runtime = "nodejs";

const schema = z.object({ orderId: z.string().trim().min(1).max(100) });

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: "Not authenticated." }, { status: 401 });

    const body = schema.parse(await request.json());

    const order = await getMyOrder(body.orderId);
    if (!order) return NextResponse.json({ success: false, error: "Order not found." }, { status: 404 });
    if (order.paymentMethod !== "razorpay" || order.paymentStatus !== "pending") {
      return NextResponse.json({ success: false, error: "This order is not available for Razorpay payment." }, { status: 409 });
    }

    const created = await createRazorpayOrder({ order: order as never });
    // attachRazorpayOrder atomically claims the slot - if a concurrent
    // request from another tab already claimed it first, this returns
    // THEIR razorpayOrderId instead, so both converge on one Razorpay order.
    const razorpayOrderId = await attachRazorpayOrder(body.orderId, created.razorpayOrderId);

    return NextResponse.json({
      success: true,
      razorpayOrderId,
      amount: created.amount,
      currency: created.currency,
      keyId: getRazorpayKeyId(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: "orderId is required." }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Unable to start Razorpay checkout.";
    const status = /not authenticated/i.test(message) ? 401 : /not configured/i.test(message) ? 503 : 400;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
