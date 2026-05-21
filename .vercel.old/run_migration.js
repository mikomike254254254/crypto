const { Client } = require('pg');

async function run() {
  const connectionStrings = [
    "postgresql://postgres:wallex-admin@db.nzzstvvbrcdhuiqppdpv.supabase.co:5432/postgres",
    "postgresql://postgres.nzzstvvbrcdhuiqppdpv:wallex-admin@aws-0-us-east-1.pooler.supabase.com:5432/postgres",
    "postgresql://postgres:wallex-admin@aws-0-us-east-1.pooler.supabase.com:5432/postgres"
  ];
  
  const sql = `
    ALTER TABLE public.users ADD COLUMN IF NOT EXISTS referred_by text REFERENCES public.users(wallet);

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
        INSERT INTO public.transactions (from_wallet, to_wallet, amount, token, type, status, note)
        VALUES ('system', new.wallet, 10.79, 'XRP', 'signup_bonus', 'completed', '$15 Wallex signup bonus');

        UPDATE public.users
        SET signup_bonus_awarded = true
        WHERE id = new.id;
        
        -- Referral bonus
        IF new.referred_by IS NOT NULL THEN
          -- Create balance rows for referrer if not exists
          INSERT INTO public.balances (wallet, amount)
          VALUES (new.referred_by, 0)
          ON CONFLICT (wallet) DO NOTHING;

          INSERT INTO public.wallet_balances (wallet, token, amount)
          VALUES (new.referred_by, 'XRP', 0)
          ON CONFLICT (wallet, token) DO NOTHING;

          INSERT INTO public.transactions (from_wallet, to_wallet, amount, token, type, status, note)
          VALUES ('system', new.referred_by, 10.00, 'XRP', 'referral_bonus', 'completed', 'Referral bonus for inviting ' || coalesce(new.full_name, new.email, 'new user'));
        END IF;
      END IF;

      RETURN new;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
  `;

  for (const connectionString of connectionStrings) {
    console.log('Trying connection string:', connectionString.replace(/:[^:]+@/, ':****@'));
    const client = new Client({
      connectionString,
      ssl: { rejectUnauthorized: false }
    });

    try {
      await client.connect();
      console.log('Connected successfully! Running migration...');
      await client.query(sql);
      console.log('Migration executed successfully! Columns and triggers updated.');
      await client.end();
      return; // success!
    } catch (err) {
      console.error('Connection failed:', err.message || err);
      try { await client.end(); } catch (e) {}
    }
  }
}
run();
