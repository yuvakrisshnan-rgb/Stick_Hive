export const AUTH_COOKIE_NAME = "stickhive_session";
export const OTP_EXPIRY_MS = 5 * 60 * 1000;
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_RESEND_COOLDOWN_MS = 60 * 1000;
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export function requireResendApiKey(): string {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    throw new Error("RESEND_API_KEY is not configured.");
  }
  return key;
}

export function authFromEmail(): string {
  return process.env.RESEND_FROM_EMAIL || process.env.AUTH_FROM_EMAIL || "Stick Hive <onboarding@resend.dev>";
}
