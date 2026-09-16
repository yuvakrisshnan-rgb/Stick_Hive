import { CopyObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getD1, nowIso } from "../db/d1";
import { getCurrentUser, isAdminUser } from "../auth/service";
import { getS3BucketName, getS3Client } from "../storage/s3";
import {
  PRODUCTS,
  SIZE_PRICES,
  priceFor,
  type StickerSize,
} from "../../src/lib/product-data";
import { FREE_SHIPPING_THRESHOLD, SHIPPING_FEE, getRazorpayPlatformFee } from "../../src/lib/cart/calculations";

const UPI_PAYMENT_WINDOW_MINUTES = 20;

export type PaymentStatus =
  | "pending"
  | "pending_confirmation"
  | "paid"
  | "failed"
  | "cancelled"
  | "refunded";

export type CheckoutCustomer = {
  name: string;
  email: string;
  phone: string;
  address: {
    addressLine1: string;
    addressLine2?: string;
    landmark?: string;
    city: string;
    state: string;
    pincode: string;
  };
};

export type CheckoutItemInput =
  | {
      type: "product";
      productId: string;
      size: StickerSize;
      quantity: number;
    }
  | {
      type: "custom";
      cartLineId: string;
      size: StickerSize;
      shape: "Circle" | "Square" | "Rounded" | "Die-cut";
      finish: "Glossy" | "Matte" | "Holographic" | "Transparent";
      quantity: number;
      artworkObjectKey: string;
      artworkContentType: string;
    };

/**
 * The materialized, in-memory shape of an order - joined from the `orders`
 * + `order_items` D1 tables (see rowToOrder below) into the same shape the
 * Mongo document used to have, Date fields included. Every function past
 * the D1 read/write boundary (serializeOrder, expireUpiPaymentIfNeeded,
 * updateAdminOrder, etc.) operates on this shape unchanged, so only the
 * I/O boundary needed to change for this migration.
 */
