import type { Address } from "@/types/address";

// ============================================================================
// STORAGE
// ============================================================================

const ADDRESS_STORAGE_KEY =
  "stickhive:addresses";

// ============================================================================
// BROWSER CHECK
// ============================================================================

function isBrowser(): boolean {
  return (
    typeof window !== "undefined"
  );
}

// ============================================================================
// ID GENERATOR
// ============================================================================

function generateAddressId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID ===
      "function"
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

// ============================================================================
// READ ADDRESSES
// ============================================================================

function readAddresses(): Address[] {
  if (!isBrowser()) {
    return [];
  }

  try {
    const stored =
      localStorage.getItem(
        ADDRESS_STORAGE_KEY,
      );

    if (!stored) {
      return [];
    }

    const parsed: unknown =
      JSON.parse(stored);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      isValidAddress,
    );
  } catch (error) {
    console.error(
      "Unable to load StickHive addresses:",
      error,
    );

    return [];
  }
}

// ============================================================================
// ADDRESS VALIDATION
// ============================================================================

function isValidAddress(
  value: unknown,
): value is Address {
  if (
    !value ||
    typeof value !== "object"
  ) {
    return false;
  }

  const address =
    value as Partial<Address>;

  return (
    typeof address.id ===
      "string" &&
    typeof address.addressLine1 ===
      "string" &&
    typeof address.city ===
      "string" &&
    typeof address.state ===
      "string" &&
    typeof address.pincode ===
      "string" &&
    typeof address.isDefault ===
      "boolean" &&
    typeof address.createdAt ===
      "string" &&
    typeof address.updatedAt ===
      "string"
  );
}

// ============================================================================
// WRITE ADDRESSES
// ============================================================================

function writeAddresses(
  addresses: Address[],
): void {
  if (!isBrowser()) {
    return;
  }

  try {
    localStorage.setItem(
      ADDRESS_STORAGE_KEY,
      JSON.stringify(addresses),
    );
  } catch (error) {
    console.error(
      "Unable to save StickHive addresses:",
      error,
    );
  }
}

// ============================================================================
// GET ALL ADDRESSES
// ============================================================================

export function getAddresses(): Address[] {
  return readAddresses();
}

// ============================================================================
// GET DEFAULT ADDRESS
// ============================================================================

export function getDefaultAddress():
  | Address
  | null {
  const addresses =
    readAddresses();

  return (
    addresses.find(
      (address) =>
        address.isDefault,
    ) ?? null
  );
}

// ============================================================================
// SAVE ADDRESS
// ============================================================================

export function saveAddress(
  addressData: Omit<
    Address,
    "id" | "createdAt" | "updatedAt"
  >,
): Address {
  const addresses =
    readAddresses();

  const now =
    new Date().toISOString();

  const newAddress: Address = {
    ...addressData,

    id:
      generateAddressId(),

    createdAt:
      now,

    updatedAt:
      now,
  };

  // --------------------------------------------------------------------------
  // If this address is default, remove default status from all others.
  // --------------------------------------------------------------------------

  let updatedAddresses =
    addresses;

  if (newAddress.isDefault) {
    updatedAddresses =
      addresses.map(
        (address) => ({
          ...address,
          isDefault: false,
        }),
      );
  }

  // --------------------------------------------------------------------------
  // Add the new address.
  // --------------------------------------------------------------------------

  updatedAddresses = [
    ...updatedAddresses,
    newAddress,
  ];

  // --------------------------------------------------------------------------
  // Persist.
  // --------------------------------------------------------------------------

  writeAddresses(
    updatedAddresses,
  );

  return newAddress;
}

// ============================================================================
// UPDATE ADDRESS
// ============================================================================

export function updateAddress(
  id: string,
  updates: Partial<
    Omit<
      Address,
      "id" | "createdAt"
    >
  >,
): Address | null {
  const addresses =
    readAddresses();

  const existing =
    addresses.find(
      (address) =>
        address.id === id,
    );

  if (!existing) {
    return null;
  }

  const shouldBeDefault =
    updates.isDefault === true;

  const updatedAt =
    new Date().toISOString();

  const updatedAddresses =
    addresses.map(
      (address) => {
        // --------------------------------------------------------------------
        // Address being updated
        // --------------------------------------------------------------------

        if (
          address.id === id
        ) {
          return {
            ...address,
            ...updates,
            updatedAt,
          };
        }

        // --------------------------------------------------------------------
        // If updated address becomes default,
        // remove default from all other addresses.
        // --------------------------------------------------------------------

        if (
          shouldBeDefault
        ) {
          return {
            ...address,
            isDefault: false,
          };
        }

        return address;
      },
    );

  writeAddresses(
    updatedAddresses,
  );

  return (
    updatedAddresses.find(
      (address) =>
        address.id === id,
    ) ?? null
  );
}

// ============================================================================
// DELETE ADDRESS
// ============================================================================

export function deleteAddress(
  id: string,
): void {
  const addresses =
    readAddresses();

  const deletedAddress =
    addresses.find(
      (address) =>
        address.id === id,
    );

  if (!deletedAddress) {
    return;
  }

  let remaining =
    addresses.filter(
      (address) =>
        address.id !== id,
    );

  // --------------------------------------------------------------------------
  // If the default address was deleted,
  // automatically make the first remaining address default.
  // --------------------------------------------------------------------------

  if (
    deletedAddress.isDefault &&
    remaining.length > 0
  ) {
    remaining =
      remaining.map(
        (address, index) => ({
          ...address,
          isDefault:
            index === 0,
        }),
      );
  }

  writeAddresses(
    remaining,
  );
}

// ============================================================================
// SET DEFAULT ADDRESS
// ============================================================================

export function setDefaultAddress(
  id: string,
): void {
  const addresses =
    readAddresses();

  const exists =
    addresses.some(
      (address) =>
        address.id === id,
    );

  if (!exists) {
    return;
  }

  const now =
    new Date().toISOString();

  const updated =
    addresses.map(
      (address) => ({
        ...address,

        isDefault:
          address.id === id,

        updatedAt:
          address.id === id
            ? now
            : address.updatedAt,
      }),
    );

  writeAddresses(
    updated,
  );
}