import { NextResponse } from "next/server";
import { claimUpiPayment } from "../../../../../../backend/orders/service";

export const runtime = "nodejs";

export async function POST(_request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  try {
    const { orderId } = await params;
    const order = await claimUpiPayment(orderId);
    return NextResponse.json({ success: true, order });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to record payment confirmation.";
    const status = /not authenticated/i.test(message)
      ? 401
      : /unavailable/i.test(message)
        ? 409
        : 400;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