export type OrderDocument = {
  userId: string;
  orderId: string;
  createdAt: Date;
  status: "awaiting_payment" | "placed" | "processing" | "packed" | "shipped" | "out_for_delivery" | "delivered" | "cancelled";
  paymentMethod: "upi" | "stripe" | "razorpay";
  paymentStatus: PaymentStatus;
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  /** Only set for paymentMethod "razorpay" — see getRazorpayPlatformFee. Included in `total`. */
  platformFee?: number;
  paymentClaimedAt?: Date;
  paymentAttempt?: number;
  paymentExpiresAt?: Date;
  paymentVerification?: {
    transactionId: string;
    utr?: string;
    payerUpiId?: string;
    payerName?: string;
    paidAmount: number;
    paidAt: Date;
    verifiedAt: Date;
    verifiedBy: string;
    note?: string;
  };
  // An automated check (e.g. the Google Pay transaction-status API) suggests
  // a payment looks complete, but this ONLY pre-fills the admin's manual
  // verification form and surfaces a "needs review" flag — it must never
  // set paymentStatus/status itself. Only submitPaymentVerification (an
  // explicit admin action) is allowed to mark an order "paid".
  paymentAutoVerification?: {
    transactionId: string;
    utr?: string;
    paidAmount: number;
    paidAt: Date;
    detectedAt: Date;
    source: string;
  };
  paymentProof?: {
    objectKey: string;
    contentType: string;
    fileName: string;
    uploadedAt: Date;
  };
  customer: CheckoutCustomer;
  items: Array<{
    type: "product" | "custom";
    productId?: string;
    productName: string;
    imageUrl?: string;
    artworkObjectKey?: string;
    artworkContentType?: string;
    size: string;
    shape?: string;
    finish?: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
  subtotal: number;
  shipping: number;
  total: number;
  shippingDetails?: {
    method: "courier" | "pickup" | "local_delivery";
    courier?: string;
    trackingNumber?: string;
    trackingUrl?: string;
    pickupLocation?: string;
    pickupInstructions?: string;
    shippedAt?: Date;
    deliveredAt?: Date;
    lastCarrierStatus?: string;
    lastCarrierLocation?: string;
    lastCarrierStatusAt?: Date;
    outForDeliveryEmailSentAt?: Date;
    delhivery?: {
      waybill: string;
      pickupLocation: string;
      createdAt: Date;
      environment: "staging" | "production";
      pickupId?: string;
    };
    updatedAt: Date;
  };
};

type OrderRow = {
  order_id: string;
  user_id: string;
  created_at: string;
  updated_at: string | null;
  status: OrderDocument["status"];
  payment_method: OrderDocument["paymentMethod"];
  payment_status: PaymentStatus;
  stripe_session_id: string | null;
  stripe_payment_intent_id: string | null;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  platform_fee: number | null;
  payment_claimed_at: string | null;
  payment_attempt: number | null;
  payment_expires_at: string | null;
  customer: string;
  subtotal: number;
  shipping: number;
  total: number;
  payment_verification: string | null;
  payment_auto_verification: string | null;
  payment_proof: string | null;
  shipping_details: string | null;
};

type OrderItemRow = {
  id: number;
  order_id: string;
  position: number;
  type: "product" | "custom";
  product_id: string | null;
  product_name: string;
  image_url: string | null;
  artwork_object_key: string | null;
  artwork_content_type: string | null;
  size: string;
  shape: string | null;
  finish: string | null;
  quantity: number;
  unit_price: number;
  line_total: number;
};

function itemRowToItem(row: OrderItemRow): OrderDocument["items"][number] {
  return {
    type: row.type,
    productId: row.product_id ?? undefined,
    productName: row.product_name,
    imageUrl: row.image_url ?? undefined,
    artworkObjectKey: row.artwork_object_key ?? undefined,
    artworkContentType: row.artwork_content_type ?? undefined,
    size: row.size,
    shape: row.shape ?? undefined,
    finish: row.finish ?? undefined,
    quantity: row.quantity,
    unitPrice: row.unit_price,
    lineTotal: row.line_total,
  };
}

function rowToOrder(row: OrderRow, itemRows: OrderItemRow[]): OrderDocument {
  const paymentVerification = row.payment_verification ? JSON.parse(row.payment_verification) : undefined;
  const paymentAutoVerification = row.payment_auto_verification ? JSON.parse(row.payment_auto_verification) : undefined;
  const paymentProof = row.payment_proof ? JSON.parse(row.payment_proof) : undefined;
  const shippingDetails = row.shipping_details ? JSON.parse(row.shipping_details) : undefined;

  return {
    userId: row.user_id,
    orderId: row.order_id,
    createdAt: new Date(row.created_at),
    status: row.status,
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status,
    stripeSessionId: row.stripe_session_id ?? undefined,
    stripePaymentIntentId: row.stripe_payment_intent_id ?? undefined,
    razorpayOrderId: row.razorpay_order_id ?? undefined,
    razorpayPaymentId: row.razorpay_payment_id ?? undefined,
    platformFee: row.platform_fee ?? undefined,
    paymentClaimedAt: row.payment_claimed_at ? new Date(row.payment_claimed_at) : undefined,
    paymentAttempt: row.payment_attempt ?? undefined,
    paymentExpiresAt: row.payment_expires_at ? new Date(row.payment_expires_at) : undefined,
    paymentVerification: paymentVerification
      ? { ...paymentVerification, paidAt: new Date(paymentVerification.paidAt), verifiedAt: new Date(paymentVerification.verifiedAt) }
      : undefined,
    paymentAutoVerification: paymentAutoVerification
      ? { ...paymentAutoVerification, paidAt: new Date(paymentAutoVerification.paidAt), detectedAt: new Date(paymentAutoVerification.detectedAt) }
      : undefined,
    paymentProof: paymentProof ? { ...paymentProof, uploadedAt: new Date(paymentProof.uploadedAt) } : undefined,
    customer: JSON.parse(row.customer),
    items: itemRows.map(itemRowToItem),
    subtotal: row.subtotal,
    shipping: row.shipping,
    total: row.total,
    shippingDetails: shippingDetails
      ? {
          ...shippingDetails,
          shippedAt: shippingDetails.shippedAt ? new Date(shippingDetails.shippedAt) : undefined,
          deliveredAt: shippingDetails.deliveredAt ? new Date(shippingDetails.deliveredAt) : undefined,
          lastCarrierStatusAt: shippingDetails.lastCarrierStatusAt ? new Date(shippingDetails.lastCarrierStatusAt) : undefined,
          outForDeliveryEmailSentAt: shippingDetails.outForDeliveryEmailSentAt ? new Date(shippingDetails.outForDeliveryEmailSentAt) : undefined,
          updatedAt: new Date(shippingDetails.updatedAt),
          delhivery: shippingDetails.delhivery
            ? { ...shippingDetails.delhivery, createdAt: new Date(shippingDetails.delhivery.createdAt) }
            : undefined,
        }
      : undefined,
  };
}

async function loadOrderItems(db: D1Database, orderId: string): Promise<OrderItemRow[]> {
  const { results } = await db
    .prepare("SELECT * FROM order_items WHERE order_id = ? ORDER BY position ASC")
    .bind(orderId)
    .all<OrderItemRow>();
  return results;
}

async function loadOrderByOrderId(db: D1Database, orderId: string): Promise<OrderDocument | null> {
  const row = await db.prepare("SELECT * FROM orders WHERE order_id = ?").bind(orderId).first<OrderRow>();
  if (!row) return null;
  return rowToOrder(row, await loadOrderItems(db, orderId));
}

async function loadOrderByRazorpayOrderId(db: D1Database, razorpayOrderId: string): Promise<OrderDocument | null> {
  const row = await db.prepare("SELECT * FROM orders WHERE razorpay_order_id = ?").bind(razorpayOrderId).first<OrderRow>();
  if (!row) return null;
  return rowToOrder(row, await loadOrderItems(db, row.order_id));
}

/**
 * The raw, unserialized OrderDocument (real Date objects) for an order,
 * with no admin/ownership check - used by route handlers that already did
 * their own authorization (e.g. via getAdminOrder) and need the Date-typed
 * shape to pass into functions like createDelhiveryShipment.
 */
export async function getOrderDocument(orderId: string): Promise<OrderDocument | null> {
  return loadOrderByOrderId(getD1(), orderId);
}

/** Used by backend/shipping/delhivery.ts to find the order a carrier webhook event belongs to. */
export async function loadOrderByTrackingNumber(trackingNumber: string): Promise<OrderDocument | null> {
  const db = getD1();
  const row = await db
    .prepare("SELECT * FROM orders WHERE json_extract(shipping_details, '$.trackingNumber') = ?")
    .bind(trackingNumber)
    .first<OrderRow>();
  if (!row) return null;
  return rowToOrder(row, await loadOrderItems(db, row.order_id));
}

/**
 * Persists a shipping_details update (and optionally a status transition)
 * for an order. `shippingDetails` only needs to be JSON-serializable - its
 * Date fields may be real Date objects or already-ISO strings, since both
 * JSON.stringify to the same TEXT value D1 stores and rowToOrder re-parses
 * identically either way. Used by backend/shipping/delhivery.ts and the
 * Delhivery create/pickup route handlers.
 */
export async function updateOrderShippingAndStatus(
  orderId: string,
  shippingDetails: Record<string, unknown>,
  status?: OrderDocument["status"],
): Promise<void> {
  const db = getD1();
  const setParts: string[] = ["shipping_details = ?", "updated_at = ?"];
  const binds: unknown[] = [JSON.stringify(shippingDetails), nowIso()];
  if (status) {
    setParts.push("status = ?");
    binds.push(status);
  }
  binds.push(orderId);
  await db.prepare(`UPDATE orders SET ${setParts.join(", ")} WHERE order_id = ?`).bind(...binds).run();
}

async function hydrateOrders(db: D1Database, orderRows: OrderRow[]): Promise<OrderDocument[]> {
  if (orderRows.length === 0) return [];
  const placeholders = orderRows.map(() => "?").join(",");
  const { results: itemRows } = await db
    .prepare(`SELECT * FROM order_items WHERE order_id IN (${placeholders}) ORDER BY order_id, position ASC`)
    .bind(...orderRows.map((r) => r.order_id))
    .all<OrderItemRow>();
  const itemsByOrder = new Map<string, OrderItemRow[]>();
  for (const item of itemRows) {
    const list = itemsByOrder.get(item.order_id) ?? [];
    list.push(item);
    itemsByOrder.set(item.order_id, list);
  }
  return orderRows.map((row) => rowToOrder(row, itemsByOrder.get(row.order_id) ?? []));
}

const PRODUCT_BY_ID = new Map(PRODUCTS.map((product) => [product.id, product]));
const MAX_QUANTITY = 10;

function generateOrderId(): string {
  return `SH-${crypto.randomUUID().split("-")[0].toUpperCase()}`;
}

function assertQuantity(value: number): number {
  if (!Number.isInteger(value) || value < 1 || value > MAX_QUANTITY) {
    throw new Error(`Quantity must be between 1 and ${MAX_QUANTITY}.`);
  }
  return value;
}

function normalizeCustomer(input: CheckoutCustomer): CheckoutCustomer {
  const email = input.email.trim().toLowerCase();
  const phone = input.phone.replace(/\D/g, "");
  const pincode = input.address.pincode.replace(/\D/g, "");

  if (!input.name.trim() || input.name.trim().length > 100) throw new Error("Please enter a valid name.");
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error("Please enter a valid email address.");
  if (!/^\d{10}$/.test(phone)) throw new Error("Please enter a valid 10-digit phone number.");
  if (!/^\d{6}$/.test(pincode)) throw new Error("Please enter a valid 6-digit PIN code.");
  if (!input.address.addressLine1.trim() || !input.address.city.trim() || !input.address.state.trim()) {
    throw new Error("Please complete your delivery address.");
  }

  return {
    name: input.name.trim(),
    email,
    phone,
    address: {
      addressLine1: input.address.addressLine1.trim(),
      addressLine2: input.address.addressLine2?.trim() || undefined,
      landmark: input.address.landmark?.trim() || undefined,
      city: input.address.city.trim(),
      state: input.address.state.trim(),
      pincode,
    },
  };
}

// D1-based user ids are crypto.randomUUID() strings (see backend/auth/service.ts,
// Task 2), not Mongo ObjectId hex - the temp-upload key prefix (see
// backend/storage/uploads.ts) is validated against that same UUID shape.
const UUID_RE = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";

function validateArtworkKey(key: string, userId: string): boolean {
  return key.startsWith(`custom-art/temp/${userId}/`) &&
    new RegExp(`^custom-art/temp/${UUID_RE}/[0-9a-f-]+\\.(png|jpg|webp)$`).test(key);
}

async function finalizeArtwork(
  userId: string,
  orderId: string,
  item: Extract<CheckoutItemInput, { type: "custom" }>,
): Promise<string> {
  if (!validateArtworkKey(item.artworkObjectKey, userId)) {
    throw new Error("Invalid custom artwork reference.");
  }

  const extension = item.artworkContentType === "image/jpeg" ? "jpg" : item.artworkContentType === "image/webp" ? "webp" : "png";
  const finalKey = `custom-art/orders/${orderId}/${item.cartLineId}.${extension}`;
  const bucket = getS3BucketName();
  const client = getS3Client();

  await client.send(new CopyObjectCommand({
    Bucket: bucket,
    CopySource: `${bucket}/${item.artworkObjectKey}`,
    Key: finalKey,
    ContentType: item.artworkContentType,
    MetadataDirective: "REPLACE",
    Metadata: {
      purpose: "stickhive-custom-artwork",
      "order-id": orderId,
      "custom-line-id": item.cartLineId,
      "user-id": userId,
    },
  }));

  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: item.artworkObjectKey }));
  return finalKey;
}

