import type { CustomerData } from "@/components/checkout/customer-form";


// ============================================================================
// ORDER STATUS
// ============================================================================
//
// Mirrors OrderDocument["status"] in backend/orders/service.ts — the actual
// values the server persists and returns. Keep these two in sync.
// ============================================================================

export type OrderStatus =
  | "awaiting_payment"
  | "placed"
  | "processing"
  | "packed"
  | "shipped"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";


// ============================================================================
// PAYMENT METHOD / STATUS
// ============================================================================
//
// Mirrors OrderDocument["paymentMethod"] / ["paymentStatus"] in
// backend/orders/service.ts. UPI is the only method wired into the live
// checkout UI today; "stripe" exists server-side but is currently unused
// by src/app/checkout/page.tsx.
// ============================================================================

export type PaymentMethod = "upi" | "stripe";

export type PaymentStatus =
  | "pending"
  | "pending_confirmation"
  | "paid"
  | "failed"
  | "cancelled"
  | "refunded";


// ============================================================================
// ORDER ITEM
// ============================================================================

export type StoredOrderItem = {
  type: "product" | "custom";

  productId?: string;

  productName: string;

  imageUrl?: string;

  /** Private S3 object reference for custom artwork. */
  artworkObjectKey?: string;
  artworkContentType?: string;

  size: string;

  shape?: string;

  finish?: string;

  quantity: number;

  unitPrice: number;

  lineTotal: number;
};


// ============================================================================
// SHIPPING DETAILS
// ============================================================================

export type ShippingDetails = {
  method: "courier" | "pickup" | "local_delivery";

  courier?: string;
  trackingNumber?: string;
  trackingUrl?: string;

  pickupLocation?: string;
  pickupInstructions?: string;

  shippedAt?: string;
  deliveredAt?: string;

  lastCarrierStatus?: string;
  lastCarrierLocation?: string;
  lastCarrierStatusAt?: string;
  outForDeliveryEmailSentAt?: string;

  updatedAt: string;
};


// ============================================================================
// PAYMENT VERIFICATION
// ============================================================================
//
// Recorded by an admin (or the Google Pay auto-verification job) once a UPI
// payment has been confirmed. See backend/payments/google-pay.ts and the
// "Verify Payment" flow in src/app/admin/admin-client.tsx.
// ============================================================================

export type PaymentVerification = {
  transactionId: string;

  utr?: string;
  payerUpiId?: string;
  payerName?: string;

  paidAmount: number;
  paidAt: string;

  verifiedAt: string;
  verifiedBy: string;

  note?: string;
};


// ============================================================================
// UPI PAYMENT DETAILS
// ============================================================================
//
// Computed on the server at response time from the order's id/total/attempt
// (see getUpiPaymentDetails in backend/orders/service.ts) — not stored on
// the order document itself, but always present on API responses for
// UPI orders that are not yet paid.
// ============================================================================

export type UpiPaymentDetails = {
  upiId: string;
  payeeName: string;
  amount: number;
  transactionReference: string;

  /** e.g. "upi://pay?pa=...&pn=...&am=...&cu=INR&tr=...&tn=..." */
  uri: string;
};


// ============================================================================
// STORED ORDER
// ============================================================================
//
// The authoritative client-facing Order contract. This is the JSON shape
// returned by /api/orders, /api/orders/[orderId], and /api/admin/orders —
// pages should import this type rather than redeclaring their own local
// copy, so the two can't drift out of sync again.
// ============================================================================

export type StoredOrder = {
  orderId: string;

  createdAt: string;

  status: OrderStatus;

  customer: CustomerData;

  paymentMethod: PaymentMethod;

  paymentStatus?: PaymentStatus;

  paymentClaimedAt?: string;
  paymentAttempt?: number;
  paymentExpiresAt?: string;

  paymentVerification?: PaymentVerification;

  /** Present on UPI orders that aren't paid yet — see UpiPaymentDetails. */
  upiPayment?: UpiPaymentDetails;

  shippingDetails?: ShippingDetails;

  items: StoredOrderItem[];

  subtotal: number;

  shipping: number;

  total: number;
};
