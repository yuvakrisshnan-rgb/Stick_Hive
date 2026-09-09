import { Resend } from "resend";
import { ObjectId } from "mongodb";
import { cookies } from "next/headers";
import { getCollection } from "../db/mongodb";
import {
  AUTH_COOKIE_NAME,
  OTP_EXPIRY_MS,
  OTP_MAX_ATTEMPTS,
  OTP_RESEND_COOLDOWN_MS,
  SESSION_MAX_AGE_SECONDS,
  authFromEmail,
  requireResendApiKey,
} from "./config";
import { createSessionToken, generateOtp, hashValue, normalizeEmail } from "./crypto";
import type { OtpChallengeDocument, SessionDocument, UserDocument } from "./types";

function now(): Date {
  return new Date();
}

function assertValidEmail(email: string): string {
  const normalized = normalizeEmail(email);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) || normalized.length > 254) {
    throw new Error("Please enter a valid email address.");
  }
  return normalized;
}

async function sendOtpEmail(email: string, code: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    if (process.env.AUTH_DEBUG_OTP === "true" && process.env.NODE_ENV !== "production") {
      console.info(`[Stick Hive auth] OTP for ${email}: ${code}`);
      return;
    }
    requireResendApiKey();
  }

  const resend = new Resend(apiKey!);
  const result = await resend.emails.send({
    from: authFromEmail(),
    to: email,
    subject: "Your Stick Hive verification code",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;color:#111">
        <h2>Verify your email 🐝</h2>
        <p style="color:#555">Use the code below to verify your email address for Stick Hive.</p>
        <div style="background:#fff8ed;border-radius:16px;padding:24px;text-align:center;margin:24px 0">
          <span style="font-size:32px;font-weight:800;letter-spacing:8px">${code}</span>
        </div>
        <p style="color:#999;font-size:13px">This code expires in 5 minutes. If you didn't request it, you can ignore this email.</p>
      </div>
    `,
  });

  if (result.error) {
    throw new Error("Unable to send verification email.");
  }
}

export async function requestEmailOtp(emailInput: string): Promise<{ success: true; debugCode?: string }> {
  const email = assertValidEmail(emailInput);
  const otpCollection = await getCollection<OtpChallengeDocument>("otp_challenges");
  const existing = await otpCollection.findOne({ email });
  const current = Date.now();

  if (existing && current - existing.lastSentAt.getTime() < OTP_RESEND_COOLDOWN_MS) {
    throw new Error("Please wait a moment before requesting another code.");
  }

  const code = generateOtp();
  const createdAt = now();

  await otpCollection.updateOne(
    { email },
    {
      $set: {
        codeHash: hashValue(code),
        attempts: 0,
        maxAttempts: OTP_MAX_ATTEMPTS,
        expiresAt: new Date(current + OTP_EXPIRY_MS),
        lastSentAt: createdAt,
        createdAt,
      },
      $setOnInsert: { email },
    },
    { upsert: true },
  );

  try {
    await sendOtpEmail(email, code);
  } catch (error) {
    await otpCollection.deleteOne({ email });
    throw error;
  }

  return process.env.AUTH_DEBUG_OTP === "true" && process.env.NODE_ENV !== "production"
    ? { success: true, debugCode: code }
    : { success: true };
}

export async function verifyEmailOtp(emailInput: string, codeInput: string): Promise<{
  success: true;
  user: { id: string; email: string };
}> {
  const email = assertValidEmail(emailInput);
  const code = codeInput.trim();
  if (!/^\d{6}$/.test(code)) {
    throw new Error("Enter the 6-digit verification code.");
  }

  const otpCollection = await getCollection<OtpChallengeDocument>("otp_challenges");
  const challenge = await otpCollection.findOne({ email });

  if (!challenge) {
    throw new Error("No verification code found. Please request a new one.");
  }
  if (challenge.expiresAt.getTime() <= Date.now()) {
    await otpCollection.deleteOne({ _id: challenge._id });
    throw new Error("This code has expired. Please request a new one.");
  }
  if (challenge.attempts >= challenge.maxAttempts) {
    await otpCollection.deleteOne({ _id: challenge._id });
    throw new Error("Too many attempts. Please request a new code.");
  }

  const expectedHash = challenge.codeHash;
  const providedHash = hashValue(code);

  if (providedHash !== expectedHash) {
    await otpCollection.updateOne({ _id: challenge._id }, { $inc: { attempts: 1 } });
    throw new Error("Incorrect code. Please try again.");
  }

  await otpCollection.deleteOne({ _id: challenge._id });

  const users = await getCollection<UserDocument>("users");
  const verifiedAt = now();
  const userId = new ObjectId();

  await users.updateOne(
    { email },
    {
      $set: { emailVerifiedAt: verifiedAt, updatedAt: verifiedAt, lastLoginAt: verifiedAt },
      $setOnInsert: { _id: userId, email, createdAt: verifiedAt },
    },
    { upsert: true },
  );

  const user = await users.findOne({ email });
  if (!user?._id) {
    throw new Error("Unable to create your account session.");
  }

  const sessionToken = createSessionToken();
  const sessions = await getCollection<SessionDocument>("sessions");
  const sessionNow = now();
  await sessions.insertOne({
    userId: user._id,
    tokenHash: hashValue(sessionToken),
    createdAt: sessionNow,
    expiresAt: new Date(sessionNow.getTime() + SESSION_MAX_AGE_SECONDS * 1000),
  });

  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  return { success: true, user: { id: user._id.toHexString(), email: user.email } };
}

export type CurrentUser = { id: string; email: string };

export function isAdminUser(user: CurrentUser): boolean {
  return getAdminEmails().includes(user.email.toLowerCase());
}

function getAdminEmails(): string[] {
  return (process.env.STICKHIVE_ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;

  const sessions = await getCollection<SessionDocument>("sessions");
  const session = await sessions.findOne({
    tokenHash: hashValue(token),
    expiresAt: { $gt: new Date() },
  });

  if (!session?.userId) return null;

  const users = await getCollection<UserDocument>("users");
  const user = await users.findOne({ _id: session.userId });
  if (!user) return null;

  return { id: user._id!.toHexString(), email: user.email };
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (token) {
    const sessions = await getCollection<SessionDocument>("sessions");
    await sessions.deleteOne({ tokenHash: hashValue(token) });
  }

  cookieStore.delete(AUTH_COOKIE_NAME);
}

