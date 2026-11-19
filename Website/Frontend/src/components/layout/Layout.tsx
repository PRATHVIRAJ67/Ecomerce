import { Heart, House, LayoutGrid, ShoppingBag, User } from 'lucide-react';
import { Suspense } from 'react';
import { NavLink, Outlet, ScrollRestoration } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { cn } from '../../lib/format';
import { Spinner } from '../ui';
import { Footer, TrustStrip } from './Footer';
import { AnnouncementBar, Header } from './Header';

function MobileNav() {
  const cart = useCart();
  const wishlist = useWishlist();
  const { isSignedIn } = useAuth();
  const items = [
    { to: '/', label: 'Home', icon: House, end: true },
    { to: '/shop', label: 'Shop', icon: LayoutGrid },
    { to: '/wishlist', label: 'Wishlist', icon: Heart, count: wishlist.count },
    { to: '/cart', label: 'Cart', icon: ShoppingBag, count: cart.count },
    { to: isSignedIn ? '/account' : '/login', label: isSignedIn ? 'Account' : 'Sign in', icon: User },
  ];
  return (
    <nav aria-label="Quick navigation" className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden">
      <ul className="grid grid-cols-5">
        {items.map(({ to, label, icon: Icon, end, count }) => (
          <li key={label}>
            <NavLink to={to} end={end} className={({ isActive }) => cn('relative flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium', isActive ? 'text-forest-700' : 'text-muted')}>
              {({ isActive }) => (
                <>
                  <span className="relative">
                    <Icon className={cn('size-[22px]', isActive && 'stroke-[2.25]')} aria-hidden />
                    {count ? (
                      <span className="absolute -top-1 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-terracotta-500 px-1 text-[10px] font-bold text-white" aria-hidden>
                        {count > 99 ? '99+' : count}
                      </span>
                    ) : null}
                  </span>
                  {label}
                  {count ? <span className="sr-only">, {count} items</span> : null}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function PageFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center" role="status" aria-label="Loading">
      <Spinner className="size-7" />
    </div>
  );
}

export function Layout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#main" className="sr-only z-[80] rounded-lg bg-forest-800 px-4 py-2 text-cream focus:not-sr-only focus:fixed focus:top-3 focus:left-3">
        Skip to content
      </a>
      <AnnouncementBar />
      <Header />
      <main id="main" className="flex-1 pb-20 md:pb-0" tabIndex={-1}>
        <Suspense fallback={<PageFallback />}>
          <Outlet />
        </Suspense>
      </main>
      <TrustStrip />
      <Footer />
      <MobileNav />
      <ScrollRestoration getKey={(location) => location.pathname} />
    </div>
  );
}
