import { discountPercent } from '@ecommerce/shared';
import { cn, formatINR } from '../../lib/format';

export function Price({ price, mrp, size = 'md', className }: { price: number; mrp: number | null; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const off = discountPercent(price, mrp);
  return (
    <div className={cn('flex flex-wrap items-baseline gap-x-2 gap-y-0.5 tabular', className)}>
      <span className={cn('font-semibold text-ink', size === 'lg' ? 'text-3xl' : size === 'md' ? 'text-lg' : 'text-base')}>
        <span className="sr-only">Price </span>
        {formatINR(price)}
      </span>
      {off > 0 && mrp && (
        <>
          <span className={cn('text-muted line-through', size === 'lg' ? 'text-lg' : 'text-sm')}>
            <span className="sr-only">MRP </span>
            {formatINR(mrp)}
          </span>
          <span className={cn('font-semibold text-terracotta-600', size === 'lg' ? 'text-base' : 'text-xs')}>{off}% off</span>
        </>
      )}
    </div>
  );
}
