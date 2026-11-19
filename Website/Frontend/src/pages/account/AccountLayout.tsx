import { Heart, LogOut, MapPin, Package, UserRound } from 'lucide-react';
import { Suspense } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { PageFallback } from '../../components/layout/Layout';
import { RequireAuth } from '../../components/RequireAuth';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/format';

const LINKS = [
  { to: '/account', label: 'Profile', icon: UserRound, end: true },
  { to: '/account/orders', label: 'Orders', icon: Package },
  { to: '/account/addresses', label: 'Addresses', icon: MapPin },
  { to: '/wishlist', label: 'Wishlist', icon: Heart },
];

export default function AccountLayout() {
  return (
    <RequireAuth>
      <AccountShell />
    </RequireAuth>
  );
}

function AccountShell() {
  const { profile, session, signOut } = useAuth();
  const navigate = useNavigate();
  const name = profile?.full_name || session?.user.email?.split('@')[0] || 'there';
  return (
    <div className="container-page py-8 sm:py-12">
      <div className="mb-8 flex items-center gap-4">
        <span className="flex size-14 items-center justify-center rounded-full bg-forest-700 font-display text-2xl font-semibold text-cream" aria-hidden>
          {name.charAt(0).toUpperCase()}
        </span>
        <div>
          <p className="text-sm text-muted">Namaste,</p>
          <h1 className="font-display text-2xl font-semibold sm:text-3xl">{name}</h1>
        </div>
      </div>
      <div className="grid gap-8 lg:grid-cols-[230px_1fr]">
        <nav aria-label="Account" className="no-scrollbar -mx-4 overflow-x-auto px-4 lg:mx-0 lg:px-0">
          <ul className="flex gap-2 lg:flex-col lg:gap-1">
            {LINKS.map(({ to, label, icon: Icon, end }) => (
              <li key={to}>
                <NavLink to={to} end={end} className={({ isActive }) => cn('flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-medium whitespace-nowrap transition', isActive ? 'bg-forest-700 text-cream' : 'bg-white text-ink-soft ring-1 ring-line hover:text-forest-800 lg:bg-transparent lg:ring-0 lg:hover:bg-forest-50')}>
                  <Icon className="size-4" aria-hidden /> {label}
                </NavLink>
              </li>
            ))}
            <li>
              <button
                type="button"
                onClick={async () => {
                  await signOut();
                  navigate('/', { replace: true });
                }}
                className="flex w-full items-center gap-2.5 rounded-xl bg-white px-4 py-2.5 text-sm font-medium whitespace-nowrap text-danger ring-1 ring-line hover:bg-danger-tint lg:bg-transparent lg:ring-0"
              >
                <LogOut className="size-4" aria-hidden /> Sign out
              </button>
            </li>
          </ul>
        </nav>
        <div className="min-w-0">
          <Suspense fallback={<PageFallback />}>
            <Outlet />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
