-- =============================================================================
-- URU — initial schema
-- Supabase Postgres. Run once (Supabase SQL editor or `supabase db push`).
-- The API connects as a privileged role (bypasses RLS). RLS below protects any
-- direct client access through Supabase (anon / authenticated roles).
-- =============================================================================

create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.user_role        as enum ('customer', 'admin', 'super_admin');
create type public.account_status   as enum ('active', 'suspended');
create type public.order_status     as enum ('pending_payment', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled');
create type public.payment_method   as enum ('cod', 'razorpay');
create type public.payment_status   as enum ('pending', 'paid', 'failed', 'refund_pending', 'refunded');
create type public.inventory_reason as enum ('initial', 'order', 'order_cancelled', 'restock', 'adjustment', 'correction');

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  email        text,
  full_name    text,
  phone        text,
  avatar_url   text,
  role         public.user_role      not null default 'customer',
  status       public.account_status not null default 'active',
  permissions  text[]                not null default '{}',
  last_seen_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index profiles_role_idx  on public.profiles (role);
create index profiles_email_idx on public.profiles (lower(email));
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- New auth user → customer profile. Role is NEVER taken from user metadata.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email, full_name, phone)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.phone
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Catalogue
-- ---------------------------------------------------------------------------
create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  parent_id   uuid references public.categories (id) on delete set null,
  name        text not null constraint categories_name_length check (char_length(name) between 2 and 80),
  slug        text not null constraint categories_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text,
  image_url   text,
  sort_order  int  not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint categories_slug_key unique (slug),
  constraint categories_not_own_parent check (parent_id is null or parent_id <> id)
);
create index categories_parent_idx on public.categories (parent_id);
create trigger categories_updated_at before update on public.categories
  for each row execute function public.set_updated_at();

create table public.products (
  id                  uuid primary key default gen_random_uuid(),
  category_id         uuid references public.categories (id) on delete restrict,
  name                text not null constraint products_name_length check (char_length(name) between 2 and 160),
  slug                text not null constraint products_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  sku                 text not null,
  short_description   text,
  description         text,
  unit                text,
  origin              text,
  tags                text[] not null default '{}',
  price               numeric(12, 2) not null constraint products_price_nonnegative check (price >= 0),
  mrp                 numeric(12, 2),
  stock_quantity      int not null default 0 constraint products_stock_nonnegative check (stock_quantity >= 0),
  low_stock_threshold int not null default 5 constraint products_threshold_nonnegative check (low_stock_threshold >= 0),
  is_active           boolean not null default true,
  is_featured         boolean not null default false,
  marked_out_of_stock boolean not null default false,
  created_by          uuid references public.profiles (id) on delete set null,
  updated_by          uuid references public.profiles (id) on delete set null,
  deleted_at          timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint products_mrp_gte_price check (mrp is null or mrp >= price)
);
create unique index products_slug_key on public.products (slug) where deleted_at is null;
create unique index products_sku_key  on public.products (upper(sku)) where deleted_at is null;
create index products_category_idx    on public.products (category_id) where deleted_at is null;
create index products_active_idx      on public.products (is_active, created_at desc) where deleted_at is null;
create index products_name_trgm_idx   on public.products using gin (name gin_trgm_ops);
create trigger products_updated_at before update on public.products
  for each row execute function public.set_updated_at();

create table public.product_images (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products (id) on delete cascade,
  url         text not null,
  storage_key text,
  alt         text,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);
create index product_images_product_idx on public.product_images (product_id, sort_order);

