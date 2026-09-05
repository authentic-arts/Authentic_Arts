-- ============================================================
-- Migration: 002_rls_policies.sql
-- Description: Row Level Security policies for every table.
--   Principle:
--     - public read on available artworks and reviews
--     - users own their own profile and orders
--     - artists own their own artworks and withdrawals
--     - admins (role = 'admin') bypass all restrictions via a
--       helper function that reads from profiles
-- ============================================================

-- Enable RLS on all tables
alter table public.profiles           enable row level security;
alter table public.artworks           enable row level security;
alter table public.reviews            enable row level security;
alter table public.orders             enable row level security;
alter table public.order_items        enable row level security;
alter table public.purchased_artworks enable row level security;
alter table public.withdrawals        enable row level security;
alter table public.sales_analytics    enable row level security;

-- ------------------------------------------------------------
-- Helper: is the current user an admin?
-- Defined as SECURITY DEFINER so it can read profiles without
-- triggering an infinite RLS recursion loop.
-- ------------------------------------------------------------
create or replace function public.fn_is_admin()
returns boolean
language sql stable security definer as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ============================================================
-- PROFILES
-- ============================================================

-- Anyone can read any profile (public artist pages, admin CRM)
create policy "profiles: public read"
  on public.profiles for select
  using (true);

-- A user can only insert their own profile row
create policy "profiles: owner insert"
  on public.profiles for insert
  with check (id = auth.uid());

-- A user can update their own profile; admins can update anyone
create policy "profiles: owner or admin update"
  on public.profiles for update
  using (id = auth.uid() or public.fn_is_admin())
  with check (id = auth.uid() or public.fn_is_admin());

-- Only admins can delete profiles
create policy "profiles: admin delete"
  on public.profiles for delete
  using (public.fn_is_admin());

-- ============================================================
-- ARTWORKS
-- ============================================================

-- Anyone can view artworks that are available or sold
create policy "artworks: public read available"
  on public.artworks for select
  using (
    status in ('available', 'sold')
    -- Pending/rejected artworks are visible only to owner or admin
    or artist_id = auth.uid()
    or public.fn_is_admin()
  );

-- Only artists can insert artworks (as their own)
create policy "artworks: artist insert"
  on public.artworks for insert
  with check (
    artist_id = auth.uid()
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'artist'
    )
  );

-- Artists can update their own artworks; admins can update any
create policy "artworks: artist or admin update"
  on public.artworks for update
  using (artist_id = auth.uid() or public.fn_is_admin())
  with check (artist_id = auth.uid() or public.fn_is_admin());

-- Only admins can delete artworks (soft-reject sets status = 'rejected')
create policy "artworks: admin delete"
  on public.artworks for delete
  using (public.fn_is_admin());

-- ============================================================
-- REVIEWS
-- ============================================================

-- Anyone can read reviews on available/sold artworks
create policy "reviews: public read"
  on public.reviews for select
  using (true);

-- A user can post a review only if they purchased the artwork
create policy "reviews: verified buyer insert"
  on public.reviews for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.purchased_artworks
      where customer_id = auth.uid() and artwork_id = reviews.artwork_id
    )
  );

-- A user can update or delete their own review
create policy "reviews: owner update"
  on public.reviews for update
  using (user_id = auth.uid());

create policy "reviews: owner delete"
  on public.reviews for delete
  using (user_id = auth.uid() or public.fn_is_admin());

-- ============================================================
-- ORDERS
-- ============================================================

-- Customers see their own orders; admins see all
create policy "orders: owner or admin read"
  on public.orders for select
  using (customer_id = auth.uid() or public.fn_is_admin());

-- Only authenticated users can create orders for themselves
create policy "orders: owner insert"
  on public.orders for insert
  with check (customer_id = auth.uid());

-- Status updates by admin only (e.g. confirming / marking delivered)
create policy "orders: admin update"
  on public.orders for update
  using (public.fn_is_admin());

-- ============================================================
-- ORDER ITEMS
-- ============================================================

-- Owner of order can see its items; artists see items for their artworks; admins see all
create policy "order_items: owner or artist or admin read"
  on public.order_items for select
  using (
    exists (
      select 1 from public.orders
      where id = order_items.order_id and customer_id = auth.uid()
    )
    or artist_id = auth.uid()
    or public.fn_is_admin()
  );

-- Inserted as part of checkout (server-side / service role only in production)
create policy "order_items: owner insert"
  on public.order_items for insert
  with check (
    exists (
      select 1 from public.orders
      where id = order_items.order_id and customer_id = auth.uid()
    )
  );

-- ============================================================
-- PURCHASED_ARTWORKS
-- ============================================================

-- Customers see their own; artists see who bought their work; admins see all
create policy "purchased_artworks: owner or artist or admin read"
  on public.purchased_artworks for select
  using (
    customer_id = auth.uid()
    or exists (
      select 1 from public.artworks
      where id = purchased_artworks.artwork_id and artist_id = auth.uid()
    )
    or public.fn_is_admin()
  );

create policy "purchased_artworks: owner insert"
  on public.purchased_artworks for insert
  with check (customer_id = auth.uid());

-- ============================================================
-- WITHDRAWALS
-- ============================================================

-- Artists see their own; admins see all
create policy "withdrawals: owner or admin read"
  on public.withdrawals for select
  using (artist_id = auth.uid() or public.fn_is_admin());

-- Artists can create withdrawal requests for themselves
create policy "withdrawals: artist insert"
  on public.withdrawals for insert
  with check (
    artist_id = auth.uid()
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'artist'
    )
  );

-- Only admins can update withdrawal status
create policy "withdrawals: admin update"
  on public.withdrawals for update
  using (public.fn_is_admin());

-- ============================================================
-- SALES_ANALYTICS
-- ============================================================

-- Artists see their own analytics; admins see all
create policy "sales_analytics: owner or admin read"
  on public.sales_analytics for select
  using (artist_id = auth.uid() or public.fn_is_admin());

-- Only the system (service role) inserts/updates analytics rows
-- No direct user insert allowed
