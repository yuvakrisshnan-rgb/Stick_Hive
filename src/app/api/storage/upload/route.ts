import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getCurrentUser } from "../../../../../backend/auth/service";
import { uploadCustomArtwork, MAX_UPLOAD_BYTES } from "../../../../../backend/storage/uploads";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated." }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, error: "A file field is required." }, { status: 400 });
    }

    if (file.size <= 0 || file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ success: false, error: "Artwork must be between 1 byte and 5 MB." }, { status: 400 });
    }

    const result = await uploadCustomArtwork({
      body: new Uint8Array(await file.arrayBuffer()),
      contentType: file.type,
      userId: new ObjectId(user.id),
      size: file.size,
    });

    return NextResponse.json({ success: true, ...result }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to upload artwork.";
    const isClientError = message.startsWith("Unsupported") || message.startsWith("Artwork") || message.includes("size");
    return NextResponse.json({ success: false, error: message }, { status: isClientError ? 400 : 503 });
  }
}
