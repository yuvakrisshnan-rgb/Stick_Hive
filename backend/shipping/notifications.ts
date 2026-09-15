import { Resend } from "resend";

export async function sendOrderConfirmationEmail(params: {
  to: string;
  customerName: string;
  orderId: string;
  items: Array<{ name: string; quantity: number; lineTotal: number }>;
  subtotal: number;
  shipping: number;
  platformFee?: number;
  total: number;
}) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    console.warn("RESEND_API_KEY is not configured; skipping order confirmation email.");
    return false;
  }
  const resend = new Resend(apiKey);
  const from = process.env.RESEND_FROM_EMAIL?.trim() || "Stick Hive <noreply@stickhive.app>";
  const safe = (value: string) => value.replace(/[<&>\"]/g, (ch) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" }[ch] || ch));
  const money = (value: number) => `₹${value.toFixed(2)}`;
  const itemRows = params.items
    .map((item) => `<tr><td style="padding:6px 0">${safe(item.name)} × ${item.quantity}</td><td style="padding:6px 0;text-align:right">${money(item.lineTotal)}</td></tr>`)
    .join("");
  const feeRow = params.platformFee
    ? `<tr><td style="padding:6px 0;color:#555">Platform fee (2.36%)</td><td style="padding:6px 0;text-align:right;color:#555">${money(params.platformFee)}</td></tr>`
    : "";
  const result = await resend.emails.send({
    from,
    to: params.to,
    subject: `Your Stick Hive order ${params.orderId} is confirmed 🎉`,
    html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#111"><h2>Payment received - your order is confirmed! 🎉</h2><p>Hi ${safe(params.customerName)}, we've received your payment for order <strong>${safe(params.orderId)}</strong>.</p><table style="width:100%;border-collapse:collapse;margin:20px 0;background:#fff8ed;border-radius:16px;padding:18px" cellpadding="10">${itemRows}<tr><td style="padding-top:10px;border-top:1px solid #eee;color:#555">Subtotal</td><td style="padding-top:10px;border-top:1px solid #eee;text-align:right;color:#555">${money(params.subtotal)}</td></tr><tr><td style="color:#555">Shipping</td><td style="text-align:right;color:#555">${params.shipping === 0 ? "FREE" : money(params.shipping)}</td></tr>${feeRow}<tr><td style="padding-top:6px;font-weight:700">Total</td><td style="padding-top:6px;text-align:right;font-weight:700">${money(params.total)}</td></tr></table><p style="margin-top:24px;color:#777;font-size:13px">— Stick Hive 🐝</p></div>`,
  });
  if (result.error) throw new Error("Unable to send the order confirmation email.");
  return true;
}

export async function sendOutForDeliveryEmail(params: { to: string; customerName: string; orderId: string; courier: string; awb: string; trackingUrl: string }) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    console.warn("RESEND_API_KEY is not configured; skipping out-for-delivery email.");
    return false;
  }
  const resend = new Resend(apiKey);
  const from = process.env.RESEND_FROM_EMAIL?.trim() || "Stick Hive <noreply@stickhive.app>";
  const safe = (value: string) => value.replace(/[<&>\"]/g, (ch) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" }[ch] || ch));
  const result = await resend.emails.send({
    from,
    to: params.to,
    subject: `Your Stick Hive order ${params.orderId} is out for delivery 📦`,
    html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#111"><h2>Your Stick Hive order is out for delivery! 📦</h2><p>Hi ${safe(params.customerName)}, your order <strong>${safe(params.orderId)}</strong> is on its way and should reach you soon.</p><div style="background:#fff8ed;border-radius:16px;padding:18px;margin:20px 0"><p style="margin:0 0 6px"><strong>${safe(params.courier)}</strong></p><p style="margin:0;color:#555">Tracking / AWB: ${safe(params.awb)}</p></div><a href="${params.trackingUrl}" style="display:inline-block;background:#111;color:#fff;padding:13px 20px;border-radius:999px;text-decoration:none;font-weight:700">Track Package</a><p style="margin-top:24px;color:#777;font-size:13px">— Stick Hive 🐝</p></div>`,
  });
  if (result.error) throw new Error("Unable to send the out-for-delivery email.");
  return true;
}
