import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import QRCode from "qrcode";

// ============================================================================
// TYPES
// ============================================================================

type InvoiceOrder = {
  orderId: string;
  createdAt: string;

  customer: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };

  paymentMethod: string;
  paymentStatus?: string;
  paymentVerification?: { transactionId: string; utr?: string; paidAmount: number; paidAt: string };

  items: {
    productName: string;
    imageUrl?: string;
    size: string;
    shape?: string;
    finish?: string;
    quantity: number;
    lineTotal: number;
  }[];

  subtotal: number;
  shipping: number;
  total: number;
};

type LoadedImage = { dataUrl: string; width: number; height: number };

// The functional autoTable(doc, options) call (used below) sets
// doc.lastAutoTable to the drawn Table afterwards - jspdf-autotable's own
// "sugar" for reading back where it finished (its getLastAutoTable()
// method only exists on its internal DocHandler wrapper, never on a
// plain jsPDF instance, so that's not available here). This is the only
// local typing for it, used in one place below, instead of casting the
// whole doc to any.
type AutoTableJsPDF = jsPDF & { lastAutoTable?: { finalY?: number } };

// ============================================================================
// BRAND TOKENS
// Mirrors the real site palette (src/app/globals.css's :root vars) and the
// real support contact (footer.tsx / contact/page.tsx) - not invented colors
// or a placeholder email, so the PDF actually matches the brand it's from.
// ============================================================================

const COLOR = {
  hiveYellow: "#FFD43B",
  honeyOrange: "#FF8A00",
  honeyDark: "#E66F00",
  cream: "#FFF8ED",
  mint: "#B8F2D0",
  ink: "#111111",
  muted: "#6B6B6B",
  border: "#F1DFC5",
  white: "#FFFFFF",
} as const;

const SUPPORT_EMAIL = "hello@stickhive.com";

// A4 content grid, in mm.
const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN_L = 20;
const MARGIN_R = 190;

// Below this y, a fresh page is started for the totals/QR/footer block
// rather than letting them run off the bottom edge - the original
// generator had no such guard, so a longer order (or one with wrapped
// item details) could silently push the total and QR off the page.
const BOTTOM_SAFE_Y = 240;

type PaymentDisplay = { label: string; bg: string; fg: string; detail?: string };

function paymentDisplay(order: InvoiceOrder): PaymentDisplay {
  const method = order.paymentMethod ? order.paymentMethod.toUpperCase() : "";

  switch (order.paymentStatus) {
    case "paid": {
      const v = order.paymentVerification;
      const ref = v?.utr || v?.transactionId;
      return {
        label: "Payment Confirmed",
        bg: "#E3F7E9",
        fg: "#1F7A3D",
        detail: method ? `Paid via ${method}${ref ? ` • Ref ${ref}` : ""}` : undefined,
      };
    }
    case "pending_confirmation":
      return {
        label: "Verification Pending",
        bg: "#FFF1D6",
        fg: "#92610A",
        detail: "We're confirming your payment - this will update shortly.",
      };
    case "failed":
      return { label: "Payment Failed", bg: "#FDE4E4", fg: "#9A2A2A" };
    case "cancelled":
      return { label: "Order Cancelled", bg: "#ECECEC", fg: "#555555" };
    case "refunded":
      return { label: "Refunded", bg: "#E3ECFB", fg: "#2A4F9A" };
    case "pending":
    default:
      // Deliberately not "Payment Confirmed" by default - the original
      // generator hardcoded that badge regardless of the real
      // paymentStatus it was handed, so an unpaid/pending order's
      // invoice still claimed the payment was confirmed.
      return { label: "Payment Pending", bg: "#FFF1D6", fg: "#92610A" };
  }
}

