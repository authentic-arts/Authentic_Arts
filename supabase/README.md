# Authentic Arts — Supabase Database Setup

## Migration files

| File | Purpose |
|------|---------|
| `001_initial_schema.sql` | Tables, enums, indexes, `updated_at` triggers |
| `002_rls_policies.sql`   | Row Level Security policies for every table |
| `003_functions_and_triggers.sql` | Business-logic stored functions & triggers |
| `004_seed_data.sql`      | Demo users, artworks, reviews, analytics |

---

## How to apply

### Option A — Supabase Dashboard (easiest)

1. Open your project at <https://supabase.com/dashboard>
2. Go to **SQL Editor**
3. Run each migration file **in order** (001 → 004)

### Option B — Supabase CLI

```bash
# Install CLI
npm install -g supabase

# Link to your project
supabase link --project-ref <your-project-ref>

# Push all migrations
supabase db push
```

---

## Environment variables

Copy `.env.example` to `.env` in the project root:

```bash
cp .env.example .env
```

Fill in your values from **Supabase Dashboard → Project Settings → API**:

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

---

## Demo credentials (seed data)

| Role     | Email                        | Password   |
|----------|------------------------------|------------|
| Artist   | amara@authenticarts.com      | artist123  |
| Artist   | kwame@authenticarts.com      | artist123  |
| Artist   | zara@authenticarts.com       | artist123  |
| Customer | james@example.com            | user123    |
| Customer | aisha@example.com            | user123    |
| Customer | tendai@example.com           | user123    |
| Customer | fatima@example.com           | user123    |
| Customer | bongani@example.com          | user123    |
| Admin    | admin@authenticarts.com      | admin123   |

> **Note:** The seed inserts hashed passwords directly into `auth.users`.
> This works for local/staging environments. For a production Supabase project,
> create users via the Auth API or Dashboard instead, then run only the
> `profiles`, `artworks`, `reviews`, and `sales_analytics` inserts.

---

## Schema overview

```
auth.users  (Supabase managed)
    │
    └── profiles          one-to-one, created automatically on signup
            │
            ├── artworks              artist uploads, pending → available
            │       └── reviews       verified buyer reviews
            │
            ├── orders                one per checkout
            │       └── order_items   line items with snapshotted prices
            │
            ├── purchased_artworks    fast lookup: did customer buy artwork?
            ├── withdrawals           artist cashout requests
            └── sales_analytics       monthly aggregated revenue per artist
```

## Key business rules (enforced in DB)

- **15% platform commission** — `artist_credit = unit_price * 0.85`, computed at
  order time inside `fn_process_order`.
- **First-time buyer 20% discount** — tracked via `profiles.is_first_time_buyer`;
  flipped to `false` by `fn_process_order` after the first confirmed order.
- **Artwork curation** — new uploads start as `pending`; only admins can call
  `fn_approve_artwork` / `fn_reject_artwork`.
- **Review gating** — RLS on `reviews` requires a matching `purchased_artworks`
  row before a user can insert a review.
- **Wallet deduction on withdrawal request** — `fn_request_withdrawal` decrements
  `wallet_balance` immediately and creates a `withdrawals` row with status `pending`.