function getUpiPaymentDetails(orderId: string, total: number, attempt = 1) {
  const upiId = process.env.STICKHIVE_UPI_ID?.trim();
  const payeeName = process.env.STICKHIVE_UPI_NAME?.trim() || "Stick Hive";
  if (!upiId) throw new Error("STICKHIVE_UPI_ID is not configured.");

  const amount = Number(total.toFixed(2));
  const transactionReference = attempt > 1 ? `${orderId}-A${attempt}` : orderId;
  const params = new URLSearchParams({
    pa: upiId,
    pn: payeeName,
    am: amount.toFixed(2),
    cu: "INR",
    tr: transactionReference,
    tn: `Stick Hive Order ${orderId} (${transactionReference})`,
  });

  return {
    upiId,
    payeeName,
    amount,
    transactionReference,
    uri: `upi://pay?${params.toString()}`,
  };
}

export async function createOrderFromCheckout(input: {
  customer: CheckoutCustomer;
  items: CheckoutItemInput[];
  paymentMethod: "upi" | "stripe" | "razorpay";
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated.");
  const userId = user.id;

  const customer = normalizeCustomer(input.customer);
  if (customer.email !== user.email) {
    throw new Error("Please use the verified email address for this session.");
  }
  if (!Array.isArray(input.items) || input.items.length === 0 || input.items.length > 50) {
    throw new Error("Your cart is empty or too large.");
  }

  const customLineIds = new Set<string>();
  for (const item of input.items) {
    if (item.type === "custom") {
      if (customLineIds.has(item.cartLineId)) throw new Error("Duplicate custom sticker item.");
      customLineIds.add(item.cartLineId);
    }
  }

  const normalizedItems: OrderDocument["items"] = [];
  let subtotal = 0;
  const finalizedKeys: string[] = [];
  const orderId = generateOrderId();

  try {
    for (const item of input.items) {
      const quantity = assertQuantity(item.quantity);

      if (item.type === "product") {
        const product = PRODUCT_BY_ID.get(item.productId);
        if (!product || !product.inStock) throw new Error("One of the selected products is unavailable.");
        if (!product.sizes.includes(item.size)) throw new Error(`Size ${item.size} is not available for ${product.name}.`);

        const { price } = priceFor(product, item.size);
        const lineTotal = price * quantity;
        subtotal += lineTotal;
        normalizedItems.push({
          type: "product",
          productId: product.id,
          productName: product.name,
          imageUrl: product.image,
          size: item.size,
          quantity,
          unitPrice: price,
          lineTotal,
        });
        continue;
      }

      if (!/^[-a-zA-Z0-9]+$/.test(item.cartLineId)) throw new Error("Invalid custom sticker reference.");
      if (!item.artworkContentType.startsWith("image/")) throw new Error("Invalid custom artwork type.");
      const unitPrice = SIZE_PRICES[item.size];
      const lineTotal = unitPrice * quantity;
      const finalKey = await finalizeArtwork(userId, orderId, item);
      finalizedKeys.push(finalKey);
      subtotal += lineTotal;
      normalizedItems.push({
        type: "custom",
        productName: "Custom Sticker",
        artworkObjectKey: finalKey,
        artworkContentType: item.artworkContentType,
        size: item.size,
        shape: item.shape,
        finish: item.finish,
        quantity,
        unitPrice,
        lineTotal,
      });
    }

    const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
    const baseTotal = subtotal + shipping;
    // Never trust a client-sent total or fee — always recompute server-side
    // from the same shared formula the checkout UI displays (see
    // getRazorpayPlatformFee in src/lib/cart/calculations.ts).
    const platformFee = input.paymentMethod === "razorpay" ? getRazorpayPlatformFee(baseTotal) : undefined;
    const total = baseTotal + (platformFee ?? 0);
    const createdAt = new Date();
    const paymentStatus: PaymentStatus = "pending";
    const paymentAttempt = 1;
    const requiresExternalConfirmation = input.paymentMethod === "upi" || input.paymentMethod === "razorpay";
    const paymentExpiresAt = input.paymentMethod === "upi"
      ? new Date(createdAt.getTime() + UPI_PAYMENT_WINDOW_MINUTES * 60 * 1000)
      : undefined;
    const status = requiresExternalConfirmation ? "awaiting_payment" : "placed";

    const db = getD1();
    await db.batch([
      db
        .prepare(
          `INSERT INTO orders (
             order_id, user_id, created_at, status, payment_method, payment_status,
             payment_attempt, payment_expires_at, platform_fee, customer, subtotal, shipping, total
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          orderId,
          userId,
          createdAt.toISOString(),
          status,
          input.paymentMethod,
          paymentStatus,
          input.paymentMethod === "upi" ? paymentAttempt : null,
          paymentExpiresAt ? paymentExpiresAt.toISOString() : null,
          platformFee ?? null,
          JSON.stringify(customer),
          subtotal,
          shipping,
          total,
        ),
      ...normalizedItems.map((item, index) =>
        db
          .prepare(
            `INSERT INTO order_items (
               order_id, position, type, product_id, product_name, image_url,
               artwork_object_key, artwork_content_type, size, shape, finish,
               quantity, unit_price, line_total
             ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          )
          .bind(
            orderId,
            index,
            item.type,
            item.productId ?? null,
            item.productName,
            item.imageUrl ?? null,
            item.artworkObjectKey ?? null,
            item.artworkContentType ?? null,
            item.size,
            item.shape ?? null,
            item.finish ?? null,
            item.quantity,
            item.unitPrice,
            item.lineTotal,
          ),
      ),
    ]);

    const serializedOrder = {
      orderId,
      createdAt: createdAt.toISOString(),
      status,
      paymentMethod: input.paymentMethod,
      paymentStatus,
      ...(input.paymentMethod === "upi" ? { paymentAttempt, paymentExpiresAt: paymentExpiresAt!.toISOString() } : {}),
      ...(platformFee !== undefined ? { platformFee } : {}),
      customer,
      items: normalizedItems,
      subtotal,
      shipping,
      total,
    };

    return {
      ...serializedOrder,
      ...(input.paymentMethod === "upi" ? { upiPayment: getUpiPaymentDetails(orderId, total, paymentAttempt), paymentExpiresAt: paymentExpiresAt!.toISOString() } : {}),
    };
  } catch (error) {
    // Best-effort cleanup if DB insertion or a later artwork operation fails.
    await Promise.all(
      finalizedKeys.map((key) =>
        getS3Client().send(new DeleteObjectCommand({ Bucket: getS3BucketName(), Key: key })).catch(() => undefined),
      ),
    );
    throw error;
  }
}

async function expireUpiPaymentIfNeeded(order: OrderDocument): Promise<OrderDocument> {
  if (order.paymentMethod !== "upi" || order.paymentStatus === "paid" || !order.paymentExpiresAt) return order;
  if (order.paymentExpiresAt.getTime() > Date.now()) return order;
  const db = getD1();
  const now = nowIso();
  await db
    .prepare(
      `UPDATE orders SET payment_status = 'cancelled', status = 'cancelled', updated_at = ?
       WHERE order_id = ? AND payment_method = 'upi' AND payment_status != 'paid' AND payment_expires_at <= ?`,
    )
    .bind(now, order.orderId, now)
    .run();
  const refreshed = await loadOrderByOrderId(db, order.orderId);
  return refreshed ?? order;
}

export async function getMyOrders() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated.");
  const db = getD1();
  const { results: orderRows } = await db
    .prepare("SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT 100")
    .bind(user.id)
    .all<OrderRow>();
  const orders = await hydrateOrders(db, orderRows);
  const refreshed = await Promise.all(orders.map(expireUpiPaymentIfNeeded));
  return refreshed.map(serializeOrder);
}

