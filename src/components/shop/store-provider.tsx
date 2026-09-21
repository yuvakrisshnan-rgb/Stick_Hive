"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  PRODUCTS,
  priceFor,
  type Product,
  type StickerSize,
} from "@/lib/product-data";

import {
  FREE_SHIPPING_THRESHOLD,
  SHIPPING_FEE,
  getAmountToFreeShipping,
  getCartDiscount,
  getCartItemCount,
  getCartSubtotal,
  getCartTotal,
  getHasFreeShipping,
  getShippingCost,
} from "@/lib/cart/calculations";

import {
  clearStoredCart,
  clearStoredCustomCart,
  loadCart,
  loadCustomCart,
  loadWishlist,
  saveCart,
  saveCustomCart,
  saveWishlist,
} from "@/lib/cart/storage";

import type {
  CartLine,
  CartLineDetailed,
  CustomStickerCartLine,
  CustomStickerFinish,
  CustomStickerShape,
} from "@/lib/cart/types";


// ============================================================================
// CONSTANTS
// ============================================================================

export const MAX_CART_QUANTITY = 10;

export {
  FREE_SHIPPING_THRESHOLD,
  SHIPPING_FEE,
};


// ============================================================================
// PRODUCT LOOKUP
// ============================================================================
// Not a module-level constant anymore: the catalog the client cart/wishlist
// need to resolve products against is whatever /shop itself is currently
// serving (backend/products/catalog.ts, static array or D1, gated by
// PRODUCTS_SOURCE) - which a client component can't read directly (no
// getD1() outside the Workers runtime). ShopProvider below seeds this
// synchronously from the static PRODUCTS array (so first paint and any
// cart already in localStorage behave exactly as before), then fetches
// GET /api/products - the same catalog.ts call /shop makes - once on
// mount and swaps in the real list if it differs. Everything in this file
// that used to close over the old module-level `productById` now takes it
// as a parameter instead.

function buildProductById(
  products: Product[],
): Map<string, Product> {
  return new Map(
    products.map((product) => [
      product.id,
      product,
    ]),
  );
}


// ============================================================================
// CONTEXT TYPE
// ============================================================================

type ShopContextValue = {
  // Normal cart
  cart: CartLine[];
  cartCount: number;
  cartLines: CartLineDetailed[];

  cartSubtotal: number;
  cartDiscount: number;
  shippingCost: number;
  cartTotal: number;
  amountToFreeShipping: number;
  hasFreeShipping: boolean;

  addToCart: (
    productId: string,
    size: StickerSize,
    quantity?: number,
  ) => void;

  updateQuantity: (
    productId: string,
    size: StickerSize,
    quantity: number,
  ) => void;

  removeFromCart: (
    productId: string,
    size: StickerSize,
  ) => void;

  clearCart: () => void;

  // Custom cart
  customCartLines: CustomStickerCartLine[];
  customCartCount: number;

  addCustomStickerToCart: (
    sticker: Omit<
      CustomStickerCartLine,
      "id" | "type" | "lineTotal"
    >,
  ) => void;

  removeCustomStickerFromCart: (
    id: string,
  ) => void;

  updateCustomStickerQuantity: (
    id: string,
    quantity: number,
  ) => void;

  updateCustomStickerDesign: (
    id: string,
    updatedSticker: Partial<CustomStickerCartLine>,
  ) => void;

  clearCustomCart: () => void;

  // Combined cart
  clearAllCart: () => void;

  // Cart drawer
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;

  // Wishlist
  wishlist: string[];
  wishlistCount: number;

  isWishlisted: (
    productId: string,
  ) => boolean;

  toggleWishlist: (
    productId: string,
  ) => void;

  // Resolves a product id against the same dynamic (static-array-seeded,
  // then /api/products-loaded) catalog the cart itself uses - for any
  // consumer (e.g. the wishlist page) that needs full product details for
  // an id without importing the static PRODUCTS array directly.
  getProduct: (
    productId: string,
  ) => Product | undefined;
};


// ============================================================================
// CONTEXT
// ============================================================================

const ShopContext =
  createContext<ShopContextValue | null>(null);


// ============================================================================
// HELPERS
// ============================================================================

function clampQuantity(
  quantity: number,
): number {
  if (!Number.isFinite(quantity)) {
    return 1;
  }

  return Math.min(
    MAX_CART_QUANTITY,
    Math.max(
      1,
      Math.floor(quantity),
    ),
  );
}


function isValidProduct(
  productId: unknown,
  productById: Map<string, Product>,
): productId is string {
  return (
    typeof productId === "string" &&
    productById.has(productId)
  );
}


