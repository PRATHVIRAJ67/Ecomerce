import { ArrowUpRight, Loader2, Search, X } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { cn, formatINR } from '../../lib/format';
import { useProducts } from '../../lib/queries';
import { ProductImage } from '../product/ProductImage';

function useDebounced<T>(value: T, ms = 250): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setV(value), ms);
    return () => window.clearTimeout(t);
  }, [value, ms]);
  return v;
}

/** Accessible combobox: live product suggestions, ↑/↓ to move, Enter to open, Esc to close. */
export function SearchBox({ className, autoFocus, onDone }: { className?: string; autoFocus?: boolean; onDone?: () => void }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const [text, setText] = useState(() => (location.pathname === '/shop' ? (params.get('q') ?? '') : ''));
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const wrap = useRef<HTMLDivElement>(null);
  const listId = useId();
  const term = useDebounced(text.trim());
  const enabled = open && term.length >= 2;
  const { data, isFetching } = useProducts({ q: term, limit: 6 }, enabled);
  const results = enabled ? (data?.items ?? []) : [];

  useEffect(() => {
    if (location.pathname !== '/shop') return;
    setText(params.get('q') ?? '');
  }, [location.pathname, params]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  useEffect(() => setActive(-1), [term]);

  const submit = (q: string) => {
    setOpen(false);
    onDone?.();
    navigate(q.trim() ? `/shop?q=${encodeURIComponent(q.trim())}` : '/shop');
  };

  const go = (slug: string) => {
    setOpen(false);
    onDone?.();
    navigate(`/product/${slug}`);
  };

  return (
    <div ref={wrap} className={cn('relative', className)}>
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          const pick = results[active];
          if (pick) go(pick.slug);
          else submit(text);
        }}
      >
        <label htmlFor={`${listId}-input`} className="sr-only">
          Search products
        </label>
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-4 size-[18px] -translate-y-1/2 text-muted" aria-hidden />
          <input
            id={`${listId}-input`}
            type="search"
            value={text}
            autoFocus={autoFocus}
            autoComplete="off"
            placeholder="Search mangoes, spices, sarees…"
            role="combobox"
            aria-expanded={open && results.length > 0}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
            maxLength={100}
            onFocus={() => setOpen(true)}
            onChange={(e) => {
              setText(e.target.value);
              setOpen(true);
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActive((a) => Math.min(a + 1, results.length - 1));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActive((a) => Math.max(a - 1, -1));
              } else if (e.key === 'Escape') {
                setOpen(false);
              }
            }}
            className="h-11 w-full rounded-full border border-line bg-white pr-10 pl-11 text-[15px] placeholder:text-muted/80 focus:border-forest-600 focus:ring-4 focus:ring-forest-600/10 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
          />
          {isFetching && enabled ? (
            <Loader2 className="absolute top-1/2 right-4 size-4 -translate-y-1/2 animate-spin text-muted" aria-hidden />
          ) : text ? (
            <button type="button" onClick={() => setText('')} className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-1 text-muted hover:text-ink" aria-label="Clear search">
              <X className="size-4" aria-hidden />
            </button>
          ) : null}
        </div>
      </form>

      {open && enabled && !isFetching && results.length === 0 && data && (
        <div className="absolute inset-x-0 top-full z-50 mt-2 rounded-2xl border border-line bg-white p-5 text-sm text-ink-soft shadow-lift">
          No products match “{term}”. Try a different word.
        </div>
      )}

      {open && results.length > 0 && (
        <ul id={listId} role="listbox" aria-label="Product suggestions" className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-line bg-white py-2 shadow-lift">
          {results.map((p, i) => (
            <li
              key={p.id}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseEnter={() => setActive(i)}
              onMouseDown={(e) => {
                e.preventDefault();
                go(p.slug);
              }}
              className={cn('flex cursor-pointer items-center gap-3 px-3 py-2', i === active && 'bg-forest-50')}
            >
              <ProductImage src={p.images[0]?.url} alt="" seed={p.category_slug ?? p.slug} hints={[p.category_name, p.name]} className="size-11 shrink-0 rounded-lg" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{p.name}</p>
                <p className="truncate text-xs text-muted">
                  {p.category_name}
                  {p.unit ? ` · ${p.unit}` : ''}
                </p>
              </div>
              <span className="text-sm font-semibold tabular">{formatINR(p.price)}</span>
            </li>
          ))}
          <li
            role="option"
            aria-selected={false}
            onMouseDown={(e) => {
              e.preventDefault();
              submit(text);
            }}
            className="mt-1 flex cursor-pointer items-center justify-between border-t border-line px-4 pt-3 pb-1.5 text-sm font-semibold text-forest-700 hover:text-terracotta-600"
          >
            See all results for “{term}” <ArrowUpRight className="size-4" aria-hidden />
          </li>
        </ul>
      )}
    </div>
  );
}
