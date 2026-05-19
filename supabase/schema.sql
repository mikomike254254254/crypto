create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete cascade,
  wallet text unique not null check (wallet ~ '^r[A-Za-z0-9]{24,34}$'),
  email text,
  full_name text,
  avatar_url text,
  kyc_status text default 'unverified' check (kyc_status in ('pending', 'approved', 'verified', 'rejected', 'unverified')),
  signup_bonus_awarded boolean default false,
  created_at timestamptz default now()
);

create table if not exists public.balances (
  wallet text primary key references public.users(wallet) on delete cascade,
  amount numeric not null default 0 check (amount >= 0),
  updated_at timestamptz default now()
);

create table if not exists public.wallet_balances (
  wallet text not null references public.users(wallet) on delete cascade,
  token text not null default 'XRP',
  amount numeric not null default 0 check (amount >= 0),
  updated_at timestamptz default now(),
  primary key (wallet, token)
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  from_wallet text,
  to_wallet text not null,
  amount numeric not null check (amount >= 0),
  token text default 'XRP',
  type text default 'transfer',
  status text default 'completed',
  note text,
  created_at timestamptz default now()
);

create table if not exists public.kyc_submissions (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid references auth.users(id) on delete cascade,
  wallet text not null references public.users(wallet) on delete cascade,
  email text,
  full_name text,
  id_type text,
  personal_info jsonb default '{}'::jsonb,
  front_document_url text,
  back_document_url text,
  selfie_document_url text,
  status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_at timestamptz,
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
  type text default 'wallex',
  created_at timestamptz default now()
);

create table if not exists public.mpesa_withdraws (
  id uuid primary key default gen_random_uuid(),
  wallet text not null references public.users(wallet) on delete cascade,
  phone text not null,
  amount_kes numeric not null check (amount_kes > 0),
  status text default 'pending',
  created_at timestamptz default now()
);

create or replace function public.update_balance_on_tx()
returns trigger as $$
begin
  if new.from_wallet is not null and new.from_wallet not in ('wallex', 'system', 'external') then
    update public.balances
    set amount = amount - new.amount,
        updated_at = now()
    where wallet = new.from_wallet and amount >= new.amount;

    if not found then
      raise exception 'Insufficient balance for wallet %', new.from_wallet;
    end if;

    update public.wallet_balances
    set amount = amount - new.amount,
        updated_at = now()
    where wallet = new.from_wallet and token = coalesce(new.token, 'XRP') and amount >= new.amount;
  end if;

  insert into public.balances (wallet, amount)
  values (new.to_wallet, new.amount)
  on conflict (wallet)
  do update set amount = public.balances.amount + excluded.amount,
                updated_at = now();

  insert into public.wallet_balances (wallet, token, amount)
  values (new.to_wallet, coalesce(new.token, 'XRP'), new.amount)
  on conflict (wallet, token)
  do update set amount = public.wallet_balances.amount + excluded.amount,
                updated_at = now();

  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists trigger_balance_update on public.transactions;
create trigger trigger_balance_update
after insert on public.transactions
for each row execute function public.update_balance_on_tx();

create or replace function public.award_signup_bonus()
returns trigger as $$
begin
  insert into public.balances (wallet, amount)
  values (new.wallet, 0)
  on conflict (wallet) do nothing;

  insert into public.wallet_balances (wallet, token, amount)
  values (new.wallet, 'XRP', 0)
  on conflict (wallet, token) do nothing;

  if new.signup_bonus_awarded is false then
    insert into public.transactions (from_wallet, to_wallet, amount, token, type, status, note)
    values ('system', new.wallet, 10.79, 'XRP', 'signup_bonus', 'completed', '$15 Wallex signup bonus');

    update public.users
    set signup_bonus_awarded = true
    where id = new.id;
  end if;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists trigger_award_signup_bonus on public.users;
create trigger trigger_award_signup_bonus
after insert on public.users
for each row execute function public.award_signup_bonus();

