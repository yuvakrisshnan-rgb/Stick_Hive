import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "../../../../backend/auth/service";
import { getWishlist, replaceWishlist } from "../../../../backend/wishlist/service";

export const runtime = "nodejs";

const bodySchema = z.object({
  productIds: z.array(z.string().min(1).max(200)).max(200),
});

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: "Not authenticated." }, { status: 401 });
    const result = await getWishlist();
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load wishlist.";
    return NextResponse.json({ success: false, error: message }, { status: 503 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: "Not authenticated." }, { status: 401 });
    const body = bodySchema.parse(await request.json());
    const result = await replaceWishlist(body.productIds);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: "Invalid wishlist payload." }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Unable to update wishlist.";
    return NextResponse.json({ success: false, error: message }, { status: 503 });
  }
}
