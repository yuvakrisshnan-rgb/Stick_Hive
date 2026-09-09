import { NextResponse } from "next/server";
import JSZip from "jszip";
import { getAdminOrder } from "../../../../../../../backend/orders/service";
import { getArtworkObject } from "../../../../../../../backend/storage/downloads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clean(value: string, fallback: string) {
  return value.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || fallback;
}

function extensionFromContentType(contentType?: string) {
  if (contentType === "image/jpeg") return "jpg";
  if (contentType === "image/webp") return "webp";
  return "png";
}

export async function GET(_request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  try {
    const { orderId } = await params;
    const order = await getAdminOrder(orderId);
    if (!order) return NextResponse.json({ success: false, error: "Order not found." }, { status: 404 });

    const customItems = order.items.map((item, index) => ({ item, index })).filter(({ item }) => Boolean(item.artworkObjectKey));
    if (customItems.length === 0) {
      return NextResponse.json({ success: false, error: "This order has no custom artwork to download." }, { status: 404 });
    }

    const zip = new JSZip();
    const folder = zip.folder(`StickHive-${clean(order.orderId, "order")}`)!;
    const manifest = [
      "StickHive print pack",
      `Order: ${order.orderId}`,
      `Created: ${new Date(order.createdAt).toLocaleString("en-IN")}`,
      `Customer: ${order.customer.name}`,
      `Phone: ${order.customer.phone}`,
      `Email: ${order.customer.email}`,
      `Status: ${order.status}`,
      `Payment: ${order.paymentStatus}`,
      "",
      "Items:",
      ...order.items.map((item, index) => `${index + 1}. ${item.productName}${item.type === "custom" ? " (custom)" : ""} | Qty ${item.quantity}${item.size ? ` | Size ${item.size}` : ""}${item.shape ? ` | Shape ${item.shape}` : ""}${item.finish ? ` | Finish ${item.finish}` : ""}`),
      "",
      `Custom artwork files: ${customItems.length}`,
    ].join("\n");
    folder.file("PRINT-INSTRUCTIONS.txt", manifest);

    for (const { item, index } of customItems) {
      const response = await getArtworkObject(item.artworkObjectKey!);
      if (!response.Body) continue;
      const bytes = await response.Body.transformToByteArray();
      const extension = extensionFromContentType(item.artworkContentType);
      const filename = `${String(index + 1).padStart(2, "0")}-${clean(item.productName, `sticker-${index + 1}`)}-${clean(item.size, "size")}.${extension}`;
      folder.file(filename, bytes);
    }

    const bytes = await zip.generateAsync({ type: "uint8array", compression: "DEFLATE", compressionOptions: { level: 6 } });
    return new NextResponse(bytes as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Length": String(bytes.byteLength),
        "Content-Disposition": `attachment; filename="StickHive-${clean(order.orderId, "order")}-Print-Pack.zip"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create print pack.";
    const status = /not authenticated/i.test(message) ? 401 : /admin access/i.test(message) ? 403 : /not found/i.test(message) ? 404 : 503;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
