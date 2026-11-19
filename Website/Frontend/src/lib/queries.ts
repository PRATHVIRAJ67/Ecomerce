import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { Banner, Category, Order, Paginated, ProductCard, ProductDetail } from '@ecommerce/shared';
import { api } from './api';

export interface StoreSettings {
  store_name?: string;
  store_tagline?: string;
  support_email?: string;
  support_phone?: string;
  shipping_fee?: number;
  free_shipping_threshold?: number;
  cod_enabled?: boolean;
  cod_max_order_value?: number;
  online_payments_enabled?: boolean;
  online_payments_available?: boolean;
  max_quantity_per_item?: number;
  maintenance_mode?: boolean;
}

export interface HomeFeed {
  banners: Banner[];
  categories: Category[];
  featured: ProductCard[];
  trending: ProductCard[];
  best_sellers: ProductCard[];
  new_arrivals: ProductCard[];
  settings: StoreSettings;
}

export type SortKey = 'relevance' | 'newest' | 'price_asc' | 'price_desc' | 'name' | 'popular';

export interface ProductQuery {
  q?: string;
  category?: string;
  sort?: SortKey;
  page?: number;
  limit?: number;
  min_price?: number;
  max_price?: number;
  in_stock?: boolean;
  featured?: boolean;
}

/** Catalogue data changes in the admin dashboard; keep it fresh but avoid refetch storms. */
const CATALOG_STALE = 60_000;

export const keys = {
  home: ['catalog', 'home'] as const,
  settings: ['catalog', 'settings'] as const,
  categories: ['catalog', 'categories'] as const,
  products: (q: ProductQuery) => ['catalog', 'products', q] as const,
  product: (slug: string) => ['catalog', 'product', slug] as const,
  lookup: (ids: string[]) => ['catalog', 'lookup', ids] as const,
  orders: (page: number) => ['me', 'orders', page] as const,
  order: (id: string) => ['me', 'order', id] as const,
  addresses: ['me', 'addresses'] as const,
  cart: ['me', 'cart'] as const,
  wishlist: ['me', 'wishlist'] as const,
  profile: ['me', 'profile'] as const,
};

export function useHome() {
  return useQuery({ queryKey: keys.home, queryFn: () => api.get<HomeFeed>('/catalog/home'), staleTime: CATALOG_STALE });
}

export function useSettings() {
  return useQuery({
    queryKey: keys.settings,
    queryFn: () => api.get<StoreSettings>('/catalog/settings'),
    staleTime: 5 * 60_000,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: keys.categories,
    queryFn: () => api.get<Category[]>('/catalog/categories'),
    staleTime: 5 * 60_000,
  });
}

export function useProducts(q: ProductQuery, enabled = true) {
  return useQuery({
    queryKey: keys.products(q),
    queryFn: ({ signal }) =>
      api.get<Paginated<ProductCard>>(
        '/catalog/products',
        {
          q: q.q,
          category: q.category,
          sort: q.sort,
          page: q.page,
          limit: q.limit,
          min_price: q.min_price,
          max_price: q.max_price,
          in_stock: q.in_stock ? 'true' : undefined,
          featured: q.featured ? 'true' : undefined,
        },
        signal,
      ),
    placeholderData: keepPreviousData,
    staleTime: CATALOG_STALE,
    enabled,
  });
}

export function useProduct(slug: string | undefined) {
  return useQuery({
    queryKey: keys.product(slug ?? ''),
    queryFn: () => api.get<ProductDetail>(`/catalog/products/${encodeURIComponent(slug!)}`),
    enabled: Boolean(slug),
    staleTime: 30_000,
    retry: (count, err) => (err as { status?: number }).status !== 404 && count < 2,
  });
}

export function useOrders(page: number, enabled = true) {
  return useQuery({
    queryKey: keys.orders(page),
    queryFn: () => api.get<Paginated<Order>>('/me/orders', { page, limit: 10 }),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useOrder(id: string | undefined, opts: { poll?: boolean } = {}) {
  return useQuery({
    queryKey: keys.order(id ?? ''),
    queryFn: () => api.get<Order>(`/me/orders/${id}`),
    enabled: Boolean(id),
    refetchInterval: opts.poll ? 30_000 : false,
    retry: (count, err) => (err as { status?: number }).status !== 404 && count < 2,
  });
}
