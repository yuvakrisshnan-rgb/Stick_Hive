// Run with: node --test tests/unit
//
// Covers backend/orders/order-fault-handling.ts directly. This logic was
// deliberately factored out of backend/orders/service.ts because
// service.ts can't be imported under plain `node --test` at all - it pulls
// in `cloudflare:workers` (via ../db/d1), a module scheme Node's loader
// can neither resolve nor mock outside an actual Workers runtime (confirmed:
// even `node --experimental-test-module-mocks` fails with
// ERR_UNSUPPORTED_ESM_URL_SCHEME). These tests exercise the real rollback
// and safe-lookup logic that createOrderFromCheckout/serializeOrder call;
// they use a small in-memory fake of the D1 interface rather than driving
// the actual service-layer functions, which is the honest limit of what's
// testable here without a bundler in the loop.
import assert from "node:assert/strict";
import { test } from "node:test";

import {
  rollbackOrphanedOrder,
  safeUpiPaymentDetails,
  type MinimalD1,
} from "../../backend/orders/order-fault-handling.ts";

type FakeStatement = { sql: string; args: unknown[] };

function createFakeD1(seedOrderIds: string[]) {
  const orders = new Set(seedOrderIds);
  const items = new Set(seedOrderIds); // one "item row set" per seeded order, for simplicity
  const executed: FakeStatement[] = [];

  const db: MinimalD1 = {
    prepare(sql: string) {
      return {
        bind(...args: unknown[]): FakeStatement {
          return { sql, args };
        },
      };
    },
    async batch(statements: unknown[]) {
      for (const raw of statements) {
        const stmt = raw as FakeStatement;
        executed.push(stmt);
        const orderId = stmt.args[0] as string;
        if (stmt.sql.startsWith("DELETE FROM order_items")) items.delete(orderId);
        if (stmt.sql.startsWith("DELETE FROM orders")) orders.delete(orderId);
      }
      return { results: [] };
    },
  };

  return { db, orders, items, executed };
}

test("rollbackOrphanedOrder deletes both the order row and its items", async () => {
  const { db, orders, items } = createFakeD1(["ORDER-1"]);
  await rollbackOrphanedOrder(db, "ORDER-1");
  assert.equal(orders.has("ORDER-1"), false);
  assert.equal(items.has("ORDER-1"), false);
});

test("rollbackOrphanedOrder leaves sibling orders untouched", async () => {
  const { db, orders, items } = createFakeD1(["ORDER-1", "ORDER-2"]);
  await rollbackOrphanedOrder(db, "ORDER-1");
  assert.equal(orders.has("ORDER-2"), true);
  assert.equal(items.has("ORDER-2"), true);
});

test("a checkout that fails after the D1 insert leaves no row behind (simulated createOrderFromCheckout catch path)", async () => {
  // Mirrors the exact control flow in createOrderFromCheckout: the D1
  // insert succeeds (orderPersisted = true), then getUpiPaymentDetails
  // throws (e.g. STICKHIVE_UPI_ID missing) while building the response.
  const { db, orders, items } = createFakeD1(["ORDER-3"]);
  const orderPersisted = true;

  async function simulateCheckout() {
    try {
      throw new Error("STICKHIVE_UPI_ID is not configured.");
    } catch (error) {
      if (orderPersisted) {
        await rollbackOrphanedOrder(db, "ORDER-3");
      }
      throw error;
    }
  }

  await assert.rejects(simulateCheckout(), /STICKHIVE_UPI_ID is not configured\./);
  assert.equal(orders.has("ORDER-3"), false, "the orphaned order row must not survive a failed checkout");
  assert.equal(items.has("ORDER-3"), false, "the orphaned order's items must not survive a failed checkout");
});

test("safeUpiPaymentDetails returns the computed value on success", () => {
  const result = safeUpiPaymentDetails(() => ({ uri: "upi://pay?pa=stickhive@upi" }), () => {});
  assert.deepEqual(result, { ok: true, value: { uri: "upi://pay?pa=stickhive@upi" } });
});

test("safeUpiPaymentDetails catches a throw, reports it via onError, and never throws itself", () => {
  let loggedError: unknown;
  const result = safeUpiPaymentDetails(
    () => {
      throw new Error("STICKHIVE_UPI_ID is not configured.");
    },
    (error) => {
      loggedError = error;
    },
  );
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.error, "STICKHIVE_UPI_ID is not configured.");
  assert.ok(loggedError instanceof Error);
});

test("mapping a list of orders where one payment-detail lookup throws still serializes every order", () => {
  // Mirrors what serializeOrder now does inside getMyOrders'/the admin
  // list's .map() - one bad UPI order must not blank out the whole list.
  const rawOrders = [
    { orderId: "A", paymentMethod: "upi" as const },
    { orderId: "B", paymentMethod: "upi" as const }, // this one fails to compute
    { orderId: "C", paymentMethod: "razorpay" as const },
  ];
  const loggedErrors: string[] = [];

  const serialized = rawOrders.map((order) => {
    if (order.paymentMethod !== "upi") return { ...order };
    const result = safeUpiPaymentDetails(
      () => {
        if (order.orderId === "B") throw new Error("boom");
        return { uri: `upi://${order.orderId}` };
      },
      (error) => loggedErrors.push(`${order.orderId}: ${String(error)}`),
    );
    return result.ok ? { ...order, upiPayment: result.value } : { ...order, upiPaymentError: result.error };
  });

  assert.equal(serialized.length, 3, "every order must still be present in the output");
  assert.deepEqual((serialized[0] as any).upiPayment, { uri: "upi://A" });
  assert.equal((serialized[1] as any).upiPaymentError, "boom");
  assert.equal((serialized[1] as any).upiPayment, undefined);
  assert.deepEqual(serialized[2], { orderId: "C", paymentMethod: "razorpay" });
  assert.equal(loggedErrors.length, 1);
});