export async function getMyOrder(orderId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated.");
  const db = getD1();
  const row = await db.prepare("SELECT * FROM orders WHERE order_id = ? AND user_id = ?").bind(orderId, user.id).first<OrderRow>();
  if (!row) return null;
  const doc = rowToOrder(row, await loadOrderItems(db, orderId));
  return serializeOrder(await expireUpiPaymentIfNeeded(doc));
}

export async function attachStripeSession(orderId: string, sessionId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated.");
  const db = getD1();
  const result = await db
    .prepare("UPDATE orders SET stripe_session_id = ? WHERE order_id = ? AND user_id = ? AND payment_status = 'pending'")
    .bind(sessionId, orderId, user.id)
    .run();
  if (!result.meta.changes) throw new Error("Order is unavailable for payment.");
}

export async function setStripePaymentState(params: {
  sessionId: string;
  paymentStatus: PaymentStatus;
  paymentIntentId?: string | null;
}) {
  const db = getD1();
  const setParts: string[] = ["payment_status = ?"];
  const binds: unknown[] = [params.paymentStatus];
  if (params.paymentIntentId) {
    setParts.push("stripe_payment_intent_id = ?");
    binds.push(params.paymentIntentId);
  }
  if (params.paymentStatus === "paid") setParts.push("status = 'placed'");
  binds.push(params.sessionId);
  await db.prepare(`UPDATE orders SET ${setParts.join(", ")} WHERE stripe_session_id = ?`).bind(...binds).run();
}

