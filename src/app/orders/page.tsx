"use client";

import { useState } from "react";
import Link from "next/link";

import {
  ArrowLeft,
  ArrowRight,
  Package,
  ShoppingBag,
} from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

type OrderStatus =
  | "placed"
  | "processing"
  | "packed"
  | "shipped"
  | "delivered";

type OrderItem = {
  productId?: string;
  productName: string;
  size: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

type CustomerData = {
  name: string;
  email: string;
  phone: string;
  address: string;
};

type StoredOrder = {
  orderId: string;
  createdAt: string;
  status?: OrderStatus;
  customer: CustomerData;
  paymentMethod: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
};

// ============================================================================
// STATUS LABELS
// ============================================================================

const statusLabels: Record<OrderStatus, string> = {
  placed: "Order Placed",
  processing: "Processing",
  packed: "Packed",
  shipped: "Shipped",
  delivered: "Delivered",
};

// ============================================================================
// LOAD ORDERS HELPER
// ============================================================================

function getStoredOrders(): StoredOrder[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const savedOrders = localStorage.getItem("stickhive:orders");

    if (!savedOrders) {
      return [];
    }

    const parsedOrders: StoredOrder[] = JSON.parse(savedOrders);

    return [...parsedOrders].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime(),
    );
  } catch (error) {
    console.error("Unable to load orders:", error);
    return [];
  }
}

// ============================================================================
// PAGE
// ============================================================================

