"use client";

// ============================================================================
// QR RENDER CHECK (dev-only — see src/app/dev/layout.tsx for the
// production-404 gate)
// ============================================================================
//
// Regression fixture for the bug where order-success/page.tsx's UPI QR
// <Image> silently rendered as a broken image on every buyer, every
// device: passing a client-generated data:image/png;base64,... src into
// next/image's <Image> without `unoptimized` routes it through
// /_next/image?url=data:..., which 400s ("Invalid image optimization
// parameters") since the optimizer doesn't handle inline data URIs.
//
// Every prior verification pass in this effort checked that checkout/order
// creation succeeded - never whether the QR actually rendered - which is
// exactly how this shipped unnoticed. This fixture mirrors the real
// order-success usage precisely (same qrcode package call, same <Image>
// props) so tests/e2e/qr-render-check.spec.ts can assert the rendered
// <img> actually loaded (non-zero natural dimensions, no broken-image
// state) and that /_next/image was never hit for it - catching this class
// of bug directly, without needing an authenticated checkout flow (this
// repo's e2e harness doesn't fabricate sessions - see cart-checkout.spec.ts).

import { useEffect, useState } from "react";
import Image from "next/image";
import QRCode from "qrcode";

const SAMPLE_UPI_URI =
  "upi://pay?pa=stickhive%40example&pn=Stick+Hive&am=60.00&cu=INR&tr=SH-QR-CHECK&tn=Stick+Hive+QR+render+check";

export default function QrRenderCheckPage() {
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(SAMPLE_UPI_URI, { width: 360, margin: 2, errorCorrectionLevel: "M" })
      .then((dataUrl) => {
        if (active) setQrDataUrl(dataUrl);
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : "Unable to generate QR.");
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <main style={{ padding: 32 }}>
      <h1>QR render check</h1>
      <p>Source URI: {SAMPLE_UPI_URI}</p>
      {error && <p data-testid="qr-render-check-error">{error}</p>}
      {qrDataUrl && (
        <Image
          src={qrDataUrl}
          alt="QR render check"
          width={288}
          height={288}
          unoptimized
          data-testid="qr-render-check-image"
        />
      )}
    </main>
  );
}
