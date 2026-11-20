import { ArrowRight, HeartHandshake, Leaf, Tractor } from 'lucide-react';
import { CategoryTiles } from '../components/home/CategoryTiles';
import { Hero, StripBanners } from '../components/home/Hero';
import { ProductGrid } from '../components/product/ProductCard';
import { ProductRail } from '../components/product/ProductRail';
import { ButtonLink, ErrorState, SectionHeading } from '../components/ui';
import { Seo, absoluteUrl } from '../lib/seo';
import { useHome } from '../lib/queries';

export default function HomePage() {
  const { data, isPending, error, refetch } = useHome();

  const heroBanners = (data?.banners ?? []).filter((b) => b.placement === 'home_hero');
  const stripBanners = (data?.banners ?? []).filter((b) => b.placement === 'home_strip');

  return (
    <>
      <Seo
        path="/"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: data?.settings.store_name ?? 'URU',
          url: absoluteUrl('/'),
          potentialAction: { '@type': 'SearchAction', target: `${absoluteUrl('/shop')}?q={search_term_string}`, 'query-input': 'required name=search_term_string' },
        }}
      />
      <Hero banners={heroBanners} loading={isPending} tagline={data?.settings.store_tagline} categories={data?.categories} />

      {error ? (
        <div className="container-page py-16">
          <ErrorState error={error} onRetry={() => void refetch()} title="We couldn't load the store" />
        </div>
      ) : (
        <div className="space-y-16 py-12 sm:space-y-24 sm:py-16">
          <CategoryTiles categories={data?.categories ?? []} loading={isPending} />

          {(isPending || (data?.featured.length ?? 0) > 0) && (
            <section className="container-page" aria-label="Featured products">
              <SectionHeading
                eyebrow="Handpicked"
                title="Featured this season"
                action={
                  <ButtonLink to="/shop?featured=true" variant="outline" size="sm">
                    View all
                  </ButtonLink>
                }
              />
              <ProductGrid products={data?.featured.slice(0, 8)} loading={isPending} />
            </section>
          )}

          <ProductRail eyebrow="Popular right now" title="Trending" products={data?.trending} loading={isPending} viewAll="/shop?sort=popular" />

          <StoryBand />

          <ProductRail eyebrow="Customer favourites" title="Best sellers" products={data?.best_sellers} loading={isPending} viewAll="/shop?sort=popular" />

          <StripBanners banners={stripBanners} />

          <ProductRail eyebrow="Just landed" title="New arrivals" products={data?.new_arrivals} loading={isPending} viewAll="/shop?sort=newest" />
        </div>
      )}
    </>
  );
}

function StoryBand() {
  const points = [
    { icon: Tractor, title: 'Straight from the source', text: 'We buy from farmers, weavers and makers — not middlemen.' },
    { icon: Leaf, title: 'Small batch, honest food', text: 'Stone-ground, sun-cured, wood-pressed. No shortcuts.' },
    { icon: HeartHandshake, title: 'Fair to the village', text: 'Every order puts a fair price in a family’s hands.' },
  ];
  return (
    <section className="container-page" aria-labelledby="story-heading">
      <div className="grid overflow-hidden rounded-[2rem] bg-terracotta-50 ring-1 ring-terracotta-200/60 lg:grid-cols-[1.1fr_1fr]">
        <div className="p-8 sm:p-12 lg:p-16">
          <p className="mb-3 text-xs font-semibold tracking-[0.18em] text-terracotta-600 uppercase">The URU promise</p>
          <h2 id="story-heading" className="font-display text-3xl leading-tight font-semibold sm:text-[2.6rem]">
            Your village. Your city. <span className="text-forest-700 italic">Your URU.</span>
          </h2>
          <p className="mt-5 max-w-lg leading-relaxed text-ink-soft">
            “Uru” means hometown. We started URU so that people who moved to the city could still eat, wear and live with the things that made home feel like home.
          </p>
          <ButtonLink to="/about" variant="primary" className="mt-8">
            Read our story <ArrowRight className="size-4" aria-hidden />
          </ButtonLink>
        </div>
        <ul className="grid gap-px bg-terracotta-200/50">
          {points.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex items-start gap-4 bg-terracotta-50 p-6 sm:p-8">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white text-terracotta-600 shadow-sm">
                <Icon className="size-6" strokeWidth={1.6} aria-hidden />
              </span>
              <div>
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-ink-soft">{text}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
