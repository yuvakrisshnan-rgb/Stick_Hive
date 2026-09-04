"use client";

import {
  useMemo,
  useState,
  type ReactNode,
} from "react";

import Link from "next/link";

import {
  ArrowLeft,
  ArrowRight,
  CreditCard,
  LockKeyhole,
  Package,
  ShieldCheck,
  ShoppingBag,
  Truck,
} from "lucide-react";

import CustomerForm, {
  type CustomerData,
  type CustomerErrors,
  validateCustomer,
} from "@/components/checkout/customer-form";

import { useShop } from "@/components/shop/store-provider";

import {
  saveAddress,
} from "@/lib/address-storage";

import type {
  OrderStatus,
  StoredOrder,
  StoredOrderItem,
} from "@/types/order";


// ============================================================================
// STORAGE
// ============================================================================

const ORDERS_STORAGE_KEY =
  "stickhive:orders";


// ============================================================================
// INITIAL CUSTOMER
// ============================================================================

const INITIAL_CUSTOMER: CustomerData = {
  name: "",
  email: "",
  phone: "",
  address: {
    addressLine1: "",
    addressLine2: "",
    landmark: "",
    city: "",
    state: "",
    pincode: "",
  },
};


// ============================================================================
// GENERATE ORDER ID
// ============================================================================

function generateOrderId() {

  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID ===
      "function"
  ) {
    return `SH-${crypto
      .randomUUID()
      .split("-")[0]
      .toUpperCase()}`;
  }

  return `SH-${Date.now()
    .toString(36)
    .toUpperCase()}`;
}


// ============================================================================
// READ STORED ORDERS
// ============================================================================

function readStoredOrders(): StoredOrder[] {

  if (
    typeof window ===
    "undefined"
  ) {
    return [];
  }

  try {

    const stored =
      localStorage.getItem(
        ORDERS_STORAGE_KEY,
      );

    if (!stored) {
      return [];
    }

    const parsed =
      JSON.parse(stored);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed as StoredOrder[];

  } catch (error) {

    console.error(
      "Unable to load StickHive orders:",
      error,
    );

    return [];
  }
}


// ============================================================================
// SAVE ORDER
// ============================================================================

function saveStoredOrder(
  order: StoredOrder,
) {

  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }

  try {

    const existingOrders =
      readStoredOrders();

    const updatedOrders = [
      order,
      ...existingOrders,
    ];

    localStorage.setItem(
      ORDERS_STORAGE_KEY,
      JSON.stringify(
        updatedOrders,
      ),
    );

  } catch (error) {

    console.error(
      "Unable to save StickHive order:",
      error,
    );

    throw error;
  }
}


// ============================================================================
// PAGE
// ============================================================================

