import { HandCoins, Mail, Phone, ShieldCheck, Truck, Undo2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatINR } from '../../lib/format';
import { useCategories, useSettings } from '../../lib/queries';
import { Logo } from './Logo';

export function TrustStrip() {
  const { data: s } = useSettings();
  const items = [
    { icon: Truck, title: s?.free_shipping_threshold ? `Free delivery over ${formatINR(s.free_shipping_threshold)}` : 'Delivered to your door', text: 'Packed fresh, shipped with care' },
    { icon: ShieldCheck, title: 'Secure checkout', text: s?.online_payments_available ? 'UPI, cards & netbanking via Razorpay' : 'Prices verified at checkout' },
    { icon: HandCoins, title: s?.cod_enabled === false ? 'Online payments' : 'Cash on Delivery', text: s?.cod_enabled === false ? 'Pay securely online' : s?.cod_max_order_value ? `On orders up to ${formatINR(s.cod_max_order_value)}` : 'Pay when it arrives' },
    { icon: Undo2, title: 'Easy cancellation', text: 'Cancel before your order is packed' },
  ];
  return (
    <section aria-label="Why shop with URU" className="border-y border-line bg-white">
      <ul className="container-page grid grid-cols-2 gap-x-4 gap-y-6 py-8 lg:grid-cols-4">
        {items.map(({ icon: Icon, title, text }) => (
          <li key={title} className="flex items-start gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-forest-50 text-forest-700">
              <Icon className="size-5" aria-hidden />
            </span>
            <div>
              <p className="text-sm font-semibold text-ink">{title}</p>
              <p className="mt-0.5 text-[13px] text-muted">{text}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function Footer() {
  const { data: categories } = useCategories();
  const { data: s } = useSettings();
  const year = new Date().getFullYear();
  return (
    <footer className="relative overflow-hidden bg-forest-900 text-cream/80">
      <div className="pattern-weave absolute inset-0 opacity-60" aria-hidden />
      <div className="container-page relative grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logo light />
          <p className="mt-4 max-w-xs font-display text-xl text-cream italic">{s?.store_tagline ?? 'Your Village. Your City. Your URU.'}</p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-cream/65">
            Honest food and craft from India's villages — sourced from the families who make them, delivered to your city.
          </p>
          <ul className="mt-6 space-y-2 text-sm">
            {s?.support_email && (
              <li>
                <a href={`mailto:${s.support_email}`} className="inline-flex items-center gap-2 hover:text-terracotta-200">
                  <Mail className="size-4" aria-hidden /> {s.support_email}
                </a>
              </li>
            )}
            {s?.support_phone && (
              <li>
                <a href={`tel:${s.support_phone.replace(/\s+/g, '')}`} className="inline-flex items-center gap-2 hover:text-terracotta-200">
                  <Phone className="size-4" aria-hidden /> {s.support_phone}
                </a>
              </li>
            )}
          </ul>
        </div>
        <FooterCol
          title="Shop"
          links={[{ to: '/shop', label: 'All products' }, ...(categories ?? []).filter((c) => !c.parent_id).slice(0, 6).map((c) => ({ to: `/category/${c.slug}`, label: c.name }))]}
        />
        <FooterCol
          title="Help"
          links={[
            { to: '/track-order', label: 'Track your order' },
            { to: '/account/orders', label: 'Your orders' },
            { to: '/faq', label: 'FAQs' },
            { to: '/contact', label: 'Contact us' },
            { to: '/about', label: 'Our story' },
          ]}
        />
        <FooterCol
          title="Policies"
          links={[
            { to: '/policies/shipping', label: 'Shipping & delivery' },
            { to: '/policies/returns', label: 'Returns & refunds' },
            { to: '/policies/cancellation', label: 'Cancellation' },
            { to: '/policies/privacy', label: 'Privacy policy' },
            { to: '/policies/terms', label: 'Terms of service' },
          ]}
        />
      </div>
      <div className="relative border-t border-white/10">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-5 text-xs text-cream/55 sm:flex-row">
          <p>© {year} {s?.store_name ?? 'URU'}. All rights reserved.</p>
          <p>Prices in INR, inclusive of applicable taxes.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { to: string; label: string }[] }) {
  return (
    <div>
      <h2 className="mb-4 text-xs font-semibold tracking-[0.18em] text-terracotta-200 uppercase">{title}</h2>
      <ul className="space-y-2.5 text-sm">
        {links.map((l) => (
          <li key={l.to}>
            <Link to={l.to} className="hover:text-white">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
