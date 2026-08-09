-- Wallet increment/decrement functions (called from server)
create or replace function increment_wallet(uid uuid, amt numeric)
returns void language sql security definer as $$
  update public.users set wallet_balance = wallet_balance + amt where id = uid;
$$;

create or replace function decrement_wallet(uid uuid, amt numeric)
returns void language sql security definer as $$
  update public.users set wallet_balance = wallet_balance - amt where id = uid;
$$;

-- Make a user an admin (run manually)
-- update public.users set is_admin = true where phone = '08012345678';
