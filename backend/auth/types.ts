import type { ObjectId } from "mongodb";

export type UserDocument = {
  _id?: ObjectId;
  email: string;
  emailVerifiedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
};

export type OtpChallengeDocument = {
  _id?: ObjectId;
  email: string;
  codeHash: string;
  attempts: number;
  maxAttempts: number;
  expiresAt: Date;
  lastSentAt: Date;
  createdAt: Date;
};

export type SessionDocument = {
  _id?: ObjectId;
  userId: ObjectId;
  tokenHash: string;
  createdAt: Date;
  expiresAt: Date;
};
