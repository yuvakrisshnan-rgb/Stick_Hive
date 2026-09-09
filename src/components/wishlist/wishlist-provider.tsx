"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAuth } from "@/components/auth/auth-provider";

type WishlistContextType = {
  wishlist: string[];
  isWishlisted: (productId: string) => boolean;
  toggleWishlist: (productId: string) => void;
  removeFromWishlist: (productId: string) => void;
  clearWishlist: () => void;
  loading: boolean;
  syncing: boolean;
};

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);
const STORAGE_KEY = "stickhive-wishlist";

function readLocalWishlist(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed)
      ? [...new Set(parsed.filter((id): id is string => typeof id === "string"))]
      : [];
  } catch {
    return [];
  }
}

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const syncGeneration = useRef(0);

  useEffect(() => {
    setWishlist(readLocalWishlist());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || user) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(wishlist));
    } catch {
      // Ignore local storage failures; the UI remains usable in memory.
    }
  }, [hydrated, user, wishlist]);

  const fetchServerWishlist = useCallback(async () => {
    const response = await fetch("/api/wishlist", {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });
    const payload = (await response.json().catch(() => null)) as
      | { success?: boolean; productIds?: unknown; error?: string }
      | null;
    if (!response.ok || !payload?.success) {
      throw new Error(payload?.error || "Unable to load wishlist.");
    }
    return Array.isArray(payload.productIds)
      ? [...new Set(payload.productIds.filter((id): id is string => typeof id === "string"))]
      : [];
  }, []);

  const saveServerWishlist = useCallback(async (productIds: string[]) => {
    const response = await fetch("/api/wishlist", {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productIds }),
    });
    const payload = (await response.json().catch(() => null)) as
      | { success?: boolean; productIds?: unknown; error?: string }
      | null;
    if (!response.ok || !payload?.success) {
      throw new Error(payload?.error || "Unable to update wishlist.");
    }
  }, []);

  useEffect(() => {
    if (!hydrated || authLoading) return;

    if (!user) {
      setSyncing(false);
      return;
    }

    const generation = ++syncGeneration.current;

    void (async () => {
      setSyncing(true);
      try {
        const serverIds = await fetchServerWishlist();
        const localIds = readLocalWishlist();
        const merged = [...new Set([...serverIds, ...localIds])];
        if (generation !== syncGeneration.current) return;
        setWishlist(merged);
        await saveServerWishlist(merged);
        try {
          localStorage.removeItem(STORAGE_KEY);
        } catch {
          // Non-fatal.
        }
      } catch (error) {
        console.error("Unable to sync wishlist:", error);
        if (generation === syncGeneration.current) {
          // Keep the local copy so the customer does not lose saved stickers.
          setWishlist(readLocalWishlist());
        }
      } finally {
        if (generation === syncGeneration.current) setSyncing(false);
      }
    })();
  }, [authLoading, fetchServerWishlist, hydrated, saveServerWishlist, user]);

  const persistForUser = useCallback(
    (next: string[]) => {
      if (!user) return;
      void saveServerWishlist(next).catch((error) => {
        console.error("Unable to save wishlist:", error);
      });
    },
    [saveServerWishlist, user],
  );

  const isWishlisted = useCallback(
    (productId: string) => wishlist.includes(productId),
    [wishlist],
  );

  const toggleWishlist = useCallback(
    (productId: string) => {
      setWishlist((current) => {
        const next = current.includes(productId)
          ? current.filter((id) => id !== productId)
          : [...current, productId];
        persistForUser(next);
        return next;
      });
    },
    [persistForUser],
  );

  const removeFromWishlist = useCallback(
    (productId: string) => {
      setWishlist((current) => {
        const next = current.filter((id) => id !== productId);
        persistForUser(next);
        return next;
      });
    },
    [persistForUser],
  );

  const clearWishlist = useCallback(() => {
    setWishlist([]);
    persistForUser([]);
  }, [persistForUser]);

  const value = useMemo(
    () => ({
      wishlist,
      isWishlisted,
      toggleWishlist,
      removeFromWishlist,
      clearWishlist,
      loading: authLoading || !hydrated,
      syncing,
    }),
    [
      authLoading,
      clearWishlist,
      hydrated,
      isWishlisted,
      removeFromWishlist,
      syncing,
      toggleWishlist,
      wishlist,
    ],
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) throw new Error("useWishlist must be used inside WishlistProvider");
  return context;
}
