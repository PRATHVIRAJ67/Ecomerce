/**
 * Loads Razorpay Checkout on demand. Only the public key_id returned by our API for each order is used
 * in the browser; the secret stays in Admin/Backend and the payment signature is verified server-side.
 */
export interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayOptions {
  key: string;
  order_id: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color?: string };
  handler: (response: RazorpayResponse) => void;
  modal?: { ondismiss?: () => void; confirm_close?: boolean };
}

interface RazorpayInstance {
  open(): void;
  on(event: 'payment.failed', cb: (resp: { error: { description?: string } }) => void): void;
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

const SRC = 'https://checkout.razorpay.com/v1/checkout.js';
let loading: Promise<void> | null = null;

export function loadRazorpay(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  loading ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      loading = null;
      script.remove();
      reject(new Error('Could not load the payment window. Check your connection and try again.'));
    };
    document.head.appendChild(script);
  });
  return loading;
}

export type PaymentOutcome =
  | { status: 'paid'; response: RazorpayResponse }
  | { status: 'dismissed' }
  | { status: 'failed'; message: string };

export async function payWithRazorpay(opts: {
  key_id: string;
  order_id: string;
  amount: number;
  currency: string;
  orderNumber: string;
  prefill?: RazorpayOptions['prefill'];
}): Promise<PaymentOutcome> {
  await loadRazorpay();
  const Razorpay = window.Razorpay;
  if (!Razorpay) throw new Error('Payment window unavailable. Please try again.');
  return new Promise<PaymentOutcome>((resolve) => {
    let settled = false;
    const done = (o: PaymentOutcome) => {
      if (!settled) {
        settled = true;
        resolve(o);
      }
    };
    const rzp = new Razorpay({
      key: opts.key_id,
      order_id: opts.order_id,
      amount: opts.amount,
      currency: opts.currency,
      name: 'URU',
      description: `Order ${opts.orderNumber}`,
      prefill: opts.prefill,
      theme: { color: '#174D38' },
      handler: (response) => done({ status: 'paid', response }),
      modal: { ondismiss: () => done({ status: 'dismissed' }), confirm_close: true },
    });
    rzp.on('payment.failed', (resp) => done({ status: 'failed', message: resp.error.description ?? 'Payment failed' }));
    rzp.open();
  });
}
