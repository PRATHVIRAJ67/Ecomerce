import type { Order } from '@ecommerce/shared';
import { ChevronRight, PackageSearch, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { OrderStatusBadge } from '../components/OrderTimeline';
import { ButtonLink, EmptyState, ErrorState, Skeleton } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { formatDate, formatINR } from '../lib/format';
import { useOrders } from '../lib/queries';
import { Seo } from '../lib/seo';

/** Orders are private to the customer, so tracking requires sign-in (no guessable public lookups). */
export default function TrackOrderPage() {
  const { isSignedIn, ready } = useAuth();
  const orders = useOrders(1, isSignedIn);

  return (
    <div className="container-page max-w-3xl py-10 sm:py-14">
      <Seo title="Track your order" description="Track your URU order from confirmation to your doorstep." path="/track-order" />
      <div className="text-center">
        <span className="inline-flex size-16 items-center justify-center rounded-full bg-forest-100 text-forest-700">
          <Truck className="size-8" aria-hidden />
        </span>
        <h1 className="mt-5 font-display text-3xl font-semibold tracking-tight sm:text-4xl">Track your order</h1>
        <p className="mt-2 text-ink-soft">See live status for every order — packed, shipped, out for delivery.</p>
      </div>

      <div className="mt-10">
        {!ready ? (
          <Skeleton className="h-40 rounded-3xl" />
        ) : !isSignedIn ? (
          <div className="rounded-3xl bg-white p-8 text-center ring-1 ring-line/70">
            <p className="text-ink-soft">Sign in with the account you used to place the order to see its tracking.</p>
            <div className="mt-5 flex justify-center gap-3">
              <ButtonLink to="/login?next=/track-order">Sign in</ButtonLink>
              <ButtonLink to="/contact" variant="outline">
                Need help?
              </ButtonLink>
            </div>
          </div>
        ) : orders.isPending ? (
          <div className="space-y-3">
            <Skeleton className="h-24 rounded-3xl" />
            <Skeleton className="h-24 rounded-3xl" />
          </div>
        ) : orders.error ? (
          <ErrorState error={orders.error} onRetry={() => void orders.refetch()} />
        ) : orders.data.items.length === 0 ? (
          <EmptyState icon={PackageSearch} title="No orders to track" action={<ButtonLink to="/shop">Start shopping</ButtonLink>}>
            Orders you place will appear here.
          </EmptyState>
        ) : (
          <>
            <h2 className="mb-4 font-semibold">Recent orders</h2>
            <ul className="space-y-3">
              {orders.data.items.map((o: Order) => (
                <li key={o.id}>
                  <Link to={`/account/orders/${o.id}`} className="flex items-center gap-4 rounded-2xl bg-white p-5 ring-1 ring-line/70 hover:ring-forest-300">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold tabular">{o.order_number}</span>
                        <OrderStatusBadge status={o.status} />
                      </div>
                      <p className="mt-1 text-sm text-muted">
                        {formatDate(o.placed_at)} · {formatINR(o.total)}
                      </p>
                    </div>
                    <ChevronRight className="size-5 text-muted" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-center text-sm">
              <Link to="/account/orders" className="font-semibold text-forest-700 underline">
                View all orders
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
