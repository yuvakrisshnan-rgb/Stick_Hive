import type {
  CartLine,
  CustomStickerCartLine,
} from "./types";

const CART_KEY = "stickhive:cart";
const CUSTOM_CART_KEY = "stickhive:custom-cart";
const WISHLIST_KEY = "stickhive:wishlist";

function readStorage<T>(
  key: string,
  fallback: T,
): T {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const value =
      window.localStorage.getItem(key);

    if (!value) {
      return fallback;
    }

    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function writeStorage<T>(
  key: string,
  value: T,
): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      key,
      JSON.stringify(value),
    );
  } catch {
    // Ignore storage errors.
  }
}

function removeStorage(
  key: string,
): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignore storage errors.
  }
}

export function loadCart(): CartLine[] {
  return readStorage<CartLine[]>(
    CART_KEY,
    [],
  );
}

export function saveCart(
  cart: CartLine[],
): void {
  writeStorage(
    CART_KEY,
    cart,
  );
}

export function clearStoredCart(): void {
  removeStorage(CART_KEY);
}

export function loadCustomCart(): CustomStickerCartLine[] {
  return readStorage<
    CustomStickerCartLine[]
  >(
    CUSTOM_CART_KEY,
    [],
  );
}

export function saveCustomCart(
  cart: CustomStickerCartLine[],
): void {
  writeStorage(
    CUSTOM_CART_KEY,
    cart,
  );
}

export function clearStoredCustomCart(): void {
  removeStorage(
    CUSTOM_CART_KEY,
  );
}

export function loadWishlist(): string[] {
  return readStorage<string[]>(
    WISHLIST_KEY,
    [],
  );
}

export function saveWishlist(
  wishlist: string[],
): void {
  writeStorage(
    WISHLIST_KEY,
    wishlist,
  );
}

export function clearStoredWishlist(): void {
  removeStorage(
    WISHLIST_KEY,
  );
}