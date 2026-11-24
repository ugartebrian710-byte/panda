-- ============================================================================
-- MIST & TURF (mistandturf.com) — COMPLETE PRODUCTION SUPABASE SQL
-- Copy and paste this entire script into the Supabase SQL Editor and click RUN.
-- It is 100% idempotent and safe to run on a fresh or existing project.
-- ============================================================================

create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- 1. PROFILES (Customer & Admin Auth Roles)
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id or public.is_admin());

drop policy if exists "Users can update own non-role profile fields" on public.profiles;
create policy "Users can update own non-role profile fields"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and role = (select p.role from public.profiles p where p.id = auth.uid())
  );

-- Auto-create profile whenever a user signs up via Supabase Auth
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    case
      when lower(coalesce(new.email, '')) = 'ugartebrian710@gmail.com' then 'admin'
      else 'customer'
    end
  )
  on conflict (id) do update
    set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- 2. EDITIONS (All 10 Product Versions & Live Inventory / Sales Counters)
-- ----------------------------------------------------------------------------
create table if not exists public.editions (
  id text primary key,
  sort_order integer not null,
  sku text not null unique,
  name text not null,
  subtitle text not null,
  stock_quantity integer not null default 50 check (stock_quantity >= 0),
  units_sold integer not null default 0 check (units_sold >= 0),
  revenue_usd numeric(12, 2) not null default 0 check (revenue_usd >= 0),
  is_active boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.editions enable row level security;

drop policy if exists "Anyone can view active editions" on public.editions;
create policy "Anyone can view active editions"
  on public.editions
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Admins can manage editions" on public.editions;
create policy "Admins can manage editions"
  on public.editions
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Seed all 10 Mist & Turf editions
insert into public.editions (id, sort_order, sku, name, subtitle, stock_quantity, is_active)
values
  ('grand-stadium', 1, 'MT-ED-01', 'The Grand Stadium', 'Tiered arena bowl & floodlit turf', 65, true),
  ('10-maestro', 2, 'MT-ED-02', 'The #10 Maestro (Messi)', 'Iconic #10 tribute & sculpted pitch', 48, true),
  ('7-legend', 3, 'MT-ED-03', 'The #7 Legend (Ronaldo)', 'Signature #7 celebration & mist base', 52, true),
  ('world-crown', 4, 'MT-ED-04', 'The World Crown (World Cup)', 'Golden cup crest & cascading mist', 40, true),
  ('golden-boot', 5, 'MT-ED-05', 'The Golden Boot', 'Sculpted metallic cleat on lush pitch', 55, true),
  ('champions-crest', 6, 'MT-ED-06', 'The Champions Crest', 'Classic silver trophy centerpiece', 44, true),
  ('golden-glove', 7, 'MT-ED-07', 'The Golden Glove', 'Keeper tribute & textured grass plinth', 60, true),
  ('heritage-matchball', 8, 'MT-ED-08', 'The Heritage Matchball', 'Vintage panel sphere & smoke channel', 58, true),
  ('overhead-volley', 9, 'MT-ED-09', 'The Overhead Volley', 'Acrobatic strike frozen in resin', 46, true),
  ('floodlight-arena', 10, 'MT-ED-10', 'The Floodlight Arena', 'Night-match gantry & corner arc', 50, true)
on conflict (id) do nothing;

-- ----------------------------------------------------------------------------
-- 3. ORDERS (Customer Orders + TikTok / Traffic Attribution)
-- ----------------------------------------------------------------------------
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  tracking_number text not null unique check (tracking_number ~ '^MT-[A-Z0-9]{6}$'),
  user_id uuid references auth.users (id) on delete set null,
  customer_name text not null check (char_length(trim(customer_name)) between 2 and 120),
  customer_email text not null check (customer_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  customer_phone text not null check (char_length(trim(customer_phone)) between 5 and 40),
  shipping_address jsonb not null,
  bundle_id text not null,
  bundle_title text not null,
  selected_editions jsonb not null default '[]'::jsonb,
  addons jsonb not null default '[]'::jsonb,
  shipping_method text not null check (shipping_method in ('standard', 'express')),
  promo_code text,
  currency text not null default 'USD' check (currency in ('USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY')),
  subtotal numeric(12, 2) not null check (subtotal >= 0),
  discount_amount numeric(12, 2) not null default 0 check (discount_amount >= 0),
  shipping_cost numeric(12, 2) not null default 0 check (shipping_cost >= 0),
  total_amount numeric(12, 2) not null check (total_amount >= 0),
  payment_method text not null,
  payment_status text not null default 'pending_gateway' check (
    payment_status in ('pending_gateway', 'authorized', 'paid', 'refunded')
  ),
  status text not null default 'Order Confirmed' check (
    status in (
      'Order Confirmed',
      'Hand-Painted & Packed',
      'Dispatched',
      'In Transit',
      'Delivered'
    )
  ),
  traffic_source text not null default 'direct',
  utm_medium text,
  utm_campaign text,
  utm_content text,
  ttclid text,
  referrer text,
  created_at timestamptz not null default now()
);

-- Safe migrations if orders table already existed from an earlier version
alter table public.orders add column if not exists user_id uuid references auth.users (id) on delete set null;
alter table public.orders add column if not exists payment_status text not null default 'pending_gateway';
alter table public.orders add column if not exists traffic_source text not null default 'direct';
alter table public.orders add column if not exists utm_medium text;
alter table public.orders add column if not exists utm_campaign text;
alter table public.orders add column if not exists utm_content text;
alter table public.orders add column if not exists ttclid text;
alter table public.orders add column if not exists referrer text;

create index if not exists idx_orders_tracking_number on public.orders (tracking_number);
create index if not exists idx_orders_created_at on public.orders (created_at desc);
create index if not exists idx_orders_traffic_source on public.orders (traffic_source);

alter table public.orders enable row level security;

drop policy if exists "Allow public order creation" on public.orders;
create policy "Allow public order creation"
  on public.orders
  for insert
  to anon, authenticated
  with check (
    tracking_number ~ '^MT-[A-Z0-9]{6}$'
    and total_amount >= 0
    and status = 'Order Confirmed'
  );

drop policy if exists "Admins and order owners can read orders" on public.orders;
create policy "Admins and order owners can read orders"
  on public.orders
  for select
  to authenticated
  using (
    public.is_admin()
    or user_id = auth.uid()
    or lower(customer_email) = lower(coalesce(auth.jwt()->>'email', ''))
  );

drop policy if exists "Admins can update order status" on public.orders;
create policy "Admins can update order status"
  on public.orders
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Automatically update per-edition units_sold, revenue_usd, and stock_quantity on new orders
create or replace function public.sync_edition_sales_on_order()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  ed_name text;
  edition_count integer;
  per_unit_rev numeric(12, 2);
begin
  edition_count := greatest(1, jsonb_array_length(new.selected_editions));
  per_unit_rev := round(new.total_amount / edition_count, 2);

  for ed_name in
    select jsonb_array_elements_text(new.selected_editions)
  loop
    update public.editions
    set
      units_sold = units_sold + 1,
      revenue_usd = revenue_usd + per_unit_rev,
      stock_quantity = greatest(0, stock_quantity - 1),
      updated_at = now()
    where name = ed_name;
  end loop;

  return new;
end;
$$;

drop trigger if exists trg_sync_edition_sales on public.orders;
create trigger trg_sync_edition_sales
  after insert on public.orders
  for each row execute function public.sync_edition_sales_on_order();

-- Non-PII public tracking lookup function
create or replace function public.lookup_order_status(p_tracking_number text)
returns table (
  tracking_number text,
  status text,
  bundle_title text,
  selected_editions jsonb,
  addons jsonb,
  shipping_method text,
  destination_city text,
  destination_country text,
  currency text,
  total_amount numeric,
  created_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    o.tracking_number,
    o.status,
    o.bundle_title,
    o.selected_editions,
    o.addons,
    o.shipping_method,
    coalesce(o.shipping_address->>'city', '') as destination_city,
    coalesce(o.shipping_address->>'country', '') as destination_country,
    o.currency,
    o.total_amount,
    o.created_at
  from public.orders o
  where upper(trim(o.tracking_number)) = upper(trim(p_tracking_number))
  limit 1;
$$;

grant execute on function public.lookup_order_status(text) to anon, authenticated;

-- ----------------------------------------------------------------------------
-- 4. TRAFFIC EVENTS (TikTok UTM, Referrer & Conversion Attribution)
-- ----------------------------------------------------------------------------
create table if not exists public.traffic_events (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  source text not null default 'direct',
  utm_medium text,
  utm_campaign text,
  utm_content text,
  ttclid text,
  referrer text,
  landing_path text not null default '/',
  event_type text not null default 'page_view' check (
    event_type in ('page_view', 'add_to_cart', 'checkout_start', 'purchase')
  ),
  edition_id text,
  created_at timestamptz not null default now()
);

create index if not exists idx_traffic_events_source on public.traffic_events (source);
create index if not exists idx_traffic_events_created_at on public.traffic_events (created_at desc);

alter table public.traffic_events enable row level security;

drop policy if exists "Allow public traffic logging" on public.traffic_events;
create policy "Allow public traffic logging"
  on public.traffic_events
  for insert
  to anon, authenticated
  with check (char_length(trim(session_id)) > 0);

drop policy if exists "Admins can view traffic analytics" on public.traffic_events;
create policy "Admins can view traffic analytics"
  on public.traffic_events
  for select
  to authenticated
  using (public.is_admin());

-- ----------------------------------------------------------------------------
-- 5. NEWSLETTER SUBSCRIBERS (6-Second 5% Off Popup Leads)
-- ----------------------------------------------------------------------------
create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  promo_code text not null default 'MIST5',
  traffic_source text not null default 'direct',
  utm_campaign text,
  created_at timestamptz not null default now()
);

alter table public.newsletter_subscribers enable row level security;

drop policy if exists "Allow public subscriber signup" on public.newsletter_subscribers;
create policy "Allow public subscriber signup"
  on public.newsletter_subscribers
  for insert
  to anon, authenticated
  with check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$');

drop policy if exists "Admins can view subscribers" on public.newsletter_subscribers;
create policy "Admins can view subscribers"
  on public.newsletter_subscribers
  for select
  to authenticated
  using (public.is_admin());

-- ----------------------------------------------------------------------------
-- 6. CONTACT MESSAGES
-- ----------------------------------------------------------------------------
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 2 and 120),
  email text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  order_number text,
  message text not null check (char_length(trim(message)) between 5 and 4000),
  created_at timestamptz not null default now()
);

