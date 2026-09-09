import { NextResponse } from "next/server";
import { getAdminOrder } from "../../../../../../../backend/orders/service";
import { createPaymentProofUrl } from "../../../../../../../backend/storage/downloads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  try {
    const { orderId } = await params;
    const order = await getAdminOrder(orderId);
    if (!order) return NextResponse.json({ success: false, error: "Order not found." }, { status: 404 });
    if (!order.paymentProof?.objectKey) return NextResponse.json({ success: false, error: "No payment proof uploaded." }, { status: 404 });
    const filename = order.paymentProof.fileName || `${order.orderId}-payment-proof`;
    const url = await createPaymentProofUrl(order.paymentProof.objectKey, filename);
    return NextResponse.redirect(url);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to open payment proof.";
    const status = /not authenticated/i.test(message) ? 401 : /admin access/i.test(message) ? 403 : /not found/i.test(message) ? 404 : 503;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
