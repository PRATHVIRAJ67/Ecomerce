import type { Address, CheckoutResult } from '@ecommerce/shared';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, CreditCard, HandCoins, Lock, MapPin, Plus, ShoppingBag } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AddressForm, AddressLines } from '../components/AddressForm';
import { ProductImage } from '../components/product/ProductImage';
import { Badge, Button, ButtonLink, EmptyState, ErrorState, Skeleton, Spinner, Textarea } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { api, ApiError, errorMessage } from '../lib/api';
import { cn, formatINR, plural } from '../lib/format';
import { Seo } from '../lib/seo';
import { keys, useSettings } from '../lib/queries';
import { usePayment } from '../lib/usePayment';

type Method = 'cod' | 'razorpay';
interface Problem {
  product_id: string;
  name: string;
  reason: 'unavailable' | 'out_of_stock' | 'insufficient_stock' | 'quantity_limit';
  available?: number;
}

const PROBLEM_TEXT: Record<Problem['reason'], (p: Problem) => string> = {
  unavailable: () => 'is no longer available',
  out_of_stock: () => 'just went out of stock',
  insufficient_stock: (p) => `only has ${p.available} left`,
  quantity_limit: (p) => `is limited to ${p.available} per order`,
};

export default function CheckoutPage() {
  const cart = useCart();
  const { profile } = useAuth();
  const { data: settings } = useSettings();
  const toast = useToast();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { pay, paying } = usePayment();

  const addresses = useQuery({ queryKey: keys.addresses, queryFn: () => api.get<Address[]>('/me/addresses') });
  const [addressId, setAddressId] = useState<string | null>(null);
  const [addingAddress, setAddingAddress] = useState(false);
  const [method, setMethod] = useState<Method | null>(null);
  const [notes, setNotes] = useState('');
  const [placing, setPlacing] = useState(false);
  const [problems, setProblems] = useState<Problem[] | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  /** Set once the server has accepted the order — the cart is now empty server-side. */
  const [placed, setPlaced] = useState(false);

  const summary = cart.summary;
  const codAllowed = settings?.cod_enabled !== false && (!settings?.cod_max_order_value || (summary?.total ?? 0) <= settings.cod_max_order_value);
  const onlineAllowed = Boolean(settings?.online_payments_available);

  useEffect(() => {
    if (addressId || !addresses.data?.length) return;
    setAddressId((addresses.data.find((a) => a.is_default) ?? addresses.data[0]!).id);
  }, [addresses.data, addressId]);

  useEffect(() => {
    if (addresses.data && addresses.data.length === 0) setAddingAddress(true);
  }, [addresses.data]);

  useEffect(() => {
    if (method === 'cod' && !codAllowed) setMethod(null);
    if (method === 'razorpay' && !onlineAllowed) setMethod(null);
    if (!method) setMethod(onlineAllowed ? 'razorpay' : codAllowed ? 'cod' : null);
  }, [codAllowed, onlineAllowed, method]);

  if (placed) {
    return (
      <div className="container-page flex min-h-[50vh] flex-col items-center justify-center py-16 text-center" role="status" aria-live="polite">
        <Seo title="Checkout" noindex />
        <Spinner className="size-8" />
        <p className="mt-4 font-display text-xl font-semibold">Completing your order…</p>
        <p className="mt-1 text-sm text-muted">Please don't close this window.</p>
      </div>
    );
  }

  if (cart.isLoading || addresses.isPending) {
    return (
      <div className="container-page py-10">
        <Seo title="Checkout" noindex />
        <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
          <div className="space-y-4">
            <Skeleton className="h-48 rounded-3xl" />
            <Skeleton className="h-40 rounded-3xl" />
          </div>
          <Skeleton className="h-96 rounded-3xl" />
        </div>
      </div>
    );
  }
  if (cart.error || addresses.error) {
    return (
      <div className="container-page py-16">
        <ErrorState error={cart.error ?? addresses.error} onRetry={() => (cart.refetch(), void addresses.refetch())} />
      </div>
    );
  }
  if (!summary || summary.lines.length === 0) {
    return (
      <div className="container-page py-10">
        <Seo title="Checkout" noindex />
        <EmptyState icon={ShoppingBag} title="Your cart is empty" action={<ButtonLink to="/shop">Continue shopping</ButtonLink>}>
          Add something you love, then come back to check out.
        </EmptyState>
      </div>
    );
  }

  const selected = addresses.data?.find((a) => a.id === addressId) ?? null;
  const blocked = summary.has_unavailable_items || Boolean(settings?.maintenance_mode);

  const placeOrder = async () => {
    setFormError(null);
    if (!selected) return setFormError('Choose a delivery address');
    if (!method) return setFormError('Choose a payment method');
    setPlacing(true);
    setProblems(null);
    try {
      const result = await api.post<CheckoutResult>('/me/checkout', { address_id: selected.id, payment_method: method, notes: notes.trim() || null });
      setPlaced(true);
      // Server cleared the cart and decremented stock inside the checkout transaction.
      void qc.invalidateQueries({ queryKey: keys.cart });
      void qc.invalidateQueries({ queryKey: ['catalog'] });
      void qc.invalidateQueries({ queryKey: ['me', 'orders'] });
      qc.setQueryData(keys.order(result.order.id), result.order);
      if (result.order.payment_method === 'razorpay') {
        if (!result.razorpay) {
          toast.info('Your order is reserved. We couldn’t open the payment window — please try paying again.');
          navigate(`/account/orders/${result.order.id}`, { replace: true });
          return;
        }
        await pay(result.order, result.razorpay);
        return;
      }
      navigate(`/order/${result.order.id}/confirmed`, { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.code === 'cart_unavailable' && Array.isArray(err.details)) {
        setProblems(err.details as Problem[]);
        cart.refetch();
      } else {
        setFormError(errorMessage(err));
      }
      setPlacing(false);
    }
  };

  return (
    <div className="container-page py-8 sm:py-12">
      <Seo title="Checkout" noindex />
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Checkout</h1>
        <p className="flex items-center gap-1.5 text-sm text-muted">
          <Lock className="size-4" aria-hidden /> Secure checkout
        </p>
      </div>

      <div className="grid items-start gap-8 lg:grid-cols-[1fr_400px]">
        <div className="space-y-6">
          {/* 1. Address */}
          <section className="rounded-3xl bg-white p-5 ring-1 ring-line/70 sm:p-7" aria-labelledby="addr-h">
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 id="addr-h" className="flex items-center gap-3 font-display text-xl font-semibold">
                <StepNo n={1} /> Delivery address
              </h2>
              {!addingAddress && (
                <Button variant="ghost" size="sm" icon={Plus} onClick={() => setAddingAddress(true)}>
                  Add new
                </Button>
              )}
            </div>
            {addingAddress ? (
              <AddressForm
                defaultName={profile?.full_name ?? ''}
                submitLabel="Save & deliver here"
                onSaved={(a) => {
                  setAddressId(a.id);
                  setAddingAddress(false);
                }}
                onCancel={addresses.data?.length ? () => setAddingAddress(false) : undefined}
              />
            ) : (
              <fieldset>
                <legend className="sr-only">Choose a delivery address</legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  {addresses.data!.map((a) => (
                    <label key={a.id} className={cn('relative flex cursor-pointer gap-3 rounded-2xl border-2 p-4 transition', a.id === addressId ? 'border-forest-700 bg-forest-50/60' : 'border-line hover:border-forest-300')}>
                      <input type="radio" name="address" value={a.id} checked={a.id === addressId} onChange={() => setAddressId(a.id)} className="mt-1 size-4 accent-forest-700" />
                      <div className="min-w-0">
                        <div className="mb-1 flex flex-wrap gap-1.5">
                          {a.label && <Badge tone="forest">{a.label}</Badge>}
                          {a.is_default && <Badge>Default</Badge>}
                        </div>
                        <AddressLines a={a} />
                      </div>
                    </label>
                  ))}
                </div>
              </fieldset>
            )}
          </section>

          {/* 2. Payment */}
          <section className="rounded-3xl bg-white p-5 ring-1 ring-line/70 sm:p-7" aria-labelledby="pay-h">
            <h2 id="pay-h" className="mb-5 flex items-center gap-3 font-display text-xl font-semibold">
              <StepNo n={2} /> Payment
            </h2>
            <fieldset className="grid gap-3">
              <legend className="sr-only">Choose a payment method</legend>
              <PaymentOption
                value="razorpay"
                checked={method === 'razorpay'}
                onSelect={setMethod}
                disabled={!onlineAllowed}
                icon={CreditCard}
                title="Pay online"
                text={onlineAllowed ? 'UPI, cards, netbanking & wallets — secured by Razorpay' : 'Online payment is not available right now'}
              />
              <PaymentOption
                value="cod"
                checked={method === 'cod'}
                onSelect={setMethod}
                disabled={!codAllowed}
                icon={HandCoins}
                title="Cash on Delivery"
                text={
                  settings?.cod_enabled === false
                    ? 'Not available right now'
                    : !codAllowed
                      ? `Available for orders up to ${formatINR(settings?.cod_max_order_value)}`
                      : 'Pay in cash or UPI when your order arrives'
                }
              />
            </fieldset>
            {!onlineAllowed && !codAllowed && (
              <p role="alert" className="mt-4 text-sm text-danger">
                No payment method is available for this order right now. Please contact us for help.
              </p>
            )}
            <Textarea label="Delivery instructions" optional maxLength={500} placeholder="E.g. call before arriving, leave with the security desk" value={notes} onChange={(e) => setNotes(e.target.value)} wrapperClassName="mt-6" />
          </section>
        </div>

        {/* Summary */}
        <aside className="lg:sticky lg:top-36" aria-label="Order summary">
          <div className="rounded-3xl bg-white p-6 ring-1 ring-line/70">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold">Your order</h2>
              <Link to="/cart" className="text-sm font-semibold text-forest-700 hover:underline">
                Edit cart
              </Link>
            </div>
            <ul className="mt-5 max-h-72 space-y-4 overflow-y-auto pr-1">
              {summary.lines.map((l) => (
                <li key={l.product_id} className="flex gap-3">
                  <div className="relative shrink-0">
                    <ProductImage src={l.product.images[0]?.url} alt="" seed={l.product.category_slug ?? l.product.slug} hints={[l.product.category_name, l.product.name]} className="size-16 rounded-xl" />
                    <span className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-forest-700 text-[11px] font-bold text-cream">{l.quantity}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-medium">{l.product.name}</p>
                    {!l.available && <p className="text-xs font-semibold text-danger">Unavailable</p>}
                    {l.product.unit && <p className="text-xs text-muted">{l.product.unit}</p>}
                  </div>
                  <p className="text-sm font-semibold tabular">{formatINR(l.line_total)}</p>
                </li>
              ))}
            </ul>
            <dl className="mt-5 space-y-2.5 border-t border-line pt-5 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-soft">Subtotal ({plural(summary.item_count, 'item')})</dt>
                <dd className="tabular">{formatINR(summary.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-soft">Delivery</dt>
                <dd className="tabular">{summary.shipping_fee ? formatINR(summary.shipping_fee) : <span className="text-success">Free</span>}</dd>
              </div>
              <div className="flex justify-between border-t border-line pt-3 text-base font-semibold">
                <dt>Total</dt>
                <dd className="tabular">{formatINR(summary.total)}</dd>
              </div>
            </dl>

            {selected && !addingAddress && (
              <p className="mt-4 flex items-start gap-2 rounded-xl bg-cream p-3 text-xs text-ink-soft">
                <MapPin className="mt-0.5 size-4 shrink-0 text-forest-700" aria-hidden /> Delivering to {selected.full_name}, {selected.city} – {selected.pincode}
              </p>
            )}

            {(problems || summary.has_unavailable_items) && (
              <div role="alert" className="mt-4 rounded-2xl border border-warning/30 bg-warning-tint p-4 text-sm">
                <p className="flex items-center gap-2 font-semibold text-warning">
                  <AlertTriangle className="size-4" aria-hidden /> Some items need your attention
                </p>
                {problems ? (
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-ink-soft">
                    {problems.map((p) => (
                      <li key={p.product_id}>
                        {p.name} {PROBLEM_TEXT[p.reason](p)}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1 text-ink-soft">Some items are out of stock or above the available quantity.</p>
                )}
                <Link to="/cart" className="mt-2 inline-block font-semibold text-forest-700 underline">
                  Review cart
                </Link>
              </div>
            )}

            {formError && (
              <p role="alert" className="mt-4 rounded-xl bg-danger-tint px-4 py-3 text-sm text-danger">
                {formError}
              </p>
            )}

            <Button size="lg" variant="accent" className="mt-5 w-full" loading={placing || paying} disabled={blocked || !selected || !method || addingAddress} onClick={() => void placeOrder()}>
              {method === 'razorpay' ? `Pay ${formatINR(summary.total)}` : `Place order · ${formatINR(summary.total)}`}
            </Button>
            {settings?.maintenance_mode && <p className="mt-3 text-center text-xs text-warning">Checkout is paused for maintenance. Please try again soon.</p>}
            <p className="mt-4 text-center text-xs leading-relaxed text-muted">
              By placing this order you agree to our{' '}
              <Link to="/policies/terms" className="underline">
                terms
              </Link>{' '}
              and{' '}
              <Link to="/policies/returns" className="underline">
                return policy
              </Link>
              . Final prices and stock are confirmed by our server.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function StepNo({ n }: { n: number }) {
  return <span className="flex size-8 items-center justify-center rounded-full bg-forest-700 font-sans text-sm font-bold text-cream" aria-hidden>{n}</span>;
}

function PaymentOption({ value, checked, onSelect, disabled, icon: Icon, title, text }: { value: Method; checked: boolean; onSelect: (m: Method) => void; disabled?: boolean; icon: typeof CreditCard; title: string; text: string }) {
  return (
    <label className={cn('flex items-center gap-4 rounded-2xl border-2 p-4 transition', disabled ? 'cursor-not-allowed border-line opacity-55' : 'cursor-pointer', checked ? 'border-forest-700 bg-forest-50/60' : !disabled && 'border-line hover:border-forest-300')}>
      <input type="radio" name="payment" value={value} checked={checked} disabled={disabled} onChange={() => onSelect(value)} className="size-4 accent-forest-700" />
      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white text-forest-700 ring-1 ring-line">
        <Icon className="size-5" aria-hidden />
      </span>
      <span>
        <span className="block font-semibold">{title}</span>
        <span className="block text-sm text-muted">{text}</span>
      </span>
    </label>
  );
}
