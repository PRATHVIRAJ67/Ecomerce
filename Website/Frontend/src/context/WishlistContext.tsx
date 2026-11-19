import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { ProductCard } from '@ecommerce/shared';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { api, errorMessage } from '../lib/api';
import { keys } from '../lib/queries';
import { readJSON, writeJSON } from '../lib/storage';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

interface WishlistState {
  items: ProductCard[] | undefined;
  ids: Set<string>;
  count: number;
  isLoading: boolean;
  error: unknown;
  refetch: () => void;
  has: (productId: string) => boolean;
  toggle: (product: Pick<ProductCard, 'id' | 'name'>) => Promise<void>;
  remove: (productId: string) => Promise<void>;
}

const STORAGE_KEY = 'uru-guest-wishlist';
const WishlistContext = createContext<WishlistState | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { isSignedIn, ready, session } = useAuth();
  const toast = useToast();
  const qc = useQueryClient();
  const userId = session?.user.id;
  const [guestIds, setGuestIds] = useState<string[]>(() => readJSON<string[]>(STORAGE_KEY, []));
  const merging = useRef(false);

  useEffect(() => writeJSON(STORAGE_KEY, guestIds), [guestIds]);

  const server = useQuery({
    queryKey: [...keys.wishlist, userId],
    queryFn: () => api.get<ProductCard[]>('/me/wishlist'),
    enabled: isSignedIn,
    staleTime: 30_000,
  });

  const guest = useQuery({
    queryKey: keys.lookup(guestIds),
    queryFn: () => api.get<ProductCard[]>('/catalog/products-lookup', { ids: guestIds.join(',') }),
    enabled: ready && !isSignedIn && guestIds.length > 0,
    staleTime: 60_000,
  });

  // Move the guest wishlist into the account after sign-in.
  useEffect(() => {
    if (!isSignedIn || !guestIds.length || merging.current) return;
    merging.current = true;
    Promise.allSettled(guestIds.map((id) => api.put(`/me/wishlist/${id}`)))
      .then(() => {
        setGuestIds([]);
        return qc.invalidateQueries({ queryKey: keys.wishlist });
      })
      .finally(() => {
        merging.current = false;
      });
  }, [isSignedIn, guestIds, qc]);

  const items = isSignedIn ? server.data : guestIds.length ? guest.data?.filter((p) => guestIds.includes(p.id)) : [];
  const ids = useMemo(() => new Set(isSignedIn ? (server.data ?? []).map((p) => p.id) : guestIds), [isSignedIn, server.data, guestIds]);

  const setServer = useCallback(
    (fn: (list: ProductCard[]) => ProductCard[]) => qc.setQueryData<ProductCard[]>([...keys.wishlist, userId], (old) => fn(old ?? [])),
    [qc, userId],
  );

  const remove = useCallback(
    async (productId: string) => {
      if (!isSignedIn) {
        setGuestIds((g) => g.filter((id) => id !== productId));
        return;
      }
      const snapshot = server.data;
      setServer((l) => l.filter((p) => p.id !== productId));
      try {
        await api.del(`/me/wishlist/${productId}`);
      } catch (e) {
        if (snapshot) qc.setQueryData([...keys.wishlist, userId], snapshot);
        toast.error(errorMessage(e));
      }
    },
    [isSignedIn, server.data, setServer, qc, userId, toast],
  );

  const toggle = useCallback(
    async (product: Pick<ProductCard, 'id' | 'name'>) => {
      if (ids.has(product.id)) {
        await remove(product.id);
        toast.info(`Removed ${product.name} from your wishlist`);
        return;
      }
      if (!isSignedIn) {
        setGuestIds((g) => [product.id, ...g.filter((x) => x !== product.id)].slice(0, 50));
        toast.success(`Saved ${product.name} to your wishlist`, { label: 'View', to: '/wishlist' });
        return;
      }
      try {
        await api.put(`/me/wishlist/${product.id}`);
        await qc.invalidateQueries({ queryKey: keys.wishlist });
        toast.success(`Saved ${product.name} to your wishlist`, { label: 'View', to: '/wishlist' });
      } catch (e) {
        toast.error(errorMessage(e));
      }
    },
    [ids, isSignedIn, remove, qc, toast],
  );

  const value = useMemo<WishlistState>(() => {
    const q = isSignedIn ? server : guest;
    return {
      items,
      ids,
      count: ids.size,
      isLoading: !ready || (isSignedIn ? server.isPending : guestIds.length > 0 && guest.isPending),
      error: q.error,
      refetch: () => void q.refetch(),
      has: (id) => ids.has(id),
      toggle,
      remove,
    };
  }, [isSignedIn, server, guest, items, ids, ready, guestIds.length, toggle, remove]);

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist(): WishlistState {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used inside <WishlistProvider>');
  return ctx;
}