create table public.price_history (
  id         bigint generated always as identity primary key,
  product_id uuid not null references public.products (id) on delete cascade,
  old_price  numeric(12, 2),
  new_price  numeric(12, 2) not null,
  old_mrp    numeric(12, 2),
  new_mrp    numeric(12, 2),
  changed_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create index price_history_product_idx on public.price_history (product_id, created_at desc);

create or replace function public.log_price_change()
returns trigger language plpgsql as $$
begin
  if new.price is distinct from old.price or new.mrp is distinct from old.mrp then
    insert into public.price_history (product_id, old_price, new_price, old_mrp, new_mrp, changed_by)
    values (new.id, old.price, new.price, old.mrp, new.mrp, new.updated_by);
  end if;
  return new;
end;
$$;
create trigger products_price_history after update of price, mrp on public.products
  for each row execute function public.log_price_change();

create table public.banners (
  id               uuid primary key default gen_random_uuid(),
  title            text not null,
  subtitle         text,
  image_url        text not null,
  mobile_image_url text,
  cta_label        text,
  link_url         text,
  placement        text not null default 'home_hero'
                   constraint banners_placement_check check (placement in ('home_hero', 'home_strip', 'category')),
  sort_order       int not null default 0,
  is_active        boolean not null default true,
  starts_at        timestamptz,
  ends_at          timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint banners_schedule_check check (ends_at is null or starts_at is null or ends_at > starts_at)
);
create trigger banners_updated_at before update on public.banners
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Customer data
-- ---------------------------------------------------------------------------
create table public.addresses (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  label      text,
  full_name  text not null,
  phone      text not null,
  line1      text not null,
  line2      text,
  landmark   text,
  city       text not null,
  state      text not null,
  pincode    text not null constraint addresses_pincode_format check (pincode ~ '^[1-9][0-9]{5}$'),
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index addresses_user_idx on public.addresses (user_id);
create trigger addresses_updated_at before update on public.addresses
  for each row execute function public.set_updated_at();

create table public.cart_items (
  user_id    uuid not null references public.profiles (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  quantity   int  not null constraint cart_items_quantity_range check (quantity between 1 and 99),
  added_at   timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

create table public.wishlist_items (
  user_id    uuid not null references public.profiles (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

-- ---------------------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------------------
create sequence public.order_number_seq start 100001;

create table public.orders (
  id                  uuid primary key default gen_random_uuid(),
  order_number        text not null default ('URU' || nextval('public.order_number_seq')::text),
  user_id             uuid references public.profiles (id) on delete set null,
  status              public.order_status   not null default 'confirmed',
  payment_method      public.payment_method not null,
  payment_status      public.payment_status not null default 'pending',
  subtotal            numeric(12, 2) not null check (subtotal >= 0),
  shipping_fee        numeric(12, 2) not null default 0 check (shipping_fee >= 0),
  discount            numeric(12, 2) not null default 0 check (discount >= 0),
  total               numeric(12, 2) not null check (total >= 0),
  item_count          int not null check (item_count > 0),
  shipping_address    jsonb not null,
  customer_name       text,
  customer_email      text,
  customer_phone      text,
  razorpay_order_id   text,
  razorpay_payment_id text,
  notes               text,
  cancel_reason       text,
  placed_at           timestamptz not null default now(),
  paid_at             timestamptz,
  delivered_at        timestamptz,
  cancelled_at        timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint orders_order_number_key unique (order_number),
  constraint orders_razorpay_order_key unique (razorpay_order_id)
);
create index orders_user_idx    on public.orders (user_id, created_at desc);
create index orders_status_idx  on public.orders (status, created_at desc);
create index orders_created_idx on public.orders (created_at desc);
create trigger orders_updated_at before update on public.orders
  for each row execute function public.set_updated_at();

create table public.order_items (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid not null references public.orders (id) on delete cascade,
  product_id   uuid references public.products (id) on delete set null,
  product_name text not null,
  sku          text,
  unit         text,
  image_url    text,
  unit_price   numeric(12, 2) not null check (unit_price >= 0),
  quantity     int not null check (quantity > 0),
  line_total   numeric(12, 2) not null check (line_total >= 0)
);
create index order_items_order_idx   on public.order_items (order_id);
create index order_items_product_idx on public.order_items (product_id);

create table public.order_status_history (
  id         bigint generated always as identity primary key,
  order_id   uuid not null references public.orders (id) on delete cascade,
  status     public.order_status not null,
  note       text,
  changed_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create index order_status_history_order_idx on public.order_status_history (order_id, created_at);

-- ---------------------------------------------------------------------------
-- Inventory, audit, settings
-- ---------------------------------------------------------------------------
create table public.inventory_movements (
  id          bigint generated always as identity primary key,
  product_id  uuid not null references public.products (id) on delete cascade,
  change      int  not null,
  stock_after int  not null check (stock_after >= 0),
  reason      public.inventory_reason not null,
  note        text,
  order_id    uuid references public.orders (id) on delete set null,
  actor_id    uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now()
);
create index inventory_movements_product_idx on public.inventory_movements (product_id, created_at desc);
create index inventory_movements_created_idx on public.inventory_movements (created_at desc);

create table public.audit_logs (
  id          bigint generated always as identity primary key,
  actor_id    uuid references public.profiles (id) on delete set null,
  actor_email text,
  actor_role  public.user_role,
  action      text not null,
  entity_type text not null,
  entity_id   text,
  before      jsonb,
  after       jsonb,
  ip          text,
  user_agent  text,
  created_at  timestamptz not null default now()
);
create index audit_logs_created_idx on public.audit_logs (created_at desc);
create index audit_logs_entity_idx  on public.audit_logs (entity_type, entity_id);
create index audit_logs_actor_idx   on public.audit_logs (actor_id, created_at desc);

create table public.platform_settings (
  key         text primary key,
  value       jsonb not null,
  is_public   boolean not null default false,
  label       text,
  description text,
  updated_by  uuid references public.profiles (id) on delete set null,
  updated_at  timestamptz not null default now()
);
create trigger platform_settings_updated_at before update on public.platform_settings
  for each row execute function public.set_updated_at();

insert into public.platform_settings (key, value, is_public, label, description) values
  ('store_name',              '"URU"',                                  true,  'Store name',                 'Shown in headers, emails and invoices'),
  ('store_tagline',           '"Your Village. Your City. Your URU."',   true,  'Tagline',                    'Brand line used on the storefront'),
  ('support_email',           '""',                                     true,  'Support email',              'Customer support email address'),
  ('support_phone',           '""',                                     true,  'Support phone',              'Customer support phone number'),
  ('shipping_fee',            '49',                                     true,  'Shipping fee (₹)',           'Flat delivery charge per order'),
  ('free_shipping_threshold', '499',                                    true,  'Free shipping above (₹)',    'Orders with subtotal at or above this ship free'),
  ('cod_enabled',             'true',                                   true,  'Cash on Delivery enabled',   'Allow customers to choose COD'),
  ('cod_max_order_value',     '5000',                                   true,  'COD max order value (₹)',    'COD is hidden for orders above this total'),
  ('online_payments_enabled', 'true',                                   true,  'Online payments enabled',    'Allow Razorpay checkout (requires API keys)'),
  ('max_quantity_per_item',   '10',                                     true,  'Max quantity per item',      'Upper limit a customer can order per product'),
  ('payment_timeout_minutes', '30',                                     false, 'Payment timeout (minutes)',  'Unpaid online orders are cancelled and stock released after this'),
  ('maintenance_mode',        'false',                                  true,  'Maintenance mode',           'Storefront shows a maintenance notice and blocks checkout');

-- ---------------------------------------------------------------------------
-- Row Level Security
-- Public: active catalogue + public settings. Customers: own rows only.
-- Everything else (admin data) is denied to anon/authenticated → API only.
-- ---------------------------------------------------------------------------
alter table public.profiles             enable row level security;
alter table public.categories           enable row level security;
alter table public.products             enable row level security;
alter table public.product_images       enable row level security;
alter table public.price_history        enable row level security;
alter table public.banners              enable row level security;
alter table public.addresses            enable row level security;
alter table public.cart_items           enable row level security;
alter table public.wishlist_items       enable row level security;
alter table public.orders               enable row level security;
alter table public.order_items          enable row level security;
alter table public.order_status_history enable row level security;
alter table public.inventory_movements  enable row level security;
alter table public.audit_logs           enable row level security;
alter table public.platform_settings    enable row level security;

create policy "profiles: read own" on public.profiles
  for select to authenticated using (id = auth.uid());

create policy "categories: public read active" on public.categories
  for select to anon, authenticated using (is_active);

create policy "products: public read active" on public.products
  for select to anon, authenticated using (is_active and deleted_at is null);

create policy "product_images: public read" on public.product_images
  for select to anon, authenticated using (
    exists (select 1 from public.products p where p.id = product_id and p.is_active and p.deleted_at is null)
  );

create policy "banners: public read live" on public.banners
  for select to anon, authenticated using (
    is_active and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at > now())
  );

create policy "settings: public read" on public.platform_settings
  for select to anon, authenticated using (is_public);

create policy "addresses: own" on public.addresses
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "cart: own" on public.cart_items
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "wishlist: own" on public.wishlist_items
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "orders: read own" on public.orders
  for select to authenticated using (user_id = auth.uid());

create policy "order_items: read own" on public.order_items
  for select to authenticated using (
    exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
  );

create policy "order_history: read own" on public.order_status_history
  for select to authenticated using (
    exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
  );

-- Customers may not change their own role/status/permissions even via direct access.
revoke update on public.profiles from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Realtime: let storefronts subscribe to catalogue changes (public rows only).
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.products, public.categories, public.banners;
  end if;
end;
$$;
