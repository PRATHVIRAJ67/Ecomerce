import { discountPercent, type ProductCard as Product } from '@ecommerce/shared';
import { MapPin, Plus, ShoppingBag } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { cn } from '../../lib/format';
import { Badge, Skeleton } from '../ui';
import { Price } from './Price';
import { ProductImage } from './ProductImage';
import { WishlistButton } from './WishlistButton';

export function ProductCard({ product, eager, className }: { product: Product; eager?: boolean; className?: string }) {
  const cart = useCart();
  const [adding, setAdding] = useState(false);
  const off = discountPercent(product.price, product.mrp);
  const inCart = cart.quantityOf(product.id);
  const image = product.images[0];
  const second = product.images[1];
  const href = `/product/${product.slug}`;

  const add = async () => {
    setAdding(true);
    await cart.add(product, 1);
    setAdding(false);
  };

  return (
    <article className={cn('group relative flex flex-col overflow-hidden rounded-3xl bg-white shadow-card ring-1 ring-line/60 transition duration-300 hover:-translate-y-0.5 hover:shadow-lift', className)}>
      <Link to={href} className="relative block aspect-[4/5] overflow-hidden" tabIndex={-1} aria-hidden>
        <ProductImage
          src={image?.url}
          alt=""
          seed={product.category_slug ?? product.slug}
          hints={[product.category_name, product.name]}
          eager={eager}
          sizes="(min-width: 1024px) 25vw, 50vw"
          className="size-full transition duration-500 group-hover:scale-[1.04]"
        />
        {second && (
          <img src={second.url} alt="" loading="lazy" className="absolute inset-0 size-full object-cover opacity-0 transition duration-500 group-hover:opacity-100" />
        )}
        {!product.in_stock && <div className="absolute inset-0 bg-white/45" />}
      </Link>

      <div className="pointer-events-none absolute inset-x-3 top-3 z-10 flex items-start justify-between">
        <div className="flex flex-col items-start gap-1.5">
          {!product.in_stock ? (
            <Badge tone="neutral" className="bg-ink/80 text-white">Out of stock</Badge>
          ) : off >= 5 ? (
            <Badge tone="terracotta">{off}% off</Badge>
          ) : null}
          {product.in_stock && product.low_stock && <Badge tone="warning">Only a few left</Badge>}
        </div>
        <WishlistButton product={product} className="pointer-events-auto" />
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        {product.origin && (
          <p className="mb-1.5 flex items-center gap-1 truncate text-xs text-muted">
            <MapPin className="size-3 shrink-0" aria-hidden />
            <span className="truncate">{product.origin}</span>
          </p>
        )}
        <h3 className="line-clamp-2 font-display text-[17px] leading-snug font-semibold text-ink sm:text-lg">
          <Link to={href} className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none">
            {product.name}
          </Link>
        </h3>
        {product.unit && <p className="mt-0.5 text-sm text-muted">{product.unit}</p>}
        <div className="mt-auto flex items-end justify-between gap-2 pt-4">
          <Price price={product.price} mrp={product.mrp} size="sm" className="flex-col !items-start !gap-0" />
          {product.in_stock ? (
            <button
              type="button"
              onClick={add}
              disabled={adding || inCart >= product.max_order_quantity}
              className={cn(
                'relative z-10 inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold transition disabled:opacity-60',
                inCart ? 'bg-forest-100 text-forest-800 hover:bg-forest-200' : 'bg-forest-700 text-cream hover:bg-forest-800',
              )}
              aria-label={inCart ? `Add another ${product.name} (${inCart} in cart)` : `Add ${product.name} to cart`}
            >
              {inCart ? <ShoppingBag className="size-4" aria-hidden /> : <Plus className="size-4" aria-hidden />}
              <span>{inCart ? inCart : 'Add'}</span>
            </button>
          ) : (
            <span className="relative z-10 text-xs font-semibold text-muted">Sold out</span>
          )}
        </div>
      </div>
    </article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl bg-white ring-1 ring-line/60" aria-hidden>
      <Skeleton className="aspect-[4/5] rounded-none" />
      <div className="space-y-2.5 p-5">
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-5 w-4/5" />
        <Skeleton className="h-3 w-1/4" />
        <div className="flex items-end justify-between pt-3">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-10 w-16" />
        </div>
      </div>
    </div>
  );
}

export function ProductGrid({ products, loading, count = 8, className }: { products?: Product[]; loading?: boolean; count?: number; className?: string }) {
  return (
    <div className={cn('grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-4', className)}>
      {loading || !products
        ? Array.from({ length: count }, (_, i) => <ProductCardSkeleton key={i} />)
        : products.map((p, i) => <ProductCard key={p.id} product={p} eager={i < 4} />)}
    </div>
  );
}
