"use client";

import { useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";

import {
  lookupPincode,
  isLikelyValidIndianMobile,
  isLikelyValidEmail,
} from "@/lib/address-validation";


// ============================================================================
// TYPES
// ============================================================================

export type CustomerAddress = {
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
};


export type CustomerData = {
  name: string;
  email: string;
  phone: string;
  address: CustomerAddress;
};


export type CustomerErrors = {
  name?: string;
  email?: string;
  phone?: string;
  address?: {
    addressLine1?: string;
    addressLine2?: string;
    landmark?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
};


// ============================================================================
// PROPS
// ============================================================================

type CustomerFormProps = {
  customer: CustomerData;
  setCustomer: Dispatch<SetStateAction<CustomerData>>;
  errors: CustomerErrors;
  emailVerified: boolean;
  onEmailVerified: (verified: boolean) => void;
};


// ============================================================================
// INDIAN STATES & UNION TERRITORIES
// ============================================================================

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",

  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
];


// ============================================================================
// COMPONENT
// ============================================================================

export default function CustomerForm({
  customer,
  setCustomer,
  errors,
  emailVerified,
  onEmailVerified,
}: CustomerFormProps) {


  // ==========================================================================
  // PIN CODE LOOKUP STATE
  // ==========================================================================

  const [pincodeStatus, setPincodeStatus] = useState<
    "idle" | "checking" | "valid" | "invalid"
  >("idle");

  const [pincodeMessage, setPincodeMessage] = useState("");


  // ==========================================================================
  // EMAIL OTP STATE
  // ==========================================================================

  const [otpStage, setOtpStage] = useState<
    "idle" | "sending" | "sent" | "verifying" | "error"
  >("idle");

  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState("");
  const [verifiedEmail, setVerifiedEmail] = useState("");


  // ==========================================================================
  // UPDATE PERSONAL FIELD
  // ==========================================================================

  function updateCustomerField(
    field: "name" | "email" | "phone",
    value: string,
  ) {
    setCustomer((previous) => ({
      ...previous,
      [field]: value,
    }));

    // If the email changes after being verified, reset verification.
    if (field === "email" && verifiedEmail && value !== verifiedEmail) {
      onEmailVerified(false);
      setOtpStage("idle");
      setOtpCode("");
      setVerifiedEmail("");
    }
  }


  // ==========================================================================
  // UPDATE ADDRESS FIELD
  // ==========================================================================

  function updateAddressField(
    field: keyof CustomerAddress,
    value: string,
  ) {
    setCustomer((previous) => ({
      ...previous,
      address: {
        ...previous.address,
        [field]: value,
      },
    }));
  }


  // ==========================================================================
  // PHONE INPUT
  // ==========================================================================

  function handlePhoneChange(value: string) {
    const digitsOnly = value.replace(/\D/g, "").slice(0, 10);
    updateCustomerField("phone", digitsOnly);
  }


  // ==========================================================================
  // PINCODE INPUT — live lookup + auto-fill city/state
  // ==========================================================================

  async function handlePincodeChange(value: string) {
    const digitsOnly = value.replace(/\D/g, "").slice(0, 6);
    updateAddressField("pincode", digitsOnly);

    if (digitsOnly.length !== 6) {
      setPincodeStatus("idle");
      setPincodeMessage("");
      return;
    }

    setPincodeStatus("checking");

    const result = await lookupPincode(digitsOnly);

    if (result.valid) {
      setPincodeStatus("valid");
      setPincodeMessage(`${result.city}, ${result.state}`);

      setCustomer((previous) => ({
        ...previous,
        address: {
          ...previous.address,
          city: result.city ?? previous.address.city,
          state: result.state ?? previous.address.state,
        },
      }));
    } else {
      setPincodeStatus("invalid");
      setPincodeMessage(result.error ?? "Invalid PIN code.");
    }
  }


  // ==========================================================================
  // SEND EMAIL OTP
  // ==========================================================================

  async function handleSendOtp() {
    if (!isLikelyValidEmail(customer.email)) {
      setOtpError("Please enter a valid email address first.");
      setOtpStage("error");
      return;
    }

    setOtpStage("sending");
    setOtpError("");

    try {
      const response = await fetch("/api/send-email-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: customer.email }),
      });

      const data = await response.json();

      if (!data.success) {
        setOtpError(data.error ?? "Unable to send verification code.");
        setOtpStage("error");
        return;
      }

      setOtpStage("sent");
    } catch (error) {
      console.error("Failed to send OTP:", error);
      setOtpError("Something went wrong. Please try again.");
      setOtpStage("error");
    }
  }


  // ==========================================================================
  // VERIFY EMAIL OTP
  // ==========================================================================

  async function handleVerifyOtp() {
    if (otpCode.length !== 6) {
      setOtpError("Enter the 6-digit code sent to your email.");
      return;
    }

    setOtpStage("verifying");
    setOtpError("");

    try {
      const response = await fetch("/api/verify-email-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: customer.email, code: otpCode }),
      });

      const data = await response.json();

      if (!data.success) {
        setOtpError(data.error ?? "Incorrect code.");
        setOtpStage("sent");
        return;
      }

      setVerifiedEmail(customer.email);
      onEmailVerified(true);
      setOtpStage("idle");
    } catch (error) {
      console.error("Failed to verify OTP:", error);
      setOtpError("Something went wrong. Please try again.");
      setOtpStage("sent");
    }
  }


  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <section
      className="
        rounded-[2rem]
        bg-white
        p-7
        shadow-xl
        md:p-8
      "
    >

      {/* ================================================================== */}
      {/* HEADER                                                             */}
      {/* ================================================================== */}

      <div>

        <p
          className="
            text-xs
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
            mt-3
            text-3xl
            font-extrabold
            tracking-tight
            md:text-4xl
          "
        >
          Checkout
        </h1>


        <p
          className="
            mt-2
            text-black/50
          "
        >
          Enter your details and delivery address.
        </p>

      </div>


      {/* ================================================================== */}
      {/* PERSONAL DETAILS                                                   */}
      {/* ================================================================== */}

      <div
        className="
          mt-8
          space-y-5
        "
      >

        {/* ================================================================ */}
        {/* FULL NAME                                                        */}
        {/* ================================================================ */}

        <div>

          <label
            htmlFor="checkout-name"
            className="
              mb-2
              block
              text-sm
              font-bold
            "
          >
            Full Name
            <span className="ml-1 text-red-500">
              *
            </span>
          </label>


          <input
            id="checkout-name"
            type="text"
            value={customer.name}
            onChange={(event) =>
              updateCustomerField(
                "name",
                event.target.value,
              )
            }
            placeholder="Enter your full name"
            autoComplete="name"
            className={`
              h-14
              w-full
              rounded-xl
              border
              px-5
              text-base
              outline-none
              transition
              placeholder:text-black/40

              ${
                errors.name
                  ? "border-red-500 focus:border-red-500"
                  : "border-black/15 focus:border-black"
              }
            `}
          />


          {errors.name && (
            <p
              className="
                mt-2
                px-1
                text-sm
                font-medium
                text-red-500
              "
            >
              {errors.name}
            </p>
          )}

        </div>


        {/* ================================================================ */}
        {/* EMAIL — with OTP verification                                    */}
        {/* ================================================================ */}

        <div>

          <label
            htmlFor="checkout-email"
            className="
              mb-2
              block
              text-sm
              font-bold
            "
          >
            Email Address
            <span className="ml-1 text-red-500">
              *
            </span>
          </label>


          <div className="flex gap-2">

            <input
              id="checkout-email"
              type="email"
              value={customer.email}
              onChange={(event) =>
                updateCustomerField(
                  "email",
                  event.target.value,
                )
              }
              disabled={emailVerified}
              placeholder="you@example.com"
              autoComplete="email"
              className={`
                h-14
                w-full
                rounded-xl
                border
                px-5
                text-base
                outline-none
                transition
                placeholder:text-black/40
                disabled:bg-black/[0.03]
                disabled:text-black/60

                ${
                  errors.email
                    ? "border-red-500 focus:border-red-500"
                    : "border-black/15 focus:border-black"
                }
              `}
            />


            {emailVerified ? (

              <div
                className="
                  flex
                  h-14
                  shrink-0
                  items-center
                  gap-1.5
                  rounded-xl
                  bg-green-50
                  px-4
                  text-sm
                  font-bold
                  text-green-600
                "
              >
                <CheckCircle2 size={17} />
                Verified
              </div>

            ) : (

              <button
                type="button"
                onClick={handleSendOtp}
                disabled={
                  otpStage === "sending" ||
                  otpStage === "sent" ||
                  otpStage === "verifying"
                }
                className="
                  flex
                  h-14
                  shrink-0
                  items-center
                  gap-2
                  rounded-xl
                  bg-black
                  px-5
                  text-sm
                  font-bold
                  text-white
                  transition
                  hover:scale-[1.02]
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                  disabled:hover:scale-100
                "
              >

                {otpStage === "sending" && (
                  <Loader2 size={15} className="animate-spin" />
                )}

                {otpStage === "sending"
                  ? "Sending..."
                  : otpStage === "sent"
                    ? "Code Sent"
                    : "Verify"}

              </button>

            )}

          </div>


          {errors.email && (
            <p
              className="
                mt-2
                px-1
                text-sm
                font-medium
                text-red-500
              "
            >
              {errors.email}
            </p>
          )}


          {/* ================================================================ */}
          {/* OTP CODE INPUT                                                    */}
          {/* ================================================================ */}

          {(otpStage === "sent" || otpStage === "verifying") && !emailVerified && (

            <div
              className="
                mt-3
                flex
                items-center
                gap-2
                rounded-xl
                bg-cream
                p-3
              "
            >

              <input
                type="text"
                inputMode="numeric"
                value={otpCode}
                onChange={(event) =>
                  setOtpCode(
                    event.target.value.replace(/\D/g, "").slice(0, 6),
                  )
                }
                placeholder="6-digit code"
                maxLength={6}
                className="
                  h-11
                  min-w-0
                  flex-1
                  rounded-lg
                  border
                  border-black/15
                  bg-white
                  px-4
                  text-base
                  tracking-[0.3em]
                  outline-none
                  focus:border-black
                "
              />


              <button
                type="button"
                onClick={handleVerifyOtp}
                disabled={otpStage === "verifying" || otpCode.length !== 6}
                className="
                  flex
                  h-11
                  shrink-0
                  items-center
                  gap-1.5
                  rounded-lg
                  bg-black
                  px-4
                  text-sm
                  font-bold
                  text-white
                  transition
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >

                {otpStage === "verifying" && (
                  <Loader2 size={14} className="animate-spin" />
                )}

                Confirm

              </button>


              <button
                type="button"
                onClick={handleSendOtp}
                disabled={otpStage === "verifying"}
                className="
                  shrink-0
                  text-xs
                  font-bold
                  text-black/50
                  underline
                  underline-offset-2
                  hover:text-black
                "
              >
                Resend
              </button>

            </div>

          )}


          {otpError && (
            <p
              className="
                mt-2
                px-1
                text-sm
                font-medium
                text-red-500
              "
            >
              {otpError}
            </p>
          )}

        </div>


        {/* ================================================================ */}
        {/* PHONE                                                            */}
        {/* ================================================================ */}

        <div>

          <label
            htmlFor="checkout-phone"
            className="
              mb-2
              block
              text-sm
              font-bold
            "
          >
            Phone Number
            <span className="ml-1 text-red-500">
              *
            </span>
          </label>


          <div
            className={`
              flex
              h-14
              w-full
              overflow-hidden
              rounded-xl
              border
              transition

              ${
                errors.phone
                  ? "border-red-500"
                  : "border-black/15 focus-within:border-black"
              }
            `}
          >

            <div
              className="
                flex
                w-[70px]
                shrink-0
                items-center
                justify-center
                border-r
                border-black/10
                bg-black/[0.02]
                text-sm
                font-bold
              "
            >
              +91
            </div>


            <input
              id="checkout-phone"
              type="tel"
              inputMode="numeric"
              value={customer.phone}
              onChange={(event) =>
                handlePhoneChange(
                  event.target.value,
                )
              }
              placeholder="10-digit mobile number"
              autoComplete="tel"
              maxLength={10}
              className="
                min-w-0
                flex-1
                bg-transparent
                px-5
                text-base
                outline-none
                placeholder:text-black/40
              "
            />

          </div>


          {errors.phone && (
            <p
              className="
                mt-2
                px-1
                text-sm
                font-medium
                text-red-500
              "
            >
              {errors.phone}
            </p>
          )}

        </div>

      </div>


      {/* ================================================================== */}
      {/* DIVIDER                                                            */}
      {/* ================================================================== */}

      <div
        className="
          my-7
          h-px
          bg-black/10
        "
      />


      {/* ================================================================== */}
      {/* DELIVERY ADDRESS                                                   */}
      {/* ================================================================== */}

      <div>

        <h2
          className="
            text-2xl
            font-extrabold
            tracking-tight
          "
        >
          Delivery Address
        </h2>


        <p
          className="
            mt-2
            text-black/50
          "
        >
          Enter the address where you want your
          stickers delivered.
        </p>


        {/* ================================================================ */}
        {/* ADDRESS LINE 1                                                   */}
        {/* ================================================================ */}

        <div className="mt-6">

          <label
            htmlFor="checkout-address-line-1"
            className="
              mb-2
              block
              text-sm
              font-bold
            "
          >
            Address Line 1
            <span className="ml-1 text-red-500">
              *
            </span>
          </label>


          <input
            id="checkout-address-line-1"
            type="text"
            value={
              customer.address.addressLine1
            }
            onChange={(event) =>
              updateAddressField(
                "addressLine1",
                event.target.value,
              )
            }
            placeholder="House / Flat / Building / Street"
            autoComplete="address-line1"
            className={`
              h-14
              w-full
              rounded-xl
              border
              px-5
              text-base
              outline-none
              transition
              placeholder:text-black/40

              ${
                errors.address?.addressLine1
                  ? "border-red-500 focus:border-red-500"
                  : "border-black/15 focus:border-black"
              }
            `}
          />


          {errors.address?.addressLine1 && (
            <p
              className="
                mt-2
                px-1
                text-sm
                font-medium
                text-red-500
              "
            >
              {errors.address.addressLine1}
            </p>
          )}

        </div>


        {/* ================================================================ */}
        {/* ADDRESS LINE 2                                                   */}
        {/* ================================================================ */}

        <div className="mt-5">

          <label
            htmlFor="checkout-address-line-2"
            className="
              mb-2
              block
              text-sm
              font-bold
            "
          >
            Address Line 2
            <span
              className="
                ml-2
                text-xs
                font-medium
                text-black/40
              "
            >
              Optional
            </span>
          </label>


          <input
            id="checkout-address-line-2"
            type="text"
            value={
              customer.address.addressLine2 ?? ""
            }
            onChange={(event) =>
              updateAddressField(
                "addressLine2",
                event.target.value,
              )
            }
            placeholder="Apartment / Area / Locality"
            autoComplete="address-line2"
            className="
              h-14
              w-full
              rounded-xl
              border
              border-black/15
              px-5
              text-base
              outline-none
              transition
              placeholder:text-black/40
              focus:border-black
            "
          />

        </div>


        {/* ================================================================ */}
        {/* LANDMARK                                                         */}
        {/* ================================================================ */}

        <div className="mt-5">

          <label
            htmlFor="checkout-landmark"
            className="
              mb-2
              block
              text-sm
              font-bold
            "
          >
            Landmark
            <span
              className="
                ml-2
                text-xs
                font-medium
                text-black/40
              "
            >
              Optional
            </span>
          </label>


          <input
            id="checkout-landmark"
            type="text"
            value={
              customer.address.landmark ?? ""
            }
            onChange={(event) =>
              updateAddressField(
                "landmark",
                event.target.value,
              )
            }
            placeholder="Nearby landmark"
            autoComplete="off"
            className="
              h-14
              w-full
              rounded-xl
              border
              border-black/15
              px-5
              text-base
              outline-none
              transition
              placeholder:text-black/40
              focus:border-black
            "
          />

        </div>


        {/* ================================================================ */}
        {/* PIN CODE — moved above city/state since it now drives them       */}
        {/* ================================================================ */}

        <div className="mt-5">

          <label
            htmlFor="checkout-pincode"
            className="
              mb-2
              block
              text-sm
              font-bold
            "
          >
            PIN Code
            <span className="ml-1 text-red-500">
              *
            </span>
          </label>


          <div className="relative">

            <input
              id="checkout-pincode"
              type="text"
              inputMode="numeric"
              value={
                customer.address.pincode
              }
              onChange={(event) =>
                handlePincodeChange(
                  event.target.value,
                )
              }
              placeholder="6-digit PIN code"
              autoComplete="postal-code"
              maxLength={6}
              className={`
                h-14
                w-full
                rounded-xl
                border
                px-5
                pr-11
                text-base
                outline-none
                transition
                placeholder:text-black/40

                ${
                  pincodeStatus === "invalid" || errors.address?.pincode
                    ? "border-red-500 focus:border-red-500"
                    : pincodeStatus === "valid"
                      ? "border-green-500 focus:border-green-500"
                      : "border-black/15 focus:border-black"
                }
              `}
            />


            {pincodeStatus === "checking" && (
              <Loader2
                size={18}
                className="
                  absolute
                  right-4
                  top-1/2
                  -translate-y-1/2
                  animate-spin
                  text-black/30
                "
              />
            )}


            {pincodeStatus === "valid" && (
              <CheckCircle2
                size={18}
                className="
                  absolute
                  right-4
                  top-1/2
                  -translate-y-1/2
                  text-green-600
                "
              />
            )}

          </div>


          {pincodeStatus === "valid" && (
            <p
              className="
                mt-2
                px-1
                text-sm
                font-medium
                text-green-600
              "
            >
              ✓ {pincodeMessage}
            </p>
          )}


          {pincodeStatus === "invalid" && (
            <p
              className="
                mt-2
                px-1
                text-sm
                font-medium
                text-red-500
              "
            >
              {pincodeMessage}
            </p>
          )}


          {errors.address?.pincode && pincodeStatus === "idle" && (
            <p
              className="
                mt-2
                px-1
                text-sm
                font-medium
                text-red-500
              "
            >
              {errors.address.pincode}
            </p>
          )}

        </div>


        {/* ================================================================ */}
        {/* CITY + STATE — auto-filled from PIN, editable as fallback        */}
        {/* ================================================================ */}

        <div
          className="
            mt-5
            grid
            gap-5
            md:grid-cols-2
          "
        >

          {/* ============================================================ */}
          {/* CITY                                                          */}
          {/* ============================================================ */}

          <div>

            <label
              htmlFor="checkout-city"
              className="
                mb-2
                block
                text-sm
                font-bold
              "
            >
              City
              <span className="ml-1 text-red-500">
                *
              </span>
            </label>


            <input
              id="checkout-city"
              type="text"
              value={
                customer.address.city
              }
              onChange={(event) =>
                updateAddressField(
                  "city",
                  event.target.value,
                )
              }
              placeholder="Enter your city"
              autoComplete="address-level2"
              className={`
                h-14
                w-full
                rounded-xl
                border
                px-5
                text-base
                outline-none
                transition
                placeholder:text-black/40

                ${
                  errors.address?.city
                    ? "border-red-500 focus:border-red-500"
                    : "border-black/15 focus:border-black"
                }
              `}
            />


            {errors.address?.city && (
              <p
                className="
                  mt-2
                  px-1
                  text-sm
                  font-medium
                  text-red-500
                "
              >
                {errors.address.city}
              </p>
            )}

          </div>


          {/* ============================================================ */}
          {/* STATE                                                         */}
          {/* ============================================================ */}

          <div>

            <label
              htmlFor="checkout-state"
              className="
                mb-2
                block
                text-sm
                font-bold
              "
            >
              State
              <span className="ml-1 text-red-500">
                *
              </span>
            </label>


            <select
              id="checkout-state"
              value={
                customer.address.state
              }
              onChange={(event) =>
                updateAddressField(
                  "state",
                  event.target.value,
                )
              }
              autoComplete="address-level1"
              className={`
                h-14
                w-full
                rounded-xl
                border
                bg-white
                px-5
                text-base
                outline-none
                transition

                ${
                  customer.address.state
                    ? "text-black"
                    : "text-black/40"
                }

                ${
                  errors.address?.state
                    ? "border-red-500 focus:border-red-500"
                    : "border-black/15 focus:border-black"
                }
              `}
            >

              <option
                value=""
                disabled
              >
                Select your state
              </option>


              {INDIAN_STATES.map(
                (state) => (
                  <option
                    key={state}
                    value={state}
                  >
                    {state}
                  </option>
                ),
              )}

            </select>


            {errors.address?.state && (
              <p
                className="
                  mt-2
                  px-1
                  text-sm
                  font-medium
                  text-red-500
                "
              >
                {errors.address.state}
              </p>
            )}

          </div>

        </div>

      </div>

    </section>
  );
}


