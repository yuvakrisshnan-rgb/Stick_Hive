import { NextResponse } from "next/server";
import { getAdminOrder } from "../../../../../../../backend/orders/service";
import { createArtworkDownloadUrl } from "../../../../../../../backend/storage/downloads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeFilename(value: string, index: number, extension: string) {
  const base = value.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || `sticker-${index + 1}`;
  return `${base}.${extension}`;
}

export async function GET(request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  try {
    const { orderId } = await params;
    const url = new URL(request.url);
    const itemIndex = Number(url.searchParams.get("item") ?? "-1");
    const order = await getAdminOrder(orderId);
    if (!order) return NextResponse.json({ success: false, error: "Order not found." }, { status: 404 });
    if (!Number.isInteger(itemIndex) || itemIndex < 0 || itemIndex >= order.items.length) {
      return NextResponse.json({ success: false, error: "Invalid order item." }, { status: 400 });
    }

    const item = order.items[itemIndex];
    if (!item.artworkObjectKey) {
      return NextResponse.json({ success: false, error: "This item has no custom artwork." }, { status: 404 });
    }

    const extension = item.artworkContentType === "image/jpeg" ? "jpg" : item.artworkContentType === "image/webp" ? "webp" : "png";
    const filename = safeFilename(`${order.orderId}-${item.productName}`, itemIndex, extension);
    const downloadUrl = await createArtworkDownloadUrl(item.artworkObjectKey, filename);
    return NextResponse.redirect(downloadUrl);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to prepare artwork download.";
    const status = /not authenticated/i.test(message) ? 401 : /admin access/i.test(message) ? 403 : /not found/i.test(message) ? 404 : 503;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