/**
 * Atomically claims the razorpay_order_id slot on an order. If two checkout
 * attempts race for the same order (e.g. two open tabs), only the first
 * UPDATE can match razorpay_order_id IS NULL — SQLite/D1 executes writes
 * serially, so this is exactly as atomic as Mongo's findOneAndUpdate with
 * $exists: false was. The second finds the slot already taken and gets
 * back the WINNER's razorpay_order_id instead, so both callers converge on
 * the same Razorpay order rather than the second silently overwriting the
 * first's (which would orphan any webhook that later arrives for the first
 * attempt).
 *
 * Returns the razorpay_order_id that should actually be used by the caller
 * - this may not be the one passed in, if someone else won the race first.
 */
export async function attachRazorpayOrder(orderId: string, razorpayOrderId: string): Promise<string> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated.");
  const db = getD1();

  const claim = await db
    .prepare(
      `UPDATE orders SET razorpay_order_id = ?
       WHERE order_id = ? AND user_id = ? AND payment_method = 'razorpay' AND payment_status = 'pending' AND razorpay_order_id IS NULL`,
    )
    .bind(razorpayOrderId, orderId, user.id)
    .run();
  if (claim.meta.changes) return razorpayOrderId;

  const existing = await db
    .prepare(
      "SELECT razorpay_order_id FROM orders WHERE order_id = ? AND user_id = ? AND payment_method = 'razorpay' AND payment_status = 'pending'",
    )
    .bind(orderId, user.id)
    .first<{ razorpay_order_id: string | null }>();
  if (existing?.razorpay_order_id) return existing.razorpay_order_id;

  throw new Error("Order is unavailable for payment.");
}

/**
 * Called ONLY from the Razorpay webhook route, after its signature has been
 * verified — this is the sole automated path allowed to mark a Razorpay
 * order "paid" (unlike Google Pay's auto-check, which may only suggest —
 * see paymentAutoVerification). Idempotent: the `payment_status != 'paid'`
 * filter means a duplicate/retried webhook delivery for an already-processed
 * event is a silent no-op rather than a double-write.
 */
