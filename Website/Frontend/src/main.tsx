import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { lazy, StrictMode, type ComponentType } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, Outlet, RouterProvider } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { RequireAuth } from './components/RequireAuth';
import { RouteError } from './components/RouteError';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './context/ToastContext';
import { WishlistProvider } from './context/WishlistContext';
import { ApiError } from './lib/api';
import HomePage from './pages/HomePage';
import './index.css';

/** Lazy-load a named export (keeps route chunks small). */
function named<M extends Record<string, unknown>, K extends keyof M>(load: () => Promise<M>, key: K) {
  return lazy(async () => ({ default: (await load())[key] as ComponentType }));
}

const ShopPage = lazy(() => import('./pages/ShopPage'));
const ProductPage = lazy(() => import('./pages/ProductPage'));
const CartPage = lazy(() => import('./pages/CartPage'));
const WishlistPage = lazy(() => import('./pages/WishlistPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const OrderConfirmationPage = lazy(() => import('./pages/OrderConfirmationPage'));
const TrackOrderPage = lazy(() => import('./pages/TrackOrderPage'));
const AppPage = lazy(() => import('./pages/AppPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const AccountLayout = lazy(() => import('./pages/account/AccountLayout'));
const ProfilePage = lazy(() => import('./pages/account/ProfilePage'));
const OrdersPage = lazy(() => import('./pages/account/OrdersPage'));
const OrderDetailPage = lazy(() => import('./pages/account/OrderDetailPage'));
const AddressesPage = lazy(() => import('./pages/account/AddressesPage'));
const auth = () => import('./pages/AuthPages');
const LoginPage = named(auth, 'LoginPage');
const RegisterPage = named(auth, 'RegisterPage');
const ForgotPasswordPage = named(auth, 'ForgotPasswordPage');
const ResetPasswordPage = named(auth, 'ResetPasswordPage');
const info = () => import('./pages/info/InfoPages');
const AboutPage = named(info, 'AboutPage');
const ContactPage = named(info, 'ContactPage');
const FaqPage = named(info, 'FaqPage');
const PolicyPage = named(info, 'PolicyPage');

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (count, err) => !(err instanceof ApiError && err.status >= 400 && err.status < 500) && count < 2,
      refetchOnWindowFocus: true,
    },
  },
  queryCache: new QueryCache({
    onError: (err) => {
      if (import.meta.env.DEV) console.warn('[query]', err);
    },
  }),
  mutationCache: new MutationCache(),
});

function Providers() {
  return (
    <ToastProvider>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <Outlet />
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

const router = createBrowserRouter([
  {
    element: <Providers />,
    errorElement: <RouteError />,
    children: [
      {
        element: <Layout />,
        errorElement: <RouteError />,
        children: [
          { index: true, element: <HomePage /> },
          { path: 'shop', element: <ShopPage /> },
          { path: 'search', element: <ShopPage /> },
          { path: 'category/:slug', element: <ShopPage /> },
          { path: 'product/:slug', element: <ProductPage /> },
          { path: 'cart', element: <CartPage /> },
          { path: 'wishlist', element: <WishlistPage /> },
          { path: 'login', element: <LoginPage /> },
          { path: 'register', element: <RegisterPage /> },
          { path: 'forgot-password', element: <ForgotPasswordPage /> },
          { path: 'reset-password', element: <ResetPasswordPage /> },
          { path: 'checkout', element: <RequireAuth><CheckoutPage /></RequireAuth> },
          { path: 'order/:id/confirmed', element: <RequireAuth><OrderConfirmationPage /></RequireAuth> },
          { path: 'track-order', element: <TrackOrderPage /> },
          { path: 'app', element: <AppPage /> },
          {
            path: 'account',
            element: <AccountLayout />,
            children: [
              { index: true, element: <ProfilePage /> },
              { path: 'orders', element: <OrdersPage /> },
              { path: 'orders/:id', element: <OrderDetailPage /> },
              { path: 'addresses', element: <AddressesPage /> },
            ],
          },
          { path: 'about', element: <AboutPage /> },
          { path: 'contact', element: <ContactPage /> },
          { path: 'faq', element: <FaqPage /> },
          { path: 'policies/:slug', element: <PolicyPage /> },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);