export default function CheckoutPage() {

  // ==========================================================================
  // SHOP
  // ==========================================================================

  const {
    cartLines,
    customCartLines,
    cartSubtotal,
    shippingCost,
    cartTotal,
    clearAllCart,
  } = useShop();


  // ==========================================================================
  // CUSTOMER
  // ==========================================================================

  const [
    customer,
    setCustomer,
  ] = useState<CustomerData>(
    INITIAL_CUSTOMER,
  );


  const [
    errors,
    setErrors,
  ] = useState<CustomerErrors>(
    {},
  );


  // ==========================================================================
  // EMAIL VERIFICATION
  // ==========================================================================

  const [
    emailVerified,
    setEmailVerified,
  ] = useState(false);


  // ==========================================================================
  // ORDER STATE
  // ==========================================================================

  const [
    isPlacingOrder,
    setIsPlacingOrder,
  ] = useState(false);


  const [
    orderError,
    setOrderError,
  ] = useState("");

  const [
    showPaymentProcessing,
    setShowPaymentProcessing,
  ] = useState(false);


  // ==========================================================================
  // ITEM COUNT
  // ==========================================================================

  const itemCount =
    useMemo(() => {

      const normalItems =
        cartLines.reduce(
          (
            total,
            item,
          ) =>
            total +
            item.quantity,
          0,
        );

      const customItems =
        customCartLines.reduce(
          (
            total,
            item,
          ) =>
            total +
            item.quantity,
          0,
        );

      return (
        normalItems +
        customItems
      );

    }, [
      cartLines,
      customCartLines,
    ]);


  // ==========================================================================
  // EMPTY CART
  // ==========================================================================

  if (
    itemCount === 0
  ) {

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

          <Link
            href="/shop"
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

            Back to Shop

          </Link>


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

              <ShoppingBag
                size={34}
              />

            </div>


            <h1
              className="
                mt-7
                text-3xl
                font-extrabold
              "
            >
              Your cart is empty
            </h1>


            <p
              className="
                mx-auto
                mt-3
                max-w-md
                text-black/50
              "
            >
              Add some stickers to
              your cart before
              proceeding to checkout.
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

              <ArrowRight
                size={18}
              />

            </Link>

          </section>

        </div>

      </main>
    );
  }


  // ==========================================================================
  // PLACE ORDER
  // ==========================================================================

  async function handlePlaceOrder() {

    setOrderError("");


    // ------------------------------------------------------------------------
    // VALIDATE CUSTOMER
    // ------------------------------------------------------------------------

    const validationErrors =
      validateCustomer(
        customer,
      );


    setErrors(
      validationErrors,
    );


    // ------------------------------------------------------------------------
    // STOP IF INVALID
    // ------------------------------------------------------------------------

    if (
      validationErrors.name ||
      validationErrors.email ||
      validationErrors.phone ||
      validationErrors.address
    ) {
      return;
    }


    // ------------------------------------------------------------------------
    // STOP IF EMAIL NOT VERIFIED
    // ------------------------------------------------------------------------

    if (!emailVerified) {

      setOrderError(
        "Please verify your email address before placing your order.",
      );

      return;
    }


    // ------------------------------------------------------------------------
    // START PAYMENT ANIMATION
    // ------------------------------------------------------------------------

    setIsPlacingOrder(
      true,
    );

    setShowPaymentProcessing(
      true,
    );


    try {

      // ======================================================================
      // SIMULATED UPI PROCESSING
      // ======================================================================
      //
      // Temporary development behaviour.
      //
      // Later this will be replaced by
      // the actual UPI payment gateway.
      //
      // ======================================================================

      await new Promise<void>(
        (resolve) => {
          setTimeout(
            resolve,
            1800,
          );
        },
      );


      // ======================================================================
      // SAVE ADDRESS
      // ======================================================================

      saveAddress({

        addressLine1:
          customer.address
            .addressLine1
            .trim(),

        addressLine2:
          customer.address
            .addressLine2
            ?.trim() ||
          undefined,

        landmark:
          customer.address
            .landmark
            ?.trim() ||
          undefined,

        city:
          customer.address
            .city
            .trim(),

        state:
          customer.address
            .state
            .trim(),

        pincode:
          customer.address
            .pincode
            .trim(),

        isDefault:
          true,

      });


      // ======================================================================
      // NORMAL PRODUCTS
      // ======================================================================

      const normalOrderItems:
        StoredOrderItem[] =
        cartLines.map(
          (item) => ({

            type:
              "product",

            productId:
              item.productId,

            productName:
              item.product.name,

            imageUrl:
              item.product.image,

            size:
              item.size,

            quantity:
              item.quantity,

            unitPrice:
              item.unitPrice,

            lineTotal:
              item.lineTotal,

          }),
        );


      // ======================================================================
      // CUSTOM PRODUCTS
      // ======================================================================

      const customOrderItems:
        StoredOrderItem[] =
        customCartLines.map(
          (item) => ({

            type:
              "custom",

            productName:
              "Custom Sticker",

            imageUrl:
              item.thumbnailUrl,

            size:
              item.size,

            shape:
              item.shape,

            finish:
              item.finish,

            quantity:
              item.quantity,

            unitPrice:
              item.unitPrice,

            lineTotal:
              item.lineTotal,

          }),
        );


      // ======================================================================
      // COMBINE ITEMS
      // ======================================================================

      const orderItems:
        StoredOrderItem[] = [
          ...normalOrderItems,
          ...customOrderItems,
        ];


      // ======================================================================
      // ORDER ID
      // ======================================================================

      const orderId =
        generateOrderId();


      // ======================================================================
      // CREATE ORDER
      // ======================================================================

      const order:
        StoredOrder = {

        orderId,

        createdAt:
          new Date()
            .toISOString(),

        status:
          "placed" as OrderStatus,

        customer: {

          ...customer,

          address: {

            addressLine1:
              customer.address
                .addressLine1
                .trim(),

            addressLine2:
              customer.address
                .addressLine2
                ?.trim() ||
              undefined,

            landmark:
              customer.address
                .landmark
                ?.trim() ||
              undefined,

            city:
              customer.address
                .city
                .trim(),

            state:
              customer.address
                .state
                .trim(),

            pincode:
              customer.address
                .pincode
                .trim(),

          },

        },

        // ====================================================================
        // PAYMENT
        // ====================================================================

        paymentMethod:
          "UPI",

        items:
          orderItems,

        subtotal:
          cartSubtotal,

        shipping:
          shippingCost,

        total:
          cartTotal,

      };


      // ======================================================================
      // SAVE ORDER
      // ======================================================================

      saveStoredOrder(
        order,
      );


      // ======================================================================
      // CLEAR CART
      // ======================================================================

      clearAllCart();


      // ======================================================================
      // REDIRECT
      // ======================================================================

      window.location.href =
        `/order-success?orderId=${encodeURIComponent(
          orderId,
        )}`;

    } catch (error) {

      console.error(
        "Unable to place StickHive order:",
        error,
      );

      setOrderError(
        "Something went wrong while placing your order. Please try again.",
      );

      setShowPaymentProcessing(
        false,
      );

      setIsPlacingOrder(
        false,
      );
    }
  }


  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <>
      {showPaymentProcessing && (
        <div
          className="
            fixed
            inset-0
            z-[9999]
            flex
            items-center
            justify-center
            bg-black/50
            px-6
            backdrop-blur-md
          "
          role="dialog"
          aria-modal="true"
          aria-label="Processing UPI payment"
        >
          <div
            className="
              w-full
              max-w-sm
              rounded-[2rem]
              bg-white
              p-8
              text-center
              shadow-2xl
              md:p-10
            "
          >
            <div
              className="
                relative
                mx-auto
                flex
                size-24
                items-center
                justify-center
              "
            >
              <span
                className="
                  absolute
                  inset-0
                  animate-ping
                  rounded-full
                  bg-hive-yellow/30
                "
              />

              <span
                className="
                  absolute
                  inset-2
                  animate-spin
                  rounded-full
                  border-4
                  border-black/10
                  border-t-black
                "
              />

              <div
                className="
                  relative
                  flex
                  size-14
                  items-center
                  justify-center
                  rounded-full
                  bg-hive-yellow
                "
              >
                <CreditCard
                  size={25}
                  strokeWidth={2.5}
                />
              </div>
            </div>

            <h2
              className="
                mt-7
                text-2xl
                font-extrabold
              "
            >
              Processing Payment
            </h2>

            <p
              className="
                mx-auto
                mt-3
                max-w-xs
                text-sm
                leading-relaxed
                text-black/50
              "
            >
              Please wait while we confirm
              your UPI payment. Do not
              close this window.
            </p>

            <div
              className="
                mx-auto
                mt-6
                flex
                items-center
                justify-center
                gap-1.5
              "
              aria-hidden="true"
            >
              <span
                className="
                  size-2
                  animate-bounce
                  rounded-full
                  bg-black
                  [animation-delay:-0.3s]
                "
              />
              <span
                className="
                  size-2
                  animate-bounce
                  rounded-full
                  bg-black
                  [animation-delay:-0.15s]
                "
              />
              <span
                className="
                  size-2
                  animate-bounce
                  rounded-full
                  bg-black
                "
              />
            </div>

            <div
              className="
                mt-7
                h-1.5
                overflow-hidden
                rounded-full
                bg-black/10
              "
            >
              <div
                className="
                  h-full
                  w-1/2
                  animate-[payment-progress_1.8s_ease-in-out_forwards]
                  rounded-full
                  bg-hive-yellow
                "
              />
            </div>
          </div>
        </div>
      )}

      <main
      className="
        min-h-screen
        bg-cream
        px-6
        pb-24
        pt-28
        md:pt-32
      "
    >

      <div
        className="
          mx-auto
          max-w-7xl
        "
      >

        {/* ================================================================== */}
        {/* BACK                                                               */}
        {/* ================================================================== */}

        <Link
          href="/shop"
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

          Back to Shop

        </Link>


        {/* ================================================================== */}
        {/* HEADER                                                             */}
        {/* ================================================================== */}

        <div
          className="
            mt-8
            max-w-2xl
          "
        >

          <p
            className="
              text-sm
              font-bold
              uppercase
              tracking-[0.2em]
              text-black/40
            "
          >
            Delivery Details
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
            Checkout
          </h1>


          <p
            className="
              mt-3
              text-base
              text-black/50
              md:text-lg
            "
          >
            Enter your details and
            delivery address.
          </p>

        </div>


        {/* ================================================================== */}
        {/* MAIN GRID                                                          */}
        {/* ================================================================== */}

        <div
          className="
            mt-10
            grid
            gap-6
            lg:grid-cols-[1.05fr_0.95fr]
            lg:items-start
          "
        >

          {/* ================================================================ */}
          {/* CUSTOMER FORM                                                    */}
          {/* ================================================================ */}

          <div>

            <CustomerForm
              customer={
                customer
              }
              setCustomer={
                setCustomer
              }
              errors={
                errors
              }
              emailVerified={
                emailVerified
              }
              onEmailVerified={
                setEmailVerified
              }
            />

          </div>


          {/* ================================================================ */}
          {/* ORDER SUMMARY                                                    */}
          {/* ================================================================ */}

          <aside
            className="
              rounded-[2rem]
              bg-white
              p-7
              shadow-xl
              lg:sticky
              lg:top-28
            "
          >

            {/* ============================================================ */}
            {/* ORDER HEADER                                                  */}
            {/* ============================================================ */}

            <div
              className="
                flex
                items-center
                justify-between
                gap-4
              "
            >

              <div>

                <h2
                  className="
                    text-2xl
                    font-extrabold
                  "
                >
                  Your Order
                </h2>


                <p
                  className="
                    mt-1
                    text-sm
                    text-black/45
                  "
                >
                  {itemCount}{" "}
                  {
                    itemCount === 1
                      ? "item"
                      : "items"
                  }
                </p>

              </div>


              <div
                className="
                  flex
                  size-11
                  items-center
                  justify-center
                  rounded-full
                  bg-cream
                "
              >

                <ShoppingBag
                  size={20}
                />

              </div>

            </div>


            {/* ============================================================ */}
            {/* PRODUCTS                                                       */}
            {/* ============================================================ */}

            <div
              className="
                mt-7
                space-y-4
              "
            >

              {cartLines.map(
                (item) => (

                  <div
                    key={`${item.productId}-${item.size}`}
                    className="
                      flex
                      items-center
                      justify-between
                      gap-4
                    "
                  >

                    <div
                      className="
                        min-w-0
                      "
                    >

                      <p
                        className="
                          truncate
                          font-bold
                        "
                      >
                        {item.product.name}
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

                    </div>


                    <p
                      className="
                        shrink-0
                        font-bold
                      "
                    >
                      ₹{item.lineTotal}
                    </p>

                  </div>

                ),
              )}


              {customCartLines.map(
                (item) => (

                  <div
                    key={item.id}
                    className="
                      flex
                      items-center
                      justify-between
                      gap-4
                    "
                  >

                    <div
                      className="
                        min-w-0
                      "
                    >

                      <p
                        className="
                          truncate
                          font-bold
                        "
                      >
                        Custom Sticker
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

                    </div>


                    <p
                      className="
                        shrink-0
                        font-bold
                      "
                    >
                      ₹{item.lineTotal}
                    </p>

                  </div>

                ),
              )}

            </div>


            {/* ============================================================ */}
            {/* DIVIDER                                                       */}
            {/* ============================================================ */}

            <div
              className="
                my-6
                h-px
                bg-black/10
              "
            />


            {/* ============================================================ */}
            {/* TOTALS                                                        */}
            {/* ============================================================ */}

            <div
              className="
                space-y-4
              "
            >

              <div
                className="
                  flex
                  items-center
                  justify-between
                  text-sm
                "
              >

                <span
                  className="
                    text-black/60
                  "
                >
                  Subtotal
                </span>


                <span
                  className="
                    font-semibold
                  "
                >
                  ₹{cartSubtotal}
                </span>

              </div>


              <div
                className="
                  flex
                  items-center
                  justify-between
                  text-sm
                "
              >

                <span
                  className="
                    text-black/60
                  "
                >
                  Shipping
                </span>


                <span
                  className="
                    font-semibold
                  "
                >
                  {
                    shippingCost === 0
                      ? "FREE"
                      : `₹${shippingCost}`
                  }
                </span>

              </div>


              <div
                className="
                  flex
                  items-center
                  justify-between
                  pt-2
                "
              >

                <span
                  className="
                    text-xl
                    font-extrabold
                  "
                >
                  Total
                </span>


                <span
                  className="
                    text-2xl
                    font-extrabold
                  "
                >
                  ₹{cartTotal}
                </span>

              </div>

            </div>


            {/* ============================================================ */}
            {/* UPI PAYMENT                                                    */}
            {/* ============================================================ */}

            <div
              className="
                mt-7
                rounded-2xl
                border
                border-black/10
                bg-cream
                p-4
              "
            >

              <div
                className="
                  flex
                  items-start
                  gap-3
                "
              >

                <div
                  className="
                    flex
                    size-10
                    shrink-0
                    items-center
                    justify-center
                    rounded-xl
                    bg-white
                  "
                >

                  <CreditCard
                    size={19}
                  />

                </div>


                <div>

                  <p
                    className="
                      font-bold
                    "
                  >
                    UPI Payment
                  </p>


                  <p
                    className="
                      mt-1
                      text-xs
                      leading-relaxed
                      text-black/50
                    "
                  >
                    Pay securely using
                    your preferred UPI
                    app.
                  </p>

                </div>

              </div>

            </div>


            {/* ============================================================ */}
            {/* ERROR                                                         */}
            {/* ============================================================ */}

            {orderError && (

              <div
                role="alert"
                className="
                  mt-5
                  rounded-2xl
                  border
                  border-red-200
                  bg-red-50
                  p-4
                  text-sm
                  font-semibold
                  text-red-600
                "
              >
                {orderError}
              </div>

            )}


            {/* ============================================================ */}
            {/* PAY BUTTON                                                    */}
            {/* ============================================================ */}

            <button
              type="button"
              onClick={
                handlePlaceOrder
              }
              disabled={
                isPlacingOrder ||
                !emailVerified
              }
              aria-busy={
                isPlacingOrder
              }
              className="
                mt-6
                flex
                w-full
                items-center
                justify-center
                gap-2
                rounded-full
                bg-black
                px-6
                py-4
                text-base
                font-bold
                text-white
                shadow-lg
                transition
                hover:scale-[1.01]
                hover:bg-honey-orange
                active:scale-[0.98]
                disabled:cursor-not-allowed
                disabled:opacity-60
                disabled:hover:scale-100
                disabled:hover:bg-black
              "
            >

              {isPlacingOrder ? (

                <>

                  <span
                    aria-hidden="true"
                    className="
                      size-5
                      animate-spin
                      rounded-full
                      border-2
                      border-white/30
                      border-t-white
                    "
                  />

                  <span>
                    Processing Payment...
                  </span>

                </>

              ) : !emailVerified ? (

                <span>
                  Verify Email To Continue
                </span>

              ) : (

                <>

                  <span>
                    Pay with UPI
                  </span>

                  <ArrowRight
                    size={18}
                  />

                </>

              )}

            </button>


            {/* ============================================================ */}
            {/* TRUST INDICATORS                                              */}
            {/* ============================================================ */}

            <div
              className="
                mt-6
                grid
                grid-cols-3
                gap-3
                border-t
                border-black/10
                pt-5
              "
            >

              <TrustItem
                icon={
                  <LockKeyhole
                    size={17}
                  />
                }
                text="Secure"
              />


              <TrustItem
                icon={
                  <Truck
                    size={17}
                  />
                }
                text="Delivery"
              />


              <TrustItem
                icon={
                  <ShieldCheck
                    size={17}
                  />
                }
                text="Protected"
              />

            </div>

          </aside>

        </div>

      </div>

    </main>
    </>
  );
}


// ============================================================================
// TRUST ITEM
// ============================================================================

type TrustItemProps = {
  icon: ReactNode;
  text: string;
};


function TrustItem({
  icon,
  text,
}: TrustItemProps) {

  return (
    <div
      className="
        flex
        flex-col
        items-center
        gap-2
        text-center
      "
    >

      <div
        className="
          flex
          size-9
          items-center
          justify-center
          rounded-full
          bg-cream
          text-black/60
        "
      >

        {icon}

      </div>


      <span
        className="
          text-[11px]
          font-bold
          text-black/50
        "
      >
        {text}
      </span>

    </div>
  );
}