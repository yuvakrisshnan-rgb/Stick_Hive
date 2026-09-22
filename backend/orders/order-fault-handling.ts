/**
 * Small D1-shaped interfaces and pure(-ish) helpers factored out of
 * service.ts specifically so they can be unit-tested directly with plain
 * `node --test` - service.ts itself can't be imported that way, since it
 * pulls in `cloudflare:workers` (via ../db/d1), a module scheme Node's
 * loader can neither resolve nor mock outside an actual Workers runtime.
 */

export type MinimalD1Statement = {
  bind(...args: unknown[]): unknown;
};

export type MinimalD1 = {
  prepare(sql: string): MinimalD1Statement;
  batch(statements: unknown[]): Promise<unknown>;
};

/**
 * Deletes an order and its items. Used to roll back a checkout that
 * inserted the order row but failed before it could be returned to the
 * customer (e.g. getUpiPaymentDetails throwing because required payment
 * config like STICKHIVE_UPI_ID is missing) - without this, that row was
 * orphaned forever: invisible to the customer (they never got the order
 * ID to look it up) and, until the safeUpiPaymentDetails fix below, unable
 * to even be listed by admin.
 */
export async function rollbackOrphanedOrder(db: MinimalD1, orderId: string): Promise<void> {
  await db.batch([
    db.prepare("DELETE FROM order_items WHERE order_id = ?").bind(orderId),
    db.prepare("DELETE FROM orders WHERE order_id = ?").bind(orderId),
  ]);
}

export type SafeComputeResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

/**
 * Runs a payment-details lookup (e.g. getUpiPaymentDetails, which throws
 * if required config is missing) without letting one order's failure take
 * down serialization of every other order in the same list/read. onError
 * is called with the raw error so the caller can log it server-side.
 */
export function safeUpiPaymentDetails<T>(
  compute: () => T,
  onError: (error: unknown) => void,
): SafeComputeResult<T> {
  try {
    return { ok: true, value: compute() };
  } catch (error) {
    onError(error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unable to compute UPI payment details.",
    };
  }
}
