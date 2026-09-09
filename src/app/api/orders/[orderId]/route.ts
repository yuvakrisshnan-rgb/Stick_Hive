import { NextResponse } from "next/server";
import { getMyOrder } from "../../../../../backend/orders/service";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  try {
    const { orderId } = await params;
    const order = await getMyOrder(orderId);
    if (!order) return NextResponse.json({ success: false, error: "Order not found." }, { status: 404 });
    return NextResponse.json({ success: true, order });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load order.";
    return NextResponse.json({ success: false, error: message }, { status: /not authenticated/i.test(message) ? 401 : 503 });
  }
}
