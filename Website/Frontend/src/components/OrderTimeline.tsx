import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS, type Order, type OrderStatus, type PaymentStatus } from '@ecommerce/shared';
import { Check, CircleDot, PackageCheck, PackageOpen, Truck, XCircle, Home, Clock } from 'lucide-react';
import { cn, formatDateTime } from '../lib/format';
import { Badge } from './ui';

const STEPS: { status: OrderStatus; label: string; icon: typeof Check }[] = [
  { status: 'confirmed', label: 'Confirmed', icon: CircleDot },
  { status: 'packed', label: 'Packed', icon: PackageOpen },
  { status: 'shipped', label: 'Shipped', icon: PackageCheck },
  { status: 'out_for_delivery', label: 'Out for delivery', icon: Truck },
  { status: 'delivered', label: 'Delivered', icon: Home },
];

const TONE: Record<OrderStatus, 'forest' | 'success' | 'warning' | 'danger' | 'neutral'> = {
  pending_payment: 'warning',
  confirmed: 'forest',
  packed: 'forest',
  shipped: 'forest',
  out_for_delivery: 'forest',
  delivered: 'success',
  cancelled: 'danger',
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge tone={TONE[status]}>{ORDER_STATUS_LABELS[status]}</Badge>;
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const tone = status === 'paid' ? 'success' : status === 'failed' ? 'danger' : status === 'pending' ? 'neutral' : 'warning';
  return <Badge tone={tone}>{PAYMENT_STATUS_LABELS[status]}</Badge>;
}

/** Progress tracker (confirmed → delivered) plus the full status history from the server. */
export function OrderTimeline({ order }: { order: Order }) {
  const history = order.history ?? [];
  const at = (s: OrderStatus) => history.filter((h) => h.status === s).at(-1)?.created_at;

  if (order.status === 'cancelled') {
    return (
      <div className="flex items-start gap-3 rounded-2xl bg-danger-tint/60 p-4">
        <XCircle className="mt-0.5 size-5 shrink-0 text-danger" aria-hidden />
        <div>
          <p className="font-semibold text-danger">Order cancelled</p>
          <p className="text-sm text-ink-soft">
            {order.cancel_reason ?? 'This order was cancelled.'} {order.cancelled_at && `· ${formatDateTime(order.cancelled_at)}`}
          </p>
          {order.payment_status === 'refund_pending' && <p className="mt-1 text-sm text-ink-soft">Your refund is being processed to the original payment method.</p>}
          {order.payment_status === 'refunded' && <p className="mt-1 text-sm text-ink-soft">Your payment has been refunded.</p>}
        </div>
      </div>
    );
  }

  if (order.status === 'pending_payment') {
    return (
      <div className="flex items-start gap-3 rounded-2xl bg-warning-tint p-4">
        <Clock className="mt-0.5 size-5 shrink-0 text-warning" aria-hidden />
        <div>
          <p className="font-semibold text-warning">Awaiting payment</p>
          <p className="text-sm text-ink-soft">Complete payment to confirm this order. Unpaid orders are cancelled automatically after a short while and the items are released.</p>
        </div>
      </div>
    );
  }

  const currentIdx = STEPS.findIndex((s) => s.status === order.status);
  return (
    <ol className="relative grid gap-5 sm:grid-cols-5 sm:gap-2" aria-label="Order progress">
      {STEPS.map((step, i) => {
        const done = i <= currentIdx;
        const isCurrent = i === currentIdx;
        const when = at(step.status);
        const Icon = done && !isCurrent ? Check : step.icon;
        return (
          <li key={step.status} className="relative flex items-center gap-3 sm:flex-col sm:text-center" aria-current={isCurrent ? 'step' : undefined}>
            {i > 0 && (
              <span className={cn('absolute -top-5 left-[19px] h-5 w-0.5 sm:top-[19px] sm:right-1/2 sm:left-auto sm:h-0.5 sm:w-[calc(100%+0.5rem)]', i <= currentIdx ? 'bg-forest-700' : 'bg-line')} aria-hidden />
            )}
            <span className={cn('relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full ring-4 ring-white', done ? 'bg-forest-700 text-cream' : 'bg-cream-dark text-muted', isCurrent && 'bg-terracotta-500')}>
              <Icon className="size-[18px]" aria-hidden />
            </span>
            <div>
              <p className={cn('text-sm font-semibold', done ? 'text-ink' : 'text-muted')}>
                {step.label}
                <span className="sr-only">{done ? ' (completed)' : ' (upcoming)'}</span>
              </p>
              {when && <p className="text-xs text-muted">{formatDateTime(when)}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function OrderHistoryList({ order }: { order: Order }) {
  const history = [...(order.history ?? [])].reverse();
  if (!history.length) return null;
  return (
    <ul className="space-y-4">
      {history.map((h) => (
        <li key={h.id} className="flex gap-3">
          <span className="mt-1.5 size-2.5 shrink-0 rounded-full bg-forest-600" aria-hidden />
          <div>
            <p className="text-sm font-semibold">{ORDER_STATUS_LABELS[h.status]}</p>
            {h.note && <p className="text-sm text-ink-soft">{h.note}</p>}
            <p className="text-xs text-muted">{formatDateTime(h.created_at)}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
