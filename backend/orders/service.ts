import { CopyObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { ObjectId } from "mongodb";
import { getCollection } from "../db/mongodb";
import { getCurrentUser, isAdminUser } from "../auth/service";
import { getS3BucketName, getS3Client } from "../storage/s3";
import {
  PRODUCTS,
  SIZE_PRICES,
  priceFor,
  type StickerSize,
} from "../../src/lib/product-data";
import { FREE_SHIPPING_THRESHOLD, SHIPPING_FEE } from "../../src/lib/cart/calculations";

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

export type OrderDocument = {
  _id?: ObjectId;
  userId: ObjectId;
  orderId: string;
  createdAt: Date;
  status: "awaiting_payment" | "placed" | "processing" | "packed" | "shipped" | "out_for_delivery" | "delivered" | "cancelled";
  paymentMethod: "upi" | "stripe";
  paymentStatus: PaymentStatus;
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
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
    updatedAt: Date;
  };
};

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

function validateArtworkKey(key: string, userId: ObjectId): boolean {
  return key.startsWith(`custom-art/temp/${userId.toHexString()}/`) &&
    /^custom-art\/temp\/[a-f0-9]{24}\/[0-9a-f-]+\.(png|jpg|webp)$/.test(key);
}

async function finalizeArtwork(
  userId: ObjectId,
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
      "user-id": userId.toHexString(),
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
  paymentMethod: "upi" | "stripe";
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated.");
  const userId = new ObjectId(user.id);

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
    const total = subtotal + shipping;
    const createdAt = new Date();
    const paymentStatus: PaymentStatus = input.paymentMethod === "upi" ? "pending" : "pending";
    const paymentAttempt = 1;
    const paymentExpiresAt = input.paymentMethod === "upi"
      ? new Date(createdAt.getTime() + UPI_PAYMENT_WINDOW_MINUTES * 60 * 1000)
      : undefined;

    const collection = await getCollection<OrderDocument>("orders");
    await collection.insertOne({
      userId,
      orderId,
      createdAt,
      status: input.paymentMethod === "upi" ? "awaiting_payment" : "placed",
      paymentMethod: input.paymentMethod,
      paymentStatus,
      ...(input.paymentMethod === "upi" ? { paymentAttempt, paymentExpiresAt } : {}),
      customer,
      items: normalizedItems,
      subtotal,
      shipping,
      total,
    });

    const serializedOrder = {
      orderId,
      createdAt: createdAt.toISOString(),
      status: input.paymentMethod === "upi" ? "awaiting_payment" : "placed",
      paymentMethod: input.paymentMethod,
      paymentStatus,
      ...(input.paymentMethod === "upi" ? { paymentAttempt, paymentExpiresAt: paymentExpiresAt!.toISOString() } : {}),
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
  const collection = await getCollection<OrderDocument>("orders");
  await collection.updateOne(
    { orderId: order.orderId, paymentMethod: "upi", paymentStatus: { $ne: "paid" }, paymentExpiresAt: { $lte: new Date() } },
    { $set: { paymentStatus: "cancelled", status: "cancelled", updatedAt: new Date() } },
  );
  const refreshed = await collection.findOne({ orderId: order.orderId });
  return refreshed ?? order;
}

export async function getMyOrders() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated.");
  const collection = await getCollection<OrderDocument>("orders");
  const docs = await collection
    .find({ userId: new ObjectId(user.id) })
    .sort({ createdAt: -1 })
    .limit(100)
    .toArray();

  const refreshed = await Promise.all(docs.map(expireUpiPaymentIfNeeded));
  return refreshed.map(serializeOrder);
}

export async function getMyOrder(orderId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated.");
  const collection = await getCollection<OrderDocument>("orders");
  const doc = await collection.findOne({ orderId, userId: new ObjectId(user.id) });
  if (!doc) return null;
  return serializeOrder(await expireUpiPaymentIfNeeded(doc));
}

export async function attachStripeSession(orderId: string, sessionId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated.");
  const collection = await getCollection<OrderDocument>("orders");
  const result = await collection.updateOne(
    { orderId, userId: new ObjectId(user.id), paymentStatus: "pending" },
    { $set: { stripeSessionId: sessionId } },
  );
  if (!result.matchedCount) throw new Error("Order is unavailable for payment.");
}