function sanitizeCart(
  value: unknown,
  productById: Map<string, Product>,
): CartLine[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const cleaned: CartLine[] = [];

  for (const item of value) {
    if (
      !item ||
      typeof item !== "object"
    ) {
      continue;
    }

    const line = item as Partial<CartLine>;

    if (
      !isValidProduct(line.productId, productById)
    ) {
      continue;
    }

    const product =
      productById.get(line.productId);

    if (!product || !product.inStock) {
      continue;
    }

    if (
      !line.size ||
      !product.sizes.includes(
        line.size as StickerSize,
      )
    ) {
      continue;
    }

    if (
      typeof line.quantity !== "number" ||
      !Number.isFinite(line.quantity)
    ) {
      continue;
    }

    const quantity =
      clampQuantity(line.quantity);

    const existingIndex =
      cleaned.findIndex(
        (existing) =>
          existing.productId ===
            line.productId &&
          existing.size ===
            line.size,
      );

    if (existingIndex >= 0) {
      cleaned[existingIndex].quantity =
        clampQuantity(
          cleaned[existingIndex].quantity +
            quantity,
        );
    } else {
      cleaned.push({
        productId:
          line.productId,

        size:
          line.size as StickerSize,

        quantity,
      });
    }
  }

  return cleaned;
}


// ============================================================================
// SANITIZE CUSTOM CART
// ============================================================================
// Validates against the layer-based sticker model. A valid entry needs a
// real `layers` array and a `thumbnailUrl` (the flattened preview used by
// the cart drawer, checkout receipt, and order history).

function sanitizeCustomCart(
  value: unknown,
): CustomStickerCartLine[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (item): item is CustomStickerCartLine => {
        if (
          !item ||
          typeof item !== "object"
        ) {
          return false;
        }

        const line =
          item as Partial<CustomStickerCartLine>;

        return (
          typeof line.id === "string" &&
          Array.isArray(line.layers) &&
          typeof line.size === "string" &&
          typeof line.shape === "string" &&
          typeof line.finish === "string" &&
          typeof line.quantity === "number" &&
          Number.isFinite(line.quantity) &&
          typeof line.unitPrice === "number" &&
          Number.isFinite(line.unitPrice) &&
          typeof line.thumbnailUrl === "string"
        );
      },
    )
    .map((line) => {
      const quantity =
        clampQuantity(line.quantity);

      const unitPrice =
        Math.max(0, line.unitPrice);

      return {
        ...line,
        type: "custom" as const,
        quantity,
        unitPrice,
        lineTotal:
          unitPrice * quantity,
      };
    });
}


function sanitizeWishlist(
  value: unknown,
  productById: Map<string, Product>,
): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return [
    ...new Set(
      value.filter((id): id is string => isValidProduct(id, productById)),
    ),
  ];
}


function createCustomStickerId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}


// ============================================================================
// PROVIDER
// ============================================================================

