import type {
  CartLineDetailed,
  CustomStickerCartLine,
} from "./types";

export const FREE_SHIPPING_THRESHOLD = 200;

export const SHIPPING_FEE = 40;

// Razorpay charges 2% + 18% GST on that 2% per successful transaction
// (2% * 1.18 = 2.36%). This is passed to the customer as a disclosed line
// item, not absorbed into product price. Shared between the server (order
// creation, the source of truth) and the client (checkout display) so the
// two can never drift.
export const RAZORPAY_PLATFORM_FEE_RATE = 0.0236;

export function getRazorpayPlatformFee(baseTotal: number): number {
  return Math.round(baseTotal * RAZORPAY_PLATFORM_FEE_RATE * 100) / 100;
}

export function getNormalCartSubtotal(
  lines: CartLineDetailed[],
): number {
  return lines.reduce(
    (total, line) => total + line.lineTotal,
    0,
  );
}

export function getCustomCartSubtotal(
  lines: CustomStickerCartLine[],
): number {
  return lines.reduce(
    (total, line) => total + line.lineTotal,
    0,
  );
}

export function getCartSubtotal(
  normalLines: CartLineDetailed[],
  customLines: CustomStickerCartLine[],
): number {
  return (
    getNormalCartSubtotal(normalLines) +
    getCustomCartSubtotal(customLines)
  );
}

export function getCartDiscount(
  normalLines: CartLineDetailed[],
): number {
  return normalLines.reduce(
    (total, line) => total + line.lineDiscount,
    0,
  );
}

export function getShippingCost(
  subtotal: number,
): number {
  if (subtotal <= 0) {
    return 0;
  }

  return subtotal >= FREE_SHIPPING_THRESHOLD
    ? 0
    : SHIPPING_FEE;
}

/**
 * The product price returned by priceFor()
 * is already the final selling price.
 *
 * cartDiscount represents the customer's
 * savings and must NOT be subtracted again.
 */
export function getCartTotal(
  subtotal: number,
  _discount: number,
): number {
  return subtotal + getShippingCost(subtotal);
}

export function getAmountToFreeShipping(
  subtotal: number,
): number {
  return Math.max(
    0,
    FREE_SHIPPING_THRESHOLD - subtotal,
  );
}

export function getHasFreeShipping(
  subtotal: number,
): boolean {
  return subtotal >= FREE_SHIPPING_THRESHOLD;
}

export function getCartItemCount(
  normalLines: { quantity: number }[],
  customLines: { quantity: number }[],
): number {
  return (
    normalLines.reduce(
      (total, line) => total + line.quantity,
      0,
    ) +
    customLines.reduce(
      (total, line) => total + line.quantity,
      0,
    )
  );
}