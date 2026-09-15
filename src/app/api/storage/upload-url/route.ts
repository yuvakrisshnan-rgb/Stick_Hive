import { NextResponse } from "next/server";
import { z } from "zod";
import { ObjectId } from "mongodb";
import { createCustomArtworkUpload } from "../../../../../backend/storage/uploads";
import { getCurrentUser } from "../../../../../backend/auth/service";
import { rateLimit, getClientIp } from "../../../../../backend/security/rate-limit";

export const runtime = "nodejs";

const requestSchema = z.object({
  contentType: z.enum(["image/png", "image/jpeg", "image/webp"]),
  size: z.number().int().positive().max(5 * 1024 * 1024),
});

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    if (ip && !(await rateLimit(`upload-url:${ip}`, 20, 10 * 60 * 1000))) {
      return NextResponse.json({ success: false, error: "Too many requests. Please try again later." }, { status: 429 });
    }

    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: "Not authenticated." }, { status: 401 });
    const body = requestSchema.parse(await request.json());
    const result = await createCustomArtworkUpload({ ...body, userId: new ObjectId(user.id) });
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: "Invalid image type or size." }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Unable to prepare upload.";
    const status = message.startsWith("Unsupported") || message.startsWith("Artwork") ? 400 : 503;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
