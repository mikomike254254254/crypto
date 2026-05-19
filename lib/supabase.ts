import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const enableWalletSync = process.env.EXPO_PUBLIC_ENABLE_SUPABASE_SYNC === 'true';

// Whether the client can be initialized at all (URL + anon key present)
export const isSupabaseClientConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Whether wallet / transaction sync is turned on
export const isWalletSyncEnabled = Boolean(enableWalletSync && isSupabaseClientConfigured);

// Auth is always available when the client is configured (regardless of wallet sync flag)
export const isSupabaseConfigured = isSupabaseClientConfigured;

export const supabase = isSupabaseClientConfigured
  ? createClient(supabaseUrl as string, supabaseAnonKey as string, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export async function recordWalletTransfer(params: {
  fromWallet: string;
  toWallet: string;
  amount: number;
  token?: string;
  note?: string;
}) {
  if (!supabase || !isWalletSyncEnabled) {
    return { ok: true, demo: true, error: null };
  }

  const { error } = await supabase.from('transactions').insert({
    from_wallet: params.fromWallet,
    to_wallet: params.toWallet,
    amount: params.amount,
    token: params.token ?? 'XRP',
    type: 'transfer',
    status: 'completed',
    note: params.note ?? null,
  });

  return { ok: !error, demo: false, error };
}

export async function loadWalletBalance(wallet: string) {
  if (!supabase || !isWalletSyncEnabled) return null;

  const { data, error } = await supabase
    .from('balances')
    .select('amount')
    .eq('wallet', wallet)
    .maybeSingle();

  if (error) return null;
  return Number(data?.amount ?? 0);
}

export async function loadWalletBalances(wallet: string): Promise<{ token: string; amount: number }[]> {
  if (!supabase || !isWalletSyncEnabled) return [];

  const { data, error } = await supabase
    .from('wallet_balances')
    .select('token, amount')
    .eq('wallet', wallet);

  if (error || !data) return [];
  return data.map((r) => ({ token: r.token, amount: Number(r.amount) }));
}

export async function loadUserNotifications(wallet: string) {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .or(`user_id.is.null,user_id.eq.${wallet}`)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error || !data) return [];
  return data;
}

export async function loadUserProfile(authUserId: string) {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('auth_user_id', authUserId)
    .maybeSingle();

  if (error || !data) return null;
  return data;
}