export default function OrdersPage() {
  const [orders] = useState<StoredOrder[]>(() => getStoredOrders());

  // ==========================================================================
  // EMPTY STATE
  // ==========================================================================

  if (orders.length === 0) {
    return (
      <main
        className="
          min-h-screen
          bg-cream
          px-6
          pb-20
          pt-32
        "
      >
        <div
          className="
            mx-auto
            max-w-3xl
          "
        >
          {/* BACK */}

          <Link
            href="/"
            className="
              inline-flex
              items-center
              gap-2
              text-sm
              font-semibold
              text-black/60
              transition
              hover:text-black
            "
          >
            <ArrowLeft size={16} />

            Back to Home
          </Link>

          {/* EMPTY ORDERS CARD */}

          <section
            className="
              mt-10
              rounded-[2.5rem]
              bg-white
              p-10
              text-center
              shadow-xl
              md:p-14
            "
          >
            <div
              className="
                mx-auto
                flex
                size-20
                items-center
                justify-center
                rounded-full
                bg-hive-yellow
              "
            >
              <ShoppingBag size={36} />
            </div>

            <h1
              className="
                mt-7
                text-3xl
                font-extrabold
              "
            >
              No Orders Yet
            </h1>

            <p
              className="
                mx-auto
                mt-3
                max-w-md
                text-black/50
              "
            >
              You haven&apos;t placed any StickHive orders yet. Find some
              stickers you love and make your first order!
            </p>

            <Link
              href="/shop"
              className="
                mt-8
                inline-flex
                items-center
                justify-center
                gap-2
                rounded-full
                bg-black
                px-7
                py-4
                font-bold
                text-white
                transition
                hover:scale-[1.02]
              "
            >
              Start Shopping

              <ArrowRight size={18} />
            </Link>
          </section>
        </div>
      </main>
    );
  }

  // ==========================================================================
  // MAIN ORDERS PAGE
  // ==========================================================================

  return (
    <main
      className="
        min-h-screen
        bg-cream
        px-6
        pb-20
        pt-32
      "
    >
      <div
        className="
          mx-auto
          max-w-4xl
        "
      >
        {/* BACK */}

        <Link
          href="/"
          className="
            inline-flex
            items-center
            gap-2
            text-sm
            font-semibold
            text-black/60
            transition
            hover:text-black
          "
        >
          <ArrowLeft size={16} />

          Back to Home
        </Link>

        {/* PAGE HEADER */}

        <div className="mt-8">
          <p
            className="
              text-sm
              font-bold
              uppercase
              tracking-widest
              text-black/40
            "
          >
            StickHive
          </p>

          <h1
            className="
              mt-2
              text-4xl
              font-extrabold
              tracking-tight
              md:text-5xl
            "
          >
            My Orders
          </h1>

          <p
            className="
              mt-3
              text-black/50
            "
          >
            View and track all your StickHive orders in one place.
          </p>
        </div>

        {/* ORDERS LIST */}

        <div
          className="
            mt-8
            space-y-5
          "
        >
          {orders.map((order) => {
            const status = order.status || "placed";

            const itemCount = order.items.reduce(
              (total, item) => total + item.quantity,
              0,
            );

            return (
              <section
                key={order.orderId}
                className="
                  overflow-hidden
                  rounded-[2rem]
                  bg-white
                  shadow-xl
                "
              >
                {/* ORDER HEADER */}

                <div
                  className="
                    flex
                    flex-col
                    gap-4
                    border-b
                    border-black/10
                    p-6
                    md:flex-row
                    md:items-center
                    md:justify-between
                    md:p-7
                  "
                >
                  <div>
                    <p
                      className="
                        text-xs
                        font-bold
                        uppercase
                        tracking-widest
                        text-black/40
                      "
                    >
                      Order ID
                    </p>

                    <h2
                      className="
                        mt-1
                        text-xl
                        font-extrabold
                      "
                    >
                      {order.orderId}
                    </h2>

                    <p
                      className="
                        mt-1
                        text-sm
                        text-black/50
                      "
                    >
                      {new Date(order.createdAt).toLocaleDateString(
                        "en-IN",
                        {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        },
                      )}
                    </p>
                  </div>

                  {/* STATUS */}

                  <div
                    className="
                      flex
                      w-fit
                      items-center
                      gap-2
                      rounded-full
                      bg-hive-yellow
                      px-4
                      py-2
                      text-sm
                      font-bold
                    "
                  >
                    <span
                      className="
                        size-2
                        rounded-full
                        bg-black
                      "
                    />

                    {statusLabels[status]}
                  </div>
                </div>

                {/* ORDER CONTENT */}

                <div
                  className="
                    p-6
                    md:p-7
                  "
                >
                  <div
                    className="
                      flex
                      flex-col
                      gap-6
                      md:flex-row
                      md:items-center
                      md:justify-between
                    "
                  >
                    {/* ITEMS */}

                    <div
                      className="
                        flex
                        items-center
                        gap-4
                      "
                    >
                      <div
                        className="
                          flex
                          size-12
                          shrink-0
                          items-center
                          justify-center
                          rounded-2xl
                          bg-cream
                        "
                      >
                        <Package size={24} />
                      </div>

                      <div>
                        <p className="font-bold">
                          {itemCount}{" "}
                          {itemCount === 1 ? "item" : "items"}
                        </p>

                        <p
                          className="
                            mt-1
                            text-sm
                            text-black/50
                          "
                        >
                          {order.items
                            .map((item) => item.productName)
                            .slice(0, 2)
                            .join(", ")}

                          {order.items.length > 2 ? " + more" : ""}
                        </p>
                      </div>
                    </div>

                    {/* TOTAL */}

                    <div className="md:text-right">
                      <p
                        className="
                          text-sm
                          text-black/50
                        "
                      >
                        Total
                      </p>

                      <p
                        className="
                          mt-1
                          text-2xl
                          font-extrabold
                        "
                      >
                        ₹{order.total}
                      </p>
                    </div>
                  </div>

                  {/* ACTIONS */}

                  <div
                    className="
                      mt-6
                      grid
                      gap-3
                      sm:grid-cols-2
                    "
                  >
                    {/* TRACK ORDER */}

                    <Link
                      href={`/track-order?orderId=${order.orderId}`}
                      className="
                        flex
                        items-center
                        justify-center
                        gap-2
                        rounded-full
                        bg-black
                        py-3
                        text-sm
                        font-bold
                        text-white
                        transition
                        hover:scale-[1.02]
                      "
                    >
                      Track Order

                      <ArrowRight size={16} />
                    </Link>

                    {/* VIEW ORDER */}

                    <Link
                      href={`/track-order?orderId=${order.orderId}`}
                      className="
                        flex
                        items-center
                        justify-center
                        rounded-full
                        border
                        border-black/10
                        py-3
                        text-sm
                        font-bold
                        transition
                        hover:bg-black/5
                      "
                    >
                      View Order
                    </Link>
                  </div>
                </div>
              </section>
            );
          })}
        </div>

        {/* CONTINUE SHOPPING */}

        <div
          className="
            mt-8
            text-center
          "
        >
          <Link
            href="/shop"
            className="
              inline-flex
              items-center
              gap-2
              rounded-full
              border
              border-black/10
              bg-white
              px-7
              py-3
              text-sm
              font-bold
              transition
              hover:bg-black
              hover:text-white
            "
          >
            Continue Shopping

            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </main>
  );
}