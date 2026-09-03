"use client";

import {
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import {
  useSearchParams,
} from "next/navigation";

import {
  CheckCircle2,
  Package,
  ArrowRight,
  Download,
  MapPin,
  Phone,
  Mail,
} from "lucide-react";

import {
  generateInvoice,
} from "@/lib/invoice-generator";


// ============================================================================
// TYPES
// ============================================================================

type Address = {
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
};


type CustomerData = {
  name: string;
  email: string;
  phone: string;
  address: Address;
};


type OrderStatus =
  | "placed"
  | "processing"
  | "packed"
  | "shipped"
  | "delivered";


type OrderItem = {
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


type StoredOrder = {
  orderId: string;

  createdAt: string;

  status: OrderStatus;

  customer: CustomerData;

  paymentMethod: string;

  items: OrderItem[];

  subtotal: number;

  shipping: number;

  total: number;
};


// ============================================================================
// STORAGE
// ============================================================================

const ORDERS_STORAGE_KEY =
  "stickhive:orders";


// ============================================================================
// LOAD STORED ORDER
// ============================================================================

function getStoredOrder(
  orderId: string | null,
): StoredOrder | null {

  if (!orderId) {
    return null;
  }

  if (
    typeof window === "undefined"
  ) {
    return null;
  }

  try {

    const savedOrders =
      localStorage.getItem(
        ORDERS_STORAGE_KEY,
      );

    if (!savedOrders) {
      return null;
    }

    const parsed =
      JSON.parse(
        savedOrders,
      );

    if (!Array.isArray(parsed)) {
      return null;
    }

    const orders =
      parsed as StoredOrder[];

    const matchingOrder =
      orders.find(
        (storedOrder) =>
          storedOrder.orderId ===
          orderId,
      );

    return (
      matchingOrder ??
      null
    );

  } catch (error) {

    console.error(
      "Unable to load StickHive order:",
      error,
    );

    return null;
  }
}


// ============================================================================
// DATE FORMAT
// ============================================================================

function formatDate(
  date: string,
) {

  try {

    return new Date(
      date,
    ).toLocaleDateString(
      "en-IN",
      {
        day: "numeric",
        month: "long",
        year: "numeric",
      },
    );

  } catch {

    return date;
  }
}


// ============================================================================
// STATUS LABEL
// ============================================================================

function getStatusLabel(
  status: OrderStatus,
) {

  switch (status) {

    case "placed":
      return "Order Placed";

    case "processing":
      return "Processing";

    case "packed":
      return "Packed";

    case "shipped":
      return "Shipped";

    case "delivered":
      return "Delivered";

    default:
      return "Order Placed";
  }
}


// ============================================================================
// INVOICE ADDRESS
// ============================================================================

function getInvoiceAddress(
  address: Address,
): string {

  return [
    address.addressLine1,
    address.addressLine2,
    address.landmark,
    address.city,
    address.state,
    address.pincode,
  ]
    .filter(
      (value) =>
        Boolean(
          value &&
          value.trim(),
        ),
    )
    .join(", ");
}


// ============================================================================
// ORDER SUCCESS PAGE
// ============================================================================

export default function OrderSuccessPage() {

  const searchParams =
    useSearchParams();


  const orderId =
    searchParams.get(
      "orderId",
    );


  const [
    order,
    setOrder,
  ] = useState<StoredOrder | null>(
    null,
  );


  const [
    hasLoaded,
    setHasLoaded,
  ] = useState(false);


  // ==========================================================================
  // LOAD ORDER
  // ==========================================================================

  useEffect(() => {

    const storedOrder =
      getStoredOrder(
        orderId,
      );

    setOrder(
      storedOrder,
    );

    setHasLoaded(
      true,
    );

  }, [
    orderId,
  ]);


  // ==========================================================================
  // LOADING STATE
  // ==========================================================================

  if (!hasLoaded) {

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
            size-10
            animate-spin
            rounded-full
            border-4
            border-black/10
            border-t-black
          "
        />

      </main>
    );
  }


  // ==========================================================================
  // ORDER NOT FOUND
  // ==========================================================================

  if (!order) {

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

        <section
          className="
            w-full
            max-w-xl
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
              bg-black/5
            "
          >

            <Package
              size={38}
            />

          </div>


          <h1
            className="
              mt-7
              text-3xl
              font-extrabold
            "
          >
            Order Not Found
          </h1>


          <p
            className="
              mx-auto
              mt-3
              max-w-md
              text-black/50
            "
          >
            We couldn&apos;t find the
            order you&apos;re looking
            for. Please check your
            order details or return to
            your orders.
          </p>


          <div
            className="
              mt-8
              flex
              flex-col
              gap-3
              sm:flex-row
            "
          >

            <Link
              href="/orders"
              className="
                flex
                flex-1
                items-center
                justify-center
                rounded-full
                bg-black
                py-4
                font-bold
                text-white
                transition
                hover:scale-[1.02]
              "
            >
              My Orders
            </Link>


            <Link
              href="/shop"
              className="
                flex
                flex-1
                items-center
                justify-center
                rounded-full
                border
                border-black/10
                py-4
                font-bold
                transition
                hover:bg-black/5
              "
            >
              Continue Shopping
            </Link>

          </div>

        </section>

      </main>
    );
  }


  // ==========================================================================
  // NON-NULL ORDER
  // ==========================================================================
  //
  // From this point onward TypeScript knows that currentOrder exists.
  //
  // This prevents:
  //
  // "'order' is possibly 'null'"
  //
  // ==========================================================================

  const currentOrder: StoredOrder =
    order;


  // ==========================================================================
  // DOWNLOAD INVOICE
  // ==========================================================================

  function handleDownloadInvoice() {

    /*
     * The order system stores the address
     * as a structured object.
     *
     * The existing invoice generator expects
     * address to be a string.
     *
     * Therefore we create a separate
     * invoice-compatible customer object.
     */

    const invoiceCustomer = {
      name:
        currentOrder.customer.name,

      email:
        currentOrder.customer.email,

      phone:
        currentOrder.customer.phone,

      address:
        getInvoiceAddress(
          currentOrder.customer.address,
        ),
    };


    const invoiceOrder = {

      orderId:
        currentOrder.orderId,

      createdAt:
        currentOrder.createdAt,

      status:
        currentOrder.status,

      customer:
        invoiceCustomer,

      paymentMethod:
        currentOrder.paymentMethod,

      items:
        currentOrder.items,

      subtotal:
        currentOrder.subtotal,

      shipping:
        currentOrder.shipping,

      total:
        currentOrder.total,

    };


    generateInvoice(
      invoiceOrder,
    );
  }


  // ==========================================================================
  // MAIN PAGE
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
          max-w-3xl
        "
      >

        {/* ================================================================== */}
        {/* SUCCESS HEADER                                                     */}
        {/* ================================================================== */}

        <section
          className="
            rounded-[2.5rem]
            bg-white
            p-8
            text-center
            shadow-xl
            md:p-12
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

            <CheckCircle2
              size={42}
              strokeWidth={2.5}
            />

          </div>


          <h1
            className="
              mt-7
              text-4xl
              font-extrabold
              tracking-tight
              md:text-5xl
            "
          >
            Order Confirmed!
          </h1>


          <p
            className="
              mx-auto
              mt-4
              max-w-lg
              text-black/50
            "
          >
            Thank you for shopping
            with StickHive. Your
            stickers are now being
            prepared.
          </p>


          <div
            className="
              mx-auto
              mt-8
              max-w-md
              rounded-2xl
              bg-cream
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
              Order ID
            </p>


            <p
              className="
                mt-2
                text-xl
                font-extrabold
              "
            >
              {currentOrder.orderId}
            </p>


            <p
              className="
                mt-2
                text-sm
                text-black/40
              "
            >
              Placed on{" "}
              {formatDate(
                currentOrder.createdAt,
              )}
            </p>

          </div>

        </section>


        {/* ================================================================== */}
        {/* DELIVERY                                                           */}
        {/* ================================================================== */}

        <section
          className="
            mt-6
            rounded-[2rem]
            bg-black
            p-6
            text-white
            md:p-8
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
                size-12
                shrink-0
                items-center
                justify-center
                rounded-full
                bg-white/10
              "
            >

              <Package
                size={24}
              />

            </div>


            <div>

              <p
                className="
                  text-sm
                  text-white/50
                "
              >
                Estimated Delivery
              </p>


              <p
                className="
                  mt-1
                  text-xl
                  font-extrabold
                "
              >
                3–5 business days
              </p>

            </div>

          </div>

        </section>


        {/* ================================================================== */}
        {/* DELIVERY ADDRESS                                                   */}
        {/* ================================================================== */}

        <section
          className="
            mt-6
            rounded-[2rem]
            bg-white
            p-6
            shadow-xl
            md:p-8
          "
        >

          <div
            className="
              flex
              items-center
              gap-3
            "
          >

            <div
              className="
                flex
                size-10
                items-center
                justify-center
                rounded-full
                bg-cream
              "
            >

              <MapPin
                size={19}
              />

            </div>


            <h2
              className="
                text-xl
                font-extrabold
              "
            >
              Delivery Address
            </h2>

          </div>


          <div
            className="
              mt-5
              rounded-2xl
              bg-cream
              p-5
            "
          >

            <p
              className="
                font-bold
              "
            >
              {currentOrder.customer.name}
            </p>


            <p
              className="
                mt-2
                text-sm
                leading-relaxed
                text-black/60
              "
            >
              {
                currentOrder.customer
                  .address.addressLine1
              }
            </p>


            {currentOrder.customer.address.addressLine2 && (

              <p
                className="
                  text-sm
                  leading-relaxed
                  text-black/60
                "
              >
                {
                  currentOrder.customer
                    .address.addressLine2
                }
              </p>

            )}


            {currentOrder.customer.address.landmark && (

              <p
                className="
                  text-sm
                  leading-relaxed
                  text-black/60
                "
              >
                {
                  currentOrder.customer
                    .address.landmark
                }
              </p>

            )}


            <p
              className="
                text-sm
                leading-relaxed
                text-black/60
              "
            >
              {
                currentOrder.customer
                  .address.city
              }
              {", "}
              {
                currentOrder.customer
                  .address.state
              }
              {" - "}
              {
                currentOrder.customer
                  .address.pincode
              }
            </p>


            <div
              className="
                mt-4
                flex
                flex-col
                gap-2
                border-t
                border-black/10
                pt-4
                text-sm
                text-black/50
                sm:flex-row
                sm:gap-5
              "
            >

              <span
                className="
                  flex
                  items-center
                  gap-2
                "
              >

                <Phone
                  size={14}
                />

                {
                  currentOrder.customer
                    .phone
                }

              </span>


              <span
                className="
                  flex
                  items-center
                  gap-2
                "
              >

                <Mail
                  size={14}
                />

                {
                  currentOrder.customer
                    .email
                }

              </span>

            </div>

          </div>

        </section>


        {/* ================================================================== */}
        {/* ORDER SUMMARY                                                      */}
        {/* ================================================================== */}

        <section
          className="
            mt-6
            rounded-[2rem]
            bg-white
            p-6
            shadow-xl
            md:p-8
          "
        >

          <div
            className="
              flex
              items-center
              justify-between
              gap-4
            "
          >

            <h2
              className="
                text-2xl
                font-extrabold
              "
            >
              Order Summary
            </h2>


            <span
              className="
                rounded-full
                bg-hive-yellow
                px-3
                py-1
                text-xs
                font-bold
                uppercase
              "
            >
              {
                getStatusLabel(
                  currentOrder.status,
                )
              }
            </span>

          </div>


          {/* ================================================================= */}
          {/* ITEMS                                                             */}
          {/* ================================================================= */}

          <div
            className="
              mt-6
              space-y-4
            "
          >

            {currentOrder.items.map(
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

                  <div
                    className="
                      min-w-0
                    "
                  >

                    <p
                      className="
                        font-bold
                      "
                    >
                      {item.productName}
                    </p>


                    <p
                      className="
                        mt-1
                        text-sm
                        text-black/50
                      "
                    >
                      {item.size}
                      {" × "}
                      {item.quantity}
                    </p>


                    {item.finish && (

                      <p
                        className="
                          mt-1
                          text-xs
                          font-semibold
                          text-black/40
                        "
                      >

                        {item.shape}
                        {" • "}
                        {item.finish}

                      </p>

                    )}

                  </div>


                  <p
                    className="
                      whitespace-nowrap
                      font-bold
                    "
                  >
                    ₹{item.lineTotal}
                  </p>

                </div>

              ),
            )}

          </div>


          {/* ================================================================= */}
          {/* PRICING                                                           */}
          {/* ================================================================= */}

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
                ₹{currentOrder.subtotal}
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
                {
                  currentOrder.shipping === 0
                    ? "FREE"
                    : `₹${currentOrder.shipping}`
                }
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
                ₹{currentOrder.total}
              </span>

            </div>

          </div>


          {/* ================================================================= */}
          {/* PAYMENT METHOD                                                    */}
          {/* ================================================================= */}

          <div
            className="
              mt-6
              rounded-2xl
              bg-black/[0.03]
              p-4
            "
          >

            <div
              className="
                flex
                items-center
                justify-between
                gap-4
                text-sm
              "
            >

              <span
                className="
                  text-black/50
                "
              >
                Payment Method
              </span>


              <span
                className="
                  font-bold
                "
              >
                UPI
              </span>

            </div>

          </div>

        </section>


        {/* ================================================================== */}
        {/* ACTIONS                                                            */}
        {/* ================================================================== */}

        <div
          className="
            mt-6
            grid
            gap-3
            sm:grid-cols-3
          "
        >

          {/* ================================================================= */}
          {/* TRACK ORDER                                                       */}
          {/* ================================================================= */}

          <Link
            href={`/track-order?orderId=${encodeURIComponent(
              currentOrder.orderId,
            )}`}
            className="
              flex
              items-center
              justify-center
              gap-2
              rounded-full
              bg-black
              py-4
              font-bold
              text-white
              transition
              hover:scale-[1.02]
              active:scale-[0.98]
            "
          >

            Track Your Order

            <ArrowRight
              size={18}
            />

          </Link>


          {/* ================================================================= */}
          {/* DOWNLOAD INVOICE                                                  */}
          {/* ================================================================= */}

          <button
            type="button"
            onClick={
              handleDownloadInvoice
            }
            className="
              flex
              items-center
              justify-center
              gap-2
              rounded-full
              bg-hive-yellow
              py-4
              font-bold
              transition
              hover:scale-[1.02]
              active:scale-[0.98]
            "
          >

            Download Invoice

            <Download
              size={18}
            />

          </button>


          {/* ================================================================= */}
          {/* CONTINUE SHOPPING                                                 */}
          {/* ================================================================= */}

          <Link
            href="/shop"
            className="
              flex
              items-center
              justify-center
              rounded-full
              border
              border-black/10
              bg-white
              py-4
              font-bold
              transition
              hover:bg-black/5
            "
          >

            Continue Shopping

          </Link>

        </div>

      </div>

    </main>
  );
}