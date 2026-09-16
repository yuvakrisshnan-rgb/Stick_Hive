import { NextResponse } from "next/server";
import { getOrderAnalytics } from "../../../../../backend/orders/analytics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // getOrderAnalytics() calls requireAdmin() internally as its first
    // operation, before any aggregation runs — same pattern every other
    // /api/admin/* route uses via getAdminOrder/getAdminOrders/updateAdminOrder.
    const analytics = await getOrderAnalytics();
    return NextResponse.json({ success: true, analytics });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load analytics.";
    const status = /not authenticated/i.test(message) ? 401 : /admin access/i.test(message) ? 403 : 503;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
