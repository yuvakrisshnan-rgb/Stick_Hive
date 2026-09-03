import type { CustomerData } from "@/components/checkout/customer-form";


// ============================================================================
// ORDER STATUS
// ============================================================================

export type OrderStatus =
  | "placed"
  | "processing"
  | "packed"
  | "shipped"
  | "delivered";


// ============================================================================
// ORDER ITEM
// ============================================================================

export type StoredOrderItem = {
  type: "product" | "custom";

  productId?: string;

  productName: string;

  imageUrl?: string;

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

  items: StoredOrderItem[];

  subtotal: number;

  shipping: number;

  total: number;
};