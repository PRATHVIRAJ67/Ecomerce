import type { Order } from '@ecommerce/shared';
import { ChevronRight, Package } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { OrderStatusBadge } from '../../components/OrderTimeline';
import { ImageFallback } from '../../components/product/ProductImage';
import { ButtonLink, EmptyState, ErrorState, Pagination, Skeleton } from '../../components/ui';
import { formatDate, formatINR, plural } from '../../lib/format';
import { useOrders } from '../../lib/queries';
import { Seo } from '../../lib/seo';

type ListItem = Order & { items?: { product_name: string; image_url: string | null; quantity: number }[] };

export default function OrdersPage() {
  const [params, setParams] = useSearchParams();
  const page = Math.max(1, Number(params.get('page')) || 1);
  const { data, isPending, error, refetch } = useOrders(page);

  return (
    <div>
      <Seo title="Your orders" noindex />
      <h2 className="mb-6 font-display text-2xl font-semibold">Your orders</h2>
      {isPending ? (
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-32 rounded-3xl" />
          ))}
        </div>
      ) : error ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : data.items.length === 0 ? (
        <EmptyState icon={Package} title="No orders yet" action={<ButtonLink to="/shop">Start shopping</ButtonLink>}>
          When you place an order, you can track it here.
        </EmptyState>
      ) : (
        <>
          <ul className="space-y-4">
            {(data.items as ListItem[]).map((o) => (
              <li key={o.id}>
                <Link to={`/account/orders/${o.id}`} className="group flex flex-col gap-4 rounded-3xl bg-white p-5 ring-1 ring-line/70 transition hover:ring-forest-300 sm:flex-row sm:items-center">
                  <div className="flex -space-x-3">
                    {(o.items ?? []).slice(0, 3).map((it, i) =>
                      it.image_url ? (
                        <img key={i} src={it.image_url} alt="" className="size-14 rounded-xl object-cover ring-2 ring-white" loading="lazy" />
                      ) : (
                        <ImageFallback key={i} seed={it.product_name} hints={[it.product_name]} className="size-14 rounded-xl ring-2 ring-white" />
                      ),
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold tabular">{o.order_number}</p>
                      <OrderStatusBadge status={o.status} />
                    </div>
                    <p className="mt-1 truncate text-sm text-ink-soft">{(o.items ?? []).map((i) => i.product_name).join(', ')}</p>
                    <p className="mt-0.5 text-xs text-muted">
                      {formatDate(o.placed_at)} · {plural(o.item_count, 'item')} · {o.payment_method === 'cod' ? 'Cash on Delivery' : 'Paid online'}
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
                    <p className="font-semibold tabular">{formatINR(o.total)}</p>
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-forest-700 group-hover:text-terracotta-600">
                      {o.status === 'pending_payment' ? 'Pay now' : 'Track'} <ChevronRight className="size-4" aria-hidden />
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          <Pagination page={page} total={data.total} limit={data.limit} onPage={(p) => setParams(p > 1 ? { page: String(p) } : {})} />
        </>
      )}
    </div>
  );
}