function rupees(value: number): string {
  return `Rs. ${value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Small-caps tracking isn't a real jsPDF feature - spacing the letters out
// by hand is the usual trick for a tracked-caps look in a generated PDF.
function tracked(text: string): string {
  return text.toUpperCase().split("").join(" ");
}

// ============================================================================
// IMAGE LOADING
// Used for the logo (same-origin) and each line item's product photo
// (often cross-origin, served from R2). The original version had no
// timeout and no try/catch around the canvas read, so a slow network
// request or a CORS-blocked ("tainted") canvas would leave the whole
// invoice generation hanging indefinitely with no feedback. This version
// always resolves - null on any failure - within `timeoutMs`.
// ============================================================================

// maxDimension caps the canvas this re-encodes the image onto, not just
// its PDF display size - jsPDF's addImage() embeds whatever pixel data
// it's handed as-is, with no resampling of its own. The original invoice
// embedded the brand logo (a 1024x1024 source PNG) at full resolution for
// an 18mm-wide placement, which is most of why that one logo alone made
// the PDF several megabytes; every size below is well under what a small
// printed thumbnail needs even at high DPI.
function loadImage(src: string, timeoutMs = 6000, maxDimension = 240): Promise<LoadedImage | null> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (value: LoadedImage | null) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };

    const timer = setTimeout(() => finish(null), timeoutMs);

    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      clearTimeout(timer);
      try {
        const scale = Math.min(1, maxDimension / Math.max(img.naturalWidth, img.naturalHeight));
        const width = Math.max(1, Math.round(img.naturalWidth * scale));
        const height = Math.max(1, Math.round(img.naturalHeight * scale));

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return finish(null);
        ctx.drawImage(img, 0, 0, width, height);
        finish({
          dataUrl: canvas.toDataURL("image/png"),
          width,
          height,
        });
      } catch (error) {
        // Most likely a cross-origin image whose host doesn't send the
        // right CORS headers back - canvas.toDataURL() throws on a
        // "tainted" canvas rather than failing gracefully.
        console.warn("[invoice] couldn't read image (possibly a CORS block):", src, error);
        finish(null);
      }
    };

    img.onerror = () => {
      clearTimeout(timer);
      finish(null);
    };

    img.src = src;
  });
}

// Scales (naturalW x naturalH) to fit inside (boxW x boxH) without
// distorting it, and returns the offset to center it in the box.
function fitContain(naturalW: number, naturalH: number, boxW: number, boxH: number) {
  const scale = Math.min(boxW / naturalW, boxH / naturalH);
  const w = naturalW * scale;
  const h = naturalH * scale;
  return { w, h, dx: (boxW - w) / 2, dy: (boxH - h) / 2 };
}

// ============================================================================
// DECORATIVE HONEYCOMB RULE
// A row of small hexagon outlines in place of a plain line - a restrained
// nod to the brand (bee / hive) that doesn't need a new image asset.
// ============================================================================

function drawHexRule(doc: jsPDF, x1: number, x2: number, y: number) {
  const r = 1.7;
  const spacing = 5.4;

  doc.setDrawColor(COLOR.honeyOrange);
  doc.setLineWidth(0.3);
  doc.setGState(doc.GState({ opacity: 0.5 }));

  for (let cx = x1 + r; cx <= x2 - r; cx += spacing) {
    const vertices: [number, number][] = Array.from({ length: 6 }, (_, i) => {
      const angle = (Math.PI / 180) * (60 * i);
      return [cx + r * Math.cos(angle), y + r * Math.sin(angle)];
    });

    const deltas = vertices.slice(1).map((point, index) => [
      point[0] - vertices[index][0],
      point[1] - vertices[index][1],
    ]);

    doc.lines(deltas, vertices[0][0], vertices[0][1], [1, 1], "S", true);
  }

  doc.setGState(doc.GState({ opacity: 1 }));
}

// Single hexagon outline, used as the "no photo available" placeholder in
// the items table instead of leaving a blank gap when a product image
// fails to load (slow network, or a cross-origin host without CORS set up).
function drawHexPlaceholder(doc: jsPDF, cx: number, cy: number, r: number) {
  const vertices: [number, number][] = Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 180) * (60 * i);
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
  });

  const deltas = vertices.slice(1).map((point, index) => [
    point[0] - vertices[index][0],
    point[1] - vertices[index][1],
  ]);

  doc.setDrawColor(COLOR.honeyOrange);
  doc.setLineWidth(0.4);
  doc.setGState(doc.GState({ opacity: 0.35 }));
  doc.lines(deltas, vertices[0][0], vertices[0][1], [1, 1], "S", true);
  doc.setGState(doc.GState({ opacity: 1 }));
}

function fillPageBackground(doc: jsPDF) {
  doc.setFillColor(COLOR.cream);
  doc.rect(0, 0, PAGE_W, PAGE_H, "F");
  doc.setFillColor(COLOR.honeyOrange);
  doc.rect(0, 0, PAGE_W, 3.5, "F");
}

function drawPill(doc: jsPDF, x: number, y: number, text: string, bg: string, fg: string) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  const textW = doc.getTextWidth(text);
  const paddingX = 4;
  const w = textW + paddingX * 2;
  const h = 7.5;

  doc.setFillColor(bg);
  doc.roundedRect(x, y, w, h, h / 2, h / 2, "F");
  doc.setTextColor(fg);
  doc.text(text, x + paddingX, y + h / 2 + 1.1);

  return { width: w, height: h };
}

// ============================================================================
// GENERATE INVOICE
// ============================================================================

export async function generateInvoice(order: InvoiceOrder) {
  try {
    const doc = new jsPDF();
    const payment = paymentDisplay(order);
    const invoiceNumber = `INV-SH-${new Date(order.createdAt).getFullYear()}-${order.orderId.slice(-6)}`;

    // Prefetch every image up front - the logo, and each line item's
    // product photo - so the (synchronous) autoTable draw hooks below
    // always have the data already in hand instead of trying to kick off
    // async work inside them.
    const [logo, trackingQr, itemImages] = await Promise.all([
      loadImage("/brand/stickhive-bee-logo.png"),
      // Real, functional QR - the original invoice shipped a QR pointing
      // at /dummy/payment-qr.png, which is a 0-byte placeholder file that
      // always fails to load, so it never actually rendered anything.
      // This one encodes the order's real tracking page.
      typeof window !== "undefined"
        ? QRCode.toDataURL(`${window.location.origin}/track-order?orderId=${encodeURIComponent(order.orderId)}`, {
            width: 240,
            margin: 1,
            errorCorrectionLevel: "M",
            color: { dark: COLOR.ink, light: "#00000000" },
          }).catch(() => null)
        : Promise.resolve(null),
      Promise.all(order.items.map((item) => (item.imageUrl ? loadImage(item.imageUrl) : Promise.resolve(null)))),
    ]);

    fillPageBackground(doc);

    // ------------------------------------------------------------------
    // HEADER
    // ------------------------------------------------------------------

    if (logo) {
      const fit = fitContain(logo.width, logo.height, 18, 18);
      doc.addImage(logo.dataUrl, "PNG", MARGIN_L + fit.dx, 10 + fit.dy, fit.w, fit.h);
    }

    doc.setTextColor(COLOR.ink);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(19);
    doc.text("Stick Hive", MARGIN_L + 22, 20);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(COLOR.muted);
    doc.text(tracked("Ideas find a home"), MARGIN_L + 22, 25.5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(COLOR.ink);
    doc.text("INVOICE", MARGIN_R, 17, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(COLOR.muted);
    doc.text(`No. ${invoiceNumber}`, MARGIN_R, 23, { align: "right" });
    doc.text(
      `Date: ${new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`,
      MARGIN_R,
      28,
      { align: "right" },
    );

    drawHexRule(doc, MARGIN_L, MARGIN_R, 34);

    // ------------------------------------------------------------------
    // BILLED TO  /  ORDER DETAILS
    // ------------------------------------------------------------------

    let leftY = 44;
    let rightY = 44;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(COLOR.honeyDark);
    doc.text(tracked("Billed to"), MARGIN_L, leftY);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(COLOR.honeyDark);
    doc.text(tracked("Order details"), 115, rightY);

    leftY += 6;
    rightY += 6;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(COLOR.ink);
    doc.text(order.customer.name, MARGIN_L, leftY);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(COLOR.muted);
    doc.text(`Order ID: ${order.orderId}`, 115, rightY);

    leftY += 6;
    rightY += 6;

    doc.text(order.customer.email, MARGIN_L, leftY);
    doc.text(`Payment: ${order.paymentMethod ? order.paymentMethod.toUpperCase() : "-"}`, 115, rightY);

    leftY += 6;
    rightY += 6;

    doc.text(order.customer.phone, MARGIN_L, leftY);
    const pill = drawPill(doc, 115, rightY - 4.5, payment.label, payment.bg, payment.fg);
    rightY += pill.height + 3;

    if (payment.detail) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(COLOR.muted);
      doc.text(doc.splitTextToSize(payment.detail, 75), 115, rightY);
      rightY += 8;
    }

    leftY += 6;
    const addressLines = doc.splitTextToSize(order.customer.address, 80);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(COLOR.muted);
    doc.text(addressLines, MARGIN_L, leftY);
    leftY += addressLines.length * 4.6;

    // ------------------------------------------------------------------
    // ITEMS TABLE
    // ------------------------------------------------------------------

    const tableStart = Math.max(leftY, rightY) + 8;
    const IMAGE_COL_W = 16;

    autoTable(doc, {
      startY: tableStart,
      margin: { left: MARGIN_L, right: PAGE_W - MARGIN_R },
      head: [["", "Sticker", "Details", "Qty", "Unit Price", "Amount"]],
      body: order.items.map((item) => [
        "",
        item.productName,
        [item.size, item.shape, item.finish].filter(Boolean).join(" • "),
        item.quantity.toString(),
        rupees(item.lineTotal / item.quantity),
        rupees(item.lineTotal),
      ]),
      theme: "striped",
      styles: { fontSize: 9, cellPadding: 4, minCellHeight: 16, lineColor: COLOR.border, lineWidth: 0.2 },
      headStyles: { fillColor: COLOR.honeyDark, textColor: COLOR.white, fontStyle: "bold", fontSize: 9 },
      alternateRowStyles: { fillColor: COLOR.white },
      bodyStyles: { fillColor: COLOR.cream, textColor: COLOR.ink },
      columnStyles: {
        0: { cellWidth: IMAGE_COL_W },
        1: { cellWidth: 46, fontStyle: "bold" },
        2: { cellWidth: 44, textColor: COLOR.muted, fontSize: 8 },
        3: { cellWidth: 14, halign: "center" },
        4: { cellWidth: 24, halign: "right", textColor: COLOR.muted },
        5: { cellWidth: 26, halign: "right", fontStyle: "bold" },
      },
      didDrawCell: (data) => {
        if (data.section !== "body" || data.column.index !== 0) return;

        const { x, y, width, height } = data.cell;
        const cx = x + width / 2;
        const cy = y + height / 2;

        const image = itemImages[data.row.index];
        if (image) {
          const box = Math.min(width, height) - 3;
          const fit = fitContain(image.width, image.height, box, box);
          doc.setFillColor(COLOR.white);
          doc.roundedRect(cx - box / 2 - 0.5, cy - box / 2 - 0.5, box + 1, box + 1, 1.5, 1.5, "F");
          doc.addImage(image.dataUrl, "PNG", cx - fit.w / 2, cy - fit.h / 2, fit.w, fit.h);
        } else {
          drawHexPlaceholder(doc, cx, cy, Math.min(width, height) / 2 - 1.5);
        }
      },
      // A longer order can spill onto a second page - keep that page on
      // brand (cream background + accent bar) instead of plain white,
      // and label it so it doesn't look like a stray, header-less sheet.
      didDrawPage: (data) => {
        if (data.pageNumber === 1) return;
        fillPageBackground(doc);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(COLOR.muted);
        doc.text(`Stick Hive — Invoice ${invoiceNumber} (continued)`, MARGIN_L, 14);
      },
    });

    let finalY = ((doc as AutoTableJsPDF).lastAutoTable?.finalY ?? tableStart + 20) + 12;

    if (finalY > BOTTOM_SAFE_Y) {
      doc.addPage();
      fillPageBackground(doc);
      finalY = 24;
    }

    // ------------------------------------------------------------------
    // TOTALS
    // ------------------------------------------------------------------

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(COLOR.muted);
    doc.text("Subtotal", 140, finalY, { align: "right" });
    doc.setTextColor(COLOR.ink);
    doc.text(rupees(order.subtotal), MARGIN_R, finalY, { align: "right" });

    finalY += 7;
    doc.setTextColor(COLOR.muted);
    doc.text("Shipping", 140, finalY, { align: "right" });
    doc.setTextColor(COLOR.ink);
    doc.text(order.shipping === 0 ? "FREE" : rupees(order.shipping), MARGIN_R, finalY, { align: "right" });

    finalY += 6;
    doc.setDrawColor(COLOR.border);
    doc.setLineWidth(0.4);
    doc.line(120, finalY, MARGIN_R, finalY);

    finalY += 9;
    doc.setFillColor(COLOR.hiveYellow);
    doc.roundedRect(118, finalY - 6.5, MARGIN_R - 118, 11, 2.5, 2.5, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(COLOR.ink);
    doc.text("TOTAL", 122, finalY + 1);
    doc.text(rupees(order.total), MARGIN_R - 3, finalY + 1, { align: "right" });

    // ------------------------------------------------------------------
    // QR  +  FOOTER
    // ------------------------------------------------------------------

    const qrY = finalY - 28;

    if (trackingQr) {
      doc.setFillColor(COLOR.white);
      doc.roundedRect(MARGIN_L - 1.5, qrY - 1.5, 27, 27, 2, 2, "F");
      doc.addImage(trackingQr, "PNG", MARGIN_L, qrY, 24, 24);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(COLOR.muted);
      doc.text("Scan to track your order", MARGIN_L, qrY + 29);
    }

    const footerY = Math.min(276, Math.max(finalY + 20, 268));
    doc.setDrawColor(COLOR.border);
    doc.setLineWidth(0.3);
    doc.line(MARGIN_L, footerY - 8, MARGIN_R, footerY - 8);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(COLOR.ink);
    doc.text(tracked("Thank you for joining the hive"), MARGIN_L, footerY);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(COLOR.muted);
    doc.text("Keep creating. Keep sticking.", MARGIN_L, footerY + 5.5);
    doc.text(`Questions about this order? ${SUPPORT_EMAIL}`, MARGIN_R, footerY + 5.5, { align: "right" });

    doc.save(`Stick-Hive-Invoice-${order.orderId}.pdf`);
  } catch (error) {
    console.error("Invoice generation failed:", error);
    throw error;
  }
}
