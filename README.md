# B.B COOPERATIVE

Members-only investment platform. Next.js 14 + Supabase + Paystack.

## Setup

### 1. Supabase
Go to your Supabase dashboard → SQL Editor and run:
1. `supabase/schema.sql` — all tables, RLS, default data
2. `supabase/functions.sql` — wallet increment/decrement functions

Then make yourself admin:
```sql
update public.users set is_admin = true where phone = 'YOUR_PHONE_NUMBER';
```

### 2. Environment
`.env.local` is already configured with your keys.

Add your production domain when deploying:
```
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

### 3. Run locally
```bash
npm install
npm run dev
```

Open http://localhost:3000

### 4. Daily rewards cron
Set up a cron job (Vercel Cron, Railway, or any scheduler) to hit:
```
GET /api/cron/daily
Authorization: Bearer bbc_cron_secret_change_in_prod
```
Run once per day at midnight. This accrues daily rewards for all active plans.

## Routes

### User app
- `/` → redirects to /home or /login
- `/login` — sign in
- `/register` — create account (gets ₦1,000 bonus)
- `/home` — dashboard
- `/products` — browse plans
- `/products/[id]` — buy a plan
- `/team` — referral & commissions
- `/community` — withdrawal feed
- `/profile` — settings hub
- `/profile/rewards` — claim pending rewards
- `/profile/checkin` — daily check-in
- `/profile/withdraw` — withdrawal requests
- `/profile/bank` — bank account management

### Admin panel
- `/admin/dashboard`
- `/admin/products` — create/edit/delete plans
- `/admin/users` — view all users
- `/admin/withdrawals` — approve/reject/mark paid
- `/admin/rewards` — gift rewards to users
- `/admin/tasks` — manage task gates
- `/admin/community` — moderate posts
- `/admin/settings` — all editable settings

## Tech stack
- Next.js 14 (App Router, TypeScript)
- Supabase (Postgres + RLS)
- Paystack (split payment + bank resolve)
- Tailwind CSS
- Zustand
- bcryptjs + jose (auth)
- date-fns
