-- ============================================================
-- Migration: 001_initial_schema.sql
-- Description: Core schema for Authentic Arts platform
--   - Extends Supabase auth.users with a profiles table
--   - Creates artworks, reviews, orders, order_items,
--     withdrawals, and sales_analytics tables
--   - Enforces RLS on every table
-- ============================================================

-- ------------------------------------------------------------
-- EXTENSIONS
-- ------------------------------------------------------------
create extension if not exists "uuid-ossp";

-- ------------------------------------------------------------
-- ENUMS
-- ------------------------------------------------------------
create type user_role as enum ('customer', 'artist', 'admin');
create type artwork_status as enum ('pending', 'available', 'sold', 'rejected');
create type order_status as enum ('pending', 'confirmed', 'delivered');
create type payment_method as enum ('mpesa', 'paypal');
create type withdrawal_status as enum ('pending', 'approved', 'paid', 'rejected');

-- ============================================================
-- TABLE: profiles
-- Extends auth.users (one-to-one). Stores all role-specific
-- fields in a single table with nullable artist/customer cols.
-- ============================================================
create table public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  email           text not null,
  name            text not null,
  role            user_role not null default 'customer',
  avatar_url      text,
  location        text,
  join_date       date not null default current_date,

  -- Customer fields
  preferred_styles  text[]  default '{}',
  is_first_time_buyer boolean default true,

  -- Artist fields
  bio             text,
  specialties     text[]  default '{}',
  verified        boolean default false,
  followers       integer default 0,
  total_sales     integer default 0,
  total_earnings  numeric(12,2) default 0,
  wallet_balance  numeric(12,2) default 0,
  withdrawn       numeric(12,2) default 0,

  -- Portfolio stats (denormalised for fast dashboard reads)
  portfolio_total_works   integer default 0,
  portfolio_sold          integer default 0,
  portfolio_available     integer default 0,

  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

comment on table public.profiles is
  'One profile per auth.users row. Covers customer, artist, and admin roles.';

