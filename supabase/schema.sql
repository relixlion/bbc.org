-- USERS
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  phone text unique not null,
  password_hash text not null,
  referral_code text unique not null,
  referred_by uuid references public.users(id) on delete set null,
  wallet_balance numeric(12,2) not null default 0,
  total_invested numeric(12,2) not null default 0,
  tier text not null default 'bronze',
  bank_name text,
  account_number text,
  account_name text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

-- PLANS (admin-created products)
create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null check (category in ('bigbrother','football','forest')),
  plan_type text not null check (plan_type in ('daily','fixed')),
  price numeric(12,2) not null,
  daily_return numeric(12,2),
  fixed_return_percent numeric(5,2),
  duration_days integer not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- USER PLAN PURCHASES
create table if not exists public.user_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  plan_id uuid not null references public.plans(id),
  amount_paid numeric(12,2) not null,
  wallet_used numeric(12,2) not null default 0,
  paystack_used numeric(12,2) not null default 0,
  paystack_ref text,
  start_date date not null default current_date,
  end_date date not null,
  last_reward_date date,
  status text not null default 'active' check (status in ('active','matured','completed')),
  created_at timestamptz not null default now()
);

-- REWARDS (pending / claimed)
create table if not exists public.rewards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  type text not null check (type in ('daily','fixed','referral','checkin','salary','admin_gift')),
  amount numeric(12,2) not null,
  label text,
  status text not null default 'pending' check (status in ('pending','claimed')),
  task_required boolean not null default false,
  task_completed boolean not null default false,
  source_plan_id uuid references public.user_plans(id) on delete set null,
  created_at timestamptz not null default now(),
  claimed_at timestamptz
);

-- TASKS (admin-managed)
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('daily_reward','weekly_salary','checkin')),
  title text not null,
  link text,
  is_active boolean not null default true,
  updated_at timestamptz not null default now()
);

-- WITHDRAWALS
create table if not exists public.withdrawals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  amount numeric(12,2) not null,
  bank_name text not null,
  account_number text not null,
  account_name text not null,
  status text not null default 'pending' check (status in ('pending','approved','paid','rejected')),
  admin_note text,
  requested_at timestamptz not null default now(),
  processed_at timestamptz
);

-- COMMUNITY POSTS
create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  image_url text,
  amount_shown numeric(12,2),
  status text not null default 'visible' check (status in ('visible','hidden')),
  created_at timestamptz not null default now()
);

-- ADMIN SETTINGS (key-value)
create table if not exists public.admin_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- TRANSACTIONS LEDGER
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  type text not null,
  amount numeric(12,2) not null,
  direction text not null check (direction in ('credit','debit')),
  reference text,
  note text,
  created_at timestamptz not null default now()
);

-- CHECK-IN LOG
create table if not exists public.checkin_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  checked_in_at date not null default current_date,
  unique(user_id, checked_in_at)
);

-- DEFAULT ADMIN SETTINGS
insert into public.admin_settings (key, value) values
  ('checkin_amount', '80'),
  ('referral_rates', '{"l1": 20, "l2": 3, "l3": 2}'),
  ('withdrawal_tiers', '[
    {"name":"bronze","label":"Bronze","min_invested":0,"threshold":35000,"days":["friday"]},
    {"name":"silver","label":"Silver","min_invested":35000,"threshold":75000,"days":["wednesday","friday"]},
    {"name":"gold","label":"Gold","min_invested":75000,"threshold":150000,"days":["monday","wednesday","friday"]},
    {"name":"platinum","label":"Platinum","min_invested":150000,"threshold":200000,"days":["monday","tuesday","wednesday","thursday","friday","saturday","sunday"]}
  ]'),
  ('weekly_salary', '{"bronze":600,"silver":1500,"gold":5000,"platinum":15000}')
on conflict (key) do nothing;

-- DEFAULT TASKS
insert into public.tasks (type, title, link, is_active) values
  ('daily_reward', 'Watch our latest YouTube video', 'https://youtube.com', true),
  ('weekly_salary', 'Subscribe to our YouTube channel', 'https://youtube.com', true),
  ('checkin', 'Follow us on Instagram', 'https://instagram.com', false)
on conflict do nothing;

-- RLS
alter table public.users enable row level security;
alter table public.plans enable row level security;
alter table public.user_plans enable row level security;
alter table public.rewards enable row level security;
alter table public.tasks enable row level security;
alter table public.withdrawals enable row level security;
alter table public.community_posts enable row level security;
alter table public.admin_settings enable row level security;
alter table public.transactions enable row level security;
alter table public.checkin_log enable row level security;

-- Policies: service role bypasses RLS (we use service role on server)
-- Anon can read plans and community posts
create policy "plans_public_read" on public.plans for select using (is_active = true);
create policy "community_public_read" on public.community_posts for select using (status = 'visible');

