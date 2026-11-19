import type { CheckoutResult, Order } from '@ecommerce/shared';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api, errorMessage } from './api';
import { keys } from './queries';
import { payWithRazorpay } from './razorpay';

type RazorpayInfo = NonNullable<CheckoutResult['razorpay']>;

/**
 * Opens Razorpay for an order awaiting payment, then asks OUR API to verify the signature.
 * The order is only marked paid server-side after HMAC verification (or the Razorpay webhook).
 */
export function usePayment() {
  const qc = useQueryClient();
  const toast = useToast();
  const navigate = useNavigate();
  const { profile, session } = useAuth();
  const [paying, setPaying] = useState(false);

  const pay = useCallback(
    async (order: Pick<Order, 'id' | 'order_number' | 'customer_phone' | 'customer_name'>, info?: RazorpayInfo | null) => {
      setPaying(true);
      try {
        const rp = info ?? (await api.post<{ razorpay: RazorpayInfo }>(`/me/orders/${order.id}/pay`)).razorpay;
        const outcome = await payWithRazorpay({
          key_id: rp.key_id,
          order_id: rp.order_id,
          amount: rp.amount,
          currency: rp.currency,
          orderNumber: order.order_number,
          prefill: {
            name: profile?.full_name ?? order.customer_name ?? undefined,
            email: profile?.email ?? session?.user.email ?? undefined,
            contact: profile?.phone ?? order.customer_phone ?? undefined,
          },
        });
        if (outcome.status === 'paid') {
          const verified = await api.post<Order>(`/me/orders/${order.id}/verify-payment`, outcome.response);
          qc.setQueryData(keys.order(order.id), verified);
          void qc.invalidateQueries({ queryKey: ['me', 'orders'] });
          navigate(`/order/${order.id}/confirmed`, { replace: true });
          return true;
        }
        if (outcome.status === 'failed') toast.error(`Payment failed: ${outcome.message}. You can try again from your order.`);
        else toast.info('Payment not completed. Your items are reserved for a short while — you can pay from the order page.');
        navigate(`/account/orders/${order.id}`, { replace: true });
        return false;
      } catch (err) {
        toast.error(errorMessage(err));
        navigate(`/account/orders/${order.id}`, { replace: true });
        return false;
      } finally {
        setPaying(false);
      }
    },
    [qc, toast, navigate, profile, session],
  );

  return { pay, paying };
}
