import { ChevronRight, Heart, LogOut, Menu, Package, Search, ShoppingBag, User, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { cn, formatINR } from '../../lib/format';
import { useCategories, useSettings } from '../../lib/queries';
import { Drawer, Skeleton } from '../ui';
import { Logo } from './Logo';
import { SearchBox } from './SearchBox';

function CountBadge({ n }: { n: number }) {
  if (!n) return null;
  return (
    <span className="absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-terracotta-500 px-1 text-[11px] font-bold text-white tabular" aria-hidden>
      {n > 99 ? '99+' : n}
    </span>
  );
}

export function AnnouncementBar() {
  const { data } = useSettings();
  if (data?.maintenance_mode) {
    return (
      <div className="bg-warning px-4 py-2 text-center text-[13px] font-medium text-white" role="status">
        We're doing some maintenance — browsing works, but checkout is paused for a little while.
      </div>
    );
  }
  const threshold = data?.free_shipping_threshold;
  return (
    <div className="bg-forest-800 px-4 py-2 text-center text-[13px] text-cream/90">
      {threshold ? (
        <>
          Free delivery on orders above <strong className="font-semibold text-terracotta-200">{formatINR(threshold)}</strong>
          {data?.cod_enabled && <span className="hidden sm:inline"> · Cash on Delivery available</span>}
        </>
      ) : (
        <span>{data?.store_tagline ?? 'Your Village. Your City. Your URU.'}</span>
      )}
    </div>
  );
}

export function Header() {
  const { isSignedIn, profile, signOut } = useAuth();
  const cart = useCart();
  const wishlist = useWishlist();
  const { data: categories, isPending } = useCategories();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const topCategories = (categories ?? []).filter((c) => !c.parent_id);
  const firstName = profile?.full_name?.split(' ')[0];

  return (
    <>
      <header className={cn('sticky top-0 z-40 border-b bg-cream/90 backdrop-blur-md transition-shadow', scrolled ? 'border-line shadow-[0_6px_24px_rgb(15_53_38/0.06)]' : 'border-transparent')}>
        <div className="container-page flex h-16 items-center gap-3 lg:h-[72px] lg:gap-8">
          <button type="button" className="-ml-2 inline-flex size-10 items-center justify-center rounded-full hover:bg-forest-100 lg:hidden" onClick={() => setMenuOpen(true)} aria-label="Open menu">
            <Menu className="size-6 text-forest-800" aria-hidden />
          </button>
          <Logo />
          <SearchBox className="mx-auto hidden w-full max-w-xl md:block" />
          <nav aria-label="Account" className="ml-auto flex items-center gap-0.5 sm:gap-1 md:ml-0">
            <button type="button" className="inline-flex size-10 items-center justify-center rounded-full hover:bg-forest-100 md:hidden" onClick={() => setSearchOpen((v) => !v)} aria-label="Search" aria-expanded={searchOpen}>
              {searchOpen ? <X className="size-5 text-forest-800" aria-hidden /> : <Search className="size-5 text-forest-800" aria-hidden />}
            </button>
            <Link to="/track-order" className="hidden h-10 items-center gap-2 rounded-full px-3 text-sm font-medium text-forest-800 hover:bg-forest-100 xl:inline-flex">
              <Package className="size-5" aria-hidden /> Track order
            </Link>
            <Link to={isSignedIn ? '/account' : '/login'} className="hidden h-10 items-center gap-2 rounded-full px-3 text-sm font-medium text-forest-800 hover:bg-forest-100 sm:inline-flex">
              <User className="size-5" aria-hidden />
              <span className="hidden max-w-28 truncate lg:inline">{isSignedIn ? (firstName ?? 'Account') : 'Sign in'}</span>
              <span className="sr-only lg:hidden">{isSignedIn ? 'Your account' : 'Sign in'}</span>
            </Link>
            <Link to="/wishlist" className="relative inline-flex size-10 items-center justify-center rounded-full hover:bg-forest-100" aria-label={`Wishlist, ${wishlist.count} items`}>
              <Heart className="size-5 text-forest-800" aria-hidden />
              <CountBadge n={wishlist.count} />
            </Link>
            <Link to="/cart" className="relative inline-flex size-10 items-center justify-center rounded-full hover:bg-forest-100" aria-label={`Cart, ${cart.count} items`}>
              <ShoppingBag className="size-5 text-forest-800" aria-hidden />
              <CountBadge n={cart.count} />
            </Link>
          </nav>
        </div>

        {searchOpen && (
          <div className="container-page pb-3 md:hidden">
            <SearchBox autoFocus onDone={() => setSearchOpen(false)} />
          </div>
        )}

        <nav aria-label="Categories" className="hidden border-t border-line/70 lg:block">
          <ul className="container-page no-scrollbar flex h-12 items-center gap-1 overflow-x-auto text-sm">
            <li>
              <NavLink to="/shop" end className={({ isActive }) => cn('rounded-full px-3.5 py-1.5 font-medium whitespace-nowrap transition', isActive && !location.search ? 'bg-forest-700 text-cream' : 'text-ink-soft hover:bg-forest-100 hover:text-forest-800')}>
                Shop all
              </NavLink>
            </li>
            {isPending
              ? Array.from({ length: 6 }, (_, i) => (
                  <li key={i}>
                    <Skeleton className="mx-2 h-4 w-24" />
                  </li>
                ))
              : topCategories.map((c) => (
                  <li key={c.id}>
                    <NavLink
                      to={`/category/${c.slug}`}
                      className={({ isActive }) => cn('rounded-full px-3.5 py-1.5 font-medium whitespace-nowrap transition', isActive ? 'bg-forest-700 text-cream' : 'text-ink-soft hover:bg-forest-100 hover:text-forest-800')}
                    >
                      {c.name}
                    </NavLink>
                  </li>
                ))}
          </ul>
        </nav>
      </header>

      <Drawer open={menuOpen} onClose={() => setMenuOpen(false)} title="Menu" side="left">
        <div className="p-5">
          <Link to={isSignedIn ? '/account' : '/login'} className="mb-6 flex items-center gap-3 rounded-2xl bg-forest-700 p-4 text-cream">
            <span className="flex size-11 items-center justify-center rounded-full bg-forest-600">
              <User className="size-5" aria-hidden />
            </span>
            <span className="flex-1">
              <span className="block font-semibold">{isSignedIn ? `Hello, ${firstName ?? 'there'}` : 'Sign in or register'}</span>
              <span className="block text-xs text-cream/70">{isSignedIn ? 'Orders, addresses & profile' : 'Track orders and save your cart'}</span>
            </span>
            <ChevronRight className="size-5 opacity-70" aria-hidden />
          </Link>
          <p className="mb-2 text-xs font-semibold tracking-[0.16em] text-muted uppercase">Shop by category</p>
          <ul className="mb-6 divide-y divide-line rounded-2xl border border-line bg-white">
            <li>
              <Link to="/shop" className="flex items-center justify-between px-4 py-3.5 font-medium">
                Shop all <ChevronRight className="size-4 text-muted" aria-hidden />
              </Link>
            </li>
            {topCategories.map((c) => (
              <li key={c.id}>
                <Link to={`/category/${c.slug}`} className="flex items-center justify-between px-4 py-3.5 font-medium">
                  {c.name} <ChevronRight className="size-4 text-muted" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
          <ul className="space-y-1 text-[15px]">
            {[
              ['/track-order', 'Track your order'],
              ['/about', 'Our story'],
              ['/faq', 'FAQs'],
              ['/contact', 'Contact us'],
            ].map(([to, label]) => (
              <li key={to}>
                <Link to={to!} className="block rounded-lg px-2 py-2 text-ink-soft hover:bg-forest-50">
                  {label}
                </Link>
              </li>
            ))}
            {isSignedIn && (
              <li>
                <button type="button" onClick={() => void signOut()} className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-danger hover:bg-danger-tint">
                  <LogOut className="size-4" aria-hidden /> Sign out
                </button>
              </li>
            )}
          </ul>
        </div>
      </Drawer>
    </>
  );
}
