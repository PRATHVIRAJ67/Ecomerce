import { profileUpdateInput, type Profile } from '@ecommerce/shared';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Button, Input, Skeleton } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { api, errorMessage } from '../../lib/api';
import { formatDate } from '../../lib/format';
import { keys, useOrders } from '../../lib/queries';
import { Seo } from '../../lib/seo';

export default function ProfilePage() {
  const { profile, session, updatePassword } = useAuth();
  const qc = useQueryClient();
  const toast = useToast();
  const [form, setForm] = useState({ full_name: '', phone: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [pw, setPw] = useState({ password: '', confirm: '' });
  const [pwErr, setPwErr] = useState<Record<string, string>>({});
  const [pwBusy, setPwBusy] = useState(false);
  const orders = useOrders(1);

  useEffect(() => {
    if (profile) setForm({ full_name: profile.full_name ?? '', phone: profile.phone ?? '' });
  }, [profile]);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    const payload = { full_name: form.full_name.trim(), phone: form.phone.trim() || null };
    const r = profileUpdateInput.safeParse(payload);
    if (!r.success) {
      const errs: Record<string, string> = {};
      for (const i of r.error.issues) errs[String(i.path[0])] ??= String(i.path[0]) === 'full_name' ? 'Enter your full name (at least 2 characters)' : i.message;
      setErrors(errs);
      return;
    }
    setErrors({});
    setBusy(true);
    try {
      const updated = await api.patch<Profile>('/me', r.data);
      qc.setQueryData([...keys.profile, session?.user.id], (old: Profile | undefined) => ({ ...(old ?? updated), ...updated }));
      toast.success('Profile updated');
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const changePassword = async (e: FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (pw.password.length < 8) errs.password = 'Use at least 8 characters';
    if (pw.password !== pw.confirm) errs.confirm = 'Passwords do not match';
    setPwErr(errs);
    if (Object.keys(errs).length) return;
    setPwBusy(true);
    try {
      await updatePassword(pw.password);
      setPw({ password: '', confirm: '' });
      toast.success('Password changed');
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setPwBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <Seo title="Your profile" noindex />
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Orders placed" value={orders.data ? String(orders.data.total) : undefined} to="/account/orders" />
        <Stat label="Member since" value={profile ? formatDate(profile.created_at) : undefined} />
        <Stat label="Email" value={profile?.email ?? session?.user.email ?? undefined} />
      </div>

      <section className="rounded-3xl bg-white p-6 ring-1 ring-line/70 sm:p-8" aria-labelledby="pd-h">
        <h2 id="pd-h" className="font-display text-xl font-semibold">
          Personal details
        </h2>
        {!profile ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
        ) : (
          <form onSubmit={save} noValidate className="mt-6 grid gap-4 sm:grid-cols-2">
            <Input label="Full name" autoComplete="name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} error={errors.full_name} />
            <Input label="Mobile number" type="tel" autoComplete="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} error={errors.phone} optional />
            <Input label="Email" value={profile.email ?? ''} disabled hint="Contact support to change your email" wrapperClassName="sm:col-span-2" />
            <div className="sm:col-span-2">
              <Button type="submit" loading={busy}>
                Save changes
              </Button>
            </div>
          </form>
        )}
      </section>

      <section className="rounded-3xl bg-white p-6 ring-1 ring-line/70 sm:p-8" aria-labelledby="pw-h">
        <h2 id="pw-h" className="font-display text-xl font-semibold">
          Change password
        </h2>
        <form onSubmit={changePassword} noValidate className="mt-6 grid gap-4 sm:grid-cols-2">
          <Input label="New password" type="password" autoComplete="new-password" value={pw.password} onChange={(e) => setPw({ ...pw, password: e.target.value })} error={pwErr.password} />
          <Input label="Confirm new password" type="password" autoComplete="new-password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} error={pwErr.confirm} />
          <div className="sm:col-span-2">
            <Button type="submit" variant="outline" loading={pwBusy}>
              Update password
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}

function Stat({ label, value, to }: { label: string; value?: string; to?: string }) {
  const body = (
    <>
      <p className="text-xs font-semibold tracking-[0.14em] text-muted uppercase">{label}</p>
      {value === undefined ? <Skeleton className="mt-2 h-6 w-20" /> : <p className="mt-1 truncate text-lg font-semibold">{value}</p>}
    </>
  );
  return to ? (
    <Link to={to} className="rounded-2xl bg-white p-5 ring-1 ring-line/70 transition hover:ring-forest-300">
      {body}
    </Link>
  ) : (
    <div className="rounded-2xl bg-white p-5 ring-1 ring-line/70">{body}</div>
  );
}
