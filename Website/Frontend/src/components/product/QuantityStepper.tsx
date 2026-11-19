import { Loader2, Minus, Plus, Trash2 } from 'lucide-react';
import { cn } from '../../lib/format';

interface Props {
  value: number;
  max: number;
  min?: number;
  onChange: (next: number) => void;
  busy?: boolean;
  size?: 'sm' | 'md';
  label: string;
  /** Show a bin icon instead of "−" at the minimum (cart lines). */
  removable?: boolean;
}

export function QuantityStepper({ value, max, min = 1, onChange, busy, size = 'md', label, removable }: Props) {
  const btn = cn('flex items-center justify-center text-forest-800 transition hover:bg-forest-100 disabled:opacity-30 disabled:hover:bg-transparent', size === 'sm' ? 'size-8' : 'size-11');
  const atMin = value <= min;
  return (
    <div className={cn('inline-flex items-center rounded-xl border border-line bg-white', size === 'sm' ? 'h-9' : 'h-12')} role="group" aria-label={label}>
      <button
        type="button"
        className={cn(btn, 'rounded-l-xl')}
        onClick={() => onChange(value - 1)}
        disabled={busy || (atMin && !removable)}
        aria-label={atMin && removable ? 'Remove item' : 'Decrease quantity'}
      >
        {atMin && removable ? <Trash2 className="size-4" aria-hidden /> : <Minus className="size-4" aria-hidden />}
      </button>
      <span className={cn('flex items-center justify-center font-semibold tabular', size === 'sm' ? 'w-8 text-sm' : 'w-10')} aria-live="polite">
        {busy ? <Loader2 className="size-4 animate-spin text-muted" aria-label="Updating" /> : value}
      </span>
      <button type="button" className={cn(btn, 'rounded-r-xl')} onClick={() => onChange(value + 1)} disabled={busy || value >= max} aria-label="Increase quantity">
        <Plus className="size-4" aria-hidden />
      </button>
    </div>
  );
}
