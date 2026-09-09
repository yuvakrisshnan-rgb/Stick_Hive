import { NextResponse } from "next/server";
import { getCurrentUser, isAdminUser } from "../../../../../backend/auth/service";
import { getAdminPath } from "../../../../../backend/auth/admin-path";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated." }, { status: 401 });
    }
    return NextResponse.json({
      success: true,
      user: {
        ...user,
        isAdmin: isAdminUser(user),
        ...(isAdminUser(user) ? { adminPath: getAdminPath() } : {}),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to read session.";
    return NextResponse.json({ success: false, error: message }, { status: 503 });
  }
}
