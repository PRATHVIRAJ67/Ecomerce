import type { Banner } from '@ecommerce/shared';
import { ArrowRight, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/format';

const isExternal = (url: string) => /^https?:\/\//i.test(url);

function BannerLink({ href, className, children }: { href: string | null; className?: string; children: React.ReactNode }) {
  if (!href) return <span className={className}>{children}</span>;
  if (isExternal(href)) {
    return (
      <a href={href} className={className} rel="noopener">
        {children}
      </a>
    );
  }
  return (
    <Link to={href} className={className}>
      {children}
    </Link>
  );
}

/** Photo carousel for merchant-scheduled home_hero banners (Admin → Banners). */
export function Hero({ banners }: { banners: Banner[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false); // hover / focus / pause button
  const [holding, setHolding] = useState(false); // touch-and-hold on phones
  const touch = useRef<{ x: number; y: number } | null>(null);
  const count = banners.length;
  // Autoplay is driven by the progress-bar animation; with reduced motion there is no autoplay at all.
  const reducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const stopped = paused || holding;

  useEffect(() => {
    if (index >= count) setIndex(0);
  }, [count, index]);

  if (!count) return null;

  const go = (i: number) => setIndex(((i % count) + count) % count);

  return (
    <section className="container-page pt-3 sm:pt-6" aria-roledescription="carousel" aria-label="Featured offers">
      <div
        className="relative overflow-hidden rounded-[1.75rem] bg-forest-800 sm:rounded-[2rem]"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
        onTouchStart={(e) => {
          const t = e.touches[0];
          if (t) touch.current = { x: t.clientX, y: t.clientY };
          setHolding(true);
        }}
        onTouchEnd={(e) => {
          setHolding(false);
          const start = touch.current;
          const t = e.changedTouches[0];
          touch.current = null;
          if (!start || !t || count < 2) return;
          const dx = t.clientX - start.x;
          const dy = t.clientY - start.y;
          if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.5) {
            e.preventDefault(); // a swipe is not a tap on the banner link
            go(index + (dx < 0 ? 1 : -1));
          }
        }}
        onTouchCancel={() => setHolding(false)}
      >
        {banners.map((b, i) => {
          const active = i === index;
          const Heading = i === 0 ? 'h1' : 'h2';
          return (
            <div
              key={b.id}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${count}: ${b.title}`}
              aria-hidden={!active}
              inert={!active}
              className={cn('transition-opacity duration-700', active ? 'relative opacity-100' : 'pointer-events-none absolute inset-0 opacity-0')}
            >
              <BannerLink href={b.link_url} className="block">
                <picture>
                  {b.mobile_image_url && <source media="(max-width: 640px)" srcSet={b.mobile_image_url} />}
                  <img
                    src={b.image_url}
                    alt=""
                    className={cn('h-[500px] w-full object-cover sm:h-[520px]', active && 'animate-kenburns')}
                    loading={i === 0 ? 'eager' : 'lazy'}
                    fetchPriority={i === 0 ? 'high' : undefined}
                    draggable={false}
                  />
                </picture>
                {/* Phones: clear photo on top, readable fade at the bottom. Desktop: fade from the left. */}
                <div className="absolute inset-0 bg-[linear-gradient(to_top,rgb(10_42_29/0.96)_0%,rgb(10_42_29/0.78)_32%,rgb(10_42_29/0.12)_62%,rgb(10_42_29/0.28)_100%)] sm:hidden" />
                <div className="absolute inset-0 hidden bg-gradient-to-r from-forest-900/85 via-forest-900/45 to-transparent sm:block" />
                <div className="absolute inset-0 flex items-end sm:items-center">
                  <div key={active ? `on-${b.id}` : b.id} className={cn('w-full px-6 pb-7 sm:max-w-xl sm:px-14 sm:pb-0', active && 'animate-fade-up')}>
                    <Heading className="font-display text-[2rem] leading-[1.08] font-semibold tracking-tight text-cream sm:text-6xl sm:leading-tight">{b.title}</Heading>
                    {b.subtitle && <p className="mt-3 line-clamp-2 text-[15px] leading-snug text-cream/85 sm:mt-4 sm:line-clamp-none sm:text-lg">{b.subtitle}</p>}
                    {b.link_url && (
                      <span className="mt-5 inline-flex h-11 items-center gap-2 rounded-2xl bg-terracotta-500 px-5 text-[15px] font-semibold text-white shadow-lift sm:mt-7 sm:h-12 sm:px-6 sm:text-base">
                        {b.cta_label || 'Shop now'} <ArrowRight className="size-5" aria-hidden />
                      </span>
                    )}
                  </div>
                </div>
              </BannerLink>
            </div>
          );
        })}

        {count > 1 && (
          <>
            {/* Story-style progress: fills while a slide plays; tap a segment to jump to it. */}
            <div className="absolute inset-x-4 top-2 z-10 flex gap-1.5 sm:inset-x-auto sm:top-auto sm:right-[8.5rem] sm:bottom-[1.6rem] sm:w-40">
              {banners.map((b, i) => (
                <button key={b.id} type="button" onClick={() => go(i)} aria-label={`Go to slide ${i + 1}`} aria-current={i === index} className="flex-1 py-2.5">
                  <span className="block h-[3px] overflow-hidden rounded-full bg-white/30">
                    <span
                      key={i === index ? `fill-${index}` : b.id}
                      className={cn('block h-full origin-left rounded-full bg-cream', i < index ? 'scale-x-100' : i > index ? 'scale-x-0' : reducedMotion ? 'scale-x-100' : 'animate-hero-progress')}
                      style={i === index && !reducedMotion ? { animationPlayState: stopped ? 'paused' : 'running' } : undefined}
                      onAnimationEnd={i === index && !reducedMotion ? () => go(index + 1) : undefined}
                    />
                  </span>
                </button>
              ))}
            </div>

            {/* Desktop controls (phones swipe, and touch-and-hold to pause). */}
            <div className="absolute right-8 bottom-8 hidden items-center gap-2 sm:flex">
              {!reducedMotion && (
                <button type="button" onClick={() => setPaused((p) => !p)} className="flex size-9 items-center justify-center rounded-full bg-white/15 text-cream backdrop-blur hover:bg-white/25" aria-label={paused ? 'Play slideshow' : 'Pause slideshow'}>
                  {paused ? <Play className="size-4" aria-hidden /> : <Pause className="size-4" aria-hidden />}
                </button>
              )}
              <button type="button" onClick={() => go(index - 1)} className="flex size-9 items-center justify-center rounded-full bg-white/15 text-cream backdrop-blur hover:bg-white/25" aria-label="Previous slide">
                <ChevronLeft className="size-5" aria-hidden />
              </button>
              <button type="button" onClick={() => go(index + 1)} className="flex size-9 items-center justify-center rounded-full bg-white/15 text-cream backdrop-blur hover:bg-white/25" aria-label="Next slide">
                <ChevronRight className="size-5" aria-hidden />
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

/** Secondary promotional banners (placement = home_strip). */
export function StripBanners({ banners }: { banners: Banner[] }) {
  if (!banners.length) return null;
  return (
    <section className="container-page grid gap-4 md:grid-cols-2" aria-label="Promotions">
      {banners.slice(0, 4).map((b) => (
        <BannerLink key={b.id} href={b.link_url} className="group relative block overflow-hidden rounded-3xl bg-forest-800">
          <img src={b.image_url} alt="" loading="lazy" className="h-56 w-full object-cover transition duration-700 group-hover:scale-105 sm:h-64" />
          <div className="absolute inset-0 bg-gradient-to-t from-forest-900/85 via-forest-900/20 to-transparent" />
          <div className="absolute inset-x-6 bottom-6">
            <h2 className="font-display text-2xl font-semibold text-cream">{b.title}</h2>
            {b.subtitle && <p className="mt-1 text-sm text-cream/80">{b.subtitle}</p>}
            {b.link_url && <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-terracotta-200">{b.cta_label || 'Explore'} <ArrowRight className="size-4" aria-hidden /></span>}
          </div>
        </BannerLink>
      ))}
    </section>
  );
}
