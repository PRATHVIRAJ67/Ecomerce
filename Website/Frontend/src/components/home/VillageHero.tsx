import type { ProductCard } from '@ecommerce/shared';
import { ArrowRight, HandCoins, MapPin, ShieldCheck, Sprout, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn, formatINR } from '../../lib/format';
import type { StoreSettings } from '../../lib/queries';
import { ButtonLink, Skeleton } from '../ui';

/** Town names ("Ratnagiri, Maharashtra" → "Ratnagiri") of the products on sale, de-duplicated. */
export function originTowns(products: ProductCard[]): string[] {
  return [...new Set(products.map((p) => (p.origin ?? '').split(',')[0]!.trim()).filter(Boolean))];
}

// ---------------------------------------------------------------------------
// Village at sunrise — hand-built SVG in brand colours (no stock photography).
// Animations come from index.css and are disabled for prefers-reduced-motion.
// ---------------------------------------------------------------------------
const LEAF = 'M0 0 C 12 -12, 34 -14, 52 -2 C 36 -7, 16 -5, 0 0 Z';
const FROND_ANGLES = [-168, -134, -100, -66, -32, 4, 160];

function Palm({ x, y, scale = 1, flip = false }: { x: number; y: number; scale?: number; flip?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -scale : scale} ${scale})`}>
      <path d="M0 0 C 5 -38, -3 -78, 8 -118" stroke="#0A2A1D" strokeWidth="5" fill="none" strokeLinecap="round" />
      <g transform="translate(8 -118)" fill="#0A2A1D">
        {FROND_ANGLES.map((a) => (
          <path key={a} d={LEAF} transform={`rotate(${a})`} />
        ))}
        <circle cx="2" cy="4" r="3.2" fill="#2C6B52" />
        <circle cx="-4" cy="5" r="3" fill="#2C6B52" />
      </g>
    </g>
  );
}

function House({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x="-12" y="0" width="24" height="16" rx="1.5" fill="#FAF7F0" />
      <path d="M-16 1 L0 -12 L16 1 Z" fill="#B85E2F" />
      <rect x="-3" y="7" width="6" height="9" rx="1" fill="#0F3526" />
    </g>
  );
}

function VillageScene() {
  return (
    <svg viewBox="0 0 400 500" preserveAspectRatio="xMidYMax slice" className="absolute inset-0 size-full" role="img" aria-label="Illustration of an Indian village at sunrise: hills, paddy terraces, a temple, houses and coconut palms">
      <defs>
        <linearGradient id="uru-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F4CFB6" />
          <stop offset="0.5" stopColor="#FBEDE4" />
          <stop offset="1" stopColor="#FDF6F1" />
        </linearGradient>
      </defs>
      <rect width="400" height="500" fill="url(#uru-sky)" />

      {/* Sun, glow and slow-turning ring */}
      <circle cx="262" cy="232" r="88" fill="#D97745" className="animate-glow" style={{ transformOrigin: '262px 232px' }} />
      <circle cx="262" cy="232" r="114" fill="none" stroke="#D97745" strokeOpacity="0.4" strokeWidth="1.5" strokeDasharray="2 9" className="animate-[spin_90s_linear_infinite]" style={{ transformOrigin: '262px 232px' }} />
      <circle cx="262" cy="232" r="58" fill="#D97745" />

      {/* Clouds */}
      <g transform="translate(70 120)">
        <g className="animate-drift" fill="#FFFFFF" opacity="0.92">
          <ellipse cx="0" cy="0" rx="32" ry="11" />
          <ellipse cx="20" cy="-8" rx="20" ry="12" />
          <ellipse cx="-16" cy="-5" rx="15" ry="9" />
        </g>
      </g>
      <g transform="translate(318 96) scale(0.8)">
        <g className="animate-drift [animation-delay:-9s]" fill="#FFFFFF" opacity="0.85">
          <ellipse cx="0" cy="0" rx="32" ry="11" />
          <ellipse cx="18" cy="-8" rx="18" ry="11" />
        </g>
      </g>

      {/* Birds */}
      <g stroke="#174D38" strokeOpacity="0.55" strokeWidth="1.6" fill="none" strokeLinecap="round">
        <path d="M146 170 q5 -5 10 0 q5 -5 10 0" />
        <path d="M170 158 q4 -4 8 0 q4 -4 8 0" />
        <path d="M330 176 q4 -4 8 0 q4 -4 8 0" />
      </g>

      {/* Far hills + temple */}
      <path d="M0 292 C 50 262, 104 262, 150 280 C 196 298, 236 300, 280 280 C 322 262, 366 258, 400 270 L400 500 L0 500 Z" fill="#9CBFAB" />
      <g fill="#5F9A7B">
        <path d="M106 278 L106 264 L109 264 L110 257 L113 257 L114 250 L117 250 L118 243 L121 243 L122 237 L126 237 L127 243 L130 243 L131 250 L134 250 L135 257 L138 257 L139 264 L142 264 L142 278 Z" />
        <circle cx="124" cy="233" r="2.4" />
      </g>

      {/* Mid hills, paddy terraces, houses */}
      <path d="M0 340 C 64 308, 132 312, 196 334 C 252 352, 318 350, 400 318 L400 500 L0 500 Z" fill="#2F7D5A" />
      <g stroke="#FAF7F0" strokeOpacity="0.3" strokeWidth="1.6" fill="none" strokeLinecap="round">
        <path d="M14 360 C 90 338, 172 342, 240 360" />
        <path d="M26 378 C 106 358, 192 362, 266 378" />
        <path d="M228 364 C 286 354, 342 346, 394 336" />
        <path d="M246 380 C 304 370, 354 362, 398 354" />
      </g>
      <House x={74} y={318} />
      <House x={318} y={334} s={0.85} />
      <House x={348} y={326} s={0.7} />

      {/* Near hill, foreground and the road home */}
      <path d="M0 402 C 80 376, 170 380, 236 400 C 296 418, 352 414, 400 392 L400 500 L0 500 Z" fill="#174D38" />
      <path d="M0 452 C 96 432, 210 446, 400 428 L400 500 L0 500 Z" fill="#0F3526" />
      <path d="M244 330 C 232 352, 258 368, 240 392 C 222 416, 186 438, 196 470 L196 500 L236 500 L236 474 C 228 446, 262 424, 276 396 C 290 366, 260 350, 254 330 Z" fill="#FAF7F0" opacity="0.9" />

      <Palm x={44} y={478} scale={1.05} />
      <Palm x={364} y={470} scale={1.25} flip />
    </svg>
  );
}

function ProductChip({ product, className }: { product: ProductCard; className?: string }) {
  const town = (product.origin ?? '').split(',')[0]!.trim();
  return (
    <Link
      to={`/product/${product.slug}`}
      className={cn('group absolute z-10 flex w-[205px] items-center gap-3 rounded-2xl bg-white/95 p-2 pr-3 shadow-lift ring-1 ring-line/70 backdrop-blur transition hover:-translate-y-0.5 sm:w-[225px]', className)}
    >
      <img src={product.images[0]!.url} alt="" loading="lazy" className="size-12 shrink-0 rounded-xl object-cover" />
      <span className="min-w-0">
        <span className="block truncate text-[13px] font-semibold text-ink group-hover:text-forest-700">{product.name}</span>
        {town && (
          <span className="mt-0.5 flex items-center gap-1 text-[11px] text-muted">
            <MapPin className="size-3 shrink-0" aria-hidden />
            <span className="truncate">{town}</span>
          </span>
        )}
        <span className="mt-0.5 block text-[13px] font-bold text-ink tabular">{formatINR(product.price)}</span>
      </span>
    </Link>
  );
}

export function VillageHero({ products, origins, settings }: { products: ProductCard[]; origins: string[]; settings?: StoreSettings }) {
  const seen = new Set<string>();
  const chips = products.filter((p) => p.in_stock && p.images.length > 0 && !seen.has(p.id) && seen.add(p.id)).slice(0, 2);
  const villages = origins.length;
  const trust = [
    settings?.free_shipping_threshold ? { icon: Truck, text: `Free delivery over ${formatINR(settings.free_shipping_threshold)}` } : null,
    settings?.cod_enabled !== false ? { icon: HandCoins, text: 'Cash on Delivery' } : null,
    { icon: ShieldCheck, text: 'Secure checkout' },
  ].filter(Boolean) as { icon: typeof Truck; text: string }[];

  return (
    <section className="container-page relative pt-6 pb-2 sm:pt-10 lg:pt-14" aria-labelledby="hero-title">
      <div className="pointer-events-none absolute top-0 -right-40 -z-10 size-[34rem] rounded-full bg-terracotta-100/70 blur-3xl" aria-hidden />
      <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
        <div className="animate-fade-up">
          <p className="inline-flex items-center gap-2 rounded-full bg-forest-100 px-3.5 py-1.5 text-[11px] font-semibold tracking-[0.16em] text-forest-800 uppercase sm:text-xs">
            <Sprout className="size-3.5" aria-hidden />
            {villages >= 3 ? `Sourced from ${villages} villages & towns` : 'Sourced from Indian villages'}
          </p>
          <h1 id="hero-title" className="mt-5 font-display text-[2.45rem] leading-[1.04] font-semibold tracking-tight text-ink sm:text-6xl lg:text-[4.3rem]">
            The taste of{' '}
            <span className="relative inline-block text-terracotta-600 italic">
              home
              <svg viewBox="0 0 200 20" preserveAspectRatio="none" className="absolute -bottom-1 left-0 h-[0.3em] w-full" aria-hidden>
                <path d="M4 14 C 52 4, 124 3, 196 10" stroke="#EAA77F" strokeWidth="7" fill="none" strokeLinecap="round" />
              </svg>
            </span>
            ,<br />
            delivered to your city.
          </h1>
          <p className="mt-5 max-w-lg text-[15.5px] leading-relaxed text-ink-soft sm:text-lg">
            Heirloom spices, farm produce, handloom and craft — bought directly from the families who make them, and packed fresh for your door.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <ButtonLink to="/shop" variant="accent" size="lg" className="flex-1 sm:flex-none">
              Start shopping <ArrowRight className="size-5" aria-hidden />
            </ButtonLink>
            <ButtonLink to="/about" variant="outline" size="lg" className="flex-1 sm:flex-none">
              Our story
            </ButtonLink>
          </div>
          <ul className="mt-7 flex flex-wrap gap-x-5 gap-y-2.5 text-[13px] text-ink-soft">
            {trust.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-1.5">
                <Icon className="size-4 text-forest-700" aria-hidden />
                {text}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative mx-auto w-full max-w-[440px] lg:max-w-[460px]">
          {/* kolam-style dot pattern behind the arch */}
          <div className="absolute -bottom-3 -left-3 h-2/3 w-2/3 rounded-[2rem] bg-[radial-gradient(#EAA77F_1.4px,transparent_1.6px)] [background-size:14px_14px] opacity-70 sm:-bottom-6 sm:-left-6" aria-hidden />
          <div className="relative aspect-[4/4.7] overflow-hidden rounded-tl-[50%_42%] rounded-tr-[50%_42%] rounded-b-[2rem] shadow-raised ring-1 ring-line/60 lg:aspect-auto lg:h-[560px]">
            <VillageScene />
          </div>
          {chips[0] && <ProductChip product={chips[0]} className="bottom-4 left-3 animate-float lg:bottom-20 lg:-left-16" />}
          {chips[1] && <ProductChip product={chips[1]} className="top-[46%] right-3 animate-float [animation-delay:-3s] lg:top-[32%] lg:-right-12" />}
        </div>
      </div>
    </section>
  );
}

export function VillageHeroSkeleton() {
  return (
    <div className="container-page grid items-center gap-10 pt-6 sm:pt-10 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:pt-14" aria-hidden>
      <div className="space-y-4">
        <Skeleton className="h-7 w-56 rounded-full" />
        <Skeleton className="h-14 w-4/5" />
        <Skeleton className="h-14 w-3/5" />
        <Skeleton className="h-16 w-full max-w-lg" />
        <Skeleton className="h-12 w-72" />
      </div>
      <Skeleton className="mx-auto aspect-[4/4.7] w-full max-w-[440px] rounded-tl-[50%_42%] rounded-tr-[50%_42%] rounded-b-[2rem] lg:aspect-auto lg:h-[560px] lg:max-w-[460px]" />
    </div>
  );
}

/** Slow marquee of the real towns our products come from. */
export function OriginsMarquee({ origins }: { origins: string[] }) {
  if (origins.length < 4) return null;
  const row = (hidden?: boolean) => (
    <ul className="flex shrink-0 items-center gap-7 pr-7" aria-hidden={hidden || undefined}>
      {origins.map((o) => (
        <li key={o} className="flex items-center gap-7 whitespace-nowrap">
          <span className="font-display text-lg text-forest-800 italic sm:text-xl">{o}</span>
          <Sprout className="size-4 text-terracotta-500" aria-hidden />
        </li>
      ))}
    </ul>
  );
  return (
    <section aria-label="Where our products come from" className="mt-12 border-y border-line/80 bg-white/60 sm:mt-16">
      <div className="container-page flex items-center gap-6 py-4">
        <p className="hidden shrink-0 text-xs font-semibold tracking-[0.18em] text-terracotta-600 uppercase md:block">From the villages of</p>
        <div className="flex min-w-0 flex-1 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]">
          <div className="flex animate-marquee">
            {row()}
            {row(true)}
          </div>
        </div>
      </div>
    </section>
  );
}