export async function setRazorpayPaymentState(params: {
  razorpayOrderId: string;
  paymentStatus: Extract<PaymentStatus, "paid" | "failed" | "cancelled">;
  razorpayPaymentId?: string;
}) {
  const db = getD1();
  const existing = await loadOrderByRazorpayOrderId(db, params.razorpayOrderId);
  if (!existing) return { matched: false as const };
  if (existing.paymentStatus === "paid") return { matched: true as const, alreadyProcessed: true as const, order: existing };

  const setParts: string[] = ["payment_status = ?", "updated_at = ?"];
  const binds: unknown[] = [params.paymentStatus, nowIso()];
  if (params.razorpayPaymentId) {
    setParts.push("razorpay_payment_id = ?");
    binds.push(params.razorpayPaymentId);
  }
  if (params.paymentStatus === "paid") {
    setParts.push("status = ?");
    binds.push(existing.status === "awaiting_payment" ? "placed" : existing.status);
  } else if (existing.status === "awaiting_payment") {
    setParts.push("status = ?");
    binds.push("awaiting_payment"); // stays put — customer can retry, order isn't dead-ended
  }
  binds.push(params.razorpayOrderId);

  const result = await db
    .prepare(`UPDATE orders SET ${setParts.join(", ")} WHERE razorpay_order_id = ? AND payment_status != 'paid'`)
    .bind(...binds)
    .run();
  if (!result.meta.changes) return { matched: true as const, alreadyProcessed: true as const, order: existing };

  const updated = await loadOrderByRazorpayOrderId(db, params.razorpayOrderId);
  return { matched: true as const, alreadyProcessed: false as const, order: updated ?? existing };
}

export type FulfillmentStatus = Exclude<OrderDocument["status"], "awaiting_payment">;

export type ShippingDetailsInput = {
  method: "courier" | "pickup" | "local_delivery";
  courier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  pickupLocation?: string;
  pickupInstructions?: string;
};

function normalizeShippingDetails(input: ShippingDetailsInput) {
  const courier = input.courier?.trim() || undefined;
  const trackingNumber = input.trackingNumber?.trim() || undefined;
  const trackingUrl = input.trackingUrl?.trim() || undefined;
  const pickupLocation = input.pickupLocation?.trim() || undefined;
  const pickupInstructions = input.pickupInstructions?.trim() || undefined;

  if (courier && courier.length > 120) throw new Error("Courier name is too long.");
  if (trackingNumber && trackingNumber.length > 120) throw new Error("Tracking number is too long.");
  if (trackingUrl && trackingUrl.length > 500) throw new Error("Tracking URL is too long.");
  if (trackingUrl && !/^https?:\/\//i.test(trackingUrl)) throw new Error("Tracking URL must start with http:// or https://.");
  if (pickupLocation && pickupLocation.length > 200) throw new Error("Pickup location is too long.");
  if (pickupInstructions && pickupInstructions.length > 500) throw new Error("Pickup instructions are too long.");

  if (input.method === "courier" && !courier) throw new Error("Enter the courier name.");
  if (input.method === "courier" && !trackingNumber) throw new Error("Enter the tracking / AWB number.");
  if (input.method === "pickup" && !pickupLocation) throw new Error("Enter the pickup location.");

  return {
    method: input.method,
    ...(courier ? { courier } : {}),
    ...(trackingNumber ? { trackingNumber } : {}),
    ...(trackingUrl ? { trackingUrl } : {}),
    ...(pickupLocation ? { pickupLocation } : {}),
    ...(pickupInstructions ? { pickupInstructions } : {}),
    updatedAt: new Date(),
  };
}


export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated.");
  if (!isAdminUser(user)) {
    throw new Error("Admin access required.");
  }
  return user;
}

export async function getAdminOrders() {
  await requireAdmin();
  const db = getD1();
  const { results: orderRows } = await db.prepare("SELECT * FROM orders ORDER BY created_at DESC LIMIT 250").all<OrderRow>();
  const orders = await hydrateOrders(db, orderRows);
  return orders.map(serializeOrder);
}

export async function getAdminOrder(orderId: string) {
  await requireAdmin();
  const db = getD1();
  const doc = await loadOrderByOrderId(db, orderId);
  return doc ? serializeOrder(doc) : null;
}

export type PaymentVerificationInput = {
  transactionId: string;
  utr?: string;
  payerUpiId?: string;
  payerName?: string;
  paidAmount: number;
  paidAt: string;
  note?: string;
};

function normalizePaymentVerification(input: PaymentVerificationInput, orderTotal: number, adminEmail: string) {
  const transactionId = input.transactionId.trim();
  const utr = input.utr?.trim() || undefined;
  const payerUpiId = input.payerUpiId?.trim() || undefined;
  const payerName = input.payerName?.trim() || undefined;
  const note = input.note?.trim() || undefined;
  const paidAmount = Number(input.paidAmount);
  const paidAt = new Date(input.paidAt);

  if (transactionId.length < 4 || transactionId.length > 120) throw new Error("Enter a valid UPI transaction ID.");
  if (!Number.isFinite(paidAmount) || paidAmount < 0) throw new Error("Enter a valid paid amount.");
  if (Math.abs(paidAmount - orderTotal) > 0.009) {
    throw new Error(`Payment amount must match the order total of ₹${orderTotal.toFixed(2)}.`);
  }
  if (Number.isNaN(paidAt.getTime())) throw new Error("Enter a valid payment date and time.");
  if (paidAt.getTime() > Date.now() + 5 * 60 * 1000) throw new Error("Payment time cannot be in the future.");
  if (payerUpiId && payerUpiId.length > 120) throw new Error("Payer UPI ID is too long.");
  if (payerName && payerName.length > 120) throw new Error("Payer name is too long.");
  if (utr && utr.length > 120) throw new Error("UTR is too long.");
  if (note && note.length > 500) throw new Error("Verification note is too long.");

  return {
    transactionId,
    ...(utr ? { utr } : {}),
    ...(payerUpiId ? { payerUpiId } : {}),
    ...(payerName ? { payerName } : {}),
    paidAmount: Number(paidAmount.toFixed(2)),
    paidAt,
    verifiedAt: new Date(),
    verifiedBy: adminEmail,
    ...(note ? { note } : {}),
  };
}

