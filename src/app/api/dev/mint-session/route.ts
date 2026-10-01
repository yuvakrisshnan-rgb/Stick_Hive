import { NextRequest, NextResponse } from "next/server";
import { ZodError, z } from "zod";
import { isTestSessionSeamAllowed, mintTestSession } from "../../../../../backend/auth/service";
import { errorFromUnknown } from "../../../../../backend/http/auth-response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Dev-only e2e test seam - see backend/auth/service.ts's mintTestSession
// for the double-gate this enforces (AUTH_TEST_SESSION_SEAM=true AND
// NODE_ENV !== "production", both required). Returns a real 404 (route
// behaves as if it doesn't exist) rather than a 403 when disabled, same
// spirit as src/app/dev/layout.tsx's notFound() for the /dev/* pages -
// this must never be distinguishable from "route not found" in production.

const schema = z.object({
  email: z.string().trim().email().max(254),
});

export async function POST(request: NextRequest) {
  if (!isTestSessionSeamAllowed()) {
    return NextResponse.json({ success: false, error: "Not found." }, { status: 404 });
  }

  try {
    let payload: unknown;
    try {
      payload = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: "Invalid request." }, { status: 400 });
    }

    const body = schema.parse(payload);
    const result = await mintTestSession(body.email);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ success: false, error: "Invalid email address." }, { status: 400 });
    }
    return errorFromUnknown(error);
  }
}
