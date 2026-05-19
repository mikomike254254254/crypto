create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  wallet text unique not null,
  email text,
  full_name text,
  avatar_url text,
  kyc_status text default 'pending' check (kyc_status in ('pending', 'approved', 'rejected', 'unverified')),
  created_at timestamptz default now()
);

create table if not exists public.balances (
  wallet text primary key,
  amount numeric not null default 0 check (amount >= 0),
  updated_at timestamptz default now()
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  from_wallet text,
  to_wallet text not null,
  amount numeric not null check (amount > 0),
  token text default 'RXP',
  type text default 'transfer',
  status text default 'completed',
  note text,
  created_at timestamptz default now()
);

create table if not exists public.banned_wallets (
  id uuid primary key default gen_random_uuid(),
  wallet_address text unique not null,
  banned_at timestamptz default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id text,
  message text not null,
  type text default 'admin',
  created_at timestamptz default now()
);

create table if not exists public.mpesa_withdraws (
  id uuid primary key default gen_random_uuid(),
  wallet text not null,
  phone text not null,
  amount_kes numeric not null check (amount_kes > 0),
  status text default 'pending',
  created_at timestamptz default now()
);

create or replace function public.update_balance_on_tx()
returns trigger as $$
begin
  if new.from_wallet is not null and new.from_wallet not in ('admin', 'system', 'external') then
    update public.balances
    set amount = amount - new.amount,
        updated_at = now()
    where wallet = new.from_wallet and amount >= new.amount;

    if not found then
      raise exception 'Insufficient RXP balance for wallet %', new.from_wallet;
    end if;
  end if;

  insert into public.balances (wallet, amount)
  values (new.to_wallet, new.amount)
  on conflict (wallet)
  do update set amount = public.balances.amount + excluded.amount,
                updated_at = now();

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trigger_balance_update on public.transactions;
create trigger trigger_balance_update
after insert on public.transactions
for each row execute function public.update_balance_on_tx();

alter table public.users enable row level security;
alter table public.balances enable row level security;
alter table public.transactions enable row level security;
alter table public.notifications enable row level security;
alter table public.mpesa_withdraws enable row level security;
alter table public.banned_wallets enable row level security;

create policy "read own user profile" on public.users
  for select using (auth.uid()::text = wallet);

create policy "insert own user profile" on public.users
  for insert with check (auth.uid()::text = wallet);

create policy "read own balance" on public.balances
  for select using (auth.uid()::text = wallet);

create policy "read own transactions" on public.transactions
  for select using (auth.uid()::text = from_wallet or auth.uid()::text = to_wallet);

create policy "create own transfers" on public.transactions
  for insert with check (auth.uid()::text = from_wallet and type = 'transfer');

create policy "read own notifications" on public.notifications
  for select using (user_id is null or auth.uid()::text = user_id);

create policy "create own mpesa withdraw request" on public.mpesa_withdraws
  for insert with check (auth.uid()::text = wallet);
