"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  PRODUCTS,
  priceFor,
  type Product,
  type StickerSize,
} from "@/lib/product-data";


// ============================================================================
// STORAGE KEYS
// ============================================================================

const CART_KEY = "stickhive:cart";
const CUSTOM_CART_KEY = "stickhive:custom-cart";
const WISHLIST_KEY = "stickhive:wishlist";


// ============================================================================
// CART CONFIGURATION
// ============================================================================

export const MAX_CART_QUANTITY = 10;

export const FREE_SHIPPING_THRESHOLD = 200;

export const SHIPPING_FEE = 40;


// ============================================================================
// NORMAL CART TYPES
// ============================================================================

export type CartLine = {
  productId: string;
  size: StickerSize;
  quantity: number;
};


export type CartLineDetailed = CartLine & {
  product: Product;
  unitPrice: number;
  originalUnitPrice?: number;
  lineTotal: number;
  lineDiscount: number;
};


// ============================================================================
// CUSTOM STICKER TYPES
// ============================================================================

export type CustomStickerShape =
  | "Circle"
  | "Square"
  | "Rounded"
  | "Die-cut";


export type CustomStickerFinish =
  | "Glossy"
  | "Matte"
  | "Holographic"
  | "Transparent";


export type CustomStickerCartLine = {
  type: "custom";

  id: string;

  imageUrl: string;

  fileName: string;

  size: StickerSize;

  shape: CustomStickerShape;

  finish: CustomStickerFinish;

  quantity: number;

  unitPrice: number;

  imageScale: number;

  lineTotal: number;
};


// ============================================================================
// CONTEXT TYPE
// ============================================================================

type ShopContextValue = {

  // --------------------------------------------------------------------------
  // Normal cart
  // --------------------------------------------------------------------------

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


  // --------------------------------------------------------------------------
  // Custom cart
  // --------------------------------------------------------------------------

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


  // --------------------------------------------------------------------------
  // Combined cart
  // --------------------------------------------------------------------------

  clearAllCart: () => void;


  // --------------------------------------------------------------------------
  // Cart drawer
  // --------------------------------------------------------------------------

  isCartOpen: boolean;

  openCart: () => void;

  closeCart: () => void;


  // --------------------------------------------------------------------------
  // Wishlist
  // --------------------------------------------------------------------------

  wishlist: string[];

  wishlistCount: number;

  isWishlisted: (
    productId: string,
  ) => boolean;

  toggleWishlist: (
    productId: string,
  ) => void;
};


// ============================================================================
// CONTEXT
// ============================================================================

const ShopContext =
  createContext<ShopContextValue | null>(null);


// ============================================================================
// PRODUCT LOOKUP
// ============================================================================

const productById =
  new Map<string, Product>(
    PRODUCTS.map((product) => [
      product.id,
      product,
    ]),
  );


// ============================================================================
// QUANTITY HELPER
// ============================================================================