export function ShopProvider({
  children,
}: {
  children: ReactNode;
}) {
  // --------------------------------------------------------------------------
  // STATE
  // --------------------------------------------------------------------------

  const [cart, setCart] =
    useState<CartLine[]>([]);

  const [customCartLines, setCustomCartLines] =
    useState<CustomStickerCartLine[]>([]);

  const [wishlist, setWishlist] =
    useState<string[]>([]);

  const [isCartOpen, setIsCartOpen] =
    useState(false);

  const [hydrated, setHydrated] =
    useState(false);

  // Flips once the /api/products fetch below has settled - success or
  // failure, either way we then know the real catalog to trust. The
  // INITIAL LOAD effect further down waits for this before reading
  // localStorage, specifically so a hard navigation/reload never
  // sanitizeCart()s a D1-only cart item against the still-static seed and
  // silently drops it before the fetch has had a chance to resolve (a
  // real race this session's Playwright verification actually hit -
  // productById already excludes it while catalog === PRODUCTS).
  const [catalogReady, setCatalogReady] =
    useState(false);

  // Seeded synchronously from the static array so first paint and an
  // already-hydrated localStorage cart behave exactly as before this
  // fetch resolves (or if it fails - see the catch below). GET
  // /api/products (backend/products/catalog.ts's listShopProducts(), the
  // same thing /shop's Server Component calls) then swaps in the real
  // list, which is only actually different from PRODUCTS once
  // PRODUCTS_SOURCE=d1 is set - see DEPLOY_CHECKLIST.md.
  const [catalog, setCatalog] =
    useState<Product[]>(PRODUCTS);

  const productById =
    useMemo(
      () => buildProductById(catalog),
      [catalog],
    );


  // --------------------------------------------------------------------------
  // CATALOG LOAD
  // --------------------------------------------------------------------------

  useEffect(() => {
    let cancelled = false;

    type ProductsResponse = {
      success?: boolean;
      products?: Product[];
    };

    fetch("/api/products")
      .then((response) => (response.ok ? (response.json() as Promise<ProductsResponse>) : null))
      .then((data) => {
        if (
          !cancelled &&
          data?.success &&
          Array.isArray(data.products)
        ) {
          setCatalog(data.products);
        }
      })
      .catch((error) => {
        // Keep the static-array seed already in state - addToCart etc.
        // still work for every static-catalog product either way, this
        // only affects whether a D1-only product resolves client-side.
        console.error("[shop] Failed to load /api/products, keeping the static catalog:", error);
      })
      .finally(() => {
        if (!cancelled) {
          setCatalogReady(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);


  // --------------------------------------------------------------------------
  // INITIAL LOAD
  // --------------------------------------------------------------------------
  // Waits for catalogReady (the /api/products fetch above to settle, not
  // just component mount) before reading and sanitizing localStorage.
  // Runs its body exactly once, against whatever `catalog`/`productById`
  // is current at that moment - it does NOT re-run on later catalog
  // changes (there aren't any once catalogReady is true; the fetch above
  // only runs once), so an existing cart is never retroactively
  // re-sanitized out from under the user.

  const initialLoadDone =
    useRef(false);

  useEffect(() => {
    if (
      !catalogReady ||
      initialLoadDone.current
    ) {
      return;
    }

    initialLoadDone.current = true;

    const savedCart =
      sanitizeCart(loadCart(), productById);

    const savedCustomCart =
      sanitizeCustomCart(
        loadCustomCart(),
      );

    const savedWishlist =
      sanitizeWishlist(
        loadWishlist(),
        productById,
      );

    setCart(savedCart);
    setCustomCartLines(savedCustomCart);
    setWishlist(savedWishlist);

    saveCart(savedCart);
    saveCustomCart(savedCustomCart);
    saveWishlist(savedWishlist);

    setHydrated(true);
  }, [catalogReady, productById]);


  // --------------------------------------------------------------------------
  // PERSISTENCE
  // --------------------------------------------------------------------------

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    saveCart(cart);
  }, [cart, hydrated]);


  useEffect(() => {
    if (!hydrated) {
      return;
    }

    saveCustomCart(customCartLines);
  }, [
    customCartLines,
    hydrated,
  ]);


  useEffect(() => {
    if (!hydrated) {
      return;
    }

    saveWishlist(wishlist);
  }, [wishlist, hydrated]);


  // ==========================================================================
  // NORMAL CART
  // ==========================================================================

  const addToCart =
    useCallback(
      (
        productId: string,
        size: StickerSize,
        quantity = 1,
      ) => {
        const product =
          productById.get(productId);

        if (!product) {
          console.warn(
            `Product "${productId}" was not found.`,
          );

          return;
        }

        if (!product.inStock) {
          console.warn(
            `"${product.name}" is currently out of stock.`,
          );

          return;
        }

        if (
          !product.sizes.includes(size)
        ) {
          console.warn(
            `Size "${size}" is not available for "${product.name}".`,
          );

          return;
        }

        const safeQuantity =
          clampQuantity(quantity);

        setCart((current) => {
          const existing =
            current.find(
              (line) =>
                line.productId ===
                  productId &&
                line.size === size,
            );

          if (!existing) {
            return [
              ...current,
              {
                productId,
                size,
                quantity:
                  safeQuantity,
              },
            ];
          }

          return current.map(
            (line) => {
              if (
                line.productId !==
                  productId ||
                line.size !== size
              ) {
                return line;
              }

              return {
                ...line,
                quantity:
                  clampQuantity(
                    line.quantity +
                      safeQuantity,
                  ),
              };
            },
          );
        });
      },
      [productById],
    );


  const updateQuantity =
    useCallback(
      (
        productId: string,
        size: StickerSize,
        quantity: number,
      ) => {
        if (
          !Number.isFinite(quantity)
        ) {
          return;
        }

        const safeQuantity =
          Math.floor(quantity);

        if (safeQuantity <= 0) {
          setCart((current) =>
            current.filter(
              (line) =>
                !(
                  line.productId ===
                    productId &&
                  line.size === size
                ),
            ),
          );

          return;
        }

        setCart((current) =>
          current.map((line) => {
            if (
              line.productId !==
                productId ||
              line.size !== size
            ) {
              return line;
            }

            return {
              ...line,
              quantity:
                clampQuantity(
                  safeQuantity,
                ),
            };
          }),
        );
      },
      [],
    );


  const removeFromCart =
    useCallback(
      (
        productId: string,
        size: StickerSize,
      ) => {
        setCart((current) =>
          current.filter(
            (line) =>
              !(
                line.productId ===
                  productId &&
                line.size === size
              ),
          ),
        );
      },
      [],
    );


  const clearCart =
    useCallback(() => {
      setCart([]);
      clearStoredCart();
    }, []);


  // ==========================================================================
  // CUSTOM STICKER CART
  // ==========================================================================

  const addCustomStickerToCart =
    useCallback(
      (
        sticker: Omit<
          CustomStickerCartLine,
          "id" | "type" | "lineTotal"
        >,
      ) => {
        const quantity =
          clampQuantity(
            sticker.quantity,
          );

        const unitPrice =
          Math.max(
            0,
            sticker.unitPrice,
          );

        const newSticker: CustomStickerCartLine = {
          ...sticker,

          id:
            createCustomStickerId(),

          type:
            "custom",

          quantity,

          unitPrice,

          lineTotal:
            unitPrice * quantity,
        };

        setCustomCartLines(
          (current) => [
            ...current,
            newSticker,
          ],
        );
      },
      [],
    );


  const removeCustomStickerFromCart =
    useCallback(
      (id: string) => {
        setCustomCartLines(
          (current) =>
            current.filter(
              (line) =>
                line.id !== id,
            ),
        );
      },
      [],
    );


  const updateCustomStickerQuantity =
    useCallback(
      (
        id: string,
        quantity: number,
      ) => {
        if (
          !Number.isFinite(quantity)
        ) {
          return;
        }

        const safeQuantity =
          Math.floor(quantity);

        if (safeQuantity <= 0) {
          setCustomCartLines(
            (current) =>
              current.filter(
                (line) =>
                  line.id !== id,
              ),
          );

          return;
        }

        setCustomCartLines(
          (current) =>
            current.map((line) => {
              if (
                line.id !== id
              ) {
                return line;
              }

              const finalQuantity =
                clampQuantity(
                  safeQuantity,
                );

              return {
                ...line,

                quantity:
                  finalQuantity,

                lineTotal:
                  line.unitPrice *
                  finalQuantity,
              };
            }),
        );
      },
      [],
    );


  const updateCustomStickerDesign =
    useCallback(
      (
        id: string,
        updatedSticker:
          Partial<CustomStickerCartLine>,
      ) => {
        setCustomCartLines(
          (current) =>
            current.map((line) => {
              if (
                line.id !== id
              ) {
                return line;
              }

              const quantity =
                clampQuantity(
                  updatedSticker.quantity ??
                    line.quantity,
                );

              const unitPrice =
                Math.max(
                  0,
                  updatedSticker.unitPrice ??
                    line.unitPrice,
                );

              return {
                ...line,

                ...updatedSticker,

                type:
                  "custom" as const,

                quantity,

                unitPrice,

                lineTotal:
                  unitPrice * quantity,
              };
            }),
        );
      },
      [],
    );


  const clearCustomCart =
    useCallback(() => {
      setCustomCartLines([]);
      clearStoredCustomCart();
    }, []);


  const clearAllCart =
    useCallback(() => {
      setCart([]);
      setCustomCartLines([]);

      clearStoredCart();
      clearStoredCustomCart();
    }, []);


  // ==========================================================================
  // CART DRAWER
  // ==========================================================================

  const openCart =
    useCallback(() => {
      setIsCartOpen(true);
    }, []);


  const closeCart =
    useCallback(() => {
      setIsCartOpen(false);
    }, []);


  // ==========================================================================
  // WISHLIST
  // ==========================================================================

  const toggleWishlist =
    useCallback(
      (productId: string) => {
        if (
          !isValidProduct(productId, productById)
        ) {
          return;
        }

        setWishlist((current) => {
          if (
            current.includes(
              productId,
            )
          ) {
            return current.filter(
              (id) =>
                id !== productId,
            );
          }

          return [
            ...current,
            productId,
          ];
        });
      },
      [productById],
    );


  const isWishlisted =
    useCallback(
      (productId: string) =>
        wishlist.includes(
          productId,
        ),
      [wishlist],
    );


  const getProduct =
    useCallback(
      (productId: string) =>
        productById.get(productId),
      [productById],
    );


  // ==========================================================================
  // DETAILED NORMAL CART
  // ==========================================================================

  const cartLines =
    useMemo<CartLineDetailed[]>(
      () =>
        cart.reduce<
          CartLineDetailed[]
        >(
          (result, line) => {
            const product =
              productById.get(
                line.productId,
              );

            if (
              !product ||
              !product.inStock
            ) {
              return result;
            }

            const pricing =
              priceFor(
                product,
                line.size,
              );

            const originalUnitPrice =
              pricing.original ??
              pricing.price;

            const lineTotal =
              pricing.price *
              line.quantity;

            const originalLineTotal =
              originalUnitPrice *
              line.quantity;

            const lineDiscount =
              Math.max(
                0,
                originalLineTotal -
                  lineTotal,
              );

            result.push({
              productId:
                line.productId,

              size:
                line.size,

              quantity:
                line.quantity,

              product,

              unitPrice:
                pricing.price,

              originalUnitPrice:
                pricing.original,

              lineTotal,

              lineDiscount,
            });

            return result;
          },
          [],
        ),
      [cart, productById],
    );


  // ==========================================================================
  // CART TOTALS
  // ==========================================================================

  const cartCount =
    useMemo(
      () =>
        getCartItemCount(
          cart,
          customCartLines,
        ),
      [
        cart,
        customCartLines,
      ],
    );


  const cartSubtotal =
    useMemo(
      () =>
        getCartSubtotal(
          cartLines,
          customCartLines,
        ),
      [
        cartLines,
        customCartLines,
      ],
    );


  const cartDiscount =
    useMemo(
      () =>
        getCartDiscount(
          cartLines,
        ),
      [cartLines],
    );


  const shippingCost =
    useMemo(
      () =>
        getShippingCost(
          cartSubtotal,
        ),
      [cartSubtotal],
    );


  const cartTotal =
    useMemo(
      () =>
        getCartTotal(
          cartSubtotal,
          cartDiscount,
        ),
      [
        cartSubtotal,
        cartDiscount,
      ],
    );


  const amountToFreeShipping =
    useMemo(
      () =>
        getAmountToFreeShipping(
          cartSubtotal,
        ),
      [cartSubtotal],
    );


  const hasFreeShipping =
    useMemo(
      () =>
        getHasFreeShipping(
          cartSubtotal,
        ),
      [cartSubtotal],
    );


  const customCartCount =
    useMemo(
      () =>
        customCartLines.reduce(
          (
            total,
            line,
          ) =>
            total + line.quantity,
          0,
        ),
      [customCartLines],
    );


  const wishlistCount =
    wishlist.length;


  // ==========================================================================
  // CONTEXT VALUE
  // ==========================================================================

  const value =
    useMemo<ShopContextValue>(
      () => ({
        cart,

        cartCount,

        cartLines,

        cartSubtotal,

        cartDiscount,

        shippingCost,

        cartTotal,

        amountToFreeShipping,

        hasFreeShipping,

        addToCart,

        updateQuantity,

        removeFromCart,

        clearCart,

        customCartLines,

        customCartCount,

        addCustomStickerToCart,

        removeCustomStickerFromCart,

        updateCustomStickerQuantity,

        updateCustomStickerDesign,

        clearCustomCart,

        clearAllCart,

        isCartOpen,

        openCart,

        closeCart,

        wishlist,

        wishlistCount,

        isWishlisted,

        toggleWishlist,

        getProduct,
      }),
      [
        cart,
        cartCount,
        cartLines,
        cartSubtotal,
        cartDiscount,
        shippingCost,
        cartTotal,
        amountToFreeShipping,
        hasFreeShipping,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        customCartLines,
        customCartCount,
        addCustomStickerToCart,
        removeCustomStickerFromCart,
        updateCustomStickerQuantity,
        updateCustomStickerDesign,
        clearCustomCart,
        clearAllCart,
        isCartOpen,
        openCart,
        closeCart,
        wishlist,
        wishlistCount,
        isWishlisted,
        toggleWishlist,
        getProduct,
      ],
    );


  // ==========================================================================
  // PROVIDER
  // ==========================================================================

  return (
    <ShopContext.Provider
      value={value}
    >
      {children}
    </ShopContext.Provider>
  );
}


// ============================================================================
// USE SHOP
// ============================================================================

export function useShop() {
  const context =
    useContext(
      ShopContext,
    );

  if (!context) {
    throw new Error(
      "useShop must be used inside ShopProvider",
    );
  }

  return context;
}


// ============================================================================
// TYPE RE-EXPORTS
// ============================================================================

export type {
  CartLine,
  CartLineDetailed,
  CustomStickerCartLine,
  CustomStickerFinish,
  CustomStickerShape,
};