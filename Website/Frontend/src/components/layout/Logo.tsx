import { Link } from 'react-router-dom';
import { cn } from '../../lib/format';

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <rect width="64" height="64" rx="18" fill="currentColor" />
      <path d="M18 20v14a14 14 0 0 0 28 0V20" fill="none" stroke="#FAF7F0" strokeWidth="6" strokeLinecap="round" />
      <circle cx="46" cy="47" r="5" fill="#D97745" />
    </svg>
  );
}

export function Logo({ light, className }: { light?: boolean; className?: string }) {
  return (
    <Link to="/" className={cn('inline-flex items-center gap-2.5', className)} aria-label="URU home">
      <LogoMark className={cn('size-9', light ? 'text-forest-600' : 'text-forest-700')} />
      <span className={cn('font-display text-[26px] leading-none font-semibold tracking-tight', light ? 'text-cream' : 'text-forest-800')}>uru</span>
    </Link>
  );
}
