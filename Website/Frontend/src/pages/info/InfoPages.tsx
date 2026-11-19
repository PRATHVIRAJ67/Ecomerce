import { ChevronDown, HeartHandshake, Leaf, Mail, MapPin, Phone, Sprout, Tractor } from 'lucide-react';
import { useState, type FormEvent, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Breadcrumbs, Button, ButtonLink, EmptyState, Input, Textarea } from '../../components/ui';
import { formatINR } from '../../lib/format';
import { useSettings, type StoreSettings } from '../../lib/queries';
import { Seo } from '../../lib/seo';

function PageHero({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) {
  return (
    <div className="relative overflow-hidden bg-forest-700 text-cream">
      <div className="pattern-weave absolute inset-0" aria-hidden />
      <div className="absolute -right-24 -bottom-32 size-96 rounded-full bg-terracotta-500/25 blur-3xl" aria-hidden />
      <div className="container-page relative py-14 sm:py-20">
        <p className="mb-3 text-xs font-semibold tracking-[0.2em] text-terracotta-200 uppercase">{eyebrow}</p>
        <h1 className="max-w-3xl font-display text-4xl leading-tight font-semibold text-cream sm:text-6xl">{title}</h1>
        {children && <div className="mt-5 max-w-2xl text-lg text-cream/80">{children}</div>}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
export function AboutPage() {
  const values = [
    { icon: Tractor, title: 'Direct from makers', text: 'We work with farmers, home cooks, weavers and potters, and buy from them directly.' },
    { icon: Leaf, title: 'Made the old way', text: 'Stone-ground, sun-dried, hand-woven, wood-pressed — traditional methods, small batches.' },
    { icon: HeartHandshake, title: 'Fair, every time', text: 'Makers set fair prices. Customers get honest products with clear origins.' },
    { icon: Sprout, title: 'Rooted in place', text: 'Every product carries the name of the village or region it comes from.' },
  ];
  return (
    <>
      <Seo title="Our story" description="URU connects people in the city with the food and craft of India's villages — direct from the families who make them." path="/about" />
      <PageHero eyebrow="Our story" title="Your village. Your city. Your URU.">
        “Uru” is the word for hometown in Kannada. URU exists so that wherever you live, the flavours and crafts of home are never far away.
      </PageHero>
      <div className="container-page grid gap-12 py-16 lg:grid-cols-[1.2fr_1fr] lg:py-24">
        <div className="prose-uru max-w-2xl text-[17px]">
          <h2>Why we started</h2>
          <p>
            Millions of us have moved from our villages and towns to the city for work and study. We brought our habits with us — but not the pickle our grandmother made every summer, the
            red rice from the paddy behind the house, or the handloom towel that only got softer with time.
          </p>
          <p>
            Meanwhile, the people who still make these things often struggle to reach buyers beyond the weekly market. URU is the bridge: a careful, honest store that brings village goods to city
            homes, and a fair income back to the village.
          </p>
          <h2>How we work</h2>
          <ul>
            <li>We list each product with its origin, so you know exactly where it comes from.</li>
            <li>Prices and stock on this site come straight from our inventory — what you see is what we have.</li>
            <li>Every order is packed by hand and tracked from confirmation to your door.</li>
          </ul>
        </div>
        <ul className="grid gap-4 self-start sm:grid-cols-2">
          {values.map(({ icon: Icon, title, text }) => (
            <li key={title} className="rounded-3xl bg-white p-6 ring-1 ring-line/70">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-terracotta-50 text-terracotta-600">
                <Icon className="size-6" strokeWidth={1.6} aria-hidden />
              </span>
              <h3 className="mt-4 font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-ink-soft">{text}</p>
            </li>
          ))}
        </ul>
      </div>
      <div className="container-page pb-20 text-center">
        <ButtonLink to="/shop" variant="accent" size="lg">
          Explore the collection
        </ButtonLink>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
export function ContactPage() {
  const { data: s } = useSettings();
  const [form, setForm] = useState({ name: '', subject: '', message: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (form.name.trim().length < 2) errs.name = 'Enter your name';
    if (form.message.trim().length < 10) errs.message = 'Tell us a little more (at least 10 characters)';
    setErrors(errs);
    if (Object.keys(errs).length || !s?.support_email) return;
    const subject = encodeURIComponent(form.subject.trim() || `Message from ${form.name.trim()}`);
    const body = encodeURIComponent(`${form.message.trim()}\n\n— ${form.name.trim()}`);
    window.location.href = `mailto:${s.support_email}?subject=${subject}&body=${body}`;
  };

  return (
    <>
      <Seo title="Contact us" description="Questions about an order or a product? Get in touch with the URU team." path="/contact" />
      <PageHero eyebrow="We're here to help" title="Contact us">
        Questions about an order, a product, or partnering with us? Reach out — a real person will reply.
      </PageHero>
      <div className="container-page grid gap-10 py-14 lg:grid-cols-[1fr_1.2fr] lg:py-20">
        <div className="space-y-4">
          {s?.support_email && (
            <a href={`mailto:${s.support_email}`} className="flex items-center gap-4 rounded-3xl bg-white p-6 ring-1 ring-line/70 hover:ring-forest-300">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-forest-50 text-forest-700">
                <Mail className="size-5" aria-hidden />
              </span>
              <span>
                <span className="block text-sm text-muted">Email</span>
                <span className="block font-semibold">{s.support_email}</span>
              </span>
            </a>
          )}
          {s?.support_phone && (
            <a href={`tel:${s.support_phone.replace(/\s+/g, '')}`} className="flex items-center gap-4 rounded-3xl bg-white p-6 ring-1 ring-line/70 hover:ring-forest-300">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-forest-50 text-forest-700">
                <Phone className="size-5" aria-hidden />
              </span>
              <span>
                <span className="block text-sm text-muted">Phone</span>
                <span className="block font-semibold">{s.support_phone}</span>
              </span>
            </a>
          )}
          <div className="flex items-center gap-4 rounded-3xl bg-white p-6 ring-1 ring-line/70">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-forest-50 text-forest-700">
              <MapPin className="size-5" aria-hidden />
            </span>
            <span>
              <span className="block text-sm text-muted">Order help</span>
              <Link to="/track-order" className="block font-semibold text-forest-700 underline">
                Track an order
              </Link>
            </span>
          </div>
          <p className="px-2 text-sm text-ink-soft">
            Many answers are already in our{' '}
            <Link to="/faq" className="font-semibold text-forest-700 underline">
              FAQs
            </Link>
            .
          </p>
        </div>

        <div className="rounded-3xl bg-white p-6 ring-1 ring-line/70 sm:p-8">
          <h2 className="font-display text-2xl font-semibold">Send us a message</h2>
          {s && !s.support_email ? (
            <p className="mt-4 text-ink-soft">Our support inbox is being set up. In the meantime, please check the FAQs or your order page for help.</p>
          ) : (
            <form onSubmit={submit} noValidate className="mt-6 space-y-4">
              <Input label="Your name" autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} />
              <Input label="Subject" optional placeholder="E.g. Order URU-1234" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} maxLength={120} />
              <Textarea label="Message" rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} error={errors.message} maxLength={2000} />
              <Button type="submit" variant="primary" disabled={!s}>
                Open in your email app
              </Button>
              <p className="text-xs text-muted">This opens your email app with the message ready to send to {s?.support_email ?? 'our team'}.</p>
            </form>
          )}
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
function faqs(s?: StoreSettings): { q: string; a: string }[] {
  const fee = s?.shipping_fee != null ? formatINR(s.shipping_fee) : 'a small fee';
  const free = s?.free_shipping_threshold ? formatINR(s.free_shipping_threshold) : null;
  return [
    { q: 'How much is delivery?', a: free ? `Delivery is free on orders of ${free} or more. Below that, a flat delivery fee of ${fee} applies. The exact amount is shown in your cart before you pay.` : `A delivery fee of ${fee} applies and is shown in your cart before you pay.` },
    { q: 'Which payment methods do you accept?', a: `${s?.online_payments_available ? 'You can pay online with UPI, cards, netbanking and wallets through Razorpay. ' : ''}${s?.cod_enabled !== false ? `Cash on Delivery is available${s?.cod_max_order_value ? ` for orders up to ${formatINR(s.cod_max_order_value)}` : ''}.` : ''}` },
    { q: 'Is online payment safe?', a: 'Yes. Payments are processed by Razorpay, a PCI-DSS compliant gateway. We never see or store your card details, and every payment is verified by our server before your order is confirmed.' },
    { q: 'How do I track my order?', a: 'Sign in and open Your orders. Each order shows its live status — confirmed, packed, shipped, out for delivery and delivered — with timestamps.' },
    { q: 'Can I cancel my order?', a: 'You can cancel from the order page while it is awaiting payment or confirmed (before it is packed). Once it is packed, please contact us and we will do our best to help.' },
    { q: 'What if an item goes out of stock after I add it to my cart?', a: 'Stock is checked again when you place the order. If something is no longer available, we will tell you before you pay so you can adjust your cart — you will never be charged for an item we cannot send.' },
    { q: 'Are your products natural / preservative-free?', a: 'Each product page lists how it is made and where it comes from. Many of our foods are made in small batches using traditional methods — check the product description for specifics.' },
    { q: 'Do I need an account to shop?', a: 'You can browse and build your cart and wishlist without an account. To check out and track orders, you will need to sign in so we can keep your order details private and secure.' },
  ];
}

export function FaqPage() {
  const { data: s } = useSettings();
  const [open, setOpen] = useState<number | null>(0);
  const list = faqs(s);
  return (
    <>
      <Seo
        title="Frequently asked questions"
        description="Answers about delivery, payments, order tracking, cancellations and more."
        path="/faq"
        jsonLd={{ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: list.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) }}
      />
      <PageHero eyebrow="Help centre" title="Frequently asked questions" />
      <div className="container-page max-w-3xl py-14 sm:py-20">
        <ul className="divide-y divide-line overflow-hidden rounded-3xl bg-white ring-1 ring-line/70">
          {list.map((f, i) => (
            <li key={f.q}>
              <h2>
                <button type="button" onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i} aria-controls={`faq-${i}`} className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left font-semibold hover:bg-cream/60">
                  {f.q}
                  <ChevronDown className={`size-5 shrink-0 text-muted transition ${open === i ? 'rotate-180' : ''}`} aria-hidden />
                </button>
              </h2>
              <div id={`faq-${i}`} hidden={open !== i} className="px-6 pb-6 leading-relaxed text-ink-soft">
                {f.a}
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-8 text-center text-ink-soft">
          Still have a question?{' '}
          <Link to="/contact" className="font-semibold text-forest-700 underline">
            Contact us
          </Link>
        </p>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
type Policy = { title: string; description: string; body: (s?: StoreSettings) => ReactNode };

const POLICIES: Record<string, Policy> = {
  shipping: {
    title: 'Shipping & delivery',
    description: 'Delivery charges, timelines and how we pack your order.',
    body: (s) => (
      <>
        <h2>Delivery charges</h2>
        <p>
          {s?.free_shipping_threshold
            ? `Orders with a subtotal of ${formatINR(s.free_shipping_threshold)} or more ship free. Below that, a flat fee of ${formatINR(s.shipping_fee ?? 0)} is added.`
            : `A flat delivery fee of ${formatINR(s?.shipping_fee ?? 0)} applies to each order.`}{' '}
          The exact charge is always shown in your cart and at checkout before you pay.
        </p>
        <h2>Dispatch and delivery times</h2>
        <p>Most orders are packed within 1–2 business days. Fresh and seasonal produce may ship on specific days to arrive at its best. Delivery time depends on your PIN code; you can follow every step on your order page.</p>
        <h2>Packaging</h2>
        <p>We pack by hand using sturdy, minimal packaging. Fragile items such as clay and glass are cushioned individually.</p>
        <h2>Tracking</h2>
        <p>
          Sign in and open <Link to="/account/orders">Your orders</Link> to see live status updates.
        </p>
      </>
    ),
  },
  returns: {
    title: 'Returns & refunds',
    description: 'What to do if something arrives damaged or incorrect.',
    body: () => (
      <>
        <h2>Damaged, defective or incorrect items</h2>
        <p>If an item arrives damaged, defective or different from what you ordered, contact us within 48 hours of delivery with your order number and a photo. We will arrange a replacement or a refund.</p>
        <h2>Perishable goods</h2>
        <p>For hygiene and food-safety reasons, perishable and opened food items cannot be returned unless they arrive damaged or spoiled.</p>
        <h2>Non-food items</h2>
        <p>Unused handloom, kitchenware and handicraft items in original packaging may be returned within 7 days of delivery. Some handmade variation in colour, weave or finish is natural and not a defect.</p>
        <h2>Refunds</h2>
        <p>Approved refunds for online payments go back to the original payment method, usually within 5–7 business days after approval. For Cash on Delivery orders, we will refund to a bank account or UPI ID you provide.</p>
      </>
    ),
  },
  cancellation: {
    title: 'Cancellation policy',
    description: 'When and how you can cancel an order.',
    body: () => (
      <>
        <h2>Cancelling your order</h2>
        <p>
          You can cancel an order yourself from its page in <Link to="/account/orders">Your orders</Link> while it is <strong>awaiting payment</strong> or <strong>confirmed</strong>. Once an order is packed, please contact us — we will try to help, but it may already be on its way.
        </p>
        <h2>Unpaid online orders</h2>
        <p>If you choose online payment and don't complete it, the order is held briefly and then cancelled automatically so the items become available to others.</p>
        <h2>Refunds on cancelled orders</h2>
        <p>If you had already paid online, a refund is initiated to your original payment method as soon as the order is cancelled.</p>
        <h2>Cancellations by us</h2>
        <p>Rarely, we may need to cancel an order — for example if an item is damaged before dispatch. We will let you know and refund any payment in full.</p>
      </>
    ),
  },
  privacy: {
    title: 'Privacy policy',
    description: 'How URU collects, uses and protects your personal information.',
    body: () => (
      <>
        <h2>What we collect</h2>
        <ul>
          <li>Account details: your name, email address and, if you add it, your phone number.</li>
          <li>Delivery addresses you save.</li>
          <li>Order history, cart and wishlist contents.</li>
          <li>Payment status from our payment partner. We never receive or store full card numbers, UPI PINs or banking passwords.</li>
        </ul>
        <h2>How we use it</h2>
        <p>Only to run the store: to process and deliver your orders, to show your order history, to contact you about your orders, and to keep the service secure. We do not sell your personal data.</p>
        <h2>Who we share it with</h2>
        <p>Delivery partners (your name, phone and address, so they can deliver), our payment gateway (to process payment), and service providers who host our systems — each only as needed to provide the service.</p>
        <h2>Security</h2>
        <p>Your account is protected by secure authentication, connections are encrypted, and access to customer data is restricted to authorised staff.</p>
        <h2>Your choices</h2>
        <p>
          You can update your profile and addresses at any time from <Link to="/account">your account</Link>. To request a copy or deletion of your data, <Link to="/contact">contact us</Link>.
        </p>
      </>
    ),
  },
  terms: {
    title: 'Terms of service',
    description: 'The terms that apply when you shop on URU.',
    body: (s) => (
      <>
        <h2>Using URU</h2>
        <p>By creating an account or placing an order, you agree to these terms. You are responsible for keeping your login details safe and for activity on your account.</p>
        <h2>Products and prices</h2>
        <p>Prices are in Indian Rupees and include applicable taxes. Product photos and descriptions are as accurate as we can make them; handmade and natural products can vary slightly. Prices and availability are confirmed by our system when you place your order.</p>
        <h2>Orders</h2>
        <p>
          An order is confirmed once it is placed with Cash on Delivery or once online payment is verified. Quantities per item may be limited{s?.max_quantity_per_item ? ` (currently up to ${s.max_quantity_per_item} per product)` : ''} to keep stock fair for everyone.
        </p>
        <h2>Payments</h2>
        <p>Online payments are processed securely by Razorpay.{s?.cod_max_order_value ? ` Cash on Delivery is available for orders up to ${formatINR(s.cod_max_order_value)}.` : ''}</p>
        <h2>Cancellations and returns</h2>
        <p>
          See our <Link to="/policies/cancellation">cancellation policy</Link> and <Link to="/policies/returns">returns policy</Link>.
        </p>
        <h2>Contact</h2>
        <p>
          Questions about these terms? <Link to="/contact">Get in touch</Link>.
        </p>
      </>
    ),
  },
};

export function PolicyPage() {
  const { slug = '' } = useParams();
  const { data: s } = useSettings();
  const policy = POLICIES[slug];
  if (!policy) {
    return (
      <div className="container-page py-10">
        <Seo title="Page not found" noindex />
        <EmptyState icon={Leaf} title="Policy not found" action={<ButtonLink to="/">Go home</ButtonLink>} />
      </div>
    );
  }
  return (
    <>
      <Seo title={policy.title} description={policy.description} path={`/policies/${slug}`} />
      <div className="container-page max-w-3xl py-10 sm:py-14">
        <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Policies' }, { label: policy.title }]} />
        <h1 className="mt-5 font-display text-4xl font-semibold tracking-tight sm:text-5xl">{policy.title}</h1>
        <div className="prose-uru mt-4">{policy.body(s)}</div>
        <nav aria-label="Other policies" className="mt-12 flex flex-wrap gap-2 border-t border-line pt-6">
          {Object.entries(POLICIES)
            .filter(([k]) => k !== slug)
            .map(([k, p]) => (
              <Link key={k} to={`/policies/${k}`} className="rounded-full border border-line bg-white px-4 py-1.5 text-sm font-medium hover:border-forest-700">
                {p.title}
              </Link>
            ))}
        </nav>
      </div>
    </>
  );
}
