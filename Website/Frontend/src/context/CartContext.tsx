import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CartSummary, ProductCard } from '@ecommerce/shared';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { api, errorMessage } from '../lib/api';
import { keys } from '../lib/queries';
import { readJSON, writeJSON } from '../lib/storage';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

interface GuestLine {
  product_id: string;
  quantity: number;
}

interface CartState {
  summary: CartSummary | undefined;
  count: number;
  isLoading: boolean;
  error: unknown;
  refetch: () => void;
  quantityOf: (productId: string) => number;
  isPending: (productId: string) => boolean;
  /** Adds to the existing quantity. Returns true on success. */
  add: (product: ProductCard, quantity?: number) => Promise<boolean>;
  setQuantity: (product: Pick<ProductCard, 'id' | 'name' | 'max_order_quantity' | 'in_stock'>, quantity: number) => Promise<boolean>;
  remove: (productId: string) => Promise<void>;
  clear: () => Promise<void>;
}

const STORAGE_KEY = 'uru-guest-cart';
const EMPTY: CartSummary = { lines: [], item_count: 0, subtotal: 0, shipping_fee: 0, total: 0, has_unavailable_items: false };

const CartContext = createContext<CartState | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { isSignedIn, ready, session } = useAuth();
  const toast = useToast();
  const qc = useQueryClient();
  const [guest, setGuest] = useState<GuestLine[]>(() => readJSON<GuestLine[]>(STORAGE_KEY, []));
  const [pending, setPending] = useState<Set<string>>(new Set());
  const merging = useRef(false);
  const userId = session?.user.id;

  useEffect(() => writeJSON(STORAGE_KEY, guest), [guest]);

  // Keep tabs in sync for the guest cart.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setGuest(readJSON<GuestLine[]>(STORAGE_KEY, []));
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const serverCart = useQuery({
    queryKey: [...keys.cart, userId],
    queryFn: () => api.get<CartSummary>('/me/cart'),
    enabled: isSignedIn,
    staleTime: 15_000,
  });

  const guestCart = useQuery({
    queryKey: ['catalog', 'cart-preview', guest],
    queryFn: () => api.post<CartSummary>('/catalog/cart-preview', { items: guest }),
    enabled: ready && !isSignedIn && guest.length > 0,
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  });

  const setServerCart = useCallback((c: CartSummary) => qc.setQueryData([...keys.cart, userId], c), [qc, userId]);

  // After sign-in, move the guest cart into the account (server skips unavailable items).
  useEffect(() => {
    if (!isSignedIn || !guest.length || merging.current) return;
    merging.current = true;
    api
      .post<CartSummary>('/me/cart/merge', { items: guest })
      .then((c) => {
        setServerCart(c);
        setGuest([]);
      })
      .catch((e) => toast.error(`We couldn't move your saved cart: ${errorMessage(e)}`))
      .finally(() => {
        merging.current = false;
      });
  }, [isSignedIn, guest, setServerCart, toast]);

  const summary: CartSummary | undefined = isSignedIn ? serverCart.data : guest.length ? guestCart.data : EMPTY;

  const quantityOf = useCallback(
    (id: string) => (isSignedIn ? (summary?.lines.find((l) => l.product_id === id)?.quantity ?? 0) : (guest.find((g) => g.product_id === id)?.quantity ?? 0)),
    [isSignedIn, summary, guest],
  );

  const markPending = (id: string, on: boolean) =>
    setPending((s) => {
      const n = new Set(s);
      if (on) n.add(id);
      else n.delete(id);
      return n;
    });

  const setQuantity = useCallback<CartState['setQuantity']>(
    async (product, quantity) => {
      const qty = Math.max(0, Math.floor(quantity));
      if (qty > 0 && !product.in_stock) {
        toast.error(`${product.name} is out of stock`);
        return false;
      }
      if (qty > product.max_order_quantity) {
        toast.info(`Only ${product.max_order_quantity} of ${product.name} can be ordered right now`);
        return false;
      }
      if (!isSignedIn) {
        setGuest((g) => {
          const rest = g.filter((l) => l.product_id !== product.id);
          if (qty === 0) return rest;
          const idx = g.findIndex((l) => l.product_id === product.id);
          const line = { product_id: product.id, quantity: qty };
          if (idx === -1) return [...g, line];
          const copy = [...g];
          copy[idx] = line;
          return copy;
        });
        return true;
      }
      markPending(product.id, true);
      try {
        setServerCart(await api.put<CartSummary>(`/me/cart/${product.id}`, { quantity: qty }));
        return true;
      } catch (e) {
        toast.error(errorMessage(e));
        void serverCart.refetch();
        return false;
      } finally {
        markPending(product.id, false);
      }
    },
    [isSignedIn, setServerCart, serverCart, toast],
  );

  const add = useCallback<CartState['add']>(
    async (product, quantity = 1) => {
      const current = quantityOf(product.id);
      const next = current + quantity;
      if (next > product.max_order_quantity) {
        if (current >= product.max_order_quantity) {
          toast.info(`You already have the maximum (${product.max_order_quantity}) of ${product.name} in your cart`);
          return false;
        }
      }
      const ok = await setQuantity(product, Math.min(next, product.max_order_quantity));
      if (ok) toast.success(`${product.name} added to cart`, { label: 'View cart', to: '/cart' });
      return ok;
    },
    [quantityOf, setQuantity, toast],
  );

  const remove = useCallback<CartState['remove']>(
    async (productId) => {
      if (!isSignedIn) {
        setGuest((g) => g.filter((l) => l.product_id !== productId));
        return;
      }
      markPending(productId, true);
      try {
        setServerCart(await api.put<CartSummary>(`/me/cart/${productId}`, { quantity: 0 }));
      } catch (e) {
        toast.error(errorMessage(e));
      } finally {
        markPending(productId, false);
      }
    },
    [isSignedIn, setServerCart, toast],
  );

  const clear = useCallback(async () => {
    if (!isSignedIn) {
      setGuest([]);
      return;
    }
    try {
      setServerCart(await api.del<CartSummary>('/me/cart'));
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }, [isSignedIn, setServerCart, toast]);

  const value = useMemo<CartState>(() => {
    const query = isSignedIn ? serverCart : guestCart;
    const count = isSignedIn ? (summary?.item_count ?? 0) : guest.reduce((n, l) => n + l.quantity, 0);
    return {
      summary,
      count,
      isLoading: !ready || (isSignedIn ? serverCart.isPending : guest.length > 0 && guestCart.isPending),
      error: query.error,
      refetch: () => void query.refetch(),
      quantityOf,
      isPending: (id) => pending.has(id),
      add,
      setQuantity,
      remove,
      clear,
    };
  }, [isSignedIn, ready, serverCart, guestCart, summary, guest, quantityOf, pending, add, setQuantity, remove, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartState {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
}