create or replace function public.handle_new_auth_user()
returns trigger as $$
declare
  wallet_from_meta text;
begin
  wallet_from_meta := coalesce(
    new.raw_user_meta_data->>'wallet',
    'r' || left(replace(new.id::text, '-', '') || md5(coalesce(new.email, 'wallex')), 33)
  );

  insert into public.users (auth_user_id, wallet, email, full_name, avatar_url, kyc_status)
  values (
    new.id,
    lower(wallet_from_meta),
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    'unverified'
  )
  on conflict (auth_user_id) do update set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, public.users.full_name),
    avatar_url = coalesce(excluded.avatar_url, public.users.avatar_url);

  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

alter table public.users enable row level security;
alter table public.balances enable row level security;
alter table public.wallet_balances enable row level security;
alter table public.transactions enable row level security;
alter table public.kyc_submissions enable row level security;
alter table public.notifications enable row level security;
alter table public.mpesa_withdraws enable row level security;
alter table public.banned_wallets enable row level security;

drop policy if exists "read own user profile" on public.users;
create policy "read own user profile" on public.users
  for select using (auth.uid() = auth_user_id);

drop policy if exists "update own user profile" on public.users;
create policy "update own user profile" on public.users
  for update using (auth.uid() = auth_user_id)
  with check (auth.uid() = auth_user_id);

drop policy if exists "read own balance" on public.balances;
create policy "read own balance" on public.balances
  for select using (exists (
    select 1 from public.users u
    where u.wallet = balances.wallet and u.auth_user_id = auth.uid()
  ));

drop policy if exists "read own wallet balances" on public.wallet_balances;
create policy "read own wallet balances" on public.wallet_balances
  for select using (exists (
    select 1 from public.users u
    where u.wallet = wallet_balances.wallet and u.auth_user_id = auth.uid()
  ));

drop policy if exists "read own transactions" on public.transactions;
create policy "read own transactions" on public.transactions
  for select using (exists (
    select 1 from public.users u
    where u.auth_user_id = auth.uid()
      and (u.wallet = transactions.from_wallet or u.wallet = transactions.to_wallet)
  ));

drop policy if exists "create own transfers" on public.transactions;
create policy "create own transfers" on public.transactions
  for insert with check (exists (
    select 1 from public.users u
    where u.auth_user_id = auth.uid()
      and u.wallet = transactions.from_wallet
      and transactions.type = 'transfer'
  ));

drop policy if exists "read own kyc submissions" on public.kyc_submissions;
create policy "read own kyc submissions" on public.kyc_submissions
  for select using (auth.uid() = auth_user_id);

drop policy if exists "create own kyc submissions" on public.kyc_submissions;
create policy "create own kyc submissions" on public.kyc_submissions
  for insert with check (auth.uid() = auth_user_id);

drop policy if exists "read own notifications" on public.notifications;
create policy "read own notifications" on public.notifications
  for select using (
    user_id is null or exists (
      select 1 from public.users u
      where u.auth_user_id = auth.uid() and u.wallet = notifications.user_id
    )
  );

drop policy if exists "create own mpesa withdraw request" on public.mpesa_withdraws;
create policy "create own mpesa withdraw request" on public.mpesa_withdraws
  for insert with check (exists (
    select 1 from public.users u
    where u.auth_user_id = auth.uid()
      and u.wallet = mpesa_withdraws.wallet
      and u.kyc_status in ('approved', 'verified')
  ));

drop policy if exists "read own mpesa withdraw requests" on public.mpesa_withdraws;
create policy "read own mpesa withdraw requests" on public.mpesa_withdraws
  for select using (exists (
    select 1 from public.users u
    where u.auth_user_id = auth.uid() and u.wallet = mpesa_withdraws.wallet
  ));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'kyc-documents',
  'kyc-documents',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'application/pdf']
)
on conflict (id) do nothing;