export async function updateAdminOrder(params: {
  orderId: string;
  paymentStatus?: PaymentStatus;
  status?: FulfillmentStatus;
  paymentVerification?: PaymentVerificationInput;
  shippingDetails?: ShippingDetailsInput;
}) {
  const admin = await requireAdmin();
  const db = getD1();
  const existing = await loadOrderByOrderId(db, params.orderId);
  if (!existing) throw new Error("Order not found.");

  const update: {
    updatedAt: Date;
    shippingDetails?: OrderDocument["shippingDetails"];
    status?: OrderDocument["status"];
    paymentStatus?: PaymentStatus;
    paymentVerification?: NonNullable<OrderDocument["paymentVerification"]>;
  } = { updatedAt: new Date() };
  let clearAutoVerification = false;

  let normalizedShipping: OrderDocument["shippingDetails"] | undefined;
  if (params.shippingDetails) {
    normalizedShipping = normalizeShippingDetails(params.shippingDetails);
    update.shippingDetails = normalizedShipping;
  }
  if (params.status) {
    update.status = params.status;
    if (params.status === "shipped" || params.status === "out_for_delivery") {
      const currentShipping = existing.shippingDetails ?? normalizedShipping;
      if (currentShipping) update.shippingDetails = { ...currentShipping, shippedAt: currentShipping.shippedAt ?? new Date(), updatedAt: new Date() };
    }
    if (params.status === "delivered") {
      const currentShipping = existing.shippingDetails ?? normalizedShipping;
      if (currentShipping) update.shippingDetails = { ...currentShipping, deliveredAt: new Date(), updatedAt: new Date() };
    }
  }

  if (params.paymentVerification) {
    if (existing.paymentMethod !== "upi") throw new Error("Payment verification details are only required for UPI orders.");
    if (existing.paymentStatus === "paid") throw new Error("Payment has already been verified.");
    const verification = normalizePaymentVerification(params.paymentVerification, existing.total, admin.email);
    const duplicateTransaction = await db
      .prepare("SELECT 1 FROM orders WHERE order_id != ? AND json_extract(payment_verification, '$.transactionId') = ?")
      .bind(existing.orderId, verification.transactionId)
      .first();
    if (duplicateTransaction) throw new Error("That UPI transaction ID is already recorded against another order.");
    update.paymentStatus = "paid";
    update.status = params.status ?? (existing.status === "awaiting_payment" ? "placed" : existing.status);
    update.paymentVerification = verification;
    clearAutoVerification = true;
  } else if (params.paymentStatus === "paid") {
    if (existing.paymentMethod === "upi") {
      throw new Error("Enter the UPI transaction details before confirming payment.");
    }
    update.paymentStatus = "paid";
    update.status = params.status ?? (existing.status === "awaiting_payment" ? "placed" : existing.status);
    clearAutoVerification = true;
  } else if (params.paymentStatus) {
    update.paymentStatus = params.paymentStatus;
  }

  if (existing.paymentMethod === "upi" && existing.paymentStatus !== "paid" && !params.paymentVerification) {
    if (params.status && params.status !== "cancelled") {
      throw new Error("Verify the UPI payment before moving the order into fulfillment.");
    }
  }

  if (params.paymentStatus === "failed" || params.paymentStatus === "cancelled" || params.paymentStatus === "refunded") {
    if (!params.status && existing.status === "awaiting_payment") update.status = "cancelled";
  }

  const setParts: string[] = ["updated_at = ?"];
  const binds: unknown[] = [update.updatedAt.toISOString()];
  if (update.shippingDetails !== undefined) {
    setParts.push("shipping_details = ?");
    binds.push(JSON.stringify(update.shippingDetails));
  }
  if (update.status !== undefined) {
    setParts.push("status = ?");
    binds.push(update.status);
  }
  if (update.paymentStatus !== undefined) {
    setParts.push("payment_status = ?");
    binds.push(update.paymentStatus);
  }
  if (update.paymentVerification !== undefined) {
    setParts.push("payment_verification = ?");
    binds.push(JSON.stringify(update.paymentVerification));
  }
  if (clearAutoVerification) setParts.push("payment_auto_verification = NULL");
  binds.push(params.orderId);

  await db.prepare(`UPDATE orders SET ${setParts.join(", ")} WHERE order_id = ?`).bind(...binds).run();
  const updated = await loadOrderByOrderId(db, params.orderId);
  if (!updated) throw new Error("Unable to reload updated order.");
  return serializeOrder(updated);
}

export async function markOutForDeliveryEmailSent(orderId: string): Promise<void> {
  const db = getD1();
  const existing = await loadOrderByOrderId(db, orderId);
  if (!existing?.shippingDetails) return;
  const updatedShipping = { ...existing.shippingDetails, outForDeliveryEmailSentAt: new Date() };
  await db
    .prepare("UPDATE orders SET shipping_details = ?, updated_at = ? WHERE order_id = ?")
    .bind(JSON.stringify(updatedShipping), nowIso(), orderId)
    .run();
}