function clampQuantity(
  quantity: number,
) {
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


// ============================================================================
// PRODUCT VALIDATION
// ============================================================================

function isValidProduct(
  productId: unknown,
): productId is string {

  if (
    typeof productId !==
    "string"
  ) {
    return false;
  }

  return productById.has(
    productId,
  );
}


// ============================================================================
// CART LINE VALIDATION
// ============================================================================

function isValidCartLine(
  line: unknown,
): line is CartLine {

  if (
    !line ||
    typeof line !== "object"
  ) {
    return false;
  }


  const item =
    line as Partial<CartLine>;


  if (
    !isValidProduct(
      item.productId,
    )
  ) {
    return false;
  }


  const product =
    productById.get(
      item.productId,
    );


  if (!product) {
    return false;
  }


  if (
    !item.size ||
    !product.sizes.includes(
      item.size as StickerSize,
    )
  ) {
    return false;
  }


  if (
    typeof item.quantity !==
    "number"
  ) {
    return false;
  }


  if (
    !Number.isFinite(
      item.quantity,
    )
  ) {
    return false;
  }


  return true;
}


// ============================================================================
// SANITIZE CART
// ============================================================================

function sanitizeCart(
  value: unknown,
): CartLine[] {

  if (!Array.isArray(value)) {
    return [];
  }


  const cleanedLines: CartLine[] = [];


  for (const rawLine of value) {

    if (
      !isValidCartLine(
        rawLine,
      )
    ) {
      continue;
    }


    const product =
      productById.get(
        rawLine.productId,
      );


    if (!product) {
      continue;
    }


    // --------------------------------------------------------------
    // Remove products that are no longer available
    // --------------------------------------------------------------

    if (!product.inStock) {
      continue;
    }


    const quantity =
      clampQuantity(
        rawLine.quantity,
      );


    const existingIndex =
      cleanedLines.findIndex(
        (line) =>
          line.productId ===
            rawLine.productId &&
          line.size ===
            rawLine.size,
      );


    // --------------------------------------------------------------
    // Merge duplicate lines
    // --------------------------------------------------------------

    if (
      existingIndex !==
      -1
    ) {

      const existing =
        cleanedLines[
          existingIndex
        ];


      existing.quantity =
        clampQuantity(
          existing.quantity +
            quantity,
        );


      continue;
    }


    cleanedLines.push({
      productId:
        rawLine.productId,

      size:
        rawLine.size,

      quantity,
    });

  }


  return cleanedLines;
}


// ============================================================================
// CUSTOM CART VALIDATION
// ============================================================================

function isValidCustomCartLine(
  value: unknown,
): value is CustomStickerCartLine {

  if (
    !value ||
    typeof value !== "object"
  ) {
    return false;
  }


  const item =
    value as Partial<CustomStickerCartLine>;


  return (
    typeof item.id ===
      "string" &&
    typeof item.imageUrl ===
      "string" &&
    typeof item.fileName ===
      "string" &&
    typeof item.size ===
      "string" &&
    typeof item.shape ===
      "string" &&
    typeof item.finish ===
      "string" &&
    typeof item.quantity ===
      "number" &&
    Number.isFinite(
      item.quantity,
    ) &&
    typeof item.unitPrice ===
      "number" &&
    Number.isFinite(
      item.unitPrice,
    )
  );
}


// ============================================================================
// SANITIZE CUSTOM CART
// ============================================================================

function sanitizeCustomCart(
  value: unknown,
): CustomStickerCartLine[] {

  if (!Array.isArray(value)) {
    return [];
  }


  return value
    .filter(
      isValidCustomCartLine,
    )
    .map(
      (
        line,
      ) => {

        const quantity =
          clampQuantity(
            line.quantity,
          );


        const unitPrice =
          Math.max(
            0,
            line.unitPrice,
          );


        return {
          ...line,

          type:
            "custom" as const,

          quantity,

          unitPrice,

          imageScale:
            Number.isFinite(
              line.imageScale,
            )
              ? Math.max(
                  0.1,
                  line.imageScale,
                )
              : 1,

          lineTotal:
            unitPrice *
            quantity,
        };

      },
    );
}


// ============================================================================
// SANITIZE WISHLIST
// ============================================================================

function sanitizeWishlist(
  value: unknown,
): string[] {

  if (!Array.isArray(value)) {
    return [];
  }


  const validIds =
    value.filter(
      (id) =>
        isValidProduct(id),
    );


  // Remove duplicate product IDs
  return [
    ...new Set(
      validIds,
    ),
  ];
}


// ============================================================================
// SHOP PROVIDER
// ============================================================================

export function ShopProvider({
  children,
}: {
  children: ReactNode;
}) {

  // ==========================================================================
  // NORMAL CART
  // ==========================================================================

  const [
    cart,
    setCart,
  ] = useState<CartLine[]>([]);


  // ==========================================================================
  // CUSTOM CART
  // ==========================================================================

  const [
    customCartLines,
    setCustomCartLines,
  ] = useState<
    CustomStickerCartLine[]
  >([]);


  // ==========================================================================
  // WISHLIST
  // ==========================================================================

  const [
    wishlist,
    setWishlist,
  ] = useState<string[]>([]);


  // ==========================================================================
  // CART DRAWER
  // ==========================================================================

  const [
    isCartOpen,
    setIsCartOpen,
  ] = useState(false);


  // ==========================================================================
  // HYDRATION
  // ==========================================================================

  const [
    hydrated,
    setHydrated,
  ] = useState(false);


  // ==========================================================================
  // LOAD SAVED DATA
  // ==========================================================================

  useEffect(() => {

    // ------------------------------------------------------------------------
    // NORMAL CART
    // ------------------------------------------------------------------------

    try {

      const savedCart =
        localStorage.getItem(
          CART_KEY,
        );


      if (savedCart) {

        const parsedCart =
          JSON.parse(
            savedCart,
          );


        const cleanCart =
          sanitizeCart(
            parsedCart,
          );


        setCart(
          cleanCart,
        );


        // Save the cleaned version immediately.
        // This removes stale/invalid data permanently.

        localStorage.setItem(
          CART_KEY,
          JSON.stringify(
            cleanCart,
          ),
        );

      }

    } catch (error) {

      console.warn(
        "Unable to load StickHive cart.",
        error,
      );


      setCart([]);


      try {

        localStorage.removeItem(
          CART_KEY,
        );

      } catch {
        // Ignore storage errors.
      }

    }


    // ------------------------------------------------------------------------
    // CUSTOM CART
    // ------------------------------------------------------------------------

    try {

      const savedCustomCart =
        localStorage.getItem(
          CUSTOM_CART_KEY,
        );


      if (savedCustomCart) {

        const parsedCustomCart =
          JSON.parse(
            savedCustomCart,
          );


        const cleanCustomCart =
          sanitizeCustomCart(
            parsedCustomCart,
          );


        setCustomCartLines(
          cleanCustomCart,
        );


        localStorage.setItem(
          CUSTOM_CART_KEY,
          JSON.stringify(
            cleanCustomCart,
          ),
        );

      }

    } catch (error) {

      console.warn(
        "Unable to load StickHive custom sticker cart.",
        error,
      );


      setCustomCartLines([]);


      try {

        localStorage.removeItem(
          CUSTOM_CART_KEY,
        );

      } catch {
        // Ignore storage errors.
      }

    }


    // ------------------------------------------------------------------------
    // WISHLIST
    // ------------------------------------------------------------------------

    try {

      const savedWishlist =
        localStorage.getItem(
          WISHLIST_KEY,
        );


      if (savedWishlist) {

        const parsedWishlist =
          JSON.parse(
            savedWishlist,
          );


        const cleanWishlist =
          sanitizeWishlist(
            parsedWishlist,
          );


        setWishlist(
          cleanWishlist,
        );


        localStorage.setItem(
          WISHLIST_KEY,
          JSON.stringify(
            cleanWishlist,
          ),
        );

      }

    } catch (error) {

      console.warn(
        "Unable to load StickHive wishlist.",
        error,
      );


      setWishlist([]);


      try {

        localStorage.removeItem(
          WISHLIST_KEY,
        );

      } catch {
        // Ignore storage errors.
      }

    }


    // ------------------------------------------------------------------------
    // COMPLETE HYDRATION
    // ------------------------------------------------------------------------

    setHydrated(true);

  }, []);


  // ==========================================================================
  // PERSIST NORMAL CART
  // ==========================================================================

  useEffect(() => {

    if (!hydrated) {
      return;
    }


    try {

      localStorage.setItem(
        CART_KEY,
        JSON.stringify(
          cart,
        ),
      );

    } catch (error) {

      console.warn(
        "Unable to save StickHive cart.",
        error,
      );

    }

  }, [
    cart,
    hydrated,
  ]);


  // ==========================================================================
  // PERSIST CUSTOM CART
  // ==========================================================================

  useEffect(() => {

    if (!hydrated) {
      return;
    }


    try {

      localStorage.setItem(
        CUSTOM_CART_KEY,
        JSON.stringify(
          customCartLines,
        ),
      );

    } catch (error) {

      console.warn(
        "Unable to save StickHive custom sticker cart.",
        error,
      );

    }

  }, [
    customCartLines,
    hydrated,
  ]);


  // ==========================================================================
  // PERSIST WISHLIST
  // ==========================================================================

  useEffect(() => {

    if (!hydrated) {
      return;
    }


    try {

      localStorage.setItem(
        WISHLIST_KEY,
        JSON.stringify(
          wishlist,
        ),
      );

    } catch (error) {

      console.warn(
        "Unable to save StickHive wishlist.",
        error,
      );

    }

  }, [
    wishlist,
    hydrated,
  ]);


  // ==========================================================================
  // ADD TO CART
  // ==========================================================================

  const addToCart =
    useCallback(
      (
        productId: string,
        size: StickerSize,
        quantity = 1,
      ) => {

        const product =
          productById.get(
            productId,
          );


        // ------------------------------------------------------------
        // Product doesn't exist
        // ------------------------------------------------------------

        if (!product) {

          console.warn(
            `Product "${productId}" was not found.`,
          );

          return;
        }


        // ------------------------------------------------------------
        // Product unavailable
        // ------------------------------------------------------------

        if (!product.inStock) {

          console.warn(
            `"${product.name}" is currently out of stock.`,
          );

          return;
        }


        // ------------------------------------------------------------
        // Size unavailable
        // ------------------------------------------------------------

        if (
          !product.sizes.includes(
            size,
          )
        ) {

          console.warn(
            `Size "${size}" is not available for "${product.name}".`,
          );

          return;
        }


        const safeQuantity =
          clampQuantity(
            quantity,
          );


        setCart(
          (currentCart) => {

            const existingIndex =
              currentCart.findIndex(
                (line) =>
                  line.productId ===
                    productId &&
                  line.size ===
                    size,
              );


            // ----------------------------------------------------------
            // New line
            // ----------------------------------------------------------

            if (
              existingIndex ===
              -1
            ) {

              return [
                ...currentCart,
                {
                  productId,
                  size,
                  quantity:
                    safeQuantity,
                },
              ];

            }


            // ----------------------------------------------------------
            // Existing line
            // ----------------------------------------------------------

            return currentCart.map(
              (
                line,
                index,
              ) => {

                if (
                  index !==
                  existingIndex
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

          },
        );

      },
      [],
    );


  // ==========================================================================
  // UPDATE NORMAL CART QUANTITY
  // ==========================================================================

  const updateQuantity =
    useCallback(
      (
        productId: string,
        size: StickerSize,
        quantity: number,
      ) => {

        if (
          !Number.isFinite(
            quantity,
          )
        ) {
          return;
        }


        const safeQuantity =
          Math.floor(
            quantity,
          );


        // ------------------------------------------------------------
        // Zero = remove
        // ------------------------------------------------------------

        if (
          safeQuantity <=
          0
        ) {

          setCart(
            (currentCart) =>
              currentCart.filter(
                (line) =>
                  !(
                    line.productId ===
                      productId &&
                    line.size ===
                      size
                  ),
              ),
          );


          return;
        }


        // ------------------------------------------------------------
        // Update quantity
        // ------------------------------------------------------------

        setCart(
          (currentCart) =>
            currentCart.map(
              (line) => {

                if (
                  line.productId !==
                    productId ||
                  line.size !==
                    size
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

              },
            ),
        );

      },
      [],
    );


  // ==========================================================================
  // REMOVE FROM CART
  // ==========================================================================

  const removeFromCart =
    useCallback(
      (
        productId: string,
        size: StickerSize,
      ) => {

        setCart(
          (currentCart) =>
            currentCart.filter(
              (line) =>
                !(
                  line.productId ===
                    productId &&
                  line.size ===
                    size
                ),
            ),
        );

      },
      [],
    );


  // ==========================================================================
  // CLEAR NORMAL CART
  // ==========================================================================

  const clearCart =
    useCallback(
      () => {

        setCart([]);


        if (
          typeof window !==
          "undefined"
        ) {

          try {

            localStorage.removeItem(
              CART_KEY,
            );

          } catch {
            // Ignore storage errors.
          }

        }

      },
      [],
    );


  // ==========================================================================
  // ADD CUSTOM STICKER
  // ==========================================================================

  const addCustomStickerToCart =
    useCallback(
      (
        sticker: Omit<
          CustomStickerCartLine,
          "id" |
          "type" |
          "lineTotal"
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


        const customSticker:
          CustomStickerCartLine =
          {
            ...sticker,

            id:
              typeof crypto !==
                "undefined" &&
              typeof crypto.randomUUID ===
                "function"
                ? crypto.randomUUID()
                : `${Date.now()}-${Math.random()
                    .toString(36)
                    .slice(2)}`,

            type:
              "custom",

            quantity,

            unitPrice,

            imageScale:
              Number.isFinite(
                sticker.imageScale,
              )
                ? Math.max(
                    0.1,
                    sticker.imageScale,
                  )
                : 1,

            lineTotal:
              unitPrice *
              quantity,
          };


        setCustomCartLines(
          (currentLines) => [
            ...currentLines,
            customSticker,
          ],
        );

      },
      [],
    );


  // ==========================================================================
  // REMOVE CUSTOM STICKER
  // ==========================================================================

  const removeCustomStickerFromCart =
    useCallback(
      (
        id: string,
      ) => {

        setCustomCartLines(
          (currentLines) =>
            currentLines.filter(
              (line) =>
                line.id !== id,
            ),
        );

      },
      [],
    );


  // ==========================================================================
  // UPDATE CUSTOM STICKER QUANTITY
  // ==========================================================================

  const updateCustomStickerQuantity =
    useCallback(
      (
        id: string,
        quantity: number,
      ) => {

        if (
          !Number.isFinite(
            quantity,
          )
        ) {
          return;
        }


        const safeQuantity =
          Math.floor(
            quantity,
          );


        if (
          safeQuantity <=
          0
        ) {

          setCustomCartLines(
            (currentLines) =>
              currentLines.filter(
                (line) =>
                  line.id !== id,
              ),
          );


          return;
        }


        setCustomCartLines(
          (currentLines) =>
            currentLines.map(
              (line) => {

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

              },
            ),
        );

      },
      [],
    );


  // ==========================================================================
  // UPDATE CUSTOM STICKER DESIGN
  // ==========================================================================

  const updateCustomStickerDesign =
    useCallback(
      (
        id: string,
        updatedSticker:
          Partial<CustomStickerCartLine>,
      ) => {

        setCustomCartLines(
          (currentLines) =>
            currentLines.map(
              (line) => {

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


                const imageScale =
                  Number.isFinite(
                    updatedSticker.imageScale ??
                      line.imageScale,
                  )
                    ? Math.max(
                        0.1,
                        updatedSticker.imageScale ??
                          line.imageScale,
                      )
                    : 1;


                return {
                  ...line,

                  ...updatedSticker,

                  type:
                    "custom" as const,

                  quantity,

                  unitPrice,

                  imageScale,

                  lineTotal:
                    unitPrice *
                    quantity,
                };

              },
            ),
        );

      },
      [],
    );


  // ==========================================================================
  // CLEAR CUSTOM CART
  // ==========================================================================

  const clearCustomCart =
    useCallback(
      () => {

        setCustomCartLines([]);


        if (
          typeof window !==
          "undefined"
        ) {

          try {

            localStorage.removeItem(
              CUSTOM_CART_KEY,
            );

          } catch {
            // Ignore storage errors.
          }

        }

      },
      [],
    );


  // ==========================================================================
  // CLEAR EVERYTHING
  // ==========================================================================

  const clearAllCart =
    useCallback(
      () => {

        setCart([]);

        setCustomCartLines([]);


        if (
          typeof window !==
          "undefined"
        ) {

          try {

            localStorage.removeItem(
              CART_KEY,
            );

            localStorage.removeItem(
              CUSTOM_CART_KEY,
            );

          } catch {
            // Ignore storage errors.
          }

        }

      },
      [],
    );


  // ==========================================================================
  // CART DRAWER
  // ==========================================================================

  const openCart =
    useCallback(
      () => {

        setIsCartOpen(true);

      },
      [],
    );


  const closeCart =
    useCallback(
      () => {

        setIsCartOpen(false);

      },
      [],
    );


  // ==========================================================================
  // WISHLIST
  // ==========================================================================

  const toggleWishlist =
    useCallback(
      (
        productId: string,
      ) => {

        if (
          !isValidProduct(
            productId,
          )
        ) {
          return;
        }


        setWishlist(
          (currentWishlist) => {

            if (
              currentWishlist.includes(
                productId,
              )
            ) {

              return currentWishlist.filter(
                (id) =>
                  id !== productId,
              );

            }


            return [
              ...currentWishlist,
              productId,
            ];

          },
        );

      },
      [],
    );


  const isWishlisted =
    useCallback(
      (
        productId: string,
      ) => {

        return wishlist.includes(
          productId,
        );

      },
      [
        wishlist,
      ],
    );


  // ==========================================================================
  // DETAILED CART LINES
  // ==========================================================================

  const cartLines =
    useMemo<CartLineDetailed[]>(
      () => {

        return cart.reduce<
          CartLineDetailed[]
        >(
          (
            result,
            line,
          ) => {

            const product =
              productById.get(
                line.productId,
              );


            if (!product) {
              return result;
            }


            // A product could theoretically become
            // unavailable while already in the cart.

            if (!product.inStock) {
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
        );

      },
      [
        cart,
      ],
    );


  // ==========================================================================
  // NORMAL CART COUNT
  // ==========================================================================

  const normalCartCount =
    useMemo(
      () =>
        cart.reduce(
          (
            total,
            item,
          ) =>
            total +
            item.quantity,
          0,
        ),
      [
        cart,
      ],
    );


  // ==========================================================================
  // CUSTOM CART COUNT
  // ==========================================================================

  const customCartCount =
    useMemo(
      () =>
        customCartLines.reduce(
          (
            total,
            item,
          ) =>
            total +
            item.quantity,
          0,
        ),
      [
        customCartLines,
      ],
    );


  // ==========================================================================
  // TOTAL CART COUNT
  // ==========================================================================

  const cartCount =
    normalCartCount +
    customCartCount;


  // ==========================================================================
  // NORMAL SUBTOTAL
  // ==========================================================================

  const normalSubtotal =
    useMemo(
      () =>
        cartLines.reduce(
          (
            total,
            item,
          ) =>
            total +
            item.lineTotal,
          0,
        ),
      [
        cartLines,
      ],
    );


  // ==========================================================================
  // CUSTOM SUBTOTAL
  // ==========================================================================

  const customSubtotal =
    useMemo(
      () =>
        customCartLines.reduce(
          (
            total,
            item,
          ) =>
            total +
            item.lineTotal,
          0,
        ),
      [
        customCartLines,
      ],
    );


  // ==========================================================================
  // CART SUBTOTAL
  // ==========================================================================

  const cartSubtotal =
    normalSubtotal +
    customSubtotal;


  // ==========================================================================
  // CART DISCOUNT
  // ==========================================================================

  const cartDiscount =
    useMemo(
      () =>
        cartLines.reduce(
          (
            total,
            item,
          ) =>
            total +
            item.lineDiscount,
          0,
        ),
      [
        cartLines,
      ],
    );


  // ==========================================================================
  // FREE SHIPPING
  // ==========================================================================

  const hasFreeShipping =
    cartSubtotal >=
    FREE_SHIPPING_THRESHOLD;


  const amountToFreeShipping =
    hasFreeShipping
      ? 0
      : Math.max(
          0,
          FREE_SHIPPING_THRESHOLD -
            cartSubtotal,
        );


  // ==========================================================================
  // SHIPPING
  // ==========================================================================

  const shippingCost =
    cartSubtotal === 0
      ? 0
      : hasFreeShipping
        ? 0
        : SHIPPING_FEE;


  // ==========================================================================
  // FINAL TOTAL
  // ==========================================================================

  const cartTotal =
    cartSubtotal +
    shippingCost;


  // ==========================================================================
  // WISHLIST COUNT
  // ==========================================================================

  const wishlistCount =
    wishlist.length;


  // ==========================================================================
  // CONTEXT VALUE
  // ==========================================================================

  const value =
    useMemo<ShopContextValue>(
      () => ({

        // Normal cart

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


        // Custom cart

        customCartLines,

        customCartCount,

        addCustomStickerToCart,

        removeCustomStickerFromCart,

        updateCustomStickerQuantity,

        updateCustomStickerDesign,

        clearCustomCart,


        // Combined cart

        clearAllCart,


        // Drawer

        isCartOpen,

        openCart,

        closeCart,


        // Wishlist

        wishlist,

        wishlistCount,

        isWishlisted,

        toggleWishlist,

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