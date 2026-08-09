-- VENDORS
create table if not exists public.vendors (
  id uuid primary key default gen_random_uuid(),
  phone text unique not null,
  password_hash text not null,
  name text not null,
  bank_name text not null,
  account_number text not null,
  account_name text not null,
  usdt_address text not null,
  min_amount numeric(12,2) not null default 5000,
  max_amount numeric(12,2) not null default 500000,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- P2P TRADES
create table if not exists public.p2p_trades (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('deposit','withdraw')),
  user_id uuid not null references public.users(id) on delete cascade,
  vendor_id uuid not null references public.vendors(id),
  naira_amount numeric(12,2) not null,
  usdt_amount numeric(12,4) not null,
  rate numeric(12,2) not null,
  status text not null default 'pending' check (status in (
    'pending','vendor_paid','confirmed','disputed','settled','cancelled','expired'
  )),
  txid text,
  user_bank_name text,
  user_account_number text,
  user_account_name text,
  vendor_bank_name text,
  vendor_account_number text,
  vendor_account_name text,
  dispute_opened_at timestamptz,
  auto_settle_at timestamptz,
  settled_at timestamptz,
  admin_note text,
  created_at timestamptz not null default now()
);

-- TRADE MESSAGES (thread)
create table if not exists public.trade_messages (
  id uuid primary key default gen_random_uuid(),
  trade_id uuid not null references public.p2p_trades(id) on delete cascade,
  sender_role text not null check (sender_role in ('user','vendor','admin')),
  sender_id uuid not null,
  body text,
  attachment_url text,
  attachment_type text,
  created_at timestamptz not null default now()
);

-- RLS
alter table public.vendors enable row level security;
alter table public.p2p_trades enable row level security;
alter table public.trade_messages enable row level security;

-- Admin settings: p2p_rate and p2p_fee
insert into public.admin_settings (key, value) values
  ('p2p_rate', '1600'),
  ('p2p_deposit_fee', '0'),
  ('p2p_withdraw_fee', '10'),
  ('daily_claim_fee', '0'),
  ('weekly_claim_fee', '15'),
  ('referral_claim_fee', '0'),
  ('checkin_claim_fee', '0')
on conflict (key) do nothing;
