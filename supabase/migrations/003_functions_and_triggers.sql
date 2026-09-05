-- ============================================================
-- Migration: 003_functions_and_triggers.sql
-- Description: Business-logic triggers and stored functions
--   1. fn_handle_new_user        – creates a profile row on signup
--   2. fn_update_artwork_rating  – recalculates avg rating on review insert/delete
--   3. fn_process_order          – on order confirmed: decrements stock,
--                                  credits artist wallets, logs purchased_artworks,
--                                  updates portfolio stats, flips first-time-buyer flag
--   4. fn_refresh_sales_analytics – upserts monthly sales rows for an artist
-- ============================================================

-- ============================================================
-- 1. Auto-create profile on auth.users insert
-- ============================================================
create or replace function public.fn_handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, name, avatar_url, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(
      new.raw_user_meta_data->>'avatar_url',
      'https://picsum.photos/seed/' || new.id || '/200/200'
    ),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'customer')
  );
  return new;
end;
$$;

create trigger trg_on_new_user
  after insert on auth.users
  for each row execute function public.fn_handle_new_user();

-- ============================================================
-- 2. Recalculate artwork average_rating and review_count
--    Fires after every INSERT or DELETE on reviews
-- ============================================================
create or replace function public.fn_update_artwork_rating()
returns trigger language plpgsql security definer as $$
declare
  v_artwork_id uuid;
  v_avg        numeric(3,1);
  v_count      integer;
begin
  -- Determine which artwork was affected
  if TG_OP = 'DELETE' then
    v_artwork_id := old.artwork_id;
  else
    v_artwork_id := new.artwork_id;
  end if;

  select
    round(avg(rating)::numeric, 1),
    count(*)
  into v_avg, v_count
  from public.reviews
  where artwork_id = v_artwork_id;

  update public.artworks
  set
    average_rating = coalesce(v_avg, 0),
    review_count   = coalesce(v_count, 0),
    updated_at     = now()
  where id = v_artwork_id;

  return null; -- AFTER trigger, return value is ignored
end;
$$;

create trigger trg_review_rating_insert
  after insert on public.reviews
  for each row execute function public.fn_update_artwork_rating();

create trigger trg_review_rating_delete
  after delete on public.reviews
  for each row execute function public.fn_update_artwork_rating();

-- ============================================================
-- 3. Process a confirmed order
--    Called explicitly from the application after payment
--    confirmation (via Supabase RPC) OR can be chained to an
--    orders status update trigger.
--
--    What it does per order_item:
--      a) Decrement artwork.quantity; set status = 'sold' if qty reaches 0
--      b) Increment artwork.sales
--      c) Credit 85% of unit_price to the artist's wallet_balance
--         and total_earnings; increment total_sales
--      d) Update artist portfolio stats (sold +1, available -1 if sold out)
--      e) Insert a purchased_artworks row for the customer
--      f) Update monthly sales_analytics for the artist
--      g) Mark customer is_first_time_buyer = false
-- ============================================================
create or replace function public.fn_process_order(p_order_id uuid)
returns void language plpgsql security definer as $$
declare
  r           record;
  v_customer  uuid;
  v_new_qty   integer;
  commission  constant numeric := 0.15;
begin
  -- Lock the order row
  select customer_id into v_customer
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'Order % not found', p_order_id;
  end if;

  -- Loop over each line item
  for r in
    select oi.artwork_id, oi.artist_id, oi.quantity, oi.unit_price, oi.artist_credit
    from public.order_items oi
    where oi.order_id = p_order_id
  loop
    -- a+b) Decrement stock and increment sales on artwork
    update public.artworks
    set
      quantity   = greatest(quantity - r.quantity, 0),
      sales      = sales + r.quantity,
      status     = case
                     when greatest(quantity - r.quantity, 0) = 0 then 'sold'::artwork_status
                     else status
                   end,
      updated_at = now()
    where id = r.artwork_id
    returning quantity into v_new_qty;

    -- c) Credit artist wallet
    update public.profiles
    set
      wallet_balance  = wallet_balance  + r.artist_credit,
      total_earnings  = total_earnings  + r.artist_credit,
      total_sales     = total_sales     + r.quantity,
      -- d) portfolio stats
      portfolio_sold      = portfolio_sold + r.quantity,
      portfolio_available = greatest(
                              portfolio_available - case when v_new_qty = 0 then 1 else 0 end,
                              0
                            ),
      updated_at = now()
    where id = r.artist_id;

    -- e) Record purchase for customer
    insert into public.purchased_artworks (customer_id, artwork_id, order_id)
    values (v_customer, r.artwork_id, p_order_id)
    on conflict (customer_id, artwork_id) do nothing;

    -- f) Update monthly sales analytics
    perform public.fn_refresh_sales_analytics(
      r.artist_id,
      extract(year  from now())::integer,
      extract(month from now())::integer,
      r.quantity,
      r.artist_credit
    );
  end loop;

  -- g) Flip first-time-buyer flag
  update public.profiles
  set is_first_time_buyer = false, updated_at = now()
  where id = v_customer and is_first_time_buyer = true;

  -- Mark order as confirmed
  update public.orders
  set status = 'confirmed', updated_at = now()
  where id = p_order_id;
