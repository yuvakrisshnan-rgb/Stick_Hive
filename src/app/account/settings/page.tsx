"use client";

import { ArrowLeft, LogOut, Mail, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";

export default function AccountSettingsPage() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  if (loading) {
    return (
      <main className="min-h-screen bg-cream px-6 pb-20 pt-32">
        <div className="mx-auto max-w-2xl">
          <div className="h-8 w-48 animate-pulse rounded-full bg-black/5" />
          <div className="mt-8 h-48 animate-pulse rounded-[2rem] bg-white shadow-xl" />
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-cream px-6 pb-20 pt-32">
        <div className="mx-auto max-w-2xl">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-black/60 transition hover:text-black"
          >
            <ArrowLeft size={16} />
            Back to Home
          </Link>

          <section className="mt-10 rounded-[2rem] bg-white p-8 text-center shadow-xl md:p-12">
            <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-hive-yellow">
              <ShieldCheck size={28} />
            </div>
            <h1 className="mt-6 text-3xl font-extrabold tracking-tight">
              Sign in to your account
            </h1>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-black/50">
              Use the account button in the navigation to continue with email OTP.
            </p>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-cream px-6 pb-20 pt-32">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-black/60 transition hover:text-black"
        >
          <ArrowLeft size={16} />
          Back to Home
        </Link>

        <div className="mt-8">
          <p className="text-sm font-bold uppercase tracking-widest text-black/40">
            Stick Hive
          </p>
          <h1 className="mt-2 text-4xl font-extrabold tracking-tight md:text-5xl">
            Account
          </h1>
          <p className="mt-3 text-black/50">
            Your email is verified and your Stick Hive session is active.
          </p>
        </div>

        <section className="mt-8 rounded-[2rem] bg-white p-7 shadow-xl md:p-8">
          <div className="flex items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-hive-yellow">
              <Mail size={21} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-widest text-black/40">
                Email
              </p>
              <p className="mt-1 break-all text-lg font-extrabold">{user.email}</p>
              <p className="mt-1 text-sm text-black/40">
                Authenticated with email OTP.
              </p>
            </div>
          </div>

          <div className="mt-7 h-px bg-black/5" />

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/orders"
              className="inline-flex items-center justify-center rounded-2xl bg-black px-5 py-3 text-sm font-bold text-white transition hover:-translate-y-px"
            >
              View My Orders
            </Link>

            <button
              type="button"
              onClick={async () => {
                await logout();
                router.push("/");
              }}
              className="inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold text-black/60 transition hover:bg-black/5 hover:text-black"
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
