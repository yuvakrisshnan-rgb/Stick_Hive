"use client";

import {
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import {
  ArrowLeft,
  Check,
  Package,
  Search,
} from "lucide-react";

import {
  useSearchParams,
} from "next/navigation";

// ============================================================================
// TYPES
// ============================================================================

type OrderStatus =
  | "placed"
  | "processing"
  | "packed"
  | "shipped"
  | "delivered";

// ============================================================================
// ADDRESS
// ============================================================================

type CustomerAddress = {
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
};

// ============================================================================
// CUSTOMER
// ============================================================================

type CustomerData = {
  name: string;
  email: string;
  phone: string;

  /*
   * New checkout structure.
   */
  address: CustomerAddress;

  /*
   * Optional legacy support.
   *
   * Older orders may still contain:
   *
   * address: "some old string address"
   */
};

// ============================================================================
// ORDER ITEM
// ============================================================================

type OrderItem = {
  type?: "product" | "custom";

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
// STATUS CONFIGURATION
// ============================================================================

const statusSteps: {
  id: OrderStatus;
  label: string;
  description: string;
}[] = [
  {
    id: "placed",
    label: "Order Placed",
    description:
      "We've received your order.",
  },

  {
    id: "processing",
    label: "Processing",
    description:
      "We're preparing your stickers.",
  },

  {
    id: "packed",
    label: "Packed",
    description:
      "Your order has been packed.",
  },

  {
    id: "shipped",
    label: "Shipped",
    description:
      "Your order is on its way.",
  },

  {
    id: "delivered",
    label: "Delivered",
    description:
      "Your order has been delivered.",
  },
];

// ============================================================================
// STORAGE KEY
// ============================================================================

const ORDERS_STORAGE_KEY =
  "stickhive:orders";

// ============================================================================
// FIND ORDER
// ============================================================================

function findOrder(
  orderNumber: string,
): {
  order: StoredOrder | null;
  error: string;
} {
  const trimmedOrderNumber =
    orderNumber.trim();

  if (!trimmedOrderNumber) {
    return {
      order: null,
      error:
        "Please enter your Order ID.",
    };
  }

  try {
    const savedOrders =
      localStorage.getItem(
        ORDERS_STORAGE_KEY,
      );

    if (!savedOrders) {
      return {
        order: null,
        error:
          "No orders were found.",
      };
    }

    const parsedOrders: unknown =
      JSON.parse(savedOrders);

    if (!Array.isArray(parsedOrders)) {
      return {
        order: null,
        error:
          "Something went wrong while loading your orders.",
      };
    }

    const orders =
      parsedOrders as StoredOrder[];

    const foundOrder =
      orders.find(
        (item) =>
          item.orderId
            ?.toLowerCase()
            .trim() ===
          trimmedOrderNumber.toLowerCase(),
      );

    if (!foundOrder) {
      return {
        order: null,
        error:
          "Order not found. Please check your Order ID and try again.",
      };
    }

    return {
      order: foundOrder,
      error: "",
    };
  } catch (error) {
    console.error(
      "Unable to search order:",
      error,
    );

    return {
      order: null,
      error:
        "Something went wrong while searching your order.",
    };
  }
}

// ============================================================================
// ADDRESS FORMATTER
// ============================================================================

function formatAddress(
  address:
    | CustomerAddress
    | string
    | undefined
    | null,
): string[] {
  // --------------------------------------------------------------------------
  // No address
  // --------------------------------------------------------------------------

  if (!address) {
    return [];
  }

  // --------------------------------------------------------------------------
  // Legacy string address
  // --------------------------------------------------------------------------

  if (typeof address === "string") {
    return [address];
  }

  // --------------------------------------------------------------------------
  // New structured address
  // --------------------------------------------------------------------------

  const lines: string[] = [];

  if (
    address.addressLine1?.trim()
  ) {
    lines.push(
      address.addressLine1.trim(),
    );
  }

  if (
    address.addressLine2?.trim()
  ) {
    lines.push(
      address.addressLine2.trim(),
    );
  }

  if (
    address.landmark?.trim()
  ) {
    lines.push(
      `Landmark: ${address.landmark.trim()}`,
    );
  }

  const cityState =
    [
      address.city?.trim(),
      address.state?.trim(),
    ]
      .filter(Boolean)
      .join(", ");

  if (cityState) {
    lines.push(cityState);
  }

  if (
    address.pincode?.trim()
  ) {
    lines.push(
      `PIN: ${address.pincode.trim()}`,
    );
  }

  return lines;
}

// ============================================================================
// PAGE
// ============================================================================

export default function TrackOrderPage() {
  const searchParams =
    useSearchParams();

  const urlOrderId =
    searchParams.get("orderId");

  // ==========================================================================
  // STATE
  // ==========================================================================

  const [
    orderId,
    setOrderId,
  ] = useState(
    urlOrderId ?? "",
  );

  const [
    order,
    setOrder,
  ] = useState<StoredOrder | null>(
    null,
  );

  const [
    error,
    setError,
  ] = useState("");

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  // ==========================================================================
  // LOAD ORDER
  // ==========================================================================
  //
  // IMPORTANT:
  //
  // localStorage is accessed ONLY here.
  //
  // This prevents server/client hydration mismatches.
  //
  // ==========================================================================

  useEffect(() => {
    setOrderId(
      urlOrderId ?? "",
    );

    if (!urlOrderId) {
      setOrder(null);
      setError("");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const result =
      findOrder(urlOrderId);

    setOrder(result.order);
    setError(result.error);
    setIsLoading(false);
  }, [urlOrderId]);

  // ==========================================================================
  // SEARCH
  // ==========================================================================

  function handleSearch() {
    const trimmedId =
      orderId.trim();

    if (!trimmedId) {
      setOrder(null);

      setError(
        "Please enter your Order ID.",
      );

      return;
    }

    setIsLoading(true);

    const result =
      findOrder(trimmedId);

    setOrder(result.order);
    setError(result.error);

    setIsLoading(false);
  }

  // ==========================================================================
  // STATUS INDEX
  // ==========================================================================

  function getStatusIndex(
    status: OrderStatus,
  ): number {
    return statusSteps.findIndex(
      (step) =>
        step.id === status,
    );
  }

  const currentStatusIndex =
    order
      ? getStatusIndex(
          order.status ??
            "placed",
        )
      : 0;

  // ==========================================================================
  // ADDRESS
  // ==========================================================================

  const addressLines =
    order
      ? formatAddress(
          order.customer.address,
        )
      : [];

  // ==========================================================================
  // LOADING
  // ==========================================================================

  if (isLoading) {
    return (
      <main
        className="
          flex
          min-h-screen
          items-center
          justify-center
          bg-cream
          px-6
          py-32
        "
      >
        <div
          className="
            flex
            flex-col
            items-center
            gap-4
          "
        >
          <div
            className="
              size-10
              animate-spin
              rounded-full
              border-4
              border-black/10
              border-t-black
            "
          />

          <p
            className="
              text-sm
              font-semibold
              text-black/50
            "
          >
            Loading your order...
          </p>
        </div>
      </main>
    );
  }

  // ==========================================================================
  // RENDER
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
          max-w-5xl
        "
      >
        {/* ================================================================== */}
        {/* BACK                                                               */}
        {/* ================================================================== */}

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
          <ArrowLeft
            size={16}
          />

          Back Home
        </Link>

        {/* ================================================================== */}
        {/* HEADER                                                             */}
        {/* ================================================================== */}

        <section
          className="
            mt-8
            rounded-[2.5rem]
            bg-white
            p-8
            shadow-xl
            md:p-10
          "
        >
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
                size-14
                items-center
                justify-center
                rounded-full
                bg-hive-yellow
              "
            >
              <Search
                size={26}
              />
            </div>

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
                Track Order
              </p>

              <h1
                className="
                  mt-1
                  text-3xl
                  font-extrabold
                "
              >
                Where is my sticker?
              </h1>
            </div>
          </div>

          {/* ================================================================ */}
          {/* SEARCH                                                           */}
          {/* ================================================================ */}

          <div
            className="
              mt-8
              flex
              flex-col
              gap-3
              sm:flex-row
            "
          >
            <input
              value={orderId}
              onChange={(event) => {
                setOrderId(
                  event.target.value,
                );
              }}
              onKeyDown={(event) => {
                if (
                  event.key ===
                  "Enter"
                ) {
                  handleSearch();
                }
              }}
              placeholder="Enter Order ID"
              aria-label="Order ID"
              className="
                flex-1
                rounded-full
                border
                border-black/10
                bg-cream
                px-6
                py-4
                font-medium
                outline-none
                transition
                focus:border-black
              "
            />

            <button
              type="button"
              onClick={
                handleSearch
              }
              className="
                rounded-full
                bg-black
                px-8
                py-4
                font-bold
                text-white
                transition
                hover:scale-[1.02]
                active:scale-[0.98]
              "
            >
              Track Order
            </button>
          </div>

          {/* ================================================================ */}
          {/* ERROR                                                            */}
          {/* ================================================================ */}

          {error && (
            <p
              className="
                mt-4
                rounded-2xl
                bg-red-50
                px-5
                py-3
                text-sm
                font-semibold
                text-red-600
              "
            >
              {error}
            </p>
          )}
        </section>

        {/* ================================================================== */}
        {/* ORDER CONTENT                                                      */}
        {/* ================================================================== */}

        {order ? (
          <>
            {/* ============================================================== */}
            {/* STATUS TRACKER                                                 */}
            {/* ============================================================== */}

            <section
              className="
                mt-6
                rounded-[2.5rem]
                bg-white
                p-8
                shadow-xl
              "
            >
              <div
                className="
                  flex
                  items-center
                  gap-3
                "
              >
                <Package
                  size={24}
                />

                <h2
                  className="
                    text-2xl
                    font-extrabold
                  "
                >
                  Order Status
                </h2>
              </div>

              <div
                className="
                  mt-8
                  space-y-6
                "
              >
                {statusSteps.map(
                  (
                    step,
                    index,
                  ) => (
                    <div
                      key={
                        step.id
                      }
                      className="
                        flex
                        items-start
                        gap-4
                      "
                    >
                      {/* STATUS CIRCLE */}

                      <div
                        className={`
                          flex
                          size-10
                          shrink-0
                          items-center
                          justify-center
                          rounded-full
                          font-bold
                          transition
                          ${
                            index <=
                            currentStatusIndex
                              ? "bg-black text-white"
                              : "bg-black/10 text-black/40"
                          }
                        `}
                      >
                        {index <
                        currentStatusIndex ? (
                          <Check
                            size={
                              18
                            }
                          />
                        ) : (
                          index + 1
                        )}
                      </div>

                      {/* STATUS TEXT */}

                      <div>
                        <p
                          className="
                            font-bold
                          "
                        >
                          {
                            step.label
                          }
                        </p>

                        <p
                          className="
                            mt-1
                            text-sm
                            text-black/50
                          "
                        >
                          {
                            step.description
                          }
                        </p>
                      </div>
                    </div>
                  ),
                )}
              </div>
            </section>

            {/* ============================================================== */}
            {/* ORDER DETAILS                                                  */}
            {/* ============================================================== */}

            <section
              className="
                mt-6
                rounded-[2.5rem]
                bg-white
                p-8
                shadow-xl
              "
            >
              <div
                className="
                  flex
                  flex-col
                  gap-3
                  sm:flex-row
                  sm:items-center
                  sm:justify-between
                "
              >
                <h2
                  className="
                    text-2xl
                    font-extrabold
                  "
                >
                  Order Details
                </h2>

                <p
                  className="
                    w-fit
                    rounded-full
                    bg-hive-yellow
                    px-4
                    py-2
                    text-xs
                    font-bold
                    uppercase
                  "
                >
                  {order.orderId}
                </p>
              </div>

              {/* ============================================================ */}
              {/* ITEMS                                                         */}
              {/* ============================================================ */}

              <div
                className="
                  mt-6
                  space-y-4
                "
              >
                {order.items.map(
                  (
                    item,
                    index,
                  ) => (
                    <div
                      key={`${item.productName}-${index}`}
                      className="
                        flex
                        items-center
                        justify-between
                        gap-4
                        rounded-2xl
                        bg-cream
                        p-4
                      "
                    >
                      <div>
                        <p
                          className="
                            font-bold
                          "
                        >
                          {
                            item.productName
                          }
                        </p>

                        <p
                          className="
                            mt-1
                            text-sm
                            text-black/50
                          "
                        >
                          {
                            item.size
                          }{" "}
                          ×{" "}
                          {
                            item.quantity
                          }
                        </p>

                        {(item.shape ||
                          item.finish) && (
                          <p
                            className="
                              mt-1
                              text-xs
                              font-semibold
                              text-black/40
                            "
                          >
                            {[
                              item.shape,
                              item.finish,
                            ]
                              .filter(
                                Boolean,
                              )
                              .join(
                                " • ",
                              )}
                          </p>
                        )}
                      </div>

                      <p
                        className="
                          whitespace-nowrap
                          font-bold
                        "
                      >
                        ₹
                        {
                          item.lineTotal
                        }
                      </p>
                    </div>
                  ),
                )}
              </div>

              {/* ============================================================ */}
              {/* PRICING                                                       */}
              {/* ============================================================ */}

              <div
                className="
                  mt-6
                  border-t
                  border-black/10
                  pt-6
                "
              >
                <div
                  className="
                    flex
                    justify-between
                    text-sm
                  "
                >
                  <span>
                    Subtotal
                  </span>

                  <span>
                    ₹
                    {
                      order.subtotal
                    }
                  </span>
                </div>

                <div
                  className="
                    mt-3
                    flex
                    justify-between
                    text-sm
                  "
                >
                  <span>
                    Shipping
                  </span>

                  <span>
                    {order.shipping ===
                    0
                      ? "FREE"
                      : `₹${order.shipping}`}
                  </span>
                </div>

                <div
                  className="
                    mt-4
                    flex
                    justify-between
                    text-xl
                    font-extrabold
                  "
                >
                  <span>
                    Total
                  </span>

                  <span>
                    ₹
                    {
                      order.total
                    }
                  </span>
                </div>
              </div>

              {/* ============================================================ */}
              {/* CUSTOMER + PAYMENT                                           */}
              {/* ============================================================ */}

              <div
                className="
                  mt-8
                  grid
                  gap-4
                  md:grid-cols-2
                "
              >
                {/* ========================================================== */}
                {/* DELIVERY ADDRESS                                           */}
                {/* ========================================================== */}

                <div
                  className="
                    rounded-2xl
                    bg-black/[0.03]
                    p-5
                  "
                >
                  <p
                    className="
                      text-xs
                      font-bold
                      uppercase
                      tracking-widest
                      text-black/40
                    "
                  >
                    Delivery Address
                  </p>

                  <p
                    className="
                      mt-3
                      font-semibold
                    "
                  >
                    {
                      order.customer
                        .name
                    }
                  </p>

                  <div
                    className="
                      mt-2
                      space-y-1
                      text-sm
                      leading-relaxed
                      text-black/60
                    "
                  >
                    {addressLines.map(
                      (
                        line,
                        index,
                      ) => (
                        <p
                          key={
                            `${line}-${index}`
                          }
                        >
                          {line}
                        </p>
                      ),
                    )}
                  </div>

                  {order.customer
                    .phone && (
                    <p
                      className="
                        mt-3
                        text-sm
                        font-semibold
                        text-black/60
                      "
                    >
                      {
                        order.customer
                          .phone
                      }
                    </p>
                  )}

                  {order.customer
                    .email && (
                    <p
                      className="
                        mt-1
                        break-all
                        text-sm
                        text-black/50
                      "
                    >
                      {
                        order.customer
                          .email
                      }
                    </p>
                  )}
                </div>

                {/* ========================================================== */}
                {/* PAYMENT                                                     */}
                {/* ========================================================== */}

                <div
                  className="
                    rounded-2xl
                    bg-black/[0.03]
                    p-5
                  "
                >
                  <p
                    className="
                      text-xs
                      font-bold
                      uppercase
                      tracking-widest
                      text-black/40
                    "
                  >
                    Payment
                  </p>

                  <p
                    className="
                      mt-3
                      font-semibold
                    "
                  >
                    {order.paymentMethod ===
                    "upi"
                      ? "UPI"
                      : order.paymentMethod ===
                          "card"
                        ? "Credit / Debit Card"
                        : order.paymentMethod}
                  </p>

                  <p
                    className="
                      mt-2
                      text-sm
                      text-black/60
                    "
                  >
                    Total Paid: ₹
                    {
                      order.total
                    }
                  </p>
                </div>
              </div>
            </section>
          </>
        ) : (
          /* ================================================================== */
          /* NO ORDER SELECTED                                                 */
          /* ================================================================== */

          <section
            className="
              mt-6
              rounded-[2.5rem]
              bg-white
              p-10
              text-center
              shadow-xl
            "
          >
            <div
              className="
                mx-auto
                flex
                size-16
                items-center
                justify-center
                rounded-full
                bg-hive-yellow
              "
            >
              <Package
                size={30}
              />
            </div>

            <h2
              className="
                mt-5
                text-2xl
                font-extrabold
              "
            >
              Track your order
            </h2>

            <p
              className="
                mx-auto
                mt-2
                max-w-md
                text-sm
                leading-relaxed
                text-black/50
              "
            >
              Enter your StickHive
              Order ID above to see
              the current status of
              your order.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}