export async function setStripePaymentState(params: {
  sessionId: string;
  paymentStatus: PaymentStatus;
  paymentIntentId?: string | null;
}) {
  const collection = await getCollection<OrderDocument>("orders");
  const update: Record<string, unknown> = { paymentStatus: params.paymentStatus };
  if (params.paymentIntentId) update.stripePaymentIntentId = params.paymentIntentId;
  if (params.paymentStatus === "paid") update.status = "placed";
  await collection.updateOne(
    { stripeSessionId: params.sessionId },
    { $set: update },
  );
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
  const collection = await getCollection<OrderDocument>("orders");
  const docs = await collection.find({}).sort({ createdAt: -1 }).limit(250).toArray();
  return docs.map(serializeOrder);
}

export async function getAdminOrder(orderId: string) {
  await requireAdmin();
  const collection = await getCollection<OrderDocument>("orders");
  const doc = await collection.findOne({ orderId });
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
  const collection = await getCollection<OrderDocument>("orders");
  const existing = await collection.findOne({ orderId: params.orderId });
  if (!existing) throw new Error("Order not found.");

  const update: Record<string, unknown> = { updatedAt: new Date() };
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
    const duplicateTransaction = await collection.findOne({
      orderId: { $ne: existing.orderId },
      "paymentVerification.transactionId": verification.transactionId,
    });
    if (duplicateTransaction) throw new Error("That UPI transaction ID is already recorded against another order.");
    update.paymentStatus = "paid";
    update.status = params.status ?? (existing.status === "awaiting_payment" ? "placed" : existing.status);
    update.paymentVerification = verification;
  } else if (params.paymentStatus === "paid") {
    if (existing.paymentMethod === "upi") {
      throw new Error("Enter the UPI transaction details before confirming payment.");
    }
    update.paymentStatus = "paid";
    update.status = params.status ?? (existing.status === "awaiting_payment" ? "placed" : existing.status);
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

  await collection.updateOne({ orderId: params.orderId }, { $set: update });
  const updated = await collection.findOne({ orderId: params.orderId });
  if (!updated) throw new Error("Unable to reload updated order.");
  return serializeOrder(updated);
}

export async function markOutForDeliveryEmailSent(orderId: string): Promise<void> {
  const collection = await getCollection<OrderDocument>("orders");
  await collection.updateOne(
    { orderId, "shippingDetails": { $exists: true } },
    { $set: { "shippingDetails.outForDeliveryEmailSentAt": new Date(), updatedAt: new Date() } },
  );
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
    paymentProof: order.paymentProof
      ? { ...order.paymentProof, uploadedAt: order.paymentProof.uploadedAt.toISOString() }
      : undefined,
    customer: order.customer,
    items: order.items,
    subtotal: order.subtotal,
    shipping: order.shipping,
    total: order.total,
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
  const userId = new ObjectId(user.id);
  const collection = await getCollection<OrderDocument>("orders");
  const existing = await collection.findOne({ orderId, userId, paymentMethod: "upi" });
  if (!existing) throw new Error("Order not found.");
  if (existing.paymentStatus === "paid") throw new Error("Payment has already been verified.");
  if (!["awaiting_payment", "cancelled"].includes(existing.status)) throw new Error("This order is no longer available for payment.");
  const paymentAttempt = (existing.paymentAttempt ?? 1) + 1;
  const paymentExpiresAt = new Date(Date.now() + UPI_PAYMENT_WINDOW_MINUTES * 60 * 1000);
  const result = await collection.findOneAndUpdate(
    { orderId, userId, paymentMethod: "upi", paymentStatus: { $ne: "paid" } },
    {
      $set: { status: "awaiting_payment", paymentStatus: "pending", paymentAttempt, paymentExpiresAt, updatedAt: new Date() },
      $unset: { paymentClaimedAt: "" },
    },
    { returnDocument: "after" },
  );
  if (!result) throw new Error("Unable to restart UPI payment.");
  return serializeOrder(result);
}

export async function claimUpiPayment(orderId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated.");
  const collection = await getCollection<OrderDocument>("orders");
  const current = await collection.findOne({ orderId, userId: new ObjectId(user.id), paymentMethod: "upi" });
  if (!current) throw new Error("Order is unavailable for UPI payment confirmation.");
  const activeOrder = await expireUpiPaymentIfNeeded(current);
  if (activeOrder.paymentStatus === "cancelled") throw new Error("This payment window has expired. Start payment again.");
  const result = await collection.findOneAndUpdate(
    {
      orderId,
      userId: new ObjectId(user.id),
      paymentMethod: "upi",
      paymentStatus: { $in: ["pending_confirmation", "pending"] },
    },
    {
      $set: {
        paymentStatus: "pending_confirmation",
        paymentClaimedAt: new Date(),
      },
    },
    { returnDocument: "after" },
  );
  if (!result) throw new Error("Order is unavailable for UPI payment confirmation.");
  return serializeOrder(result);
}
