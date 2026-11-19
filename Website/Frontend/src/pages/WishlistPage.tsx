import { Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ProductGrid } from '../components/product/ProductCard';
import { ButtonLink, EmptyState, ErrorState } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { plural } from '../lib/format';
import { Seo } from '../lib/seo';

export default function WishlistPage() {
  const wishlist = useWishlist();
  const { isSignedIn } = useAuth();
  const items = wishlist.items;

  return (
    <div className="container-page py-8 sm:py-12">
      <Seo title="Your wishlist" noindex />
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Your wishlist</h1>
          {items && items.length > 0 && <p className="mt-1 text-muted">{plural(items.length, 'saved item')}</p>}
        </div>
        {!isSignedIn && items && items.length > 0 && (
          <p className="text-sm text-ink-soft">
            <Link to="/login?next=/wishlist" className="font-semibold text-forest-700 underline">
              Sign in
            </Link>{' '}
            to keep your wishlist on every device.
          </p>
        )}
      </div>

      {wishlist.error && !items ? (
        <ErrorState error={wishlist.error} onRetry={wishlist.refetch} />
      ) : wishlist.isLoading ? (
        <ProductGrid loading count={4} />
      ) : !items || items.length === 0 ? (
        <EmptyState icon={Heart} title="Nothing saved yet" action={<ButtonLink to="/shop">Discover products</ButtonLink>}>
          Tap the heart on any product to save it here for later.
        </EmptyState>
      ) : (
        <ProductGrid products={items} />
      )}
    </div>
  );
}
