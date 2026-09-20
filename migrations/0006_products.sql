-- Migration number: 0006 	 2026-09-21T00:00:00.000Z
--
-- Real sticker product data, sourced from scripts/sticker-intake.mjs's
-- CSV output (stickers.csv) via scripts/seed-products.mjs. Additive only -
-- the live shop still reads src/lib/product-data.ts's static PRODUCTS
-- array; nothing wires this table into the site yet. This is deliberately
-- a minimal schema mirroring the CSV plus image URLs, not a copy of
-- product-data.ts's Product type - fields that are purely mock-catalog
-- UI embellishments (rating, reviews, salesCount, labels, sizes,
-- isPremium, collection, color) have no real data from intake and aren't
-- included; add them later if/when the shop actually reads from D1.
--
-- slug is the primary key (not a separate id column) - it's the seed
-- script's upsert key ("idempotent upsert by slug"), and it's already
-- the same shape product-data.ts uses for Product.id.
--
-- category is a plain TEXT column with no CHECK/FK tying it to
-- product-data.ts's Category union - the seed script writes the CSV's
-- raw folder-derived string as-is (e.g. "Bollywood", "Meme stickers").
-- Reconciling that union with these values is a separate, not-yet-
-- approved decision; this table doesn't need it resolved to exist.
--
-- tags is JSON TEXT (array, always read/written whole), matching the
-- orders.customer/shipping_details convention rather than a join table.
--
-- needs_review is INTEGER 0/1 - SQLite has no boolean type; the CSV's
-- "true"/"false" strings are converted by the seed script.
--
-- image_url/thumbnail_url start NULL for every row, active or draft.
-- They're only ever set later by the (not-yet-run) R2 upload script, and
-- only for status='active' rows - draft rows stay imageless in the real
-- bucket until a human activates them. Excluded from the seed script's
-- upsert UPDATE SET for the same reason created_at is excluded: re-
-- seeding from the CSV must never wipe out a URL set by a later step.
CREATE TABLE products (
  slug TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  suggested_category TEXT,
  tags TEXT NOT NULL DEFAULT '[]',
  description TEXT NOT NULL,
  price REAL NOT NULL,
  needs_review INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active')),
  content_hash TEXT NOT NULL UNIQUE,
  source_path TEXT NOT NULL,
  image_url TEXT,
  thumbnail_url TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_category ON products(category);
