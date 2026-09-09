import { Resend } from "resend";

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
