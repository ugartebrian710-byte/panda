-- Mist & Turf (mistandturf.com) Supabase Database Schema & RLS Policies
-- Run this entire script inside the Supabase SQL Editor.

create extension if not exists pgcrypto;

-- 1. ORDERS TABLE
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  tracking_number text not null unique check (tracking_number ~ '^MT-[A-Z0-9]{6}$'),
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
  status text not null default 'Order Confirmed' check (
    status in (
      'Order Confirmed',
      'Hand-Painted & Packed',
      'Dispatched',
      'In Transit',
      'Delivered'
    )
  ),
  created_at timestamptz not null default now()
);

create index if not exists idx_orders_tracking_number on public.orders (tracking_number);

alter table public.orders enable row level security;

-- Allow anonymous checkout customers to place orders
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

-- Secure tracking lookup function: returns ONLY non-PII status & destination city/country
-- so customer emails/phones/street addresses remain private.
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

-- 2. CONTACT MESSAGES TABLE
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

-- 3. REVIEWS TABLE
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
