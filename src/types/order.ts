import type { CustomerData } from "@/components/checkout/customer-form";


// ============================================================================
// ORDER STATUS
// ============================================================================

export type OrderStatus =
  | "awaiting_payment"
  | "placed"
  | "processing"
  | "packed"
  | "shipped"
  | "delivered"
  | "cancelled";


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
// STORED ORDER
// ============================================================================

export type StoredOrder = {
  orderId: string;

  createdAt: string;

  status: OrderStatus;

  customer: CustomerData;

  paymentMethod: string;

  paymentStatus?:
    | "pending"
    | "pending_confirmation"
    | "paid"
    | "failed"
    | "cancelled"
    | "refunded";

  items: StoredOrderItem[];

  subtotal: number;

  shipping: number;

  total: number;
};