import type { ProductCard as Product } from '@ecommerce/shared';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/format';
import { IconButton, SectionHeading } from '../ui';
import { ProductCard, ProductCardSkeleton } from './ProductCard';

interface Props {
  eyebrow?: string;
  title: string;
  products: Product[] | undefined;
  loading?: boolean;
  viewAll?: string;
  className?: string;
}

/** Horizontally scrolling product row with scroll-snap; arrow buttons on desktop. */
export function ProductRail({ eyebrow, title, products, loading, viewAll, className }: Props) {
  const track = useRef<HTMLDivElement>(null);
  if (!loading && products && products.length === 0) return null;
  const scroll = (dir: 1 | -1) => track.current?.scrollBy({ left: dir * track.current.clientWidth * 0.85, behavior: 'smooth' });

  return (
    <section className={cn('container-page', className)} aria-label={title}>
      <SectionHeading
        eyebrow={eyebrow}
        title={title}
        action={
          <div className="flex items-center gap-1">
            {viewAll && (
              <Link to={viewAll} className="mr-2 inline-flex items-center gap-1 text-sm font-semibold text-forest-700 hover:text-terracotta-600">
                View all <ArrowRight className="size-4" aria-hidden />
              </Link>
            )}
            <IconButton label={`Scroll ${title} left`} icon={ChevronLeft} onClick={() => scroll(-1)} className="hidden border border-line bg-white md:inline-flex" />
            <IconButton label={`Scroll ${title} right`} icon={ChevronRight} onClick={() => scroll(1)} className="hidden border border-line bg-white md:inline-flex" />
          </div>
        }
      />
      <div ref={track} className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-2 sm:-mx-6 sm:gap-5 sm:scroll-px-6 sm:px-6 lg:mx-0 lg:scroll-px-0 lg:px-0">
        {(loading || !products ? Array.from({ length: 5 }) : products).map((p, i) => (
          <div key={p ? (p as Product).id : i} className="w-[46%] shrink-0 snap-start sm:w-[31%] lg:w-[calc((100%-4*1.25rem)/5)]">
            {p ? <ProductCard product={p as Product} /> : <ProductCardSkeleton />}
          </div>
        ))}
      </div>
    </section>
  );
}
