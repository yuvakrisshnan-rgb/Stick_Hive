-- Migration number: 0004 	 2026-09-16T07:35:00.000Z
--
-- Task 3: wishlist table, replacing the Mongo `wishlists` collection.
--
-- Schema decision: a JSON array column (product_ids), not a join/junction
-- table. The only two operations this app performs are "read the whole
-- list for a user" and "replace the whole list for a user" (see
-- src/app/api/wishlist/route.ts - GET and PUT, no per-item add/remove
-- endpoint, no query that joins wishlists to products or filters by a
-- single product id). A junction table would need a transactional
-- DELETE-all + INSERT-all on every replace with no query-pattern benefit
-- over a single JSON column, so the simpler shape matches actual usage.

CREATE TABLE wishlists (
  user_id TEXT PRIMARY KEY REFERENCES users(id),
  product_ids TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
