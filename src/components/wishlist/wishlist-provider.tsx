"use client"

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"


// ============================================================================
// TYPES
// ============================================================================

type WishlistContextType = {
  wishlist: string[]
  isWishlisted: (productId: string) => boolean
  toggleWishlist: (productId: string) => void
  removeFromWishlist: (productId: string) => void
  clearWishlist: () => void
}


// ============================================================================
// CONTEXT
// ============================================================================

const WishlistContext =
  createContext<WishlistContextType | undefined>(
    undefined,
  )


const STORAGE_KEY =
  "stickhive-wishlist"


// ============================================================================
// PROVIDER
// ============================================================================

export function WishlistProvider({
  children,
}: {
  children: React.ReactNode
}) {

  const [wishlist, setWishlist] =
    useState<string[]>([])


  const [hydrated, setHydrated] =
    useState(false)


  // ==========================================================================
  // LOAD WISHLIST
  // ==========================================================================

  useEffect(() => {

    try {

      const saved =
        localStorage.getItem(
          STORAGE_KEY,
        )


      if (saved) {

        const parsed =
          JSON.parse(saved)


        if (
          Array.isArray(parsed)
        ) {

          setWishlist(parsed)

        }

      }

    } catch (error) {

      console.error(
        "Unable to load wishlist:",
        error,
      )

    } finally {

      setHydrated(true)

    }

  }, [])


  // ==========================================================================
  // SAVE WISHLIST
  // ==========================================================================

  useEffect(() => {

    if (!hydrated) return


    try {

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(wishlist),
      )

    } catch (error) {

      console.error(
        "Unable to save wishlist:",
        error,
      )

    }

  }, [
    wishlist,
    hydrated,
  ])


  // ==========================================================================
  // CHECK WISHLIST
  // ==========================================================================

  function isWishlisted(
    productId: string,
  ) {

    return wishlist.includes(
      productId,
    )

  }


  // ==========================================================================
  // TOGGLE WISHLIST
  // ==========================================================================

  function toggleWishlist(
    productId: string,
  ) {

    setWishlist((current) => {

      if (
        current.includes(productId)
      ) {

        return current.filter(
          (id) =>
            id !== productId,
        )

      }


      return [
        ...current,
        productId,
      ]

    })

  }


  // ==========================================================================
  // REMOVE
  // ==========================================================================

  function removeFromWishlist(
    productId: string,
  ) {

    setWishlist((current) =>
      current.filter(
        (id) =>
          id !== productId,
      ),
    )

  }


  // ==========================================================================
  // CLEAR
  // ==========================================================================

  function clearWishlist() {

    setWishlist([])

  }


  // ==========================================================================
  // CONTEXT VALUE
  // ==========================================================================

  const value =
    useMemo(
      () => ({
        wishlist,
        isWishlisted,
        toggleWishlist,
        removeFromWishlist,
        clearWishlist,
      }),
      [wishlist],
    )


  return (

    <WishlistContext.Provider
      value={value}
    >
      {children}
    </WishlistContext.Provider>

  )

}


// ============================================================================
// HOOK
// ============================================================================

export function useWishlist() {

  const context =
    useContext(
      WishlistContext,
    )


  if (!context) {

    throw new Error(
      "useWishlist must be used inside WishlistProvider",
    )

  }


  return context

}