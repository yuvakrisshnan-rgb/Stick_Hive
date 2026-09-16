-- Migration number: 0003 	 2026-09-16T06:13:02.954Z
--
-- Task 2: auth & session tables, replacing the users/otp_challenges/
-- sessions Mongo collections. All timestamps are ISO 8601 TEXT (sortable
-- and human-readable when inspecting the DB directly) rather than an
-- epoch integer.
--
-- No TTL/auto-expiry exists in SQLite/D1 the way Mongo's expireAfterSeconds
-- indexes worked - per Task 2's instructions, no cron cleanup job is built
-- yet. Every read path in the rewritten auth service explicitly filters
-- expires_at > current timestamp instead, so expired rows are simply
-- ignored rather than relied on to be deleted. Expired rows accumulate
-- until a cleanup job exists - not a correctness problem, just a future
-- housekeeping task.

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  email_verified_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  last_login_at TEXT
);

CREATE TABLE otp_challenges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  code_hash TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL,
  expires_at TEXT NOT NULL,
  last_sent_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL REFERENCES users(id),
  token_hash TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
