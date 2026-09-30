import { NextResponse } from "next/server";
import { getAdminInsights } from "../../../../../backend/admin/insights";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // getAdminInsights() calls requireAdmin() internally as its first
    // operation, before any query runs — same pattern every other
    // /api/admin/* route uses.
    const insights = await getAdminInsights();
    return NextResponse.json({ success: true, insights });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load insights.";
    const status = /not authenticated/i.test(message) ? 401 : /admin access/i.test(message) ? 403 : 503;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
