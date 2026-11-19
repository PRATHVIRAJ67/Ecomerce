import { Apple, Citrus, Cookie, CookingPot, Droplets, Flame, Palette, Shirt, Sprout, Wheat, type LucideIcon } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../../lib/format';

const ICONS: [RegExp, LucideIcon][] = [
  [/fruit|produce|vegetable|fresh/i, Apple],
  [/spice|masala|chilli|pepper/i, Flame],
  [/pickle|preserve|chutney/i, Citrus],
  [/snack|sweet|namkeen/i, Cookie],
  [/oil|ghee/i, Droplets],
  [/staple|rice|millet|grain|pulse|flour|organic/i, Wheat],
  [/handloom|textile|saree|fabric|towel|cloth/i, Shirt],
  [/home|kitchen|cook|clay|brass/i, CookingPot],
  [/craft|toy|gift|decor|art/i, Palette],
];

const PALETTES = [
  'from-forest-100 via-cream to-forest-200 text-forest-700',
  'from-terracotta-100 via-cream to-terracotta-200 text-terracotta-600',
  'from-cream-dark via-cream to-sand text-forest-700',
  'from-forest-200 via-forest-100 to-cream text-forest-800',
];

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function iconFor(...hints: (string | null | undefined)[]): LucideIcon {
  const text = hints.filter(Boolean).join(' ');
  return ICONS.find(([re]) => re.test(text))?.[1] ?? Sprout;
}

/** Decorative placeholder shown while a product has no photo yet (images are uploaded from the admin dashboard). */
export function ImageFallback({ seed, hints, className, iconClassName }: { seed: string; hints: (string | null | undefined)[]; className?: string; iconClassName?: string }) {
  const Icon = iconFor(...hints);
  const palette = PALETTES[hash(seed) % PALETTES.length];
  return (
    <div className={cn('relative flex items-center justify-center overflow-hidden bg-gradient-to-br', palette, className)} aria-hidden>
      <svg className="absolute inset-0 size-full opacity-[0.07]" aria-hidden>
        <defs>
          <pattern id={`p-${hash(seed)}`} width="22" height="22" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="22" stroke="currentColor" strokeWidth="6" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#p-${hash(seed)})`} />
      </svg>
      <div className="relative flex aspect-square w-[42%] items-center justify-center rounded-full bg-white/55 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.7)] backdrop-blur-sm">
        <Icon className={cn('size-[46%]', iconClassName)} strokeWidth={1.25} />
      </div>
    </div>
  );
}

interface ProductImageProps {
  src?: string | null;
  alt: string;
  seed: string;
  hints: (string | null | undefined)[];
  className?: string;
  imgClassName?: string;
  eager?: boolean;
  sizes?: string;
}

export function ProductImage({ src, alt, seed, hints, className, imgClassName, eager, sizes }: ProductImageProps) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  if (!src || failed) return <ImageFallback seed={seed} hints={hints} className={className} />;
  return (
    <div className={cn('relative overflow-hidden bg-cream-dark', className)}>
      {!loaded && <div className="skeleton absolute inset-0" aria-hidden />}
      <img
        src={src}
        alt={alt}
        loading={eager ? 'eager' : 'lazy'}
        fetchPriority={eager ? 'high' : undefined}
        decoding="async"
        sizes={sizes}
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        className={cn('size-full object-cover transition-opacity duration-300', loaded ? 'opacity-100' : 'opacity-0', imgClassName)}
      />
    </div>
  );
}