alter table public.contact_messages enable row level security;

drop policy if exists "Allow public contact submission" on public.contact_messages;
create policy "Allow public contact submission"
  on public.contact_messages
  for insert
  to anon, authenticated
  with check (
    char_length(trim(name)) >= 2
    and char_length(trim(message)) >= 5
  );

drop policy if exists "Admins can read contact messages" on public.contact_messages;
create policy "Admins can read contact messages"
  on public.contact_messages
  for select
  to authenticated
  using (public.is_admin());

-- ----------------------------------------------------------------------------
-- 7. CUSTOMER REVIEWS
-- ----------------------------------------------------------------------------
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  author_name text not null check (char_length(trim(author_name)) between 2 and 80),
  location text not null default 'Worldwide' check (char_length(trim(location)) between 2 and 80),
  edition_name text not null check (char_length(trim(edition_name)) between 2 and 120),
  rating integer not null check (rating between 1 and 5),
  title text not null check (char_length(trim(title)) between 2 and 140),
  body text not null check (char_length(trim(body)) between 5 and 2000),
  verified_purchase boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_reviews_created_at on public.reviews (created_at desc);

alter table public.reviews enable row level security;

drop policy if exists "Allow public review read" on public.reviews;
create policy "Allow public review read"
  on public.reviews
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Allow public review insert" on public.reviews;
create policy "Allow public review insert"
  on public.reviews
  for insert
  to anon, authenticated
  with check (
    rating between 1 and 5
    and char_length(trim(author_name)) >= 2
    and char_length(trim(body)) >= 5
  );

-- ----------------------------------------------------------------------------
-- 8. ENABLE REALTIME STREAMING FOR ADMIN DASHBOARD
-- ----------------------------------------------------------------------------
do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'orders',
    'editions',
    'traffic_events',
    'newsletter_subscribers',
    'contact_messages'
  ]
  loop
    begin
      execute format('alter publication supabase_realtime add table public.%I;', tbl);
    exception
      when duplicate_object then null;
    end;
  end loop;
end $$;

-- ----------------------------------------------------------------------------
-- OPTIONAL: Grant admin role to any additional email after they sign up:
-- update public.profiles set role = 'admin' where email = 'your-admin@mistandturf.com';
-- ----------------------------------------------------------------------------
