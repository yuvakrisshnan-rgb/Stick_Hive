import { NextResponse } from "next/server";
import { getAdminOrders } from "../../../../../backend/orders/service";

export const runtime = "nodejs";

export async function GET() {
  try {
    const orders = await getAdminOrders();
    return NextResponse.json({ success: true, orders });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load admin orders.";
    const status = /not authenticated/i.test(message) ? 401 : /admin access/i.test(message) ? 403 : 503;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
