import { NextRequest, NextResponse } from "next/server";
import { ZodError, z } from "zod";
import { requestEmailOtp } from "../../../../backend/auth/service";
import { errorFromUnknown } from "../../../../backend/http/auth-response";

export const runtime = "nodejs";
const schema = z.object({ email: z.string().trim().email().max(254) });

export async function POST(request: NextRequest) {
  try {
    const body = schema.parse(await request.json());
    return NextResponse.json(await requestEmailOtp(body.email));
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ success: false, error: "Please enter a valid email address." }, { status: 400 });
    }
    return errorFromUnknown(error);
  }
}
