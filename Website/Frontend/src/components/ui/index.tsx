import { ChevronLeft, ChevronRight, Loader2, RefreshCw, X, type LucideIcon } from 'lucide-react';
import {
  forwardRef,
  useEffect,
  useId,
  useRef,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { createPortal } from 'react-dom';
import { Link, type LinkProps } from 'react-router-dom';
import { errorMessage } from '../../lib/api';
import { cn } from '../../lib/format';

// ---------------------------------------------------------------------------
// Buttons
// ---------------------------------------------------------------------------
type Variant = 'primary' | 'accent' | 'outline' | 'ghost' | 'light' | 'danger' | 'dark-outline';
type Size = 'sm' | 'md' | 'lg';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-forest-700 text-cream hover:bg-forest-800 shadow-sm disabled:bg-forest-700/50',
  accent: 'bg-terracotta-500 text-white hover:bg-terracotta-600 shadow-sm disabled:bg-terracotta-500/50',
  outline: 'border border-forest-700/25 bg-white text-forest-800 hover:border-forest-700 hover:bg-forest-50 disabled:opacity-50',
  ghost: 'text-forest-800 hover:bg-forest-100/70 disabled:opacity-50',
  light: 'bg-cream text-forest-800 hover:bg-white shadow-sm disabled:opacity-60',
  danger: 'border border-danger/30 bg-white text-danger hover:bg-danger-tint disabled:opacity-50',
  'dark-outline': 'border border-white/30 text-cream hover:bg-white/10 hover:border-white/60',
};
const SIZES: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-sm gap-1.5 rounded-xl',
  md: 'h-11 px-5 text-sm gap-2 rounded-xl',
  lg: 'h-13 px-7 text-base gap-2.5 rounded-2xl',
};
const BASE =
  'inline-flex items-center justify-center font-semibold whitespace-nowrap transition-colors duration-150 disabled:cursor-not-allowed select-none';

export function buttonClass(variant: Variant = 'primary', size: Size = 'md', extra?: string) {
  return cn(BASE, VARIANTS[variant], SIZES[size], extra);
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: LucideIcon;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading, icon: Icon, className, children, disabled, type = 'button', ...rest },
  ref,
) {
  return (
    <button ref={ref} type={type} className={buttonClass(variant, size, className)} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : Icon ? <Icon className="size-4" aria-hidden /> : null}
      {children}
    </button>
  );
});

export function ButtonLink({ variant = 'primary', size = 'md', className, icon: Icon, children, ...rest }: LinkProps & { variant?: Variant; size?: Size; icon?: LucideIcon }) {
  return (
    <Link className={buttonClass(variant, size, className)} {...rest}>
      {Icon && <Icon className="size-4" aria-hidden />}
      {children}
    </Link>
  );
}

export function IconButton({ label, icon: Icon, className, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; icon: LucideIcon }) {
  return (
    <button type="button" aria-label={label} title={label} className={cn('inline-flex size-10 items-center justify-center rounded-full text-forest-800 transition hover:bg-forest-100', className)} {...rest}>
      <Icon className="size-5" aria-hidden />
    </button>
  );
}

export const Spinner = ({ className }: { className?: string }) => <Loader2 className={cn('size-5 animate-spin text-forest-700', className)} aria-hidden />;

// ---------------------------------------------------------------------------
// Form fields
// ---------------------------------------------------------------------------
const INPUT =
  'w-full rounded-xl border bg-white px-3.5 py-2.5 text-[15px] text-ink placeholder:text-muted/70 transition focus:outline-none focus:ring-4 disabled:bg-cream-dark/50';
const inputTone = (error?: string) =>
  error ? 'border-danger/60 focus:border-danger focus:ring-danger/10' : 'border-line focus:border-forest-600 focus:ring-forest-600/10';

interface FieldShellProps {
  label: string;
  error?: string;
  hint?: string;
  optional?: boolean;
  id: string;
  children: ReactNode;
  className?: string;
}

