import { CUSTOMER_CANCELLABLE, type Order } from '@ecommerce/shared';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CreditCard, PackageSearch, RefreshCw, XCircle } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AddressLines } from '../../components/AddressForm';
import { OrderHistoryList, OrderStatusBadge, OrderTimeline, PaymentStatusBadge } from '../../components/OrderTimeline';
import { ProductImage } from '../../components/product/ProductImage';
import { Button, ButtonLink, EmptyState, ErrorState, Modal, Skeleton, Textarea } from '../../components/ui';
import { useToast } from '../../context/ToastContext';
import { api, errorMessage, isNotFound } from '../../lib/api';
import { formatDateTime, formatINR } from '../../lib/format';
import { keys, useOrder, useSettings } from '../../lib/queries';
import { Seo } from '../../lib/seo';
import { usePayment } from '../../lib/usePayment';

const ACTIVE = new Set(['confirmed', 'packed', 'shipped', 'out_for_delivery', 'pending_payment']);

export default function OrderDetailPage() {
  const { id } = useParams();
  const qc = useQueryClient();
  const toast = useToast();
  const { data: settings } = useSettings();
  const { pay, paying } = usePayment();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const { data: order, isPending, error, refetch, isFetching } = useOrder(id, { poll: true });

  if (isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-36 rounded-3xl" />
        <Skeleton className="h-64 rounded-3xl" />
      </div>
    );
  }
  if (isNotFound(error)) {
    return <EmptyState icon={PackageSearch} title="Order not found" action={<ButtonLink to="/account/orders">Back to orders</ButtonLink>} />;
  }
  if (error || !order) return <ErrorState error={error} onRetry={() => void refetch()} />;

  const canCancel = CUSTOMER_CANCELLABLE.includes(order.status);
  const canPay = order.status === 'pending_payment' && order.payment_method === 'razorpay';

  const cancel = async () => {
    setCancelling(true);
    try {
      const updated = await api.post<Order>(`/me/orders/${order.id}/cancel`, { reason: reason.trim() || null });
      qc.setQueryData(keys.order(order.id), updated);
      void qc.invalidateQueries({ queryKey: ['me', 'orders'] });
      void qc.invalidateQueries({ queryKey: ['catalog'] });
      toast.success('Your order has been cancelled');
      setCancelOpen(false);
    } catch (e) {
      toast.error(errorMessage(e));
      void refetch();
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="space-y-6">
      <Seo title={`Order ${order.order_number}`} noindex />
      <Link to="/account/orders" className="inline-flex items-center gap-1.5 text-sm font-medium text-forest-700 hover:underline">
        <ArrowLeft className="size-4" aria-hidden /> All orders
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-2xl font-semibold tabular">{order.order_number}</h2>
            <OrderStatusBadge status={order.status} />
          </div>
          <p className="mt-1 text-sm text-muted">Placed {formatDateTime(order.placed_at)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {ACTIVE.has(order.status) && (
            <Button variant="ghost" size="sm" icon={RefreshCw} onClick={() => void refetch()} loading={isFetching} aria-label="Refresh order status">
              Refresh
            </Button>
          )}
          {canPay && settings?.online_payments_available && (
            <Button variant="accent" size="sm" icon={CreditCard} loading={paying} onClick={() => void pay(order)}>
              Pay {formatINR(order.total)}
            </Button>
          )}
          {canCancel && (
            <Button variant="danger" size="sm" icon={XCircle} onClick={() => setCancelOpen(true)}>
              Cancel order
            </Button>
          )}
        </div>
      </div>

      <section className="rounded-3xl bg-white p-6 ring-1 ring-line/70" aria-labelledby="track-h">
        <h3 id="track-h" className="mb-5 font-semibold">
          Tracking
        </h3>
        <OrderTimeline order={order} />
        {order.delivered_at && <p className="mt-5 text-sm text-success">Delivered on {formatDateTime(order.delivered_at)}</p>}
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="rounded-3xl bg-white p-6 ring-1 ring-line/70" aria-labelledby="items-h">
          <h3 id="items-h" className="mb-4 font-semibold">
            Items
          </h3>
          <ul className="divide-y divide-line">
            {(order.items ?? []).map((i) => (
              <li key={i.id} className="flex items-center gap-4 py-3">
                <ProductImage src={i.image_url} alt="" seed={i.product_name} hints={[i.product_name]} className="size-16 shrink-0 rounded-xl" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{i.product_name}</p>
                  <p className="text-sm text-muted">
                    {i.quantity} × {formatINR(i.unit_price)}
                    {i.unit ? ` · ${i.unit}` : ''}
                  </p>
                </div>
                <p className="font-semibold tabular">{formatINR(i.line_total)}</p>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-soft">Subtotal</dt>
              <dd className="tabular">{formatINR(order.subtotal)}</dd>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between">
                <dt className="text-ink-soft">Discount</dt>
                <dd className="text-success tabular">−{formatINR(order.discount)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-ink-soft">Delivery</dt>
              <dd className="tabular">{order.shipping_fee ? formatINR(order.shipping_fee) : 'Free'}</dd>
            </div>
            <div className="flex justify-between border-t border-line pt-2 text-base font-semibold">
              <dt>Total</dt>
              <dd className="tabular">{formatINR(order.total)}</dd>
            </div>
          </dl>
        </section>

        <div className="space-y-6">
          <section className="rounded-3xl bg-white p-6 ring-1 ring-line/70" aria-labelledby="ship-h">
            <h3 id="ship-h" className="mb-3 font-semibold">
              Delivery address
            </h3>
            <AddressLines a={order.shipping_address} />
          </section>
          <section className="rounded-3xl bg-white p-6 ring-1 ring-line/70" aria-labelledby="payh">
            <h3 id="payh" className="mb-3 font-semibold">
              Payment
            </h3>
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink-soft">{order.payment_method === 'cod' ? 'Cash on Delivery' : 'Online · Razorpay'}</span>
              <PaymentStatusBadge status={order.payment_status} />
            </div>
            {order.paid_at && <p className="mt-2 text-xs text-muted">Paid {formatDateTime(order.paid_at)}</p>}
            {order.notes && (
              <p className="mt-4 rounded-xl bg-cream p-3 text-sm text-ink-soft">
                <span className="font-medium text-ink">Your note:</span> {order.notes}
              </p>
            )}
          </section>
          <section className="rounded-3xl bg-white p-6 ring-1 ring-line/70" aria-labelledby="hist-h">
            <h3 id="hist-h" className="mb-4 font-semibold">
              Activity
            </h3>
            <OrderHistoryList order={order} />
          </section>
        </div>
      </div>

      <Modal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title="Cancel this order?"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCancelOpen(false)}>
              Keep order
            </Button>
            <Button variant="danger" loading={cancelling} onClick={() => void cancel()}>
              Yes, cancel
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-soft">
          {order.payment_status === 'paid' ? 'Your payment will be refunded to the original payment method.' : 'Nothing has been charged for this order.'}
        </p>
        <Textarea label="Reason" optional maxLength={300} value={reason} onChange={(e) => setReason(e.target.value)} wrapperClassName="mt-4" placeholder="Help us improve (optional)" />
      </Modal>
    </div>
  );
}