-- ============================================================
-- TABLE: artworks
-- ============================================================
create table public.artworks (
  id              uuid primary key default gen_random_uuid(),
  artist_id       uuid not null references public.profiles(id) on delete cascade,
  artist_name     text not null,

  title           text not null,
  description     text,
  category        text not null,
  style           text not null,
  medium          text,
  dimensions      text,
  year            integer,
  origin          text not null,
  authenticity    text not null,
  inspiration     text,
  tags            text[] default '{}',
  alt_text        text,

  -- Pricing & inventory
  price           numeric(12,2) not null check (price > 0),
  original_price  numeric(12,2) not null,
  quantity        integer not null default 1 check (quantity >= 0),

  -- Images: first element is the primary thumbnail
  images          text[] default '{}',

  -- Status & curation
  status          artwork_status not null default 'pending',
  featured        boolean default false,
  best_seller     boolean default false,

  -- Aggregate stats (updated by triggers)
  sales           integer default 0,
  average_rating  numeric(3,1) default 0,
  review_count    integer default 0,

  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

comment on table public.artworks is
  'All artworks. Newly uploaded pieces start as pending and must be approved by an admin.';

create index idx_artworks_artist_id on public.artworks(artist_id);
create index idx_artworks_status    on public.artworks(status);
create index idx_artworks_category  on public.artworks(category);
create index idx_artworks_featured  on public.artworks(featured) where featured = true;

-- ============================================================
-- TABLE: reviews
-- ============================================================
create table public.reviews (
  id          uuid primary key default gen_random_uuid(),
  artwork_id  uuid not null references public.artworks(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  user_name   text not null,
  user_avatar text,
  rating      integer not null check (rating between 1 and 5),
  comment     text,
  verified    boolean default false, -- true when user has actually purchased the artwork
  created_at  timestamptz default now(),

  -- A user may only review an artwork once
  unique (artwork_id, user_id)
);

comment on table public.reviews is
  'Customer reviews. verified=true means the reviewer purchased the artwork.';

create index idx_reviews_artwork_id on public.reviews(artwork_id);
create index idx_reviews_user_id    on public.reviews(user_id);

-- ============================================================
-- TABLE: orders
-- ============================================================
create table public.orders (
  id              uuid primary key default gen_random_uuid(),
  customer_id     uuid not null references public.profiles(id) on delete restrict,

  status          order_status not null default 'pending',
  payment_method  payment_method not null,
  payment_ref     text,          -- M-Pesa transaction code or PayPal order ID

  subtotal        numeric(12,2) not null,
  discount_amount numeric(12,2) not null default 0,
  total           numeric(12,2) not null,

  -- Snapshot: was this the customer's first purchase (triggers 20% promo)?
  first_time_discount_applied boolean default false,

  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

comment on table public.orders is
  'One order per checkout. Contains the rolled-up totals and payment metadata.';

create index idx_orders_customer_id on public.orders(customer_id);
create index idx_orders_status      on public.orders(status);

-- ============================================================
-- TABLE: order_items
-- ============================================================
create table public.order_items (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references public.orders(id) on delete cascade,
  artwork_id  uuid not null references public.artworks(id) on delete restrict,
  artist_id   uuid not null references public.profiles(id) on delete restrict,

  -- Snapshot prices at time of purchase (artwork price can change later)
  unit_price  numeric(12,2) not null,
  quantity    integer not null default 1 check (quantity > 0),
  subtotal    numeric(12,2) not null,

  -- 85% of unit_price credited to artist after 15% platform commission
  artist_credit numeric(12,2) not null,

  created_at  timestamptz default now()
);

comment on table public.order_items is
  'Line items for each order. Prices are snapshotted at purchase time.';

create index idx_order_items_order_id   on public.order_items(order_id);
create index idx_order_items_artwork_id on public.order_items(artwork_id);
create index idx_order_items_artist_id  on public.order_items(artist_id);

-- ============================================================
-- TABLE: purchased_artworks  (customer ↔ artwork link)
-- Fast lookup: "has this customer purchased this artwork?"
-- ============================================================
create table public.purchased_artworks (
  customer_id uuid not null references public.profiles(id) on delete cascade,
  artwork_id  uuid not null references public.artworks(id) on delete cascade,
  order_id    uuid not null references public.orders(id)   on delete cascade,
  purchased_at timestamptz default now(),
  primary key (customer_id, artwork_id)
);

create index idx_purchased_customer on public.purchased_artworks(customer_id);
create index idx_purchased_artwork  on public.purchased_artworks(artwork_id);

-- ============================================================
-- TABLE: withdrawals
-- Artist wallet cashout requests
-- ============================================================
create table public.withdrawals (
  id              uuid primary key default gen_random_uuid(),
  artist_id       uuid not null references public.profiles(id) on delete cascade,
  amount          numeric(12,2) not null check (amount > 0),
  method          payment_method not null,
  destination     text not null,  -- phone number or PayPal email
  status          withdrawal_status not null default 'pending',
  admin_note      text,
  requested_at    timestamptz default now(),
  processed_at    timestamptz
);

comment on table public.withdrawals is
  'Artist withdrawal requests. Processed manually or via webhook.';

create index idx_withdrawals_artist_id on public.withdrawals(artist_id);
create index idx_withdrawals_status    on public.withdrawals(status);

-- ============================================================
-- TABLE: sales_analytics
-- Monthly aggregated sales per artist (mirrors mockData salesData)
-- Populated and refreshed by the fn_refresh_sales_analytics function
-- ============================================================
create table public.sales_analytics (
  id          uuid primary key default gen_random_uuid(),
  artist_id   uuid not null references public.profiles(id) on delete cascade,
  month       text not null,        -- e.g. 'Jan', 'Feb'
  month_num   integer not null,     -- 1-12 for ordering
  year        integer not null,
  sales       integer not null default 0,
  revenue     numeric(12,2) not null default 0,
  updated_at  timestamptz default now(),

  unique (artist_id, year, month_num)
);

create index idx_sales_analytics_artist on public.sales_analytics(artist_id, year, month_num);

-- ============================================================
-- updated_at auto-maintenance trigger function
-- ============================================================
create or replace function public.fn_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.fn_set_updated_at();

create trigger trg_artworks_updated_at
  before update on public.artworks
  for each row execute function public.fn_set_updated_at();

create trigger trg_orders_updated_at
  before update on public.orders
  for each row execute function public.fn_set_updated_at();