function serializeOrder(order: OrderDocument) {
  return {
    orderId: order.orderId,
    createdAt: order.createdAt.toISOString(),
    status: order.status,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    paymentClaimedAt: order.paymentClaimedAt?.toISOString(),
    paymentAttempt: order.paymentAttempt,
    paymentExpiresAt: order.paymentExpiresAt?.toISOString(),
    paymentVerification: order.paymentVerification
      ? { ...order.paymentVerification, paidAt: order.paymentVerification.paidAt.toISOString(), verifiedAt: order.paymentVerification.verifiedAt.toISOString() }
      : undefined,
    paymentAutoVerification: order.paymentAutoVerification
      ? { ...order.paymentAutoVerification, paidAt: order.paymentAutoVerification.paidAt.toISOString(), detectedAt: order.paymentAutoVerification.detectedAt.toISOString() }
      : undefined,
    paymentProof: order.paymentProof
      ? { ...order.paymentProof, uploadedAt: order.paymentProof.uploadedAt.toISOString() }
      : undefined,
    customer: order.customer,
    items: order.items,
    subtotal: order.subtotal,
    shipping: order.shipping,
    total: order.total,
    platformFee: order.platformFee,
    razorpayOrderId: order.razorpayOrderId,
    razorpayPaymentId: order.razorpayPaymentId,
    shippingDetails: order.shippingDetails
      ? {
          ...order.shippingDetails,
          shippedAt: order.shippingDetails.shippedAt?.toISOString(),
          deliveredAt: order.shippingDetails.deliveredAt?.toISOString(),
          lastCarrierStatusAt: order.shippingDetails.lastCarrierStatusAt?.toISOString(),
          outForDeliveryEmailSentAt: order.shippingDetails.outForDeliveryEmailSentAt?.toISOString(),
          updatedAt: order.shippingDetails.updatedAt.toISOString(),
        }
      : undefined,
    ...(order.paymentMethod === "upi"
      ? { upiPayment: getUpiPaymentDetails(order.orderId, order.total, order.paymentAttempt ?? 1) }
      : {}),
  };
}


export async function expireUpiForCustomer(order: OrderDocument): Promise<OrderDocument> {
  return expireUpiPaymentIfNeeded(order);
}

export async function retryUpiPayment(orderId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated.");
  const db = getD1();
  const existing = await db
    .prepare("SELECT * FROM orders WHERE order_id = ? AND user_id = ? AND payment_method = 'upi'")
    .bind(orderId, user.id)
    .first<OrderRow>();
  if (!existing) throw new Error("Order not found.");
  if (existing.payment_status === "paid") throw new Error("Payment has already been verified.");
  if (!["awaiting_payment", "cancelled"].includes(existing.status)) throw new Error("This order is no longer available for payment.");
  const paymentAttempt = (existing.payment_attempt ?? 1) + 1;
  const paymentExpiresAt = new Date(Date.now() + UPI_PAYMENT_WINDOW_MINUTES * 60 * 1000);
  const result = await db
    .prepare(
      `UPDATE orders SET status = 'awaiting_payment', payment_status = 'pending', payment_attempt = ?, payment_expires_at = ?, updated_at = ?, payment_claimed_at = NULL
       WHERE order_id = ? AND user_id = ? AND payment_method = 'upi' AND payment_status != 'paid'`,
    )
    .bind(paymentAttempt, paymentExpiresAt.toISOString(), nowIso(), orderId, user.id)
    .run();
  if (!result.meta.changes) throw new Error("Unable to restart UPI payment.");
  const updated = await loadOrderByOrderId(db, orderId);
  if (!updated) throw new Error("Unable to restart UPI payment.");
  return serializeOrder(updated);
}

/** Used by the payment-proof upload route: the caller's own UPI order, with expiry applied. */
export async function getMyOrderForPaymentProof(orderId: string): Promise<OrderDocument | null> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated.");
  const db = getD1();
  const row = await db
    .prepare("SELECT * FROM orders WHERE order_id = ? AND user_id = ? AND payment_method = 'upi'")
    .bind(orderId, user.id)
    .first<OrderRow>();
  if (!row) return null;
  const order = rowToOrder(row, await loadOrderItems(db, orderId));
  return expireUpiPaymentIfNeeded(order);
}

/** Used by the payment-proof upload route to attach the uploaded screenshot's S3 key. */
export async function setPaymentProof(orderId: string, paymentProof: NonNullable<OrderDocument["paymentProof"]>): Promise<void> {
  const db = getD1();
  await db
    .prepare("UPDATE orders SET payment_proof = ?, updated_at = ? WHERE order_id = ?")
    .bind(JSON.stringify(paymentProof), nowIso(), orderId)
    .run();
}

export async function claimUpiPayment(orderId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated.");
  const db = getD1();
  const current = await loadOrderByOrderId(db, orderId);
  if (!current || current.userId !== user.id || current.paymentMethod !== "upi") {
    throw new Error("Order is unavailable for UPI payment confirmation.");
  }
  const activeOrder = await expireUpiPaymentIfNeeded(current);
  if (activeOrder.paymentStatus === "cancelled") throw new Error("This payment window has expired. Start payment again.");

  const result = await db
    .prepare(
      `UPDATE orders SET payment_status = 'pending_confirmation', payment_claimed_at = ?
       WHERE order_id = ? AND user_id = ? AND payment_method = 'upi' AND payment_status IN ('pending_confirmation', 'pending')`,
    )
    .bind(nowIso(), orderId, user.id)
    .run();
  if (!result.meta.changes) throw new Error("Order is unavailable for UPI payment confirmation.");
  const updated = await loadOrderByOrderId(db, orderId);
  if (!updated) throw new Error("Order is unavailable for UPI payment confirmation.");
  return serializeOrder(updated);
}
