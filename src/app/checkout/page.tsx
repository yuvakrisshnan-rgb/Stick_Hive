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
  Loader2,
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

import { useAuth } from "@/components/auth/auth-provider";

import { useShop } from "@/components/shop/store-provider";

import {
  saveAddress,
} from "@/lib/address-storage";



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
// PAGE
// ============================================================================

export default function CheckoutPage() {

  // ==========================================================================
  // AUTH
  // ==========================================================================
  // Checkout no longer runs its own email-OTP step - that step IS the
  // account sign-in OTP (same backend functions, see backend/auth/service.ts),
  // so a shopper who already signed in via the navbar is already verified.
  // Checkout just trusts the session instead of re-running it.

  const {
    user,
    loading: authLoading,
  } = useAuth();


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


  // The checkout email is always the signed-in account's own verified
  // address - it's never re-entered or re-verified here, and never stored
  // as separate mutable state that would need syncing. Derived at render
  // time instead of via an effect.
  const customerEmail = user?.email ?? "";


  // ==========================================================================
  // PAYMENT METHOD
  // ==========================================================================
  // Direct UPI (QR code + deep link, paid straight to the store's own VPA)
  // is the only checkout path - no payment gateway in between. There's no
  // enablement flag for this the way Razorpay has isRazorpayConfigured():
  // it's unconditionally offered, and the only failure mode is the backend
  // not having STICKHIVE_UPI_ID set, which surfaces as an order-creation
  // error rather than something checked up front here.

  const paymentMethod = "upi" as const;


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


  // ==========================================================================
  // FEE / TOTALS
  // ==========================================================================
  // Direct UPI carries no platform fee - that's a Razorpay-only charge.

  const grandTotal = cartTotal;


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
  // AUTH LOADING
  // ==========================================================================
  // Every hook above this point must run unconditionally on every render,
  // so this - and every other early return - comes after all of them.

  if (authLoading) {

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

        <Loader2
          size={30}
          className="animate-spin text-black/40"
        />

      </main>
    );
  }


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
  // SIGN IN REQUIRED
  // ==========================================================================
  // The old "Verify Email To Continue" OTP step inside this form WAS the
  // sign-in OTP under a different URL - see backend/auth/service.ts. Now
  // that it's gone from here, a shopper has to actually be signed in
  // (via the same navbar OTP flow) before they can reach the checkout
  // form at all, since there's otherwise no account for the order to
  // attach to.

  if (!user) {

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

              <LockKeyhole
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
              Sign in to checkout
            </h1>


            <p
              className="
                mx-auto
                mt-3
                max-w-md
                text-black/50
              "
            >
              Your Stick Hive order is tied to your account,
              so we need you signed in before you can pay.
              It&apos;s just the same one-time email code.
            </p>


            <button
              type="button"
              onClick={() => {
                (
                  window as Window & {
                    __stickHiveOpenAuth?: () => void;
                  }
                ).__stickHiveOpenAuth?.();
              }}
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

              Sign In to Continue

              <ArrowRight
                size={18}
              />

            </button>

          </section>

        </div>

      </main>
    );
  }


  // ============================================================================
  // PLACE ORDER
  // ============================================================================

  async function handlePlaceOrder() {
    setOrderError("");

    const validationErrors = validateCustomer({ ...customer, email: customerEmail });
    setErrors(validationErrors);

    if (validationErrors.name || validationErrors.email || validationErrors.phone || validationErrors.address) {
      return;
    }

    setIsPlacingOrder(true);

    try {
      const items = [
        ...cartLines.map((item) => ({
          type: "product" as const,
          productId: item.productId,
          size: item.size,
          quantity: item.quantity,
        })),
        ...customCartLines.map((item) => {
          if (!item.artworkObjectKey || !item.artworkContentType) {
            throw new Error("Custom sticker artwork is missing. Please open the design and add it to cart again.");
          }
          return {
            type: "custom" as const,
            cartLineId: item.id,
            size: item.size,
            shape: item.shape,
            finish: item.finish,
            quantity: item.quantity,
            artworkObjectKey: item.artworkObjectKey,
            artworkContentType: item.artworkContentType,
          };
        }),
      ];

      const orderResponse = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentMethod,
          customer: {
            name: customer.name.trim(),
            email: customerEmail.trim().toLowerCase(),
            phone: customer.phone.replace(/\D/g, ""),
            address: {
              addressLine1: customer.address.addressLine1.trim(),
              addressLine2: customer.address.addressLine2?.trim() || undefined,
              landmark: customer.address.landmark?.trim() || undefined,
              city: customer.address.city.trim(),
              state: customer.address.state.trim(),
              pincode: customer.address.pincode.replace(/\D/g, ""),
            },
          },
          items,
        }),
      });

      const orderData = (await orderResponse.json()) as any;
      if (!orderResponse.ok || !orderData.success) {
        throw new Error(orderData.error ?? "Unable to place your order.");
      }

      saveAddress({
        addressLine1: customer.address.addressLine1.trim(),
        addressLine2: customer.address.addressLine2?.trim() || undefined,
        landmark: customer.address.landmark?.trim() || undefined,
        city: customer.address.city.trim(),
        state: customer.address.state.trim(),
        pincode: customer.address.pincode.trim(),
        isDefault: true,
      });

      const order = orderData.order;
      localStorage.setItem("stickhive:last-order", JSON.stringify(order));

      clearAllCart();
      window.location.href = `/order-success?orderId=${encodeURIComponent(order.orderId)}&payment=${paymentMethod}`;
    } catch (error) {
      console.error("Unable to place Stick Hive order:", error);
      setOrderError(error instanceof Error ? error.message : "Something went wrong while placing your order.");
      setIsPlacingOrder(false);
    }
  }

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <>

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
                { ...customer, email: customerEmail }
              }
              setCustomer={
                setCustomer
              }
              errors={
                errors
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
                  ₹{grandTotal.toFixed(2)}
                </span>

              </div>

            </div>


            {/* ============================================================ */}
            {/* PAYMENT METHOD                                                */}
            {/* ============================================================ */}

            <div className="mt-7 space-y-3">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-black/40">
                Payment Method
              </p>

              <div className="w-full rounded-2xl border border-black bg-black p-4 text-left text-white">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-black">
                    ₹
                  </div>
                  <div>
                    <p className="font-bold">UPI</p>
                    <p className="mt-1 text-xs leading-relaxed opacity-70">
                      You&apos;ll get a QR code and UPI link next. Google Pay confirms automatically; other UPI apps are confirmed once we reconcile our bank statement.
                    </p>
                  </div>
                </div>
              </div>
            </div>

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
                isPlacingOrder
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
                    Creating Order...
                  </span>

                </>

              ) : (

                <>

                  <span>
                    Continue to Payment
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