function FieldShell({ label, error, hint, optional, id, children, className }: FieldShellProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
        {optional && <span className="ml-1 font-normal text-muted">(optional)</span>}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-[13px] text-danger" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-[13px] text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string; hint?: string; optional?: boolean; wrapperClassName?: string };

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ label, error, hint, optional, wrapperClassName, className, id, ...rest }, ref) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <FieldShell label={label} error={error} hint={hint} optional={optional} id={fid} className={wrapperClassName}>
      <input
        ref={ref}
        id={fid}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${fid}-error` : hint ? `${fid}-hint` : undefined}
        className={cn(INPUT, inputTone(error), className)}
        {...rest}
      />
    </FieldShell>
  );
});

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & { label: string; error?: string; wrapperClassName?: string };
export function Select({ label, error, wrapperClassName, className, id, children, ...rest }: SelectProps) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <FieldShell label={label} error={error} id={fid} className={wrapperClassName}>
      <select id={fid} aria-invalid={error ? true : undefined} aria-describedby={error ? `${fid}-error` : undefined} className={cn(INPUT, inputTone(error), 'appearance-auto', className)} {...rest}>
        {children}
      </select>
    </FieldShell>
  );
}

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; error?: string; hint?: string; optional?: boolean; wrapperClassName?: string };
export function Textarea({ label, error, hint, optional, wrapperClassName, className, id, ...rest }: TextareaProps) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <FieldShell label={label} error={error} hint={hint} optional={optional} id={fid} className={wrapperClassName}>
      <textarea id={fid} aria-invalid={error ? true : undefined} className={cn(INPUT, inputTone(error), 'min-h-24 resize-y', className)} {...rest} />
    </FieldShell>
  );
}

export function Checkbox({ label, className, ...rest }: InputHTMLAttributes<HTMLInputElement> & { label: ReactNode }) {
  return (
    <label className={cn('inline-flex cursor-pointer items-center gap-2.5 text-sm text-ink', className)}>
      <input type="checkbox" className="size-4 rounded border-line accent-forest-700" {...rest} />
      {label}
    </label>
  );
}

// ---------------------------------------------------------------------------
// Feedback
// ---------------------------------------------------------------------------
export const Skeleton = ({ className }: { className?: string }) => <div className={cn('skeleton rounded-xl', className)} aria-hidden />;

export function EmptyState({ icon: Icon, title, children, action }: { icon: LucideIcon; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-16 text-center">
      <div className="mb-5 flex size-20 items-center justify-center rounded-full bg-forest-100 text-forest-700">
        <Icon className="size-9" strokeWidth={1.5} aria-hidden />
      </div>
      <h2 className="font-display text-2xl font-semibold">{title}</h2>
      {children && <div className="mt-2 text-ink-soft">{children}</div>}
      {action && <div className="mt-6 flex flex-wrap justify-center gap-3">{action}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry, title = "Something didn't load" }: { error: unknown; onRetry?: () => void; title?: string }) {
  return (
    <div role="alert" className="mx-auto flex max-w-md flex-col items-center rounded-3xl border border-danger/15 bg-danger-tint/40 px-6 py-10 text-center">
      <h2 className="font-display text-xl font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-ink-soft">{errorMessage(error)}</p>
      {onRetry && (
        <Button variant="outline" size="sm" icon={RefreshCw} onClick={onRetry} className="mt-5">
          Try again
        </Button>
      )}
    </div>
  );
}

type BadgeTone = 'forest' | 'terracotta' | 'neutral' | 'success' | 'warning' | 'danger';
const BADGE: Record<BadgeTone, string> = {
  forest: 'bg-forest-100 text-forest-800',
  terracotta: 'bg-terracotta-500 text-white',
  neutral: 'bg-cream-dark text-ink-soft',
  success: 'bg-success-tint text-success',
  warning: 'bg-warning-tint text-warning',
  danger: 'bg-danger-tint text-danger',
};
export function Badge({ tone = 'neutral', className, children }: { tone?: BadgeTone; className?: string; children: ReactNode }) {
  return <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold', BADGE[tone], className)}>{children}</span>;
}

// ---------------------------------------------------------------------------
// Overlays
// ---------------------------------------------------------------------------
function useOverlay(open: boolean, onClose: () => void, panel: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    const focusables = () =>
      Array.from(panel.current?.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])') ?? []);
    window.setTimeout(() => (focusables()[0] ?? panel.current)?.focus(), 30);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab') {
        const els = focusables();
        if (!els.length) return;
        const first = els[0]!;
        const last = els[els.length - 1]!;
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      previouslyFocused?.focus?.();
    };
  }, [open, onClose, panel]);
}

export function Drawer({ open, onClose, title, side = 'right', children, footer }: { open: boolean; onClose: () => void; title: string; side?: 'left' | 'right'; children: ReactNode; footer?: ReactNode }) {
  const panel = useRef<HTMLDivElement>(null);
  useOverlay(open, onClose, panel);
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-forest-900/40 backdrop-blur-[2px]" onClick={onClose} aria-hidden />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={cn(
          'absolute top-0 flex h-full w-[88%] max-w-sm flex-col bg-cream shadow-raised',
          side === 'right' ? 'right-0 animate-slide-in' : 'left-0 animate-slide-in-left',
        )}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="font-display text-lg font-semibold">{title}</h2>
          <IconButton label="Close" icon={X} onClick={onClose} className="-mr-2" />
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
        {footer && <div className="border-t border-line bg-white p-4">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

export function Modal({ open, onClose, title, children, footer, size = 'md' }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode; size?: 'md' | 'lg' }) {
  const panel = useRef<HTMLDivElement>(null);
  useOverlay(open, onClose, panel);
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-6">
      <div className="absolute inset-0 bg-forest-900/45 backdrop-blur-[2px]" onClick={onClose} aria-hidden />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={cn('relative flex max-h-[92dvh] w-full animate-fade-up flex-col rounded-t-3xl bg-cream shadow-raised sm:rounded-3xl', size === 'lg' ? 'sm:max-w-2xl' : 'sm:max-w-lg')}
      >
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <h2 className="font-display text-xl font-semibold">{title}</h2>
          <IconButton label="Close" icon={X} onClick={onClose} className="-mr-2" />
        </div>
        <div className="overflow-y-auto px-6 pb-6">{children}</div>
        {footer && <div className="flex justify-end gap-3 border-t border-line px-6 py-4">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

// ---------------------------------------------------------------------------
// Navigation helpers
// ---------------------------------------------------------------------------
export function Breadcrumbs({ items }: { items: { label: string; to?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-muted">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight className="size-3.5 opacity-60" aria-hidden />}
            {item.to ? (
              <Link to={item.to} className="hover:text-forest-700 hover:underline">
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className="text-ink-soft">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function Pagination({ page, total, limit, onPage }: { page: number; total: number; limit: number; onPage: (p: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / limit));
  if (pages <= 1) return null;
  const windowed = Array.from({ length: pages }, (_, i) => i + 1).filter((p) => p === 1 || p === pages || Math.abs(p - page) <= 1);
  return (
    <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-1.5">
      <IconButton label="Previous page" icon={ChevronLeft} disabled={page <= 1} onClick={() => onPage(page - 1)} className="disabled:opacity-30" />
      {windowed.map((p, i) => (
        <span key={p} className="flex items-center gap-1.5">
          {i > 0 && windowed[i - 1]! < p - 1 && <span className="px-1 text-muted">…</span>}
          <button
            type="button"
            onClick={() => onPage(p)}
            aria-current={p === page ? 'page' : undefined}
            className={cn('size-10 rounded-full text-sm font-semibold tabular transition', p === page ? 'bg-forest-700 text-cream' : 'text-ink-soft hover:bg-forest-100')}
          >
            {p}
          </button>
        </span>
      ))}
      <IconButton label="Next page" icon={ChevronRight} disabled={page >= pages} onClick={() => onPage(page + 1)} className="disabled:opacity-30" />
    </nav>
  );
}

export function SectionHeading({ eyebrow, title, action, className }: { eyebrow?: string; title: string; action?: ReactNode; className?: string }) {
  return (
    <div className={cn('mb-6 flex items-end justify-between gap-4 sm:mb-8', className)}>
      <div>
        {eyebrow && <p className="mb-1.5 text-xs font-semibold tracking-[0.18em] text-terracotta-600 uppercase">{eyebrow}</p>}
        <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-[2rem]">{title}</h2>
      </div>
      {action}
    </div>
  );
}
