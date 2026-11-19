import type { Banner } from '@ecommerce/shared';
import { ArrowRight, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/format';
import { ButtonLink, Skeleton } from '../ui';

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

/** Brand hero used when the merchant hasn't scheduled any home banners yet. */
function BrandHero({ tagline }: { tagline?: string }) {
  return (
    <section className="container-page pt-4 sm:pt-6">
      <div className="relative isolate overflow-hidden rounded-[2rem] bg-forest-700 text-cream">
        <div className="pattern-weave absolute inset-0" aria-hidden />
        <div className="absolute -top-24 -right-24 size-[28rem] rounded-full bg-forest-600/60 blur-2xl" aria-hidden />
        <div className="absolute -bottom-40 left-1/3 size-[26rem] rounded-full bg-terracotta-500/25 blur-3xl" aria-hidden />
        {/* Rolling hills + sun motif */}
        <svg viewBox="0 0 800 400" className="absolute right-0 bottom-0 hidden h-full max-h-[460px] w-auto opacity-95 md:block" aria-hidden>
          <circle cx="560" cy="150" r="78" fill="#D97745" />
          <circle cx="560" cy="150" r="110" fill="none" stroke="#D97745" strokeOpacity="0.35" strokeWidth="2" strokeDasharray="4 10" />
          <path d="M120 400 C 260 250, 380 260, 520 320 S 760 300, 800 260 V400Z" fill="#0F3526" />
          <path d="M260 400 C 420 300, 560 300, 680 350 S 780 360, 800 340 V400Z" fill="#0A2A1D" />
          <path d="M300 300 C 420 210, 520 220, 620 260" fill="none" stroke="#FAF7F0" strokeOpacity="0.18" strokeWidth="2" />
          <g fill="#FAF7F0" fillOpacity="0.85">
            <rect x="640" y="268" width="34" height="26" rx="2" />
            <path d="M634 270 L657 248 L680 270Z" fill="#B85E2F" fillOpacity="1" />
            <rect x="700" y="280" width="26" height="20" rx="2" />
            <path d="M695 282 L713 264 L731 282Z" fill="#B85E2F" fillOpacity="1" />
          </g>
        </svg>
        <div className="relative max-w-2xl px-6 py-14 sm:px-12 sm:py-20 lg:py-28">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-semibold tracking-[0.18em] text-terracotta-200 uppercase ring-1 ring-white/15">
            Sourced from Indian villages
          </p>
          <h1 className="font-display text-[2.5rem] leading-[1.05] font-semibold tracking-tight text-cream sm:text-6xl lg:text-7xl">
            The taste of home,
            <br />
            <span className="text-terracotta-300 italic">delivered</span> to your city.
          </h1>
          <p className="mt-6 max-w-lg text-base leading-relaxed text-cream/80 sm:text-lg">
            {tagline ?? 'Your Village. Your City. Your URU.'} Heirloom spices, farm produce, handloom and craft — straight from the families who make them.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <ButtonLink to="/shop" variant="accent" size="lg">
              Start shopping <ArrowRight className="size-5" aria-hidden />
            </ButtonLink>
            <ButtonLink to="/about" variant="dark-outline" size="lg">
              Our story
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Hero({ banners, loading, tagline }: { banners: Banner[]; loading?: boolean; tagline?: string }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = banners.length;

  useEffect(() => {
    if (count < 2 || paused) return;
    const t = window.setInterval(() => setIndex((i) => (i + 1) % count), 6500);
    return () => window.clearInterval(t);
  }, [count, paused]);

  useEffect(() => {
    if (index >= count) setIndex(0);
  }, [count, index]);

  if (loading) {
    return (
      <div className="container-page pt-4 sm:pt-6">
        <Skeleton className="h-[420px] rounded-[2rem] sm:h-[520px]" />
      </div>
    );
  }
  if (!count) return <BrandHero tagline={tagline} />;

  return (
    <section className="container-page pt-4 sm:pt-6" aria-roledescription="carousel" aria-label="Featured offers">
      <div className="relative overflow-hidden rounded-[2rem] bg-forest-800" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}>
        {banners.map((b, i) => (
          <div
            key={b.id}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${count}: ${b.title}`}
            aria-hidden={i !== index}
            inert={i !== index}
            className={cn('transition-opacity duration-700', i === index ? 'relative opacity-100' : 'pointer-events-none absolute inset-0 opacity-0')}
          >
            <BannerLink href={b.link_url} className="block">
              <picture>
                {b.mobile_image_url && <source media="(max-width: 640px)" srcSet={b.mobile_image_url} />}
                <img src={b.image_url} alt="" className="h-[440px] w-full object-cover sm:h-[520px]" loading={i === 0 ? 'eager' : 'lazy'} fetchPriority={i === 0 ? 'high' : undefined} />
              </picture>
              <div className="absolute inset-0 bg-gradient-to-r from-forest-900/85 via-forest-900/45 to-transparent" />
              <div className="absolute inset-0 flex items-end sm:items-center">
                <div className="max-w-xl px-6 pb-16 sm:px-14 sm:pb-0">
                  {i === 0 ? (
                    <h1 className="font-display text-4xl leading-tight font-semibold text-cream sm:text-6xl">{b.title}</h1>
                  ) : (
                    <h2 className="font-display text-4xl leading-tight font-semibold text-cream sm:text-6xl">{b.title}</h2>
                  )}
                  {b.subtitle && <p className="mt-4 text-base text-cream/85 sm:text-lg">{b.subtitle}</p>}
                  {b.link_url && (
                    <span className="mt-7 inline-flex h-12 items-center gap-2 rounded-2xl bg-terracotta-500 px-6 font-semibold text-white">
                      {b.cta_label || 'Shop now'} <ArrowRight className="size-5" aria-hidden />
                    </span>
                  )}
                </div>
              </div>
            </BannerLink>
          </div>
        ))}

        {count > 1 && (
          <div className="absolute right-5 bottom-5 flex items-center gap-2 sm:right-8 sm:bottom-8">
            <button type="button" onClick={() => setPaused((p) => !p)} className="flex size-9 items-center justify-center rounded-full bg-white/15 text-cream backdrop-blur hover:bg-white/25" aria-label={paused ? 'Play slideshow' : 'Pause slideshow'}>
              {paused ? <Play className="size-4" aria-hidden /> : <Pause className="size-4" aria-hidden />}
            </button>
            <button type="button" onClick={() => setIndex((i) => (i - 1 + count) % count)} className="flex size-9 items-center justify-center rounded-full bg-white/15 text-cream backdrop-blur hover:bg-white/25" aria-label="Previous slide">
              <ChevronLeft className="size-5" aria-hidden />
            </button>
            <div className="flex gap-1.5 px-1">
              {banners.map((b, i) => (
                <button key={b.id} type="button" onClick={() => setIndex(i)} aria-label={`Go to slide ${i + 1}`} aria-current={i === index} className={cn('h-2 rounded-full transition-all', i === index ? 'w-7 bg-terracotta-400' : 'w-2 bg-white/50 hover:bg-white/80')} />
              ))}
            </div>
            <button type="button" onClick={() => setIndex((i) => (i + 1) % count)} className="flex size-9 items-center justify-center rounded-full bg-white/15 text-cream backdrop-blur hover:bg-white/25" aria-label="Next slide">
              <ChevronRight className="size-5" aria-hidden />
            </button>
          </div>
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
