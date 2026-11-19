import type { Category } from '@ecommerce/shared';
import { PackageSearch, SlidersHorizontal, X } from 'lucide-react';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ProductGrid } from '../components/product/ProductCard';
import { Breadcrumbs, Button, Checkbox, Drawer, EmptyState, ErrorState, Pagination } from '../components/ui';
import { cn, plural } from '../lib/format';
import { Seo } from '../lib/seo';
import { useCategories, useProducts, type SortKey } from '../lib/queries';

const SORTS: { value: SortKey; label: string }[] = [
  { value: 'relevance', label: 'Recommended' },
  { value: 'popular', label: 'Best selling' },
  { value: 'newest', label: 'Newest first' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'name', label: 'Name: A–Z' },
];
const PAGE_SIZE = 24;

const num = (v: string | null) => {
  if (v == null || v === '') return undefined;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
};

export default function ShopPage() {
  const { slug } = useParams();
  const [params, setParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const categories = useCategories();

  const category = slug ?? params.get('category') ?? undefined;
  const q = params.get('q')?.trim() || undefined;
  const sortParam = params.get('sort') as SortKey | null;
  const sort: SortKey = sortParam && SORTS.some((s) => s.value === sortParam) ? sortParam : 'relevance';
  const page = Math.max(1, Math.floor(num(params.get('page')) ?? 1));
  const minPrice = num(params.get('min_price'));
  const maxPrice = num(params.get('max_price'));
  const inStock = params.get('in_stock') === 'true';
  const featured = params.get('featured') === 'true';

  const query = { q, category, sort, page, limit: PAGE_SIZE, min_price: minPrice, max_price: maxPrice, in_stock: inStock || undefined, featured: featured || undefined };
  const { data, isPending, isFetching, error, refetch, isPlaceholderData } = useProducts(query);

  const current = categories.data?.find((c) => c.slug === category);
  const parent = current?.parent_id ? categories.data?.find((c) => c.id === current.parent_id) : undefined;
  const children = current ? (categories.data ?? []).filter((c) => c.parent_id === current.id) : [];
  const unknownCategory = Boolean(category && categories.data && !current);

  const update = (patch: Record<string, string | null | undefined>, resetPage = true) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) {
      if (v == null || v === '' || v === 'false') next.delete(k);
      else next.set(k, v);
    }
    if (resetPage) next.delete('page');
    setParams(next, { replace: false });
  };

  const goToPage = (p: number) => {
    update({ page: p > 1 ? String(p) : null }, false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const title = q ? `Results for “${q}”` : current ? current.name : featured ? 'Featured products' : 'Shop all';
  const activeFilters = [
    minPrice != null || maxPrice != null ? { key: 'price', label: `₹${minPrice ?? 0} – ${maxPrice != null ? `₹${maxPrice}` : 'any'}`, clear: () => update({ min_price: null, max_price: null }) } : null,
    inStock ? { key: 'stock', label: 'In stock', clear: () => update({ in_stock: null }) } : null,
    featured ? { key: 'featured', label: 'Featured', clear: () => update({ featured: null }) } : null,
    q ? { key: 'q', label: `“${q}”`, clear: () => update({ q: null }) } : null,
  ].filter(Boolean) as { key: string; label: string; clear: () => void }[];

  const filters = (
    <Filters
      categories={categories.data ?? []}
      activeSlug={category}
      minPrice={minPrice}
      maxPrice={maxPrice}
      inStock={inStock}
      featured={featured}
      onPrice={(min, max) => update({ min_price: min, max_price: max })}
      onToggle={(key, v) => update({ [key]: v ? 'true' : null })}
      query={q}
    />
  );

  return (
    <div className="container-page py-6 sm:py-10">
      <Seo
        title={q ? `Search: ${q}` : current ? current.name : 'Shop all products'}
        description={current?.description ?? (q ? `Shop URU products matching “${q}”.` : 'Browse the full URU collection — produce, spices, pickles, staples, handloom and handicrafts from Indian villages.')}
        path={slug ? `/category/${slug}` : '/shop'}
        noindex={Boolean(q) || page > 1}
      />
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, ...(current || slug ? [{ label: 'Shop', to: '/shop' }] : []), ...(parent ? [{ label: parent.name, to: `/category/${parent.slug}` }] : []), { label: current?.name ?? (slug ? 'Category' : 'Shop') }]} />

      <header className="mt-4 mb-6 flex flex-col gap-2 sm:mb-8">
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-5xl">{title}</h1>
        {current?.description && <p className="max-w-2xl text-ink-soft">{current.description}</p>}
        {children.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-2">
            {children.map((c) => (
              <li key={c.id}>
                <Link to={`/category/${c.slug}`} className="inline-block rounded-full border border-line bg-white px-4 py-1.5 text-sm font-medium hover:border-forest-700">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </header>

      <div className="grid gap-8 lg:grid-cols-[250px_1fr]">
        <aside className="hidden lg:block" aria-label="Filters">
          <div className="sticky top-36">{filters}</div>
        </aside>

        <div>
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <Button variant="outline" size="sm" icon={SlidersHorizontal} onClick={() => setFiltersOpen(true)} className="lg:hidden">
              Filters{activeFilters.length ? ` (${activeFilters.length})` : ''}
            </Button>
            <p className="text-sm text-muted" aria-live="polite">
              {data ? plural(data.total, 'product') : isPending ? 'Loading…' : ''}
            </p>
            <label className="ml-auto flex items-center gap-2 text-sm">
              <span className="hidden text-muted sm:inline">Sort by</span>
              <select value={sort} onChange={(e) => update({ sort: e.target.value === 'relevance' ? null : e.target.value })} className="h-9 rounded-xl border border-line bg-white px-3 text-sm font-medium focus:border-forest-600 focus:outline-none">
                {SORTS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {activeFilters.length > 0 && (
            <div className="mb-5 flex flex-wrap items-center gap-2">
              {activeFilters.map((f) => (
                <button key={f.key} type="button" onClick={f.clear} className="inline-flex items-center gap-1.5 rounded-full bg-forest-100 px-3 py-1 text-sm font-medium text-forest-800 hover:bg-forest-200" aria-label={`Remove filter ${f.label}`}>
                  {f.label} <X className="size-3.5" aria-hidden />
                </button>
              ))}
              <button type="button" onClick={() => setParams(new URLSearchParams())} className="text-sm font-medium text-terracotta-600 hover:underline">
                Clear all
              </button>
            </div>
          )}

          {unknownCategory ? (
            <EmptyState icon={PackageSearch} title="Category not found" action={<Link to="/shop" className="font-semibold text-forest-700 underline">Browse all products</Link>}>
              This category may have been renamed or is no longer available.
            </EmptyState>
          ) : error ? (
            <ErrorState error={error} onRetry={() => void refetch()} />
          ) : data && data.items.length === 0 ? (
            <EmptyState
              icon={PackageSearch}
              title={q ? 'No matches found' : 'Nothing here yet'}
              action={
                <Button variant="primary" onClick={() => setParams(new URLSearchParams())}>
                  Clear filters
                </Button>
              }
            >
              {q ? `We couldn't find products for “${q}”. Try a simpler word, or check the spelling.` : 'No products match these filters right now.'}
            </EmptyState>
          ) : (
            <div className={cn('transition-opacity', isFetching && isPlaceholderData && 'opacity-60')} aria-busy={isFetching}>
              <ProductGrid products={data?.items} loading={isPending} count={12} />
              {data && <Pagination page={page} total={data.total} limit={PAGE_SIZE} onPage={goToPage} />}
            </div>
          )}
        </div>
      </div>

      <Drawer open={filtersOpen} onClose={() => setFiltersOpen(false)} title="Filters" side="left" footer={<Button className="w-full" onClick={() => setFiltersOpen(false)}>Show {data ? plural(data.total, 'product') : 'results'}</Button>}>
        <div className="p-5">{filters}</div>
      </Drawer>
    </div>
  );
}

interface FiltersProps {
  categories: Category[];
  activeSlug?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock: boolean;
  featured: boolean;
  query?: string;
  onPrice: (min: string | null, max: string | null) => void;
  onToggle: (key: 'in_stock' | 'featured', value: boolean) => void;
}

function Filters({ categories, activeSlug, minPrice, maxPrice, inStock, featured, query, onPrice, onToggle }: FiltersProps) {
  const [min, setMin] = useState(minPrice?.toString() ?? '');
  const [max, setMax] = useState(maxPrice?.toString() ?? '');
  const [priceError, setPriceError] = useState<string | null>(null);
  useEffect(() => {
    setMin(minPrice?.toString() ?? '');
    setMax(maxPrice?.toString() ?? '');
  }, [minPrice, maxPrice]);

  const top = useMemo(() => categories.filter((c) => !c.parent_id), [categories]);
  const qs = query ? `?q=${encodeURIComponent(query)}` : '';

  const applyPrice = (e: FormEvent) => {
    e.preventDefault();
    const a = min.trim() === '' ? null : Number(min);
    const b = max.trim() === '' ? null : Number(max);
    if ((a != null && (!Number.isFinite(a) || a < 0)) || (b != null && (!Number.isFinite(b) || b < 0))) {
      setPriceError('Enter a valid amount');
      return;
    }
    if (a != null && b != null && a > b) {
      setPriceError('Minimum must be less than maximum');
      return;
    }
    setPriceError(null);
    onPrice(a != null ? String(a) : null, b != null ? String(b) : null);
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="mb-3 text-xs font-semibold tracking-[0.16em] text-muted uppercase">Category</h2>
        <ul className="space-y-0.5">
          <li>
            <Link to={`/shop${qs}`} className={cn('block rounded-lg px-3 py-2 text-sm', !activeSlug ? 'bg-forest-700 font-semibold text-cream' : 'text-ink-soft hover:bg-forest-50')}>
              All products
            </Link>
          </li>
          {top.map((c) => (
            <li key={c.id}>
              <Link to={`/category/${c.slug}${qs}`} className={cn('flex items-center justify-between rounded-lg px-3 py-2 text-sm', activeSlug === c.slug ? 'bg-forest-700 font-semibold text-cream' : 'text-ink-soft hover:bg-forest-50')}>
                {c.name}
                {typeof c.product_count === 'number' && <span className={cn('text-xs tabular', activeSlug === c.slug ? 'text-cream/70' : 'text-muted')}>{c.product_count}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <form onSubmit={applyPrice} noValidate>
        <h2 className="mb-3 text-xs font-semibold tracking-[0.16em] text-muted uppercase">Price (₹)</h2>
        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor="min-price">
            Minimum price
          </label>
          <input id="min-price" inputMode="numeric" placeholder="Min" value={min} onChange={(e) => setMin(e.target.value.replace(/[^\d.]/g, ''))} className="h-10 w-full rounded-xl border border-line bg-white px-3 text-sm focus:border-forest-600 focus:outline-none" />
          <span className="text-muted">–</span>
          <label className="sr-only" htmlFor="max-price">
            Maximum price
          </label>
          <input id="max-price" inputMode="numeric" placeholder="Max" value={max} onChange={(e) => setMax(e.target.value.replace(/[^\d.]/g, ''))} className="h-10 w-full rounded-xl border border-line bg-white px-3 text-sm focus:border-forest-600 focus:outline-none" />
        </div>
        {priceError && (
          <p className="mt-2 text-[13px] text-danger" role="alert">
            {priceError}
          </p>
        )}
        <Button type="submit" variant="outline" size="sm" className="mt-3 w-full">
          Apply price
        </Button>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {[
            [null, '250'],
            ['250', '500'],
            ['500', '1000'],
            ['1000', null],
          ].map(([a, b]) => (
            <button key={`${a}-${b}`} type="button" onClick={() => onPrice(a!, b!)} className="rounded-full border border-line bg-white px-2.5 py-1 text-xs font-medium text-ink-soft hover:border-forest-700">
              {a ? (b ? `₹${a}–${b}` : `Over ₹${a}`) : `Under ₹${b}`}
            </button>
          ))}
        </div>
      </form>

      <div className="space-y-3">
        <h2 className="text-xs font-semibold tracking-[0.16em] text-muted uppercase">Availability</h2>
        <Checkbox label="In stock only" checked={inStock} onChange={(e) => onToggle('in_stock', e.target.checked)} />
        <Checkbox label="Featured products" checked={featured} onChange={(e) => onToggle('featured', e.target.checked)} />
      </div>
    </div>
  );
}
