-- Migration number: 0001 	 2026-09-16T05:56:08.261Z
--
-- Throwaway table used only to prove the vinext + D1 connection works
-- end-to-end (Task 1). Dropped in a later migration once the real schema
-- migrations (auth/wishlist/orders) are in place.

CREATE TABLE d1_connection_check (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  message TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
