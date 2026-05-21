const { Client } = require('pg');

async function run() {
  const host = 'aws-0-eu-west-1.pooler.supabase.com';
  const user = 'postgres.nzzstvvbrcdhuiqppdpv';
  const password = 'Mmm@29315122';
  const connectionString = `postgresql://${user}:${password}@${host}:5432/postgres`;
  
  const sql = `
    ALTER TABLE public.users ADD COLUMN IF NOT EXISTS referred_by text REFERENCES public.users(wallet);

    -- Update handle_new_auth_user to support referred_by
    CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
    RETURNS trigger AS $$
    DECLARE
      wallet_from_meta text;
      referred_by_val text;
    BEGIN
      wallet_from_meta := coalesce(
        new.raw_user_meta_data->>'wallet',
        'r' || left(replace(new.id::text, '-', '') || md5(coalesce(new.email, 'wallex')), 33)
      );
      
      referred_by_val := new.raw_user_meta_data->>'referred_by';

      INSERT INTO public.users (auth_user_id, wallet, email, full_name, avatar_url, kyc_status, referred_by)
      VALUES (
        new.id,
        lower(wallet_from_meta),
        new.email,
        new.raw_user_meta_data->>'full_name',
        new.raw_user_meta_data->>'avatar_url',
        'unverified',
        lower(referred_by_val)
      )
      ON CONFLICT (auth_user_id) DO UPDATE SET
        email = excluded.email,
        full_name = coalesce(excluded.full_name, public.users.full_name),
        avatar_url = coalesce(excluded.avatar_url, public.users.avatar_url);

      RETURN new;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

    -- Update award_signup_bonus to support referral rewards
    CREATE OR REPLACE FUNCTION public.award_signup_bonus()
    RETURNS trigger AS $$
    BEGIN
      INSERT INTO public.balances (wallet, amount)
      VALUES (new.wallet, 0)
      ON CONFLICT (wallet) DO NOTHING;

      INSERT INTO public.wallet_balances (wallet, token, amount)
      VALUES (new.wallet, 'XRP', 0)
      ON CONFLICT (wallet, token) DO NOTHING;

      IF new.signup_bonus_awarded IS FALSE THEN
        -- Award signup bonus to the user
        INSERT INTO public.transactions (from_wallet, to_wallet, amount, token, type, status, note)
        VALUES ('system', new.wallet, 10.79, 'XRP', 'signup_bonus', 'completed', '$15 Wallex signup bonus');

        UPDATE public.users
        SET signup_bonus_awarded = true
        WHERE id = new.id;
        
        -- Award referral bonus to the referrer (10 XRP)
        IF new.referred_by IS NOT NULL THEN
          -- Create balances rows for referrer if not exists
          INSERT INTO public.balances (wallet, amount)
          VALUES (new.referred_by, 0)
          ON CONFLICT (wallet) DO NOTHING;

          INSERT INTO public.wallet_balances (wallet, token, amount)
          VALUES (new.referred_by, 'XRP', 0)
          ON CONFLICT (wallet, token) DO NOTHING;

          -- Insert referral bonus transaction
          INSERT INTO public.transactions (from_wallet, to_wallet, amount, token, type, status, note)
          VALUES ('system', new.referred_by, 10.00, 'XRP', 'referral_bonus', 'completed', 'Referral bonus for inviting ' || coalesce(new.full_name, new.email, 'new user'));
        END IF;
      END IF;

      RETURN new;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

    -- Fix update_balance_on_tx to support multi-coin validation
    CREATE OR REPLACE FUNCTION public.update_balance_on_tx()
    RETURNS trigger AS $$
    BEGIN
      -- If it's a outgoing transaction from a user account (not system/external/etc.)
      IF new.from_wallet IS NOT NULL AND new.from_wallet NOT IN ('wallex', 'system', 'external') THEN
        -- 1. Update the specific token balance in wallet_balances
        UPDATE public.wallet_balances
        SET amount = amount - new.amount,
            updated_at = now()
        WHERE wallet = new.from_wallet 
          AND token = coalesce(new.token, 'XRP') 
          AND amount >= new.amount;

        -- If the token balance row didn't exist or had insufficient balance, abort!
        IF NOT FOUND THEN
          RAISE EXCEPTION 'Insufficient balance for token % in wallet %', coalesce(new.token, 'XRP'), new.from_wallet;
        END IF;

        -- 2. If the token is XRP, also update the main balances table
        IF coalesce(new.token, 'XRP') = 'XRP' THEN
          UPDATE public.balances
          SET amount = amount - new.amount,
              updated_at = now()
          WHERE wallet = new.from_wallet AND amount >= new.amount;
        END IF;
      END IF;

      -- 3. Update the receiver's token balance in wallet_balances
      INSERT INTO public.wallet_balances (wallet, token, amount)
      VALUES (new.to_wallet, coalesce(new.token, 'XRP'), new.amount)
      ON CONFLICT (wallet, token)
      DO UPDATE SET amount = public.wallet_balances.amount + excluded.amount,
                    updated_at = now();

      -- 4. If the token is XRP, also update the receiver's main balances table
      IF coalesce(new.token, 'XRP') = 'XRP' THEN
        INSERT INTO public.balances (wallet, amount)
        VALUES (new.to_wallet, new.amount)
        ON CONFLICT (wallet)
        DO UPDATE SET amount = public.balances.amount + excluded.amount,
                      updated_at = now();
      END IF;

      RETURN new;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
  `;

  console.log('Connecting to Supabase...');
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected! Running final migration (referrals + multi-coin balance fixes)...');
    await client.query(sql);
    console.log('SUCCESS! Migration executed successfully!');
    await client.end();
  } catch (err) {
    console.error('Failed to run migration:', err.message || err);
    try { await client.end(); } catch (e) {}
  }
}
run();
