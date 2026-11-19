import { CheckCircle2, Clock, PackageSearch } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { AddressLines } from '../components/AddressForm';
import { OrderTimeline } from '../components/OrderTimeline';
import { ProductImage } from '../components/product/ProductImage';
import { ButtonLink, EmptyState, ErrorState, Skeleton } from '../components/ui';
import { isNotFound } from '../lib/api';
import { formatDateTime, formatINR } from '../lib/format';
import { Seo } from '../lib/seo';
import { useOrder } from '../lib/queries';

export default function OrderConfirmationPage() {
  const { id } = useParams();
  const { data: order, isPending, error, refetch } = useOrder(id);

  if (isPending) {
    return (
      <div className="container-page max-w-3xl py-12">
        <Skeleton className="mx-auto size-20 rounded-full" />
        <Skeleton className="mx-auto mt-6 h-10 w-2/3" />
        <Skeleton className="mt-10 h-64 rounded-3xl" />
      </div>
    );
  }
  if (isNotFound(error)) {
    return (
      <div className="container-page py-12">
        <EmptyState icon={PackageSearch} title="Order not found" action={<ButtonLink to="/account/orders">Your orders</ButtonLink>} />
      </div>
    );
  }
  if (error || !order) {
    return (
      <div className="container-page py-16">
        <ErrorState error={error} onRetry={() => void refetch()} />
      </div>
    );
  }

  const awaiting = order.status === 'pending_payment';

  return (
    <div className="container-page max-w-3xl py-10 sm:py-14">
      <Seo title={`Order ${order.order_number}`} noindex />
      <div className="text-center">
        <span className={awaiting ? 'inline-flex size-20 items-center justify-center rounded-full bg-warning-tint text-warning' : 'inline-flex size-20 animate-fade-up items-center justify-center rounded-full bg-success-tint text-success'}>
          {awaiting ? <Clock className="size-10" aria-hidden /> : <CheckCircle2 className="size-10" aria-hidden />}
        </span>
        <h1 className="mt-6 font-display text-3xl font-semibold tracking-tight sm:text-4xl">{awaiting ? 'Almost there…' : 'Thank you! Your order is placed.'}</h1>
        <p className="mt-3 text-ink-soft">
          Order <strong className="text-ink tabular">{order.order_number}</strong> · placed {formatDateTime(order.placed_at)}
        </p>
        <p className="mt-1 text-sm text-muted">
          {order.payment_method === 'cod' ? `Please keep ${formatINR(order.total)} ready — pay in cash or UPI on delivery.` : order.payment_status === 'paid' ? 'Payment received. A confirmation has been recorded on your order.' : 'We are waiting for your payment to be confirmed.'}
        </p>
      </div>

      <div className="mt-10 space-y-6">
        <section className="rounded-3xl bg-white p-6 ring-1 ring-line/70" aria-label="Order status">
          <OrderTimeline order={order} />
        </section>

        <section className="grid gap-6 rounded-3xl bg-white p-6 ring-1 ring-line/70 sm:grid-cols-2" aria-label="Order details">
          <div>
            <h2 className="mb-2 text-xs font-semibold tracking-[0.16em] text-muted uppercase">Delivering to</h2>
            <AddressLines a={order.shipping_address} />
          </div>
          <div>
            <h2 className="mb-2 text-xs font-semibold tracking-[0.16em] text-muted uppercase">Summary</h2>
            <dl className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-soft">Items ({order.item_count})</dt>
                <dd className="tabular">{formatINR(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-soft">Delivery</dt>
                <dd className="tabular">{order.shipping_fee ? formatINR(order.shipping_fee) : 'Free'}</dd>
              </div>
              <div className="flex justify-between border-t border-line pt-2 font-semibold">
                <dt>Total</dt>
                <dd className="tabular">{formatINR(order.total)}</dd>
              </div>
              <div className="flex justify-between pt-1 text-ink-soft">
                <dt>Payment</dt>
                <dd>{order.payment_method === 'cod' ? 'Cash on Delivery' : 'Online (Razorpay)'}</dd>
              </div>
            </dl>
          </div>
          {order.items && (
            <ul className="space-y-3 border-t border-line pt-5 sm:col-span-2">
              {order.items.map((i) => (
                <li key={i.id} className="flex items-center gap-3">
                  <ProductImage src={i.image_url} alt="" seed={i.product_name} hints={[i.product_name]} className="size-14 shrink-0 rounded-xl" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{i.product_name}</p>
                    <p className="text-xs text-muted">
                      {i.quantity} × {formatINR(i.unit_price)}
                      {i.unit ? ` · ${i.unit}` : ''}
                    </p>
                  </div>
                  <p className="text-sm font-semibold tabular">{formatINR(i.line_total)}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="flex flex-wrap justify-center gap-3">
          <ButtonLink to={`/account/orders/${order.id}`} variant="primary">
            {awaiting ? 'Complete payment' : 'Track this order'}
          </ButtonLink>
          <ButtonLink to="/shop" variant="outline">
            Continue shopping
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
