import { NextResponse } from "next/server";
import { checkGooglePayPayment } from "../../../../../../backend/payments/google-pay";

export const runtime = "nodejs";

export async function POST(_request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  try {
    const { orderId } = await params;
    const result = await checkGooglePayPayment(orderId);
    return NextResponse.json({ success: true, status: result.status, paid: result.paid, order: result.order });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to check payment status.";
    return NextResponse.json({ success: false, error: message }, { status: /not authenticated/i.test(message) ? 401 : 503 });
  }
}
