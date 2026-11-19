import { CheckCircle2, HandCoins, MapPin, PackageX, Share2, ShieldCheck, ShoppingBag, Truck, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Gallery } from '../components/product/Gallery';
import { Price } from '../components/product/Price';
import { ProductRail } from '../components/product/ProductRail';
import { QuantityStepper } from '../components/product/QuantityStepper';
import { WishlistButton } from '../components/product/WishlistButton';
import { Badge, Breadcrumbs, Button, ButtonLink, EmptyState, ErrorState, Skeleton } from '../components/ui';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { isNotFound } from '../lib/api';
import { formatINR } from '../lib/format';
import { Seo, absoluteUrl } from '../lib/seo';
import { useProduct, useSettings } from '../lib/queries';

export default function ProductPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const cart = useCart();
  const { data: settings } = useSettings();
  const { data: product, isPending, error, refetch } = useProduct(slug);
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState<'add' | 'buy' | null>(null);

  useEffect(() => setQty(1), [slug]);

  if (isPending) return <ProductSkeleton />;
  if (isNotFound(error)) {
    return (
      <div className="container-page py-10">
        <Seo title="Product not found" noindex />
        <EmptyState icon={PackageX} title="This product isn't available" action={<ButtonLink to="/shop">Browse the shop</ButtonLink>}>
          It may have been removed or the link is incorrect.
        </EmptyState>
      </div>
    );
  }
  if (error || !product) {
    return (
      <div className="container-page py-16">
        <ErrorState error={error} onRetry={() => void refetch()} />
      </div>
    );
  }

  const inCart = cart.quantityOf(product.id);
  const remaining = Math.max(0, product.max_order_quantity - inCart);
  const canBuy = product.in_stock && remaining > 0;
  const threshold = settings?.free_shipping_threshold;

  const addToCart = async (then?: 'buy') => {
    setBusy(then ?? 'add');
    const ok = await cart.add(product, Math.min(qty, remaining));
    setBusy(null);
    if (ok && then === 'buy') navigate('/cart');
  };

  const share = async () => {
    const url = absoluteUrl(`/product/${product.slug}`);
    try {
      if (navigator.share) await navigator.share({ title: product.name, url });
      else {
        await navigator.clipboard.writeText(url);
        toast.success('Link copied');
      }
    } catch {
      /* user cancelled */
    }
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    sku: product.sku,
    description: product.short_description ?? product.description ?? undefined,
    image: product.images.map((i) => i.url),
    category: product.category_name ?? undefined,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'INR',
      price: product.price,
      availability: product.in_stock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: absoluteUrl(`/product/${product.slug}`),
    },
  };

  return (
    <>
      <Seo title={product.name} description={product.short_description ?? product.description} path={`/product/${product.slug}`} image={product.images[0]?.url} type="product" jsonLd={jsonLd} />
      <div className="container-page py-6 sm:py-10">
        <Breadcrumbs
          items={[
            { label: 'Home', to: '/' },
            { label: 'Shop', to: '/shop' },
            ...(product.category_slug ? [{ label: product.category_name ?? 'Category', to: `/category/${product.category_slug}` }] : []),
            { label: product.name },
          ]}
        />

        <div className="mt-6 grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
          <Gallery
            images={product.images}
            name={product.name}
            seed={product.category_slug ?? product.slug}
            hints={[product.category_name, product.name]}
            badge={!product.in_stock ? <Badge className="bg-ink/85 text-white">Out of stock</Badge> : undefined}
          />

          <div className="lg:pt-2">
            {product.category_name && (
              <Link to={`/category/${product.category_slug}`} className="text-xs font-semibold tracking-[0.18em] text-terracotta-600 uppercase hover:underline">
                {product.category_name}
              </Link>
            )}
            <h1 className="mt-2 font-display text-3xl leading-tight font-semibold tracking-tight sm:text-[2.6rem]">{product.name}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
              {product.unit && <span>{product.unit}</span>}
              {product.origin && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-4" aria-hidden /> {product.origin}
                </span>
              )}
            </div>
            {product.short_description && <p className="mt-5 text-lg leading-relaxed text-ink-soft">{product.short_description}</p>}

            <div className="mt-6 rounded-3xl bg-white p-5 ring-1 ring-line/70 sm:p-6">
              <Price price={product.price} mrp={product.mrp} size="lg" />
              <p className="mt-1 text-xs text-muted">Inclusive of all taxes</p>

              <div className="mt-4" aria-live="polite">
                {!product.in_stock ? (
                  <p className="inline-flex items-center gap-2 font-semibold text-danger">
                    <PackageX className="size-5" aria-hidden /> Currently out of stock
                  </p>
                ) : product.low_stock ? (
                  <p className="inline-flex items-center gap-2 font-semibold text-warning">
                    <Zap className="size-5" aria-hidden /> Only a few left — order soon
                  </p>
                ) : (
                  <p className="inline-flex items-center gap-2 font-semibold text-success">
                    <CheckCircle2 className="size-5" aria-hidden /> In stock
                  </p>
                )}
              </div>

              {product.in_stock && (
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <QuantityStepper value={Math.min(qty, Math.max(1, remaining))} max={Math.max(1, remaining)} onChange={setQty} label="Quantity" />
                  {inCart > 0 && (
                    <span className="text-sm text-muted">
                      {inCart} already in your cart{remaining === 0 ? ' (maximum reached)' : ''}
                    </span>
                  )}
                </div>
              )}

              <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
                <Button size="lg" variant="primary" icon={ShoppingBag} disabled={!canBuy} loading={busy === 'add'} onClick={() => void addToCart()}>
                  {product.in_stock ? (remaining === 0 ? 'Limit reached' : 'Add to cart') : 'Sold out'}
                </Button>
                <Button size="lg" variant="accent" disabled={!canBuy} loading={busy === 'buy'} onClick={() => void addToCart('buy')}>
                  Buy now
                </Button>
                <div className="flex gap-3">
                  <WishlistButton product={product} withLabel className="flex-1 sm:flex-none" />
                  <button type="button" onClick={() => void share()} className="inline-flex size-12 items-center justify-center rounded-xl border border-line bg-white text-forest-800 hover:border-forest-700" aria-label="Share this product">
                    <Share2 className="size-5" aria-hidden />
                  </button>
                </div>
              </div>
              {product.in_stock && product.max_order_quantity < (settings?.max_quantity_per_item ?? Infinity) && (
                <p className="mt-3 text-xs text-muted">Limited stock: up to {product.max_order_quantity} per order.</p>
              )}
            </div>

            <ul className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
              <li className="flex items-start gap-2.5 rounded-2xl bg-forest-50 p-3.5">
                <Truck className="mt-0.5 size-5 shrink-0 text-forest-700" aria-hidden />
                <span>{threshold ? (product.price >= threshold ? 'Free delivery on this item' : `Free delivery over ${formatINR(threshold)}`) : 'Home delivery'}</span>
              </li>
              {settings?.cod_enabled !== false && (
                <li className="flex items-start gap-2.5 rounded-2xl bg-forest-50 p-3.5">
                  <HandCoins className="mt-0.5 size-5 shrink-0 text-forest-700" aria-hidden />
                  <span>Cash on Delivery available</span>
                </li>
              )}
              <li className="flex items-start gap-2.5 rounded-2xl bg-forest-50 p-3.5">
                <ShieldCheck className="mt-0.5 size-5 shrink-0 text-forest-700" aria-hidden />
                <span>Secure checkout, price verified</span>
              </li>
            </ul>

            <section className="mt-8 border-t border-line pt-6" aria-labelledby="about-product">
              <h2 id="about-product" className="font-display text-xl font-semibold">
                About this product
              </h2>
              {product.description ? (
                <div className="prose-uru mt-2 whitespace-pre-line">{product.description}</div>
              ) : (
                <p className="mt-2 text-ink-soft">{product.short_description ?? 'More details coming soon.'}</p>
              )}
              <dl className="mt-6 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2.5 text-sm">
                {product.origin && (
                  <>
                    <dt className="text-muted">Origin</dt>
                    <dd className="font-medium">{product.origin}</dd>
                  </>
                )}
                {product.unit && (
                  <>
                    <dt className="text-muted">Pack size</dt>
                    <dd className="font-medium">{product.unit}</dd>
                  </>
                )}
                <dt className="text-muted">SKU</dt>
                <dd className="font-medium tabular">{product.sku}</dd>
              </dl>
              {product.tags.length > 0 && (
                <ul className="mt-5 flex flex-wrap gap-2" aria-label="Tags">
                  {product.tags.map((t) => (
                    <li key={t}>
                      <Link to={`/shop?q=${encodeURIComponent(t)}`} className="inline-block rounded-full bg-cream-dark px-3 py-1 text-xs font-medium text-ink-soft hover:bg-sand">
                        #{t}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      </div>

      {product.related.length > 0 && (
        <div className="py-12 sm:py-16">
          <ProductRail eyebrow="More to love" title="You may also like" products={product.related} viewAll={product.category_slug ? `/category/${product.category_slug}` : '/shop'} />
        </div>
      )}

      {/* Sticky mobile purchase bar */}
      {canBuy && (
        <div className="fixed inset-x-0 bottom-[calc(62px+env(safe-area-inset-bottom))] z-30 border-t border-line bg-white/95 px-4 py-3 backdrop-blur md:hidden">
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{product.name}</p>
              <p className="font-semibold tabular">{formatINR(product.price)}</p>
            </div>
            <Button variant="primary" icon={ShoppingBag} loading={busy === 'add'} onClick={() => void addToCart()}>
              Add to cart
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

function ProductSkeleton() {
  return (
    <div className="container-page py-6 sm:py-10" aria-busy="true" aria-label="Loading product">
      <Skeleton className="h-4 w-60" />
      <div className="mt-6 grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
        <Skeleton className="aspect-square rounded-[2rem]" />
        <div className="space-y-4">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-10 w-4/5" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-52 w-full rounded-3xl" />
        </div>
      </div>
    </div>
  );
}
