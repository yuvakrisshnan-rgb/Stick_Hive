"use client";

import {
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import {
  ArrowLeft,
  Check,
  MapPin,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";

import type { Address } from "@/types/address";

import {
  deleteAddress,
  getAddresses,
  saveAddress,
  setDefaultAddress,
  updateAddress,
} from "@/lib/address-storage";

// ============================================================================
// FORM TYPE
// ============================================================================

type AddressFormData = {
  addressLine1: string;
  addressLine2: string;
  landmark: string;
  city: string;
  state: string;
  pincode: string;
};

// ============================================================================
// EMPTY FORM
// ============================================================================

const EMPTY_FORM: AddressFormData = {
  addressLine1: "",
  addressLine2: "",
  landmark: "",
  city: "",
  state: "",
  pincode: "",
};

// ============================================================================
// PAGE
// ============================================================================

export default function MyAddressPage() {
  // ==========================================================================
  // STATE
  // ==========================================================================

  const [addresses, setAddresses] =
    useState<Address[]>([]);

  const [isLoaded, setIsLoaded] =
    useState(false);

  const [isFormOpen, setIsFormOpen] =
    useState(false);

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [form, setForm] =
    useState<AddressFormData>(
      EMPTY_FORM,
    );

  const [errors, setErrors] =
    useState<
      Partial<
        Record<
          keyof AddressFormData,
          string
        >
      >
    >({});

  // ==========================================================================
  // LOAD ADDRESSES
  // ==========================================================================

  useEffect(() => {
    setAddresses(
      getAddresses(),
    );

    setIsLoaded(true);
  }, []);

  // ==========================================================================
  // UPDATE FORM
  // ==========================================================================

  function updateField(
    field: keyof AddressFormData,
    value: string,
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    setErrors((previous) => ({
      ...previous,
      [field]: undefined,
    }));
  }

  // ==========================================================================
  // VALIDATE FORM
  // ==========================================================================

  function validateForm(): boolean {
    const newErrors: Partial<
      Record<
        keyof AddressFormData,
        string
      >
    > = {};

    // ------------------------------------------------------------------------
    // Address Line 1
    // ------------------------------------------------------------------------

    if (
      !form.addressLine1.trim()
    ) {
      newErrors.addressLine1 =
        "Please enter your address.";
    } else if (
      form.addressLine1.trim()
        .length < 5
    ) {
      newErrors.addressLine1 =
        "Please enter a complete address.";
    }

    // ------------------------------------------------------------------------
    // City
    // ------------------------------------------------------------------------

    if (!form.city.trim()) {
      newErrors.city =
        "Please enter your city.";
    } else if (
      !/^[A-Za-z\s.-]+$/.test(
        form.city.trim(),
      )
    ) {
      newErrors.city =
        "Please enter a valid city.";
    }

    // ------------------------------------------------------------------------
    // State
    // ------------------------------------------------------------------------

    if (!form.state.trim()) {
      newErrors.state =
        "Please enter your state.";
    } else if (
      !/^[A-Za-z\s.-]+$/.test(
        form.state.trim(),
      )
    ) {
      newErrors.state =
        "Please enter a valid state.";
    }

    // ------------------------------------------------------------------------
    // PIN Code
    // ------------------------------------------------------------------------

    if (!form.pincode.trim()) {
      newErrors.pincode =
        "Please enter your PIN code.";
    } else if (
      !/^[1-9][0-9]{5}$/.test(
        form.pincode.trim(),
      )
    ) {
      newErrors.pincode =
        "Please enter a valid 6-digit PIN code.";
    }

    setErrors(newErrors);

    return (
      Object.keys(newErrors).length === 0
    );
  }

  // ==========================================================================
  // OPEN ADD FORM
  // ==========================================================================

  function openAddForm() {
    setEditingId(null);

    setForm({
      ...EMPTY_FORM,
    });

    setErrors({});

    setIsFormOpen(true);
  }

  // ==========================================================================
  // OPEN EDIT FORM
  // ==========================================================================

  function openEditForm(
    address: Address,
  ) {
    setEditingId(
      address.id,
    );

    setForm({
      addressLine1:
        address.addressLine1,

      addressLine2:
        address.addressLine2 ?? "",

      landmark:
        address.landmark ?? "",

      city:
        address.city,

      state:
        address.state,

      pincode:
        address.pincode,
    });

    setErrors({});

    setIsFormOpen(true);
  }

  // ==========================================================================
  // CLOSE FORM
  // ==========================================================================

  function closeForm() {
    setIsFormOpen(false);

    setEditingId(null);

    setForm({
      ...EMPTY_FORM,
    });

    setErrors({});
  }

  // ==========================================================================
  // SAVE FORM
  // ==========================================================================

  function handleSaveAddress() {
    if (!validateForm()) {
      return;
    }

    const addressData = {
      addressLine1:
        form.addressLine1.trim(),

      addressLine2:
        form.addressLine2.trim() ||
        undefined,

      landmark:
        form.landmark.trim() ||
        undefined,

      city:
        form.city.trim(),

      state:
        form.state.trim(),

      pincode:
        form.pincode.trim(),

      isDefault:
        addresses.length === 0,
    };

    // ------------------------------------------------------------------------
    // UPDATE EXISTING ADDRESS
    // ------------------------------------------------------------------------

    if (editingId) {
      updateAddress(
        editingId,
        addressData,
      );
    }

    // ------------------------------------------------------------------------
    // CREATE NEW ADDRESS
    // ------------------------------------------------------------------------

    else {
      saveAddress(
        addressData,
      );
    }

    // ------------------------------------------------------------------------
    // Refresh state from storage
    // ------------------------------------------------------------------------

    setAddresses(
      getAddresses(),
    );

    closeForm();
  }

  // ==========================================================================
  // DELETE
  // ==========================================================================

  function handleDeleteAddress(
    id: string,
  ) {
    const address =
      addresses.find(
        (item) =>
          item.id === id,
      );

    if (!address) {
      return;
    }

    const confirmed =
      window.confirm(
        "Are you sure you want to delete this address?",
      );

    if (!confirmed) {
      return;
    }

    deleteAddress(id);

    setAddresses(
      getAddresses(),
    );
  }

  // ==========================================================================
  // SET DEFAULT
  // ==========================================================================

  function handleSetDefault(
    id: string,
  ) {
    setDefaultAddress(id);

    setAddresses(
      getAddresses(),
    );
  }

  // ==========================================================================
  // INPUT CLASS
  // ==========================================================================

  function inputClass(
    field:
      keyof AddressFormData,
  ) {
    return `
      h-12
      w-full
      rounded-xl
      border
      bg-white
      px-4
      text-sm
      outline-none
      transition

      ${
        errors[field]
          ? "border-red-500 focus:border-red-500"
          : "border-black/15 focus:border-black"
      }
    `;
  }

  // ==========================================================================
  // ERROR MESSAGE
  // ==========================================================================

  function ErrorMessage({
    field,
  }: {
    field: keyof AddressFormData;
  }) {
    if (!errors[field]) {
      return null;
    }

    return (
      <p
        className="
          mt-1.5
          px-1
          text-xs
          font-semibold
          text-red-500
        "
      >
        {errors[field]}
      </p>
    );
  }

  // ==========================================================================
  // LOADING
  // ==========================================================================

  if (!isLoaded) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-cream px-6 py-32">
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
          max-w-4xl
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
          <ArrowLeft size={16} />

          Back to Home
        </Link>

        {/* ================================================================== */}
        {/* HEADER                                                             */}
        {/* ================================================================== */}

        <div
          className="
            mt-8
            flex
            flex-col
            gap-5
            sm:flex-row
            sm:items-end
            sm:justify-between
          "
        >
          <div>
            <p
              className="
                text-xs
                font-bold
                uppercase
                tracking-[0.16em]
                text-black/40
              "
            >
              Account
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
              My Addresses
            </h1>

            <p
              className="
                mt-3
                max-w-xl
                text-sm
                leading-relaxed
                text-black/50
              "
            >
              Save your delivery addresses for
              faster checkout next time.
            </p>
          </div>

          {/* ADD ADDRESS */}

          <button
            type="button"
            onClick={openAddForm}
            className="
              inline-flex
              items-center
              justify-center
              gap-2
              rounded-full
              bg-black
              px-6
              py-3
              text-sm
              font-bold
              text-white
              transition
              hover:scale-[1.02]
              active:scale-[0.98]
            "
          >
            <Plus size={18} />

            Add Address
          </button>
        </div>

        {/* ================================================================== */}
        {/* ADDRESS FORM                                                       */}
        {/* ================================================================== */}

        {isFormOpen && (
          <section
            className="
              mt-8
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
                items-start
                justify-between
                gap-4
              "
            >
              <div>
                <p
                  className="
                    text-xs
                    font-bold
                    uppercase
                    tracking-[0.16em]
                    text-black/40
                  "
                >
                  {editingId
                    ? "Edit Address"
                    : "New Address"}
                </p>

                <h2
                  className="
                    mt-2
                    text-2xl
                    font-extrabold
                  "
                >
                  Delivery Address
                </h2>
              </div>

              <button
                type="button"
                onClick={closeForm}
                aria-label="Close address form"
                className="
                  flex
                  size-10
                  items-center
                  justify-center
                  rounded-full
                  bg-black/5
                  transition
                  hover:bg-black/10
                "
              >
                <X size={18} />
              </button>
            </div>

            <div
              className="
                mt-7
                space-y-5
              "
            >
              {/* ADDRESS LINE 1 */}

              <div>
                <label
                  htmlFor="address-line-1"
                  className="
                    mb-2
                    block
                    text-sm
                    font-bold
                  "
                >
                  Address Line 1
                </label>

                <input
                  id="address-line-1"
                  type="text"
                  autoComplete="address-line1"
                  value={
                    form.addressLine1
                  }
                  onChange={(event) =>
                    updateField(
                      "addressLine1",
                      event.target.value,
                    )
                  }
                  placeholder="House / Flat / Building / Street"
                  className={inputClass(
                    "addressLine1",
                  )}
                />

                <ErrorMessage
                  field="addressLine1"
                />
              </div>

              {/* ADDRESS LINE 2 */}

              <div>
                <label
                  htmlFor="address-line-2"
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
                      text-black/35
                    "
                  >
                    Optional
                  </span>
                </label>

                <input
                  id="address-line-2"
                  type="text"
                  autoComplete="address-line2"
                  value={
                    form.addressLine2
                  }
                  onChange={(event) =>
                    updateField(
                      "addressLine2",
                      event.target.value,
                    )
                  }
                  placeholder="Apartment, area, locality"
                  className={inputClass(
                    "addressLine2",
                  )}
                />

                <ErrorMessage
                  field="addressLine2"
                />
              </div>

              {/* LANDMARK */}

              <div>
                <label
                  htmlFor="address-landmark"
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
                      text-black/35
                    "
                  >
                    Optional
                  </span>
                </label>

                <input
                  id="address-landmark"
                  type="text"
                  autoComplete="off"
                  value={
                    form.landmark
                  }
                  onChange={(event) =>
                    updateField(
                      "landmark",
                      event.target.value,
                    )
                  }
                  placeholder="Nearby landmark"
                  className={inputClass(
                    "landmark",
                  )}
                />

                <ErrorMessage
                  field="landmark"
                />
              </div>

              {/* CITY + STATE */}

              <div
                className="
                  grid
                  gap-4
                  sm:grid-cols-2
                "
              >
                {/* CITY */}

                <div>
                  <label
                    htmlFor="address-city"
                    className="
                      mb-2
                      block
                      text-sm
                      font-bold
                    "
                  >
                    City
                  </label>

                  <input
                    id="address-city"
                    type="text"
                    autoComplete="address-level2"
                    value={
                      form.city
                    }
                    onChange={(event) =>
                      updateField(
                        "city",
                        event.target.value,
                      )
                    }
                    placeholder="City"
                    className={inputClass(
                      "city",
                    )}
                  />

                  <ErrorMessage
                    field="city"
                  />
                </div>

                {/* STATE */}

                <div>
                  <label
                    htmlFor="address-state"
                    className="
                      mb-2
                      block
                      text-sm
                      font-bold
                    "
                  >
                    State
                  </label>

                  <input
                    id="address-state"
                    type="text"
                    autoComplete="address-level1"
                    value={
                      form.state
                    }
                    onChange={(event) =>
                      updateField(
                        "state",
                        event.target.value,
                      )
                    }
                    placeholder="State"
                    className={inputClass(
                      "state",
                    )}
                  />

                  <ErrorMessage
                    field="state"
                  />
                </div>
              </div>

              {/* PIN CODE */}

              <div>
                <label
                  htmlFor="address-pincode"
                  className="
                    mb-2
                    block
                    text-sm
                    font-bold
                  "
                >
                  PIN Code
                </label>

                <input
                  id="address-pincode"
                  type="text"
                  inputMode="numeric"
                  autoComplete="postal-code"
                  value={
                    form.pincode
                  }
                  onChange={(event) => {
                    const digits =
                      event.target.value
                        .replace(/\D/g, "")
                        .slice(0, 6);

                    updateField(
                      "pincode",
                      digits,
                    );
                  }}
                  placeholder="6-digit PIN code"
                  maxLength={6}
                  className={inputClass(
                    "pincode",
                  )}
                />

                <ErrorMessage
                  field="pincode"
                />
              </div>
            </div>

            {/* FORM ACTIONS */}

            <div
              className="
                mt-7
                flex
                flex-col-reverse
                gap-3
                sm:flex-row
                sm:justify-end
              "
            >
              <button
                type="button"
                onClick={closeForm}
                className="
                  rounded-full
                  border
                  border-black/10
                  px-6
                  py-3
                  text-sm
                  font-bold
                  transition
                  hover:bg-black/5
                "
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={
                  handleSaveAddress
                }
                className="
                  inline-flex
                  items-center
                  justify-center
                  gap-2
                  rounded-full
                  bg-black
                  px-6
                  py-3
                  text-sm
                  font-bold
                  text-white
                  transition
                  hover:scale-[1.02]
                  active:scale-[0.98]
                "
              >
                <Check size={17} />

                {editingId
                  ? "Update Address"
                  : "Save Address"}
              </button>
            </div>
          </section>
        )}

        {/* ================================================================== */}
        {/* EMPTY STATE                                                        */}
        {/* ================================================================== */}

        {addresses.length === 0 &&
          !isFormOpen && (
            <section
              className="
                mt-8
                rounded-[2rem]
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
                <MapPin size={36} />
              </div>

              <h2
                className="
                  mt-7
                  text-2xl
                  font-extrabold
                "
              >
                No Saved Addresses
              </h2>

              <p
                className="
                  mx-auto
                  mt-3
                  max-w-md
                  text-sm
                  leading-relaxed
                  text-black/50
                "
              >
                Add your delivery address once
                and use it quickly for future
                StickHive orders.
              </p>

              <button
                type="button"
                onClick={openAddForm}
                className="
                  mt-7
                  inline-flex
                  items-center
                  gap-2
                  rounded-full
                  bg-black
                  px-6
                  py-3
                  text-sm
                  font-bold
                  text-white
                  transition
                  hover:scale-[1.02]
                "
              >
                <Plus size={17} />

                Add Your First Address
              </button>
            </section>
          )}

        {/* ================================================================== */}
        {/* ADDRESS LIST                                                       */}
        {/* ================================================================== */}

        {addresses.length > 0 && (
          <div
            className="
              mt-8
              space-y-4
            "
          >
            {addresses.map(
              (address) => (
                <section
                  key={address.id}
                  className="
                    rounded-[2rem]
                    bg-white
                    p-6
                    shadow-xl
                    md:p-7
                  "
                >
                  {/* ADDRESS HEADER */}

                  <div
                    className="
                      flex
                      flex-col
                      gap-4
                      sm:flex-row
                      sm:items-start
                      sm:justify-between
                    "
                  >
                    <div
                      className="
                        flex
                        items-start
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
                        <MapPin
                          size={22}
                        />
                      </div>

                      <div>
                        <div
                          className="
                            flex
                            flex-wrap
                            items-center
                            gap-2
                          "
                        >
                          <h2
                            className="
                              text-lg
                              font-extrabold
                            "
                          >
                            {address.city}
                          </h2>

                          {address.isDefault && (
                            <span
                              className="
                                inline-flex
                                items-center
                                gap-1
                                rounded-full
                                bg-hive-yellow
                                px-3
                                py-1
                                text-[10px]
                                font-bold
                                uppercase
                                tracking-wide
                              "
                            >
                              <Check
                                size={12}
                              />

                              Default
                            </span>
                          )}
                        </div>

                        <p
                          className="
                            mt-2
                            text-sm
                            leading-relaxed
                            text-black/60
                          "
                        >
                          {address.addressLine1}
                        </p>

                        {address.addressLine2 && (
                          <p
                            className="
                              mt-1
                              text-sm
                              leading-relaxed
                              text-black/60
                            "
                          >
                            {
                              address.addressLine2
                            }
                          </p>
                        )}

                        {address.landmark && (
                          <p
                            className="
                              mt-1
                              text-sm
                              text-black/50
                            "
                          >
                            Landmark:{" "}
                            {
                              address.landmark
                            }
                          </p>
                        )}

                        <p
                          className="
                            mt-2
                            text-sm
                            font-semibold
                          "
                        >
                          {address.city},{" "}
                          {address.state}{" "}
                          {address.pincode}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* ACTIONS */}

                  <div
                    className="
                      mt-6
                      flex
                      flex-col
                      gap-3
                      border-t
                      border-black/10
                      pt-5
                      sm:flex-row
                      sm:items-center
                      sm:justify-between
                    "
                  >
                    <div
                      className="
                        flex
                        flex-wrap
                        gap-2
                      "
                    >
                      <button
                        type="button"
                        onClick={() =>
                          openEditForm(
                            address,
                          )
                        }
                        className="
                          inline-flex
                          items-center
                          gap-2
                          rounded-full
                          border
                          border-black/10
                          px-4
                          py-2.5
                          text-xs
                          font-bold
                          transition
                          hover:bg-black/5
                        "
                      >
                        <Pencil
                          size={14}
                        />

                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleDeleteAddress(
                            address.id,
                          )
                        }
                        className="
                          inline-flex
                          items-center
                          gap-2
                          rounded-full
                          border
                          border-red-100
                          px-4
                          py-2.5
                          text-xs
                          font-bold
                          text-red-500
                          transition
                          hover:bg-red-50
                        "
                      >
                        <Trash2
                          size={14}
                        />

                        Delete
                      </button>
                    </div>

                    {!address.isDefault && (
                      <button
                        type="button"
                        onClick={() =>
                          handleSetDefault(
                            address.id,
                          )
                        }
                        className="
                          inline-flex
                          items-center
                          justify-center
                          gap-2
                          rounded-full
                          bg-black
                          px-5
                          py-2.5
                          text-xs
                          font-bold
                          text-white
                          transition
                          hover:scale-[1.02]
                        "
                      >
                        <Check
                          size={14}
                        />

                        Set as Default
                      </button>
                    )}
                  </div>
                </section>
              ),
            )}
          </div>
        )}

        {/* ================================================================== */}
        {/* FOOTER NOTE                                                        */}
        {/* ================================================================== */}

        {addresses.length > 0 && (
          <p
            className="
              mt-6
              text-center
              text-xs
              leading-relaxed
              text-black/40
            "
          >
            Your saved addresses are currently
            stored securely on this device.
            Backend synchronization can be
            connected later.
          </p>
        )}
      </div>
    </main>
  );
}