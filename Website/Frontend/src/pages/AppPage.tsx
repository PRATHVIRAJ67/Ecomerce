import { Bell, Check, Copy, Download, Heart, ShieldCheck, Smartphone, Truck, Zap } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '../context/ToastContext';
import { formatDate } from '../lib/format';
import { ANDROID_RELEASE as R } from '../lib/appRelease';
import { Seo } from '../lib/seo';

const MB = (b: number) => `${(b / 1024 / 1024).toFixed(1)} MB`;

function Phone({ src, alt, className = '' }: { src: string; alt: string; className?: string }) {
  return (
    <div className={`relative aspect-[9/19.5] w-full overflow-hidden rounded-[2.4rem] border-[7px] border-ink bg-ink shadow-raised ${className}`}>
      <img src={src} alt={alt} loading="lazy" className="size-full object-cover object-top" />
      <span className="absolute top-2 left-1/2 h-4 w-20 -translate-x-1/2 rounded-full bg-ink" aria-hidden />
    </div>
  );
}

export default function AppPage() {
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  const href = `/download/${R.file}`;
  /** The button only appears once a release is actually uploaded (size is filled in by the release step). */
  const available = R.sizeBytes > 0;

  const copyHash = async () => {
    try {
      await navigator.clipboard.writeText(R.sha256);
      setCopied(true);
      toast.success('Checksum copied');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked */
    }
  };

  const features = [
    { icon: Zap, title: 'Fast & smooth', text: 'A native app built for quick browsing, even on slower networks.' },
    { icon: Heart, title: 'Your cart everywhere', text: 'Cart and wishlist stay in sync with the website.' },
    { icon: Truck, title: 'Live order tracking', text: 'Packed, shipped, out for delivery — see every step.' },
    { icon: ShieldCheck, title: 'Secure checkout', text: 'UPI, cards and Cash on Delivery, verified by our server.' },
  ];

  return (
    <>
      <Seo title="Get the URU app" description={`Download the URU app for Android (${R.minAndroid}). Shop village produce, spices, handloom and crafts with live order tracking.`} path="/app" />

      {/* Hero */}
      <section className="relative overflow-hidden bg-forest-700 text-cream">
        <div className="pattern-weave absolute inset-0" aria-hidden />
        <div className="absolute -right-32 -bottom-40 size-[30rem] rounded-full bg-terracotta-500/25 blur-3xl" aria-hidden />
        <div className="container-page relative grid items-center gap-12 py-14 lg:grid-cols-[1.1fr_1fr] lg:py-20">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-semibold tracking-[0.18em] text-terracotta-200 uppercase ring-1 ring-white/15">
              <Smartphone className="size-3.5" aria-hidden /> URU for Android
            </p>
            <h1 className="font-display text-4xl leading-[1.08] font-semibold text-cream sm:text-6xl">
              The taste of home,
              <br />
              <span className="text-terracotta-300 italic">in your pocket.</span>
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-cream/80">Browse, save, order and track — the full URU store in a fast, beautiful app.</p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              {available ? (
                <a
                  href={href}
                  download
                  className="inline-flex h-14 items-center gap-3 rounded-2xl bg-terracotta-500 px-7 text-base font-semibold text-white shadow-lift transition hover:bg-terracotta-600"
                >
                  <Download className="size-5" aria-hidden />
                  Download APK
                  <span className="text-sm font-medium text-white/80">· {MB(R.sizeBytes)}</span>
                </a>
              ) : (
                <span className="inline-flex h-14 items-center gap-3 rounded-2xl bg-white/10 px-7 text-base font-semibold text-cream ring-1 ring-white/20" role="status">
                  <Smartphone className="size-5" aria-hidden />
                  Android app — coming very soon
                </span>
              )}
              <div className="text-sm text-cream/75">
                {available ? `Version ${R.version} · ${formatDate(R.releasedAt)}` : 'Shop on the website meanwhile — same cart, same account.'}
                <br />
                {R.minAndroid}
              </div>
            </div>

            <div className={`mt-8 hidden items-center gap-4 rounded-2xl bg-white/10 p-4 ring-1 ring-white/15 ${available ? 'sm:inline-flex' : ''}`}>
              <img src="/app/qr.svg" alt="QR code linking to this download page" width={96} height={96} className="rounded-lg bg-white p-1" />
              <p className="max-w-[14rem] text-sm text-cream/80">On a computer? Scan with your Android phone’s camera to download there.</p>
            </div>
          </div>

          <div className="relative mx-auto grid w-full max-w-md grid-cols-3 items-end gap-3 sm:gap-4">
            <Phone src="/app/screen-explore.png" alt="URU app: explore categories" className="translate-y-6 opacity-90" />
            <Phone src="/app/screen-home.png" alt="URU app: home screen" className="z-10 scale-110" />
            <Phone src="/app/screen-product.png" alt="URU app: product page" className="translate-y-6 opacity-90" />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container-page py-14 sm:py-20" aria-labelledby="why-h">
        <h2 id="why-h" className="font-display text-3xl font-semibold sm:text-4xl">
          Why get the app?
        </h2>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(({ icon: Icon, title, text }) => (
            <li key={title} className="rounded-3xl bg-white p-6 ring-1 ring-line/70">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-forest-50 text-forest-700">
                <Icon className="size-6" aria-hidden />
              </span>
              <h3 className="mt-4 font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-ink-soft">{text}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Install steps */}
      <section className="container-page pb-16 sm:pb-24" aria-labelledby="install-h">
        <div className="grid gap-8 rounded-[2rem] bg-terracotta-50 p-7 ring-1 ring-terracotta-200/60 sm:p-10 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <h2 id="install-h" className="font-display text-3xl font-semibold">
              How to install
            </h2>
            <p className="mt-2 text-ink-soft">The app isn’t on the Play Store yet, so Android will ask you to allow the install once.</p>
            <ol className="mt-6 space-y-4">
              {[
                ['Download the APK', 'Tap “Download APK” above on your Android phone.'],
                ['Open the file', 'Open it from your notifications or the Downloads folder.'],
                ['Allow this install', 'If asked, allow your browser to “install unknown apps”, then go back.'],
                ['Tap Install', 'Open URU, and sign in with your website account — your cart comes with you.'],
              ].map(([t, d], i) => (
                <li key={t} className="flex gap-4">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-forest-700 text-sm font-bold text-cream">{i + 1}</span>
                  <div>
                    <p className="font-semibold">{t}</p>
                    <p className="text-sm text-ink-soft">{d}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <div className="space-y-4 self-start">
            <div className="rounded-3xl bg-white p-6 ring-1 ring-line/70">
              <p className="flex items-center gap-2 font-semibold">
                <ShieldCheck className="size-5 text-forest-700" aria-hidden /> Verify your download
              </p>
              <p className="mt-1 text-sm text-ink-soft">Signed by URU. SHA-256 checksum of {R.file}:</p>
              {R.sha256 ? (
                <button type="button" onClick={copyHash} className="mt-3 flex w-full items-start gap-2 rounded-xl bg-cream p-3 text-left font-mono text-[11px] leading-relaxed break-all text-ink-soft hover:bg-cream-dark" aria-label="Copy checksum">
                  <span className="flex-1">{R.sha256}</span>
                  {copied ? <Check className="size-4 shrink-0 text-success" aria-hidden /> : <Copy className="size-4 shrink-0" aria-hidden />}
                </button>
              ) : null}
            </div>
            <div className="rounded-3xl bg-white p-6 ring-1 ring-line/70">
              <p className="flex items-center gap-2 font-semibold">
                <Bell className="size-5 text-forest-700" aria-hidden /> iPhone?
              </p>
              <p className="mt-1 text-sm text-ink-soft">The iOS app is on its way. Until then, the website works beautifully on iPhone — add it to your home screen from Safari’s share menu.</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
