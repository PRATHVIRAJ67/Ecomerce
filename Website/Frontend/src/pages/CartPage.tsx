import type { CartLine } from '@ecommerce/shared';
import { AlertTriangle, ArrowRight, Lock, ShoppingBag, Trash2, Truck } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Price } from '../components/product/Price';
import { ProductImage } from '../components/product/ProductImage';
import { ProductRail } from '../components/product/ProductRail';
import { QuantityStepper } from '../components/product/QuantityStepper';
import { Button, ButtonLink, EmptyState, ErrorState, Skeleton } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { cn, formatINR, plural } from '../lib/format';
import { Seo } from '../lib/seo';
import { useHome, useSettings } from '../lib/queries';

export default function CartPage() {
  const cart = useCart();
  const { isSignedIn } = useAuth();
  const navigate = useNavigate();
  const { data: settings } = useSettings();
  const summary = cart.summary;

  const header = (
    <>
      <Seo title="Your cart" noindex />
      <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Your cart</h1>
    </>
  );

  if (cart.isLoading && !summary) {
    return (
      <div className="container-page py-8 sm:py-12">
        {header}
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
          <div className="space-y-4">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-32 rounded-3xl" />
            ))}
          </div>
          <Skeleton className="h-72 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (cart.error && !summary) {
    return (
      <div className="container-page py-12">
        {header}
        <div className="mt-8">
          <ErrorState error={cart.error} onRetry={cart.refetch} title="We couldn't load your cart" />
        </div>
      </div>
    );
  }

  if (!summary || summary.lines.length === 0) {
    return (
      <div className="pb-16">
        <div className="container-page py-8 sm:py-12">
          {header}
          <EmptyState icon={ShoppingBag} title="Your cart is empty" action={<ButtonLink to="/shop">Start shopping</ButtonLink>}>
            Spices, pickles, handloom — the good stuff from home is a few clicks away.
          </EmptyState>
        </div>
        <EmptyCartSuggestions />
      </div>
    );
  }

  const threshold = settings?.free_shipping_threshold ?? 0;
  const toFree = threshold > 0 ? Math.max(0, threshold - summary.subtotal) : 0;
  const progress = threshold > 0 ? Math.min(100, (summary.subtotal / threshold) * 100) : 100;
  const unavailable = summary.lines.filter((l) => !l.available);

  return (
    <div className="container-page py-8 sm:py-12">
      {header}
      <p className="mt-1 text-muted">{plural(summary.item_count, 'item')}</p>

      <div className="mt-8 grid items-start gap-8 lg:grid-cols-[1fr_380px]">
        <div>
          {unavailable.length > 0 && (
            <div role="alert" className="mb-5 flex gap-3 rounded-2xl border border-warning/30 bg-warning-tint p-4 text-sm">
              <AlertTriangle className="size-5 shrink-0 text-warning" aria-hidden />
              <p>
                <strong className="font-semibold">{plural(unavailable.length, 'item')} can't be ordered right now</strong> — out of stock or above the available quantity. Remove or adjust them to continue to checkout.
              </p>
            </div>
          )}
          <ul className="divide-y divide-line overflow-hidden rounded-3xl bg-white ring-1 ring-line/70">
            {summary.lines.map((line) => (
              <CartRow key={line.product_id} line={line} />
            ))}
          </ul>
          <div className="mt-4 flex justify-between text-sm">
            <Link to="/shop" className="font-semibold text-forest-700 hover:underline">
              ← Continue shopping
            </Link>
            <button type="button" onClick={() => void cart.clear()} className="font-medium text-muted hover:text-danger">
              Clear cart
            </button>
          </div>
        </div>

        <aside className="lg:sticky lg:top-36" aria-label="Order summary">
          <div className="rounded-3xl bg-white p-6 ring-1 ring-line/70">
            <h2 className="font-display text-xl font-semibold">Order summary</h2>
            {threshold > 0 && (
              <div className="mt-4 rounded-2xl bg-forest-50 p-4">
                <p className="flex items-center gap-2 text-sm font-medium text-forest-800">
                  <Truck className="size-4" aria-hidden />
                  {toFree > 0 ? (
                    <>
                      Add <strong className="tabular">{formatINR(toFree)}</strong> more for free delivery
                    </>
                  ) : (
                    'You’ve unlocked free delivery'
                  )}
                </p>
                <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-forest-200" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)} aria-label="Progress to free delivery">
                  <div className="h-full rounded-full bg-forest-700 transition-all" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}
            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-soft">Subtotal</dt>
                <dd className="font-medium tabular">{formatINR(summary.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-soft">Delivery</dt>
                <dd className="font-medium tabular">{summary.shipping_fee ? formatINR(summary.shipping_fee) : <span className="text-success">Free</span>}</dd>
              </div>
              <div className="flex justify-between border-t border-line pt-3 text-base">
                <dt className="font-semibold">Total</dt>
                <dd className="font-semibold tabular">{formatINR(summary.total)}</dd>
              </div>
            </dl>
            <Button size="lg" variant="accent" className="mt-6 w-full" disabled={summary.has_unavailable_items || summary.subtotal <= 0 || settings?.maintenance_mode} onClick={() => navigate(isSignedIn ? '/checkout' : '/login?next=/checkout')}>
              {isSignedIn ? 'Proceed to checkout' : 'Sign in to checkout'} <ArrowRight className="size-5" aria-hidden />
            </Button>
            {settings?.maintenance_mode && <p className="mt-3 text-center text-xs text-warning">Checkout is paused for maintenance.</p>}
            <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted">
              <Lock className="size-3.5" aria-hidden /> Prices and stock are re-checked when you place the order
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function CartRow({ line }: { line: CartLine }) {
  const cart = useCart();
  const p = line.product;
  const busy = cart.isPending(p.id);
  const overLimit = p.in_stock && line.quantity > p.max_order_quantity;
  return (
    <li className={cn('flex gap-4 p-4 sm:p-5', !line.available && 'bg-cream/60')}>
      <Link to={`/product/${p.slug}`} className="shrink-0" tabIndex={-1} aria-hidden>
        <ProductImage src={p.images[0]?.url} alt="" seed={p.category_slug ?? p.slug} hints={[p.category_name, p.name]} className={cn('size-24 rounded-2xl sm:size-28', !line.available && 'opacity-60')} />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link to={`/product/${p.slug}`} className="line-clamp-2 font-semibold hover:text-forest-700">
              {p.name}
            </Link>
            <p className="mt-0.5 text-sm text-muted">{[p.unit, p.origin].filter(Boolean).join(' · ')}</p>
          </div>
          <p className="shrink-0 font-semibold tabular">{formatINR(line.line_total)}</p>
        </div>
        {!p.in_stock ? (
          <p className="mt-2 text-sm font-medium text-danger">Out of stock — please remove</p>
        ) : overLimit ? (
          <p className="mt-2 text-sm font-medium text-warning">Only {p.max_order_quantity} available — reduce quantity</p>
        ) : (
          <Price price={p.price} mrp={p.mrp} size="sm" className="mt-1 text-sm" />
        )}
        <div className="mt-auto flex items-center justify-between gap-3 pt-3">
          {p.in_stock ? (
            <QuantityStepper
              size="sm"
              value={line.quantity}
              max={Math.max(p.max_order_quantity, 1)}
              removable
              busy={busy}
              label={`Quantity of ${p.name}`}
              onChange={(n) => void (n <= 0 ? cart.remove(p.id) : cart.setQuantity(p, Math.min(n, p.max_order_quantity)))}
            />
          ) : (
            <span />
          )}
          <button type="button" onClick={() => void cart.remove(p.id)} disabled={busy} className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-danger">
            <Trash2 className="size-4" aria-hidden /> Remove
          </button>
        </div>
      </div>
    </li>
  );
}

function EmptyCartSuggestions() {
  const { data, isPending } = useHome();
  return <ProductRail eyebrow="Popular picks" title="Customers love these" products={data?.best_sellers} loading={isPending} viewAll="/shop?sort=popular" />;
}
