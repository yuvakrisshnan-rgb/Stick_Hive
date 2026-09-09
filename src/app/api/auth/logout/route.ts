import { NextResponse } from "next/server";
import { logout } from "../../../../../backend/auth/service";

export const runtime = "nodejs";

export async function POST() {
  try {
    await logout();
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to log out.";
    return NextResponse.json({ success: false, error: message }, { status: 503 });
  }
}