end;
$$;

-- ============================================================
-- 4. Upsert a single monthly analytics row for an artist
-- ============================================================
create or replace function public.fn_refresh_sales_analytics(
  p_artist_id uuid,
  p_year      integer,
  p_month_num integer,
  p_sales     integer,
  p_revenue   numeric
)
returns void language plpgsql security definer as $$
declare
  v_month_name text;
begin
  v_month_name := to_char(make_date(p_year, p_month_num, 1), 'Mon');

  insert into public.sales_analytics
    (artist_id, month, month_num, year, sales, revenue, updated_at)
  values
    (p_artist_id, v_month_name, p_month_num, p_year, p_sales, p_revenue, now())
  on conflict (artist_id, year, month_num)
  do update set
    sales      = sales_analytics.sales   + excluded.sales,
    revenue    = sales_analytics.revenue + excluded.revenue,
    updated_at = now();
end;
$$;

-- ============================================================
-- 5. RPC: switch_to_artist
--    Allows a customer to elevate their own profile to artist role.
-- ============================================================
create or replace function public.fn_switch_to_artist(
  p_bio       text default '',
  p_location  text default ''
)
returns void language plpgsql security definer as $$
begin
  update public.profiles
  set
    role                 = 'artist',
    bio                  = p_bio,
    location             = p_location,
    verified             = false,
    total_sales          = 0,
    total_earnings       = 0,
    wallet_balance       = 0,
    withdrawn            = 0,
    followers            = 0,
    portfolio_total_works = 0,
    portfolio_sold        = 0,
    portfolio_available   = 0,
    updated_at           = now()
  where id = auth.uid() and role = 'customer';

  if not found then
    raise exception 'Only customers can switch to artist role.';
  end if;
end;
$$;

-- ============================================================
-- 6. RPC: approve_artwork  (admin only)
-- ============================================================
create or replace function public.fn_approve_artwork(p_artwork_id uuid)
returns void language plpgsql security definer as $$
begin
  if not public.fn_is_admin() then
    raise exception 'Permission denied.';
  end if;

  update public.artworks
  set status = 'available', updated_at = now()
  where id = p_artwork_id and status = 'pending';

  -- Increment artist's portfolio_available count
  update public.profiles p
  set portfolio_available = portfolio_available + 1, updated_at = now()
  from public.artworks a
  where a.id = p_artwork_id and p.id = a.artist_id;
end;
$$;

-- ============================================================
-- 7. RPC: reject_artwork  (admin only)
-- ============================================================
create or replace function public.fn_reject_artwork(p_artwork_id uuid)
returns void language plpgsql security definer as $$
begin
  if not public.fn_is_admin() then
    raise exception 'Permission denied.';
  end if;

  update public.artworks
  set status = 'rejected', updated_at = now()
  where id = p_artwork_id;

  -- Decrement artist's portfolio_total_works (rejected art not counted)
  update public.profiles p
  set portfolio_total_works = greatest(portfolio_total_works - 1, 0),
      updated_at = now()
  from public.artworks a
  where a.id = p_artwork_id and p.id = a.artist_id;
end;
$$;

-- ============================================================
-- 8. RPC: request_withdrawal  (artist only)
-- ============================================================
create or replace function public.fn_request_withdrawal(
  p_amount      numeric,
  p_method      payment_method,
  p_destination text
)
returns uuid language plpgsql security definer as $$
declare
  v_balance numeric;
  v_id      uuid;
begin
  -- Validate role and balance
  select wallet_balance into v_balance
  from public.profiles
  where id = auth.uid() and role = 'artist'
  for update;

  if not found then
    raise exception 'Only artists can request withdrawals.';
  end if;

  if p_amount <= 0 then
    raise exception 'Withdrawal amount must be greater than zero.';
  end if;

  if p_amount > v_balance then
    raise exception 'Insufficient wallet balance.';
  end if;

  -- Deduct immediately (held pending processing)
  update public.profiles
  set
    wallet_balance = wallet_balance - p_amount,
    withdrawn      = withdrawn + p_amount,
    updated_at     = now()
  where id = auth.uid();

  -- Create the withdrawal record
  insert into public.withdrawals (artist_id, amount, method, destination)
  values (auth.uid(), p_amount, p_method, p_destination)
  returning id into v_id;

  return v_id;
end;
$$;
