import Link from "next/link";
import { ArrowLeft, Mail, MessageCircle, PackageCheck } from "lucide-react";

export default function HelpPage() {
  return (
    <main className="min-h-screen bg-cream px-5 pb-24 pt-28 md:px-8 md:pt-32">
      <div className="mx-auto max-w-4xl">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-black/60 hover:text-black">
          <ArrowLeft size={16} /> Back to Stick Hive
        </Link>
        <div className="mt-10 max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-black/40">Customer support</p>
          <h1 className="mt-2 text-5xl font-extrabold tracking-tight">How can we help?</h1>
          <p className="mt-4 text-lg leading-8 text-black/55">Questions about orders, payments, custom stickers, or delivery? Reach out and we&apos;ll help.</p>
        </div>
        <section className="mt-10 grid gap-5 md:grid-cols-3">
          <div className="rounded-[2rem] bg-white p-7 shadow-xl"><MessageCircle className="mb-5" /><h2 className="text-xl font-extrabold">Orders</h2><p className="mt-2 text-sm leading-6 text-black/55">Check payment status, order progress, and delivery details from My Orders.</p></div>
          <div className="rounded-[2rem] bg-white p-7 shadow-xl"><PackageCheck className="mb-5" /><h2 className="text-xl font-extrabold">Payments</h2><p className="mt-2 text-sm leading-6 text-black/55">For UPI payments, your order uses a unique reference so we can confirm the transaction.</p></div>
          <div className="rounded-[2rem] bg-white p-7 shadow-xl"><Mail className="mb-5" /><h2 className="text-xl font-extrabold">Support</h2><p className="mt-2 text-sm leading-6 text-black/55">Email us at <a className="font-bold underline" href="mailto:support@stickhive.app">support@stickhive.app</a>.</p></div>
        </section>
        <section className="mt-6 rounded-[2rem] bg-black p-7 text-white md:p-9">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/45">Need order-specific help?</p>
          <p className="mt-3 text-2xl font-extrabold">Include your order ID in your message.</p>
          <p className="mt-2 max-w-2xl leading-7 text-white/60">That helps us find your payment, custom artwork, invoice, and delivery record quickly.</p>
        </section>
      </div>
    </main>
  );
}
