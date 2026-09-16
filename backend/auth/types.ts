export type UserRow = {
  id: string;
  email: string;
  email_verified_at: string;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
};

export type OtpChallengeRow = {
  id: number;
  email: string;
  code_hash: string;
  attempts: number;
  max_attempts: number;
  expires_at: string;
  last_sent_at: string;
  created_at: string;
};

export type SessionRow = {
  id: number;
  user_id: string;
  token_hash: string;
  created_at: string;
  expires_at: string;
};
