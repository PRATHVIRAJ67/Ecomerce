import { addressInput, type Address } from '@ecommerce/shared';
import { useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { useToast } from '../context/ToastContext';
import { api, ApiError, errorMessage } from '../lib/api';
import { keys } from '../lib/queries';
import { Button, Checkbox, Input, Select } from './ui';

export const INDIAN_STATES = [
  'Andaman and Nicobar Islands', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chandigarh', 'Chhattisgarh',
  'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu and Kashmir',
  'Jharkhand', 'Karnataka', 'Kerala', 'Ladakh', 'Lakshadweep', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya',
  'Mizoram', 'Nagaland', 'Odisha', 'Puducherry', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
];

type FormState = {
  label: string;
  full_name: string;
  phone: string;
  line1: string;
  line2: string;
  landmark: string;
  city: string;
  state: string;
  pincode: string;
  is_default: boolean;
};

const fromAddress = (a?: Address | null, fallbackName = ''): FormState => ({
  label: a?.label ?? '',
  full_name: a?.full_name ?? fallbackName,
  phone: a?.phone ?? '',
  line1: a?.line1 ?? '',
  line2: a?.line2 ?? '',
  landmark: a?.landmark ?? '',
  city: a?.city ?? '',
  state: a?.state ?? '',
  pincode: a?.pincode ?? '',
  is_default: a?.is_default ?? false,
});

interface Props {
  address?: Address | null;
  defaultName?: string;
  onSaved: (a: Address) => void;
  onCancel?: () => void;
  submitLabel?: string;
}

/** Validated with the same zod schema the API uses (Shared/validation). */
export function AddressForm({ address, defaultName, onSaved, onCancel, submitLabel }: Props) {
  const qc = useQueryClient();
  const toast = useToast();
  const [form, setForm] = useState<FormState>(() => fromAddress(address, defaultName));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const set = (k: keyof FormState) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const payload = {
      label: form.label.trim() || null,
      full_name: form.full_name,
      phone: form.phone.replace(/\s+/g, ' ').trim(),
      line1: form.line1,
      line2: form.line2.trim() || null,
      landmark: form.landmark.trim() || null,
      city: form.city,
      state: form.state,
      pincode: form.pincode.trim(),
      is_default: form.is_default,
    };
    const result = addressInput.safeParse(payload);
    if (!result.success) {
      const errs: Record<string, string> = {};
      for (const i of result.error.issues) {
        const k = String(i.path[0]);
        errs[k] ??= k === 'line1' ? 'Enter your house / flat and street' : k === 'state' ? 'Choose your state' : i.message.startsWith('Too small') || i.message.includes('>=') ? 'This field is required' : i.message;
      }
      setErrors(errs);
      return;
    }
    setErrors({});
    setBusy(true);
    try {
      const saved = address ? await api.patch<Address>(`/me/addresses/${address.id}`, result.data) : await api.post<Address>('/me/addresses', result.data);
      await qc.invalidateQueries({ queryKey: keys.addresses });
      toast.success(address ? 'Address updated' : 'Address saved');
      onSaved(saved);
    } catch (err) {
      if (err instanceof ApiError && Array.isArray(err.details)) {
        const errs: Record<string, string> = {};
        for (const d of err.details as { path: string; message: string }[]) errs[d.path] = d.message;
        setErrors(errs);
      }
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
      <Input label="Full name" autoComplete="name" value={form.full_name} onChange={set('full_name')} error={errors.full_name} required />
      <Input label="Mobile number" type="tel" inputMode="tel" autoComplete="tel" placeholder="10-digit mobile" value={form.phone} onChange={set('phone')} error={errors.phone} hint="For delivery updates" required />
      <Input label="House / flat, building, street" autoComplete="address-line1" value={form.line1} onChange={set('line1')} error={errors.line1} wrapperClassName="sm:col-span-2" required />
      <Input label="Area, colony, sector" autoComplete="address-line2" value={form.line2} onChange={set('line2')} error={errors.line2} optional wrapperClassName="sm:col-span-2" />
      <Input label="Landmark" value={form.landmark} onChange={set('landmark')} error={errors.landmark} optional />
      <Input
        label="PIN code"
        inputMode="numeric"
        autoComplete="postal-code"
        maxLength={6}
        value={form.pincode}
        onChange={(e) => setForm((f) => ({ ...f, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
        error={errors.pincode}
        required
      />
      <Input label="City / town" autoComplete="address-level2" value={form.city} onChange={set('city')} error={errors.city} required />
      <Select label="State" autoComplete="address-level1" value={form.state} onChange={set('state')} error={errors.state} required>
        <option value="">Select state</option>
        {INDIAN_STATES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
        {form.state && !INDIAN_STATES.includes(form.state) && <option value={form.state}>{form.state}</option>}
      </Select>
      <Input label="Save as" placeholder="Home, Work…" maxLength={40} value={form.label} onChange={set('label')} error={errors.label} optional />
      <div className="flex items-end pb-2.5">
        <Checkbox label="Make this my default address" checked={form.is_default} onChange={(e) => setForm((f) => ({ ...f, is_default: e.target.checked }))} />
      </div>
      <div className="flex flex-wrap gap-3 pt-2 sm:col-span-2">
        <Button type="submit" loading={busy}>
          {submitLabel ?? (address ? 'Save changes' : 'Save address')}
        </Button>
        {onCancel && (
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}

export function AddressLines({ a }: { a: Pick<Address, 'full_name' | 'phone' | 'line1' | 'line2' | 'landmark' | 'city' | 'state' | 'pincode'> }) {
  return (
    <address className="text-sm leading-relaxed text-ink-soft not-italic">
      <span className="font-semibold text-ink">{a.full_name}</span>
      <br />
      {a.line1}
      {a.line2 ? `, ${a.line2}` : ''}
      {a.landmark ? <><br />Near {a.landmark}</> : null}
      <br />
      {a.city}, {a.state} – {a.pincode}
      <br />
      Phone: {a.phone}
    </address>
  );
}
