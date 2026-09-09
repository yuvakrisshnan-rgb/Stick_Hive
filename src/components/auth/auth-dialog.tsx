"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, Loader2, Mail, X } from "lucide-react";
import { useAuth } from "./auth-provider";

type AuthDialogProps = {
  open: boolean;
  onClose: () => void;
};

export default function AuthDialog({ open, onClose }: AuthDialogProps) {
  const { sendOtp, verifyOtp } = useAuth();

  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) {
      setStep("email");
      setEmail("");
      setCode("");
      setMessage("");
      setBusy(false);
    }
  }, [open]);

  const handleSendOtp = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage("");

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setMessage("Enter your email address.");
      return;
    }

    setBusy(true);
    const result = await sendOtp(normalizedEmail);
    setBusy(false);

    if (!result.success) {
      setMessage(result.error || "We couldn't send your code.");
      return;
    }

    setEmail(normalizedEmail);
    setCode("");
    setStep("otp");
  };

  const handleVerifyOtp = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage("");

    if (!/^\d{6}$/.test(code.trim())) {
      setMessage("Enter the 6-digit code from your email.");
      return;
    }

    setBusy(true);
    const result = await verifyOtp(email, code.trim());
    setBusy(false);

    if (!result.success) {
      setMessage(result.error || "That code couldn't be verified.");
      return;
    }

    onClose();
  };

  const handleResend = async () => {
    setMessage("");
    setBusy(true);
    const result = await sendOtp(email);
    setBusy(false);

    if (!result.success) {
      setMessage(result.error || "We couldn't resend your code.");
      return;
    }

    setMessage("A fresh verification code is on its way.");
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4 py-6 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(event) => {
            if (event.currentTarget === event.target && !busy) {
              onClose();
            }
          }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-dialog-title"
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            className="relative w-full max-w-md overflow-hidden rounded-[2rem] bg-white p-7 shadow-2xl md:p-9"
          >
            <button
              type="button"
              aria-label="Close sign in"
              onClick={onClose}
              disabled={busy}
              className="absolute right-5 top-5 flex size-9 items-center justify-center rounded-full transition hover:bg-black/5 disabled:opacity-50"
            >
              <X size={18} />
            </button>

            {step === "otp" ? (
              <button
                type="button"
                onClick={() => {
                  setStep("email");
                  setMessage("");
                  setCode("");
                }}
                disabled={busy}
                className="mb-7 inline-flex items-center gap-2 text-sm font-semibold text-black/50 transition hover:text-black disabled:opacity-50"
              >
                <ArrowLeft size={15} />
                Change email
              </button>
            ) : (
              <div className="mb-7 size-12 rounded-2xl bg-hive-yellow/80" />
            )}

            <p className="text-xs font-bold uppercase tracking-[0.18em] text-black/40">
              Stick Hive account
            </p>

            <h2
              id="auth-dialog-title"
              className="mt-2 text-3xl font-extrabold tracking-tight"
            >
              {step === "email" ? "Sign in with email" : "Check your inbox"}
            </h2>

            <p className="mt-3 text-sm leading-6 text-black/50">
              {step === "email"
                ? "We'll send you a one-time code. No password to remember."
                : `We sent a 6-digit code to ${email}.`}
            </p>

            {step === "email" ? (
              <form onSubmit={handleSendOtp} className="mt-7 space-y-4">
                <label className="block">
                  <span className="mb-2 block text-sm font-bold">
                    Email address
                  </span>
                  <div className="flex items-center gap-3 rounded-2xl border border-black/10 bg-cream px-4 py-3 focus-within:border-black">
                    <Mail size={18} className="text-black/40" />
                    <input
                      type="email"
                      autoComplete="email"
                      inputMode="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="you@example.com"
                      className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-black/30"
                      disabled={busy}
                      required
                    />
                  </div>
                </label>

                {message ? (
                  <p className="text-sm font-semibold text-red-600">{message}</p>
                ) : null}

                <button
                  type="submit"
                  disabled={busy}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-black px-5 py-4 text-sm font-bold text-white transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {busy ? <Loader2 size={17} className="animate-spin" /> : null}
                  {busy ? "Sending code..." : "Send verification code"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="mt-7 space-y-4">
                <label className="block">
                  <span className="mb-2 block text-sm font-bold">
                    Verification code
                  </span>
                  <input
                    autoFocus
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    pattern="\d{6}"
                    value={code}
                    onChange={(event) =>
                      setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    placeholder="000000"
                    className="w-full rounded-2xl border border-black/10 bg-cream px-4 py-4 text-center font-mono text-2xl font-bold tracking-[0.45em] outline-none focus:border-black"
                    disabled={busy}
                    required
                  />
                </label>

                {message ? (
                  <p className="text-sm font-semibold text-black/60">{message}</p>
                ) : null}

                <button
                  type="submit"
                  disabled={busy}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-black px-5 py-4 text-sm font-bold text-white transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {busy ? <Loader2 size={17} className="animate-spin" /> : null}
                  {busy ? "Verifying..." : "Verify and continue"}
                </button>

                <button
                  type="button"
                  onClick={handleResend}
                  disabled={busy}
                  className="w-full rounded-2xl px-4 py-3 text-sm font-bold text-black/60 transition hover:bg-black/5 hover:text-black disabled:opacity-50"
                >
                  Resend code
                </button>
              </form>
            )}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