// ============================================================================
// CUSTOMER VALIDATION
// ============================================================================

export function validateCustomer(
  customer: CustomerData,
): CustomerErrors {

  const errors: CustomerErrors = {};

  const name =
    customer.name.trim();

  const email =
    customer.email.trim();

  const phone =
    customer.phone.trim();

  const address =
    customer.address;


  // ==========================================================================
  // NAME
  // ==========================================================================

  if (!name) {

    errors.name =
      "Full name is required.";

  } else if (
    name.length < 2
  ) {

    errors.name =
      "Please enter your full name.";

  } else if (
    name.length > 60
  ) {

    errors.name =
      "Name must be 60 characters or less.";

  } else if (
    !/^[A-Za-zÀ-ÿ]+(?:[ '-][A-Za-zÀ-ÿ]+)*$/.test(
      name,
    )
  ) {

    errors.name =
      "Please enter a valid name.";

  }


  // ==========================================================================
  // EMAIL
  // ==========================================================================

  if (!email) {

    errors.email =
      "Email address is required.";

  } else if (!isLikelyValidEmail(email)) {

    errors.email =
      "Please enter a valid email address.";

  }


  // ==========================================================================
  // PHONE
  // ==========================================================================

  if (!phone) {

    errors.phone =
      "Phone number is required.";

  } else if (!isLikelyValidIndianMobile(phone)) {

    errors.phone =
      "Enter a valid 10-digit Indian mobile number.";

  }


  // ==========================================================================
  // ADDRESS
  // ==========================================================================

  const addressErrors:
    NonNullable<CustomerErrors["address"]> =
    {};


  if (
    !address.addressLine1.trim()
  ) {

    addressErrors.addressLine1 =
      "Address Line 1 is required.";

  } else if (
    address.addressLine1.trim().length < 5
  ) {

    addressErrors.addressLine1 =
      "Please enter a complete address.";

  } else if (
    address.addressLine1.trim().length > 150
  ) {

    addressErrors.addressLine1 =
      "Address Line 1 is too long.";

  }


  if (
    address.addressLine2 &&
    address.addressLine2.trim().length > 150
  ) {

    addressErrors.addressLine2 =
      "Address Line 2 is too long.";

  }


  if (
    address.landmark &&
    address.landmark.trim().length > 100
  ) {

    addressErrors.landmark =
      "Landmark is too long.";

  }


  if (
    !address.city.trim()
  ) {

    addressErrors.city =
      "City is required.";

  } else if (
    address.city.trim().length < 2
  ) {

    addressErrors.city =
      "Please enter a valid city.";

  }


  if (
    !address.state.trim()
  ) {

    addressErrors.state =
      "Please select your state.";

  } else if (
    !INDIAN_STATES.includes(
      address.state,
    )
  ) {

    addressErrors.state =
      "Please select a valid state.";

  }


  if (
    !address.pincode.trim()
  ) {

    addressErrors.pincode =
      "PIN code is required.";

  } else if (
    !/^[1-9]\d{5}$/.test(
      address.pincode.trim(),
    )
  ) {

    addressErrors.pincode =
      "Enter a valid 6-digit PIN code.";

  }


  if (
    Object.keys(addressErrors).length > 0
  ) {

    errors.address =
      addressErrors;

  }


  return errors;
}