-- ============================================================
-- Migration: 006_mpesa_payments.sql
-- Description: Table and policies for M-Pesa Daraja transactions
-- ============================================================

-- ------------------------------------------------------------
-- ENUMS
-- ------------------------------------------------------------
create type mpesa_status as enum ('pending', 'completed', 'failed', 'cancelled', 'timeout');

-- ============================================================
-- TABLE: mpesa_transactions
-- ============================================================
create table if not exists public.mpesa_transactions (
  id                    uuid primary key default gen_random_uuid(),
  order_id              uuid references public.orders(id) on delete set null,
  user_id               uuid references public.profiles(id) on delete set null,
  checkout_request_id   text unique not null,
  merchant_request_id   text,
  phone_number          text not null,
  amount                numeric(12,2) not null check (amount > 0),
  status                mpesa_status not null default 'pending',
  mpesa_receipt_number  text,
  result_code           integer,
  result_desc           text,
  raw_callback_payload  jsonb,
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);

comment on table public.mpesa_transactions is
  'Tracks all Safaricom Daraja STK Push requests and payment confirmations.';

create index if not exists idx_mpesa_checkout_req on public.mpesa_transactions(checkout_request_id);
create index if not exists idx_mpesa_user_id      on public.mpesa_transactions(user_id);
create index if not exists idx_mpesa_order_id     on public.mpesa_transactions(order_id);
create index if not exists idx_mpesa_status       on public.mpesa_transactions(status);

-- ------------------------------------------------------------
-- RLS POLICIES
-- ------------------------------------------------------------
alter table public.mpesa_transactions enable row level security;

-- Customers can view their own transactions
create policy "Users can view their own mpesa transactions"
  on public.mpesa_transactions for select
  using (auth.uid() = user_id);

-- Admins can view all transactions
create policy "Admins can view all mpesa transactions"
  on public.mpesa_transactions for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- Authenticated users or anon can insert / update their pending transaction
create policy "Users can insert mpesa transactions"
  on public.mpesa_transactions for insert
  with check (auth.uid() = user_id or user_id is null);

create policy "Users can update their pending mpesa transactions"
  on public.mpesa_transactions for update
  using (auth.uid() = user_id or user_id is null);
