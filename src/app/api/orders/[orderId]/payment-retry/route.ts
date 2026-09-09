import { NextResponse } from "next/server";
import { retryUpiPayment } from "../../../../../../backend/orders/service";

export const runtime = "nodejs";

export async function POST(_request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  try {
    const { orderId } = await params;
    const order = await retryUpiPayment(orderId);
    return NextResponse.json({ success: true, order });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to restart UPI payment.";
    const status = /not authenticated/i.test(message) ? 401 : /not found|no longer|already verified/i.test(message) ? 409 : 400;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
