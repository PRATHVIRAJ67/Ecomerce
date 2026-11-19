import type { ProductImage as Img } from '@ecommerce/shared';
import { ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import { useRef, useState, type KeyboardEvent, type MouseEvent } from 'react';
import { cn } from '../../lib/format';
import { Modal } from '../ui';
import { ImageFallback } from './ProductImage';

interface Props {
  images: Img[];
  name: string;
  seed: string;
  hints: (string | null | undefined)[];
  badge?: React.ReactNode;
}

export function Gallery({ images, name, seed, hints, badge }: Props) {
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const [lightbox, setLightbox] = useState(false);
  const touchX = useRef<number | null>(null);
  const count = images.length;
  const current = images[Math.min(index, count - 1)];

  const go = (d: number) => setIndex((i) => (i + d + count) % count);
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight') go(1);
    if (e.key === 'ArrowLeft') go(-1);
  };
  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
  };

  if (!count) {
    return (
      <div className="relative">
        <ImageFallback seed={seed} hints={hints} className="aspect-square w-full rounded-[2rem]" iconClassName="size-[40%]" />
        {badge && <div className="absolute top-4 left-4">{badge}</div>}
        <p className="mt-3 text-center text-xs text-muted">Photos coming soon</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col-reverse gap-3 md:flex-row md:gap-4">
      {count > 1 && (
        <ul className="no-scrollbar flex gap-2.5 overflow-x-auto md:max-h-[560px] md:w-20 md:flex-col md:overflow-y-auto" aria-label="Product photos">
          {images.map((img, i) => (
            <li key={img.id} className="shrink-0">
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Show photo ${i + 1} of ${count}`}
                aria-current={i === index}
                className={cn('block size-16 overflow-hidden rounded-xl ring-2 transition md:size-20', i === index ? 'ring-forest-700' : 'ring-transparent opacity-70 hover:opacity-100')}
              >
                <img src={img.url} alt="" loading="lazy" className="size-full object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div
        className="group relative aspect-square flex-1 cursor-zoom-in overflow-hidden rounded-[2rem] bg-white ring-1 ring-line/70 focus-visible:outline-2"
        tabIndex={0}
        role="region"
        aria-roledescription="image gallery"
        aria-label={`${name} photo ${index + 1} of ${count}. Use arrow keys to browse, Enter to enlarge.`}
        onKeyDown={(e) => {
          onKey(e);
          if (e.key === 'Enter') setLightbox(true);
        }}
        onMouseMove={onMove}
        onMouseLeave={() => setZoom(null)}
        onClick={() => setLightbox(true)}
        onTouchStart={(e) => (touchX.current = e.touches[0]?.clientX ?? null)}
        onTouchEnd={(e) => {
          const start = touchX.current;
          const end = e.changedTouches[0]?.clientX;
          if (start != null && end != null && Math.abs(end - start) > 40) go(end < start ? 1 : -1);
          touchX.current = null;
        }}
      >
        <img
          key={current!.id}
          src={current!.url}
          alt={current!.alt || name}
          className="size-full animate-fade-up object-cover transition-transform duration-200"
          style={zoom ? { transform: 'scale(1.8)', transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
          fetchPriority="high"
        />
        {badge && <div className="pointer-events-none absolute top-4 left-4">{badge}</div>}
        <span className="pointer-events-none absolute right-4 bottom-4 flex size-10 items-center justify-center rounded-full bg-white/90 text-forest-800 shadow-sm md:opacity-0 md:group-hover:opacity-100" aria-hidden>
          <ZoomIn className="size-5" />
        </span>
        {count > 1 && (
          <>
            <button type="button" onClick={(e) => (e.stopPropagation(), go(-1))} className="absolute top-1/2 left-3 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-sm md:opacity-0 md:group-hover:opacity-100" aria-label="Previous photo">
              <ChevronLeft className="size-5" aria-hidden />
            </button>
            <button type="button" onClick={(e) => (e.stopPropagation(), go(1))} className="absolute top-1/2 right-3 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-sm md:opacity-0 md:group-hover:opacity-100" aria-label="Next photo">
              <ChevronRight className="size-5" aria-hidden />
            </button>
            <div className="absolute inset-x-0 bottom-4 flex justify-center gap-1.5 md:hidden" aria-hidden>
              {images.map((img, i) => (
                <span key={img.id} className={cn('h-1.5 rounded-full transition-all', i === index ? 'w-5 bg-forest-700' : 'w-1.5 bg-forest-700/30')} />
              ))}
            </div>
          </>
        )}
      </div>

      <Modal open={lightbox} onClose={() => setLightbox(false)} title={name} size="lg">
        <div className="relative" onKeyDown={onKey}>
          <img src={current!.url} alt={current!.alt || name} className="max-h-[70dvh] w-full rounded-2xl object-contain" />
          {count > 1 && (
            <div className="mt-4 flex items-center justify-center gap-3">
              <button type="button" onClick={() => go(-1)} className="flex size-10 items-center justify-center rounded-full border border-line bg-white" aria-label="Previous photo">
                <ChevronLeft className="size-5" aria-hidden />
              </button>
              <span className="text-sm text-muted tabular">
                {index + 1} / {count}
              </span>
              <button type="button" onClick={() => go(1)} className="flex size-10 items-center justify-center rounded-full border border-line bg-white" aria-label="Next photo">
                <ChevronRight className="size-5" aria-hidden />
              </button>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
