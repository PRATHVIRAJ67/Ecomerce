import type { Banner, Category } from '@ecommerce/shared';
import { ArrowRight, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/format';
import { ButtonLink, Skeleton } from '../ui';

const isExternal = (url: string) => /^https?:\/\//i.test(url);

function BannerLink({ href, className, children, tabIndex, ariaHidden }: { href: string | null; className?: string; children: React.ReactNode; tabIndex?: number; ariaHidden?: boolean }) {
  const a11y = { tabIndex, 'aria-hidden': ariaHidden || undefined };
  if (!href) return <span className={className}>{children}</span>;
  if (isExternal(href)) {
    return (
      <a href={href} className={className} rel="noopener" {...a11y}>
        {children}
      </a>
    );
  }
  return (
    <Link to={href} className={className} {...a11y}>
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

const pad2 = (n: number) => String(n).padStart(2, '0');

/** Keeps hyphenated words together ("stone-ground"), so a headline never breaks at the hyphen. */
function NoHyphenBreak({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\s+)/).map((part, i) =>
        part.includes('-') ? (
          <span key={i} className="whitespace-nowrap">
            {part}
          </span>
        ) : (
          part
        ),
      )}
    </>
  );
}

/** Small label above the headline, derived from where the banner links (real category name when possible). */
function eyebrowFor(link: string | null, categories: Category[]): string | null {
  if (!link) return null;
  const slug = link.match(/^\/category\/([^/?#]+)/)?.[1];
  if (slug) return categories.find((c) => c.slug === slug)?.name ?? null;
  if (link.startsWith('/product/')) return 'Featured';
  if (link === '/shop' || link.startsWith('/shop?')) return 'All categories';
  return null;
}

export function Hero({ banners, loading, tagline, categories = [] }: { banners: Banner[]; loading?: boolean; tagline?: string; categories?: Category[] }) {
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

  if (loading) {
    return (
      <div className="container-page pt-3 sm:pt-6">
        <Skeleton className="h-[540px] rounded-[1.75rem] sm:h-[600px] sm:rounded-[2rem] lg:h-[460px]" />
      </div>
    );
  }
  if (!count) return <BrandHero tagline={tagline} />;

  const go = (i: number) => setIndex(((i % count) + count) % count);
  const navButton = 'flex size-9 items-center justify-center rounded-full border border-cream/25 text-cream transition hover:border-cream/60 hover:bg-white/10';

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
          const eyebrow = eyebrowFor(b.link_url, categories);
          return (
            <div
              key={b.id}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${count}: ${b.title}`}
              aria-hidden={!active}
              inert={!active}
              className={cn(
                'grid transition-opacity duration-700 lg:min-h-[460px] lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]',
                active ? 'relative opacity-100' : 'pointer-events-none absolute inset-0 opacity-0',
              )}
            >
              {/* Photo in full colour — no tint over the subject. Top on phones, right on desktop. */}
              <BannerLink href={b.link_url} tabIndex={-1} ariaHidden className="relative block h-[220px] overflow-hidden sm:h-[300px] lg:order-2 lg:h-auto">
                <picture>
                  {b.mobile_image_url && <source media="(max-width: 640px)" srcSet={b.mobile_image_url} />}
                  <img
                    src={b.image_url}
                    alt=""
                    className={cn('absolute inset-0 size-full object-cover', active && 'animate-kenburns')}
                    loading={i === 0 ? 'eager' : 'lazy'}
                    fetchPriority={i === 0 ? 'high' : undefined}
                    draggable={false}
                  />
                </picture>
                {/* Soft blend into the panel: bottom edge on phones, left edge on desktop. */}
                <span className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-forest-800 to-transparent lg:inset-x-auto lg:inset-y-0 lg:left-0 lg:h-auto lg:w-28 lg:bg-gradient-to-r" aria-hidden />
              </BannerLink>

              {/* Copy on a solid brand panel — always legible, never fighting the photo. */}
              <div className="relative flex min-h-[290px] flex-col justify-center px-6 pt-2 pb-16 sm:min-h-[300px] sm:px-10 sm:pb-20 lg:min-h-0 lg:px-14 lg:pt-14 lg:pb-24">
                <div className="pattern-weave pointer-events-none absolute inset-0 opacity-60" aria-hidden />
                <div key={active ? `on-${b.id}` : b.id} className={cn('relative', active && 'animate-fade-up')}>
                  {eyebrow && <p className="mb-3 text-[11px] font-semibold tracking-[0.22em] text-terracotta-200 uppercase sm:text-xs">{eyebrow}</p>}
                  <Heading className="font-display text-[1.9rem] leading-[1.1] font-semibold tracking-tight text-balance text-cream sm:text-[2.6rem] lg:text-[3.1rem] lg:leading-[1.06]">
                    <NoHyphenBreak text={b.title} />
                  </Heading>
                  {b.subtitle && <p className="mt-3 line-clamp-2 max-w-md text-[15px] leading-relaxed text-cream/75 sm:mt-4 sm:line-clamp-none sm:text-[17px]">{b.subtitle}</p>}
                  {b.link_url && (
                    <BannerLink
                      href={b.link_url}
                      className="mt-6 inline-flex h-12 items-center gap-2 rounded-2xl bg-terracotta-500 px-6 text-[15px] font-semibold text-white shadow-lift transition hover:bg-terracotta-600 sm:mt-8"
                    >
                      {b.cta_label || 'Shop now'} <ArrowRight className="size-5" aria-hidden />
                    </BannerLink>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {count > 1 && (
          // Lives on the panel (not over the photo): "01 ━━ 02" story-style progress + controls.
          <div className="absolute inset-x-6 bottom-5 z-10 flex items-center gap-3 sm:inset-x-10 sm:bottom-7 lg:right-[calc(54%+3.5rem)] lg:bottom-10 lg:left-14">
            <span className="text-xs font-semibold text-cream tabular">{pad2(index + 1)}</span>
            <div className="flex flex-1 gap-1.5">
              {banners.map((b, i) => (
                <button key={b.id} type="button" onClick={() => go(i)} aria-label={`Go to slide ${i + 1}`} aria-current={i === index} className="flex-1 py-2.5">
                  <span className="block h-[3px] overflow-hidden rounded-full bg-white/20">
                    <span
                      key={i === index ? `fill-${index}` : b.id}
                      className={cn('block h-full origin-left rounded-full bg-terracotta-300', i < index ? 'scale-x-100' : i > index ? 'scale-x-0' : reducedMotion ? 'scale-x-100' : 'animate-hero-progress')}
                      style={i === index && !reducedMotion ? { animationPlayState: stopped ? 'paused' : 'running' } : undefined}
                      onAnimationEnd={i === index && !reducedMotion ? () => go(index + 1) : undefined}
                    />
                  </span>
                </button>
              ))}
            </div>
            <span className="text-xs font-semibold text-cream/45 tabular">{pad2(count)}</span>
            <div className="ml-1 hidden items-center gap-2 sm:flex">
              {!reducedMotion && (
                <button type="button" onClick={() => setPaused((p) => !p)} className={navButton} aria-label={paused ? 'Play slideshow' : 'Pause slideshow'}>
                  {paused ? <Play className="size-4" aria-hidden /> : <Pause className="size-4" aria-hidden />}
                </button>
              )}
              <button type="button" onClick={() => go(index - 1)} className={navButton} aria-label="Previous slide">
                <ChevronLeft className="size-5" aria-hidden />
              </button>
              <button type="button" onClick={() => go(index + 1)} className={navButton} aria-label="Next slide">
                <ChevronRight className="size-5" aria-hidden />
              </button>
            </div>
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
