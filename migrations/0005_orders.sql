-- Migration number: 0005 	 2026-09-16T08:00:00.000Z
--
-- Task 4: orders + order_items, replacing the Mongo `orders` collection.
--
-- Flattened top-level columns for anything queried/filtered on directly
-- (status, payment_status, payment_method, the stripe/razorpay id lookups,
-- the optimistic-concurrency guards). JSON columns for sub-objects that are
-- always read/written as a whole and never queried by subfield: customer,
-- payment_verification, payment_auto_verification, payment_proof,
-- shipping_details (including its nested delhivery object). Note:
-- upiPayment is NOT a column - it's computed at read time from
-- order_id/total/payment_attempt (see getUpiPaymentDetails), never stored,
-- matching the original Mongo document exactly.
--
-- items[] becomes its own table (order_items) rather than a JSON column,
-- since Task 6's analytics rewrite needs to GROUP BY product/quantity
-- across items - a JSON array column can't be aggregated with plain SQL.

CREATE TABLE orders (
  order_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL,
  updated_at TEXT,
  status TEXT NOT NULL,
  payment_method TEXT NOT NULL,
  payment_status TEXT NOT NULL,
  stripe_session_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT,
  razorpay_order_id TEXT UNIQUE,
  razorpay_payment_id TEXT,
  platform_fee REAL,
  payment_claimed_at TEXT,
  payment_attempt INTEGER,
  payment_expires_at TEXT,
  customer TEXT NOT NULL,
  subtotal REAL NOT NULL,
  shipping REAL NOT NULL,
  total REAL NOT NULL,
  payment_verification TEXT,
  payment_auto_verification TEXT,
  payment_proof TEXT,
  shipping_details TEXT
);

CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_created_at ON orders(created_at);

CREATE TABLE order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id TEXT NOT NULL REFERENCES orders(order_id),
  position INTEGER NOT NULL,
  type TEXT NOT NULL,
  product_id TEXT,
  product_name TEXT NOT NULL,
  image_url TEXT,
  artwork_object_key TEXT,
  artwork_content_type TEXT,
  size TEXT NOT NULL,
  shape TEXT,
  finish TEXT,
  quantity INTEGER NOT NULL,
  unit_price REAL NOT NULL,
  line_total REAL NOT NULL
);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);
