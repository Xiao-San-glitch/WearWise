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
import { Check } from "lucide-react";

const STORAGE_KEY = "wearwise:store:v1";

export interface CartLine {
  key: string;
  productId: string;
  slug: string;
  name: string;
  brand: string;
  image: string;
  price: number;
  mrp: number;
  size: string;
  quantity: number;
  retailer: string;
  affiliateUrl: string;
}

export interface WishlistProduct {
  id: string;
  slug: string;
  name: string;
  brand: string;
  image: string;
  price: number;
  mrp: number;
  category: string;
}

export interface SavedLookItem {
  id: string;
  slug: string;
  name: string;
  brand: string;
  image: string;
  price: number;
}

export interface SavedLook {
  id: string;
  title: string;
  items: SavedLookItem[];
  total: number;
  createdAt: string;
  explanation?: string;
}

interface PersistedState {
  cart: CartLine[];
  wishlist: WishlistProduct[];
  looks: SavedLook[];
}

interface StoreContextValue extends PersistedState {
  hydrated: boolean;
  cartCount: number;
  cartSubtotal: number;
  addToCart: (item: Omit<CartLine, "key" | "quantity">, quantity?: number) => void;
  updateQuantity: (key: string, quantity: number) => void;
  updateSize: (key: string, size: string) => void;
  removeFromCart: (key: string) => void;
  clearCart: () => void;
  isWishlisted: (id: string) => boolean;
  toggleWishlist: (product: WishlistProduct) => void;
  saveLook: (look: Omit<SavedLook, "createdAt" | "id"> & { id?: string }) => void;
  removeLook: (id: string) => void;
  notify: (message: string) => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

function readState(): PersistedState {
  if (typeof window === "undefined") return { cart: [], wishlist: [], looks: [] };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { cart: [], wishlist: [], looks: [] };
    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    return {
      cart: Array.isArray(parsed.cart) ? parsed.cart : [],
      wishlist: Array.isArray(parsed.wishlist) ? parsed.wishlist : [],
      looks: Array.isArray(parsed.looks) ? parsed.looks : [],
    };
  } catch {
    return { cart: [], wishlist: [], looks: [] };
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PersistedState>({ cart: [], wishlist: [], looks: [] });
  const [hydrated, setHydrated] = useState(false);
  const [toast, setToast] = useState<{ id: number; message: string } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setState(readState());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage may be unavailable in private mode */
    }
  }, [state, hydrated]);

  const notify = useCallback((message: string) => {
    setToast({ id: Date.now(), message });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const addToCart = useCallback<StoreContextValue["addToCart"]>((item, quantity = 1) => {
    const key = `${item.productId}:${item.size}`;
    setState((prev) => {
      const existing = prev.cart.find((line) => line.key === key);
      const cart = existing
        ? prev.cart.map((line) =>
            line.key === key ? { ...line, quantity: Math.min(line.quantity + quantity, 10) } : line,
          )
        : [...prev.cart, { ...item, key, quantity }];
      return { ...prev, cart };
    });
    notify(`${item.name} added to bag`);
  }, [notify]);

  const updateQuantity = useCallback<StoreContextValue["updateQuantity"]>((key, quantity) => {
    setState((prev) => ({
      ...prev,
      cart:
        quantity <= 0
          ? prev.cart.filter((line) => line.key !== key)
          : prev.cart.map((line) => (line.key === key ? { ...line, quantity: Math.min(quantity, 10) } : line)),
    }));
  }, []);

  const updateSize = useCallback<StoreContextValue["updateSize"]>((key, size) => {
    setState((prev) => {
      const line = prev.cart.find((entry) => entry.key === key);
      if (!line) return prev;
      const nextKey = `${line.productId}:${size}`;
      if (nextKey === key) return prev;
      const collision = prev.cart.find((entry) => entry.key === nextKey && entry.key !== key);
      const cart = collision
        ? prev.cart
            .filter((entry) => entry.key !== key)
            .map((entry) =>
              entry.key === nextKey
                ? { ...entry, quantity: Math.min(entry.quantity + line.quantity, 10) }
                : entry,
            )
        : prev.cart.map((entry) => (entry.key === key ? { ...entry, key: nextKey, size } : entry));
      return { ...prev, cart };
    });
  }, []);

  const removeFromCart = useCallback<StoreContextValue["removeFromCart"]>((key) => {
    setState((prev) => ({ ...prev, cart: prev.cart.filter((line) => line.key !== key) }));
  }, []);

  const clearCart = useCallback(() => setState((prev) => ({ ...prev, cart: [] })), []);

  const isWishlisted = useCallback(
    (id: string) => state.wishlist.some((item) => item.id === id),
    [state.wishlist],
  );

  const toggleWishlist = useCallback<StoreContextValue["toggleWishlist"]>(
    (product) => {
      setState((prev) => {
        const exists = prev.wishlist.some((item) => item.id === product.id);
        return {
          ...prev,
          wishlist: exists
            ? prev.wishlist.filter((item) => item.id !== product.id)
            : [product, ...prev.wishlist],
        };
      });
      notify(isWishlisted(product.id) ? `${product.name} removed from wishlist` : `${product.name} saved to wishlist`);
    },
    [notify, isWishlisted],
  );

  const saveLook = useCallback<StoreContextValue["saveLook"]>(
    (look) => {
      setState((prev) => {
        const id = look.id ?? `look_${Date.now()}`;
        const exists = prev.looks.some((item) => item.id === id);
        const entry: SavedLook = {
          id,
          title: look.title,
          items: look.items,
          total: look.total,
          explanation: look.explanation,
          createdAt: new Date().toISOString(),
        };
        return {
          ...prev,
          looks: exists ? prev.looks.map((item) => (item.id === id ? entry : item)) : [entry, ...prev.looks],
        };
      });
      notify("Look saved to your wishlist");
    },
    [notify],
  );

  const removeLook = useCallback((id: string) => {
    setState((prev) => ({ ...prev, looks: prev.looks.filter((item) => item.id !== id) }));
  }, []);

  const value = useMemo<StoreContextValue>(() => {
    const cartCount = state.cart.reduce((sum, line) => sum + line.quantity, 0);
    const cartSubtotal = state.cart.reduce((sum, line) => sum + line.price * line.quantity, 0);
    return {
      ...state,
      hydrated,
      cartCount,
      cartSubtotal,
      addToCart,
      updateQuantity,
      updateSize,
      removeFromCart,
      clearCart,
      isWishlisted,
      toggleWishlist,
      saveLook,
      removeLook,
      notify,
    };
  }, [
    state,
    hydrated,
    addToCart,
    updateQuantity,
    updateSize,
    removeFromCart,
    clearCart,
    isWishlisted,
    toggleWishlist,
    saveLook,
    removeLook,
    notify,
  ]);

  return (
    <StoreContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-6 z-[80] flex justify-center px-4"
      >
        {toast && (
          <div
            key={toast.id}
            className="animate-fadeUp flex items-center gap-2.5 rounded-full bg-ink px-5 py-3 text-[12px] text-cream shadow-lift"
          >
            <Check className="h-3.5 w-3.5" />
            {toast.message}
          </div>
        )}
      </div>
    </StoreContext.Provider>
  );
}

export function useStore(): StoreContextValue {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useStore must be used inside StoreProvider");
  return context;
}
