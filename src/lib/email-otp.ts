import { Resend } from "resend";

// ============================================================================
// EMAIL OTP
// ============================================================================
// In-memory store for OTP codes. This resets whenever the dev server
// restarts — fine for now, but should move to a real database (Redis,
// or a Supabase table) before going to production, since serverless
// functions don't share memory across invocations reliably.

type OtpEntry = {
  code: string;
  expiresAt: number;
  attempts: number;
};

const otpStore = new Map<string, OtpEntry>();

const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const MAX_ATTEMPTS = 5;

const resend = new Resend(process.env.RESEND_API_KEY);

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// --------------------------------------------------------------------------
// SEND
// --------------------------------------------------------------------------

export async function sendEmailOtp(
  email: string,
): Promise<{ success: boolean; error?: string }> {
  const code = generateOtp();

  otpStore.set(email.toLowerCase(), {
    code,
    expiresAt: Date.now() + OTP_EXPIRY_MS,
    attempts: 0,
  });

  try {
    await resend.emails.send({
      from: "StickHive <onboarding@resend.dev>",
      to: email,
      subject: "Your StickHive verification code",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #111;">Verify your email 🐝</h2>
          <p style="color: #555; font-size: 15px;">
            Use the code below to verify your email address for your StickHive order.
          </p>
          <div style="background: #fff8ed; border-radius: 16px; padding: 24px; text-align: center; margin: 24px 0;">
            <span style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #111;">
              ${code}
            </span>
          </div>
          <p style="color: #999; font-size: 13px;">
            This code expires in 5 minutes. If you didn't request this, you can ignore this email.
          </p>
        </div>
      `,
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to send email OTP:", error);
    return { success: false, error: "Unable to send verification email." };
  }
}

// --------------------------------------------------------------------------
// VERIFY
// --------------------------------------------------------------------------

export function verifyEmailOtp(
  email: string,
  code: string,
): { success: boolean; error?: string } {
  const key = email.toLowerCase();
  const entry = otpStore.get(key);

  if (!entry) {
    return { success: false, error: "No verification code found. Please request a new one." };
  }

  if (Date.now() > entry.expiresAt) {
    otpStore.delete(key);
    return { success: false, error: "This code has expired. Please request a new one." };
  }

  if (entry.attempts >= MAX_ATTEMPTS) {
    otpStore.delete(key);
    return { success: false, error: "Too many attempts. Please request a new code." };
  }

  entry.attempts += 1;

  if (entry.code !== code) {
    return { success: false, error: "Incorrect code. Please try again." };
  }

  otpStore.delete(key);
  return { success: true };
}