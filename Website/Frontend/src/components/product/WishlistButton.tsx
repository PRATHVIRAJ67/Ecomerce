import { Heart } from 'lucide-react';
import type { ProductCard } from '@ecommerce/shared';
import { useWishlist } from '../../context/WishlistContext';
import { cn } from '../../lib/format';

export function WishlistButton({ product, className, withLabel }: { product: Pick<ProductCard, 'id' | 'name'>; className?: string; withLabel?: boolean }) {
  const wishlist = useWishlist();
  const active = wishlist.has(product.id);
  const label = active ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`;
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void wishlist.toggle(product);
      }}
      aria-pressed={active}
      aria-label={withLabel ? undefined : label}
      title={label}
      className={cn(
        'inline-flex items-center justify-center gap-2 transition',
        withLabel
          ? 'h-12 rounded-xl border border-line bg-white px-4 text-sm font-semibold text-forest-800 hover:border-forest-700'
          : 'size-9 rounded-full bg-white/90 shadow-sm backdrop-blur hover:scale-105 hover:bg-white',
        className,
      )}
    >
      <Heart className={cn('size-[18px] transition', active ? 'fill-terracotta-500 text-terracotta-500' : 'text-forest-800')} aria-hidden />
      {withLabel && (active ? 'Saved' : 'Wishlist')}
    </button>
  );
}
