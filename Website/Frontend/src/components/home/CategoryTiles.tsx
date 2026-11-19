import type { Category } from '@ecommerce/shared';
import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { plural } from '../../lib/format';
import { ImageFallback } from '../product/ProductImage';
import { SectionHeading, Skeleton } from '../ui';

export function CategoryTiles({ categories, loading }: { categories: Category[]; loading?: boolean }) {
  const top = categories.filter((c) => !c.parent_id);
  if (!loading && !top.length) return null;
  return (
    <section className="container-page" aria-label="Shop by category">
      <SectionHeading
        eyebrow="Explore"
        title="Shop by category"
        action={
          <Link to="/shop" className="text-sm font-semibold text-forest-700 hover:text-terracotta-600">
            Everything →
          </Link>
        }
      />
      <ul className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-4 sm:gap-4 sm:px-0 lg:grid-cols-8">
        {loading
          ? Array.from({ length: 8 }, (_, i) => (
              <li key={i} className="w-28 shrink-0 sm:w-auto">
                <Skeleton className="aspect-square rounded-3xl" />
                <Skeleton className="mx-auto mt-3 h-4 w-3/4" />
              </li>
            ))
          : top.map((c) => (
              <li key={c.id} className="w-28 shrink-0 snap-start sm:w-auto">
                <Link to={`/category/${c.slug}`} className="group block text-center">
                  <div className="relative aspect-square overflow-hidden rounded-3xl ring-1 ring-line/70 transition group-hover:-translate-y-0.5 group-hover:shadow-lift">
                    {c.image_url ? (
                      <img src={c.image_url} alt="" loading="lazy" className="size-full object-cover transition duration-500 group-hover:scale-105" />
                    ) : (
                      <ImageFallback seed={c.slug} hints={[c.name, c.slug]} className="size-full" />
                    )}
                    <span className="absolute top-2 right-2 flex size-7 items-center justify-center rounded-full bg-white/90 text-forest-800 opacity-0 shadow-sm transition group-hover:opacity-100" aria-hidden>
                      <ArrowUpRight className="size-4" />
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-tight font-semibold text-ink group-hover:text-forest-700">{c.name}</p>
                  {typeof c.product_count === 'number' && <p className="mt-0.5 text-xs text-muted">{plural(c.product_count, 'product')}</p>}
                </Link>
              </li>
            ))}
      </ul>
    </section>
  );
}
