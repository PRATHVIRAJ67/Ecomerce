import { CheckCircle2, Eye, EyeOff, MailCheck } from 'lucide-react';
import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { LogoMark } from '../components/layout/Logo';
import { Button, ButtonLink, Input } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { errorMessage } from '../lib/api';
import { safeNext } from '../lib/format';
import { Seo } from '../lib/seo';
import { supabase } from '../lib/supabase';

const email = z.string().trim().min(1, 'Enter your email').email('Enter a valid email address');
const password = z.string().min(8, 'Use at least 8 characters').max(72, 'Use 72 characters or fewer');

type Errors = Record<string, string | undefined>;
function collect(result: z.ZodSafeParseResult<unknown>): Errors {
  if (result.success) return {};
  const out: Errors = {};
  for (const issue of result.error.issues) {
    const k = String(issue.path[0] ?? 'form');
    out[k] ??= issue.message;
  }
  return out;
}

function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle?: ReactNode; children: ReactNode; footer?: ReactNode }) {
  const { status } = useAuth();
  return (
    <div className="container-page py-8 sm:py-14">
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-[2rem] bg-white shadow-card ring-1 ring-line/70 lg:grid-cols-2">
        <div className="relative hidden overflow-hidden bg-forest-700 p-12 text-cream lg:block">
          <div className="pattern-weave absolute inset-0" aria-hidden />
          <div className="absolute -right-20 -bottom-24 size-80 rounded-full bg-terracotta-500/30 blur-2xl" aria-hidden />
          <div className="relative flex h-full flex-col">
            <LogoMark className="size-12 text-forest-600" />
            <p className="mt-auto font-display text-4xl leading-tight font-semibold text-cream">
              Bring a little of <span className="text-terracotta-300 italic">home</span> to every meal.
            </p>
            <ul className="mt-8 space-y-3 text-sm text-cream/80">
              {['Track every order, start to doorstep', 'Your cart & wishlist on every device', 'Save addresses for one-tap checkout'].map((t) => (
                <li key={t} className="flex items-center gap-2.5">
                  <CheckCircle2 className="size-4 text-terracotta-300" aria-hidden /> {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="p-6 sm:p-12">
          <h1 className="font-display text-3xl font-semibold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-2 text-ink-soft">{subtitle}</p>}
          {status === 'unavailable' ? (
            <p role="alert" className="mt-6 rounded-2xl bg-warning-tint p-4 text-sm text-warning">
              Customer accounts aren't configured for this store yet (missing Supabase settings).
            </p>
          ) : (
            <div className="mt-8">{children}</div>
          )}
          {footer && <div className="mt-8 border-t border-line pt-6 text-center text-sm text-ink-soft">{footer}</div>}
        </div>
      </div>
    </div>
  );
}

function PasswordInput({ label, value, onChange, error, autoComplete, hint }: { label: string; value: string; onChange: (v: string) => void; error?: string; autoComplete: string; hint?: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input label={label} type={show ? 'text' : 'password'} value={value} onChange={(e) => onChange(e.target.value)} error={error} hint={hint} autoComplete={autoComplete} className="pr-12" required />
      <button type="button" onClick={() => setShow((s) => !s)} className="absolute top-[34px] right-2 flex size-9 items-center justify-center rounded-lg text-muted hover:text-ink" aria-label={show ? 'Hide password' : 'Show password'}>
        {show ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
      </button>
    </div>
  );
}

function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-xl bg-danger-tint px-4 py-3 text-sm text-danger">
      {message}
    </p>
  );
}

export function LoginPage() {
  const { signIn, isSignedIn } = useAuth();
  const [params] = useSearchParams();
  const next = safeNext(params.get('next'), '/account');
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (isSignedIn && !busy) return <Navigate to={next} replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const errs = collect(z.object({ email, password: z.string().min(1, 'Enter your password') }).safeParse(form));
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    setFormError(null);
    try {
      await signIn(form.email, form.password);
      navigate(next, { replace: true });
    } catch (err) {
      setFormError(errorMessage(err));
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to check out, track orders and see your saved items."
      footer={
        <>
          New to URU?{' '}
          <Link to={`/register${params.get('next') ? `?next=${encodeURIComponent(next)}` : ''}`} className="font-semibold text-forest-700 underline">
            Create an account
          </Link>
        </>
      }
    >
      <Seo title="Sign in" noindex />
      <form onSubmit={submit} noValidate className="space-y-5">
        <FormError message={formError} />
        <Input label="Email" type="email" autoComplete="email" inputMode="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} error={errors.email} required />
        <PasswordInput label="Password" autoComplete="current-password" value={form.password} onChange={(v) => setForm({ ...form, password: v })} error={errors.password} />
        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-sm font-medium text-forest-700 hover:underline">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" size="lg" className="w-full" loading={busy}>
          Sign in
        </Button>
      </form>
    </AuthShell>
  );
}

export function RegisterPage() {
  const { signUp, isSignedIn } = useAuth();
  const [params] = useSearchParams();
  const next = safeNext(params.get('next'), '/account');
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: '', email: '', password: '', confirm: '', terms: false });
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  if (isSignedIn && !busy) return <Navigate to={next} replace />;

  if (sentTo) {
    return (
      <AuthShell title="Check your inbox">
        <Seo title="Confirm your email" noindex />
        <div className="flex flex-col items-center py-6 text-center">
          <span className="flex size-16 items-center justify-center rounded-full bg-forest-100 text-forest-700">
            <MailCheck className="size-8" aria-hidden />
          </span>
          <p className="mt-5 text-ink-soft">
            We've sent a confirmation link to <strong className="text-ink">{sentTo}</strong>. Open it to activate your account, then sign in.
          </p>
          <ButtonLink to={`/login?next=${encodeURIComponent(next)}`} className="mt-6">
            Go to sign in
          </ButtonLink>
        </div>
      </AuthShell>
    );
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const schema = z
      .object({
        full_name: z.string().trim().min(2, 'Enter your full name').max(120),
        email,
        password,
        confirm: z.string(),
        terms: z.literal(true, { message: 'Please accept the terms to continue' }),
      })
      .refine((d) => d.password === d.confirm, { message: 'Passwords do not match', path: ['confirm'] });
    const errs = collect(schema.safeParse(form));
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    setFormError(null);
    try {
      const { needsConfirmation } = await signUp(form);
      if (needsConfirmation) {
        setSentTo(form.email.trim());
        setBusy(false);
      } else navigate(next, { replace: true });
    } catch (err) {
      setFormError(errorMessage(err));
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="It takes less than a minute."
      footer={
        <>
          Already have an account?{' '}
          <Link to={`/login${params.get('next') ? `?next=${encodeURIComponent(next)}` : ''}`} className="font-semibold text-forest-700 underline">
            Sign in
          </Link>
        </>
      }
    >
      <Seo title="Create account" noindex />
      <form onSubmit={submit} noValidate className="space-y-5">
        <FormError message={formError} />
        <Input label="Full name" autoComplete="name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} error={errors.full_name} required />
        <Input label="Email" type="email" autoComplete="email" inputMode="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} error={errors.email} required />
        <PasswordInput label="Password" autoComplete="new-password" value={form.password} onChange={(v) => setForm({ ...form, password: v })} error={errors.password} hint="At least 8 characters" />
        <PasswordInput label="Confirm password" autoComplete="new-password" value={form.confirm} onChange={(v) => setForm({ ...form, confirm: v })} error={errors.confirm} />
        <div>
          <label className="flex items-start gap-2.5 text-sm text-ink-soft">
            <input type="checkbox" checked={form.terms} onChange={(e) => setForm({ ...form, terms: e.target.checked })} className="mt-0.5 size-4 accent-forest-700" aria-invalid={errors.terms ? true : undefined} />
            <span>
              I agree to the{' '}
              <Link to="/policies/terms" className="font-medium text-forest-700 underline" target="_blank">
                Terms
              </Link>{' '}
              and{' '}
              <Link to="/policies/privacy" className="font-medium text-forest-700 underline" target="_blank">
                Privacy policy
              </Link>
              .
            </span>
          </label>
          {errors.terms && (
            <p className="mt-1.5 text-[13px] text-danger" role="alert">
              {errors.terms}
            </p>
          )}
        </div>
        <Button type="submit" size="lg" className="w-full" loading={busy}>
          Create account
        </Button>
      </form>
    </AuthShell>
  );
}

export function ForgotPasswordPage() {
  const { requestPasswordReset } = useAuth();
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const r = email.safeParse(value);
    setError(r.success ? undefined : r.error.issues[0]?.message);
    if (!r.success) return;
    setBusy(true);
    setFormError(null);
    try {
      await requestPasswordReset(value);
      setSent(true);
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Reset your password"
      subtitle={sent ? undefined : "Enter your account email and we'll send you a reset link."}
      footer={
        <Link to="/login" className="font-semibold text-forest-700 underline">
          Back to sign in
        </Link>
      }
    >
      <Seo title="Forgot password" noindex />
      {sent ? (
        <p role="status" className="rounded-2xl bg-forest-50 p-5 text-ink-soft">
          If an account exists for <strong className="text-ink">{value.trim()}</strong>, a password reset link is on its way. The link expires in one hour.
        </p>
      ) : (
        <form onSubmit={submit} noValidate className="space-y-5">
          <FormError message={formError} />
          <Input label="Email" type="email" autoComplete="email" value={value} onChange={(e) => setValue(e.target.value)} error={error} required />
          <Button type="submit" size="lg" className="w-full" loading={busy}>
            Send reset link
          </Button>
        </form>
      )}
    </AuthShell>
  );
}

export function ResetPasswordPage() {
  const { updatePassword, session, ready } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [recovery, setRecovery] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setRecovery(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const errs = collect(z.object({ password, confirm: z.string() }).refine((d) => d.password === d.confirm, { message: 'Passwords do not match', path: ['confirm'] }).safeParse(form));
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    setFormError(null);
    try {
      await updatePassword(form.password);
      navigate('/account', { replace: true });
    } catch (err) {
      setFormError(errorMessage(err));
      setBusy(false);
    }
  };

  const linkMissing = ready && !session && !recovery;

  return (
    <AuthShell title="Choose a new password">
      <Seo title="Reset password" noindex />
      {linkMissing ? (
        <div className="space-y-4">
          <p className="text-ink-soft">This reset link is invalid or has expired. Request a new one to continue.</p>
          <ButtonLink to="/forgot-password">Request a new link</ButtonLink>
        </div>
      ) : (
        <form onSubmit={submit} noValidate className="space-y-5">
          <FormError message={formError} />
          <PasswordInput label="New password" autoComplete="new-password" value={form.password} onChange={(v) => setForm({ ...form, password: v })} error={errors.password} hint="At least 8 characters" />
          <PasswordInput label="Confirm new password" autoComplete="new-password" value={form.confirm} onChange={(v) => setForm({ ...form, confirm: v })} error={errors.confirm} />
          <Button type="submit" size="lg" className="w-full" loading={busy}>
            Update password
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
