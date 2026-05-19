import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl as string, supabaseAnonKey as string)
  : null;

export async function recordWalletTransfer(params: {
  fromWallet: string;
  toWallet: string;
  amount: number;
  token?: string;
  note?: string;
}) {
  if (!supabase) {
    return { ok: true, demo: true, error: null };
  }

  const { error } = await supabase.from('transactions').insert({
    from_wallet: params.fromWallet,
    to_wallet: params.toWallet,
    amount: params.amount,
    token: params.token ?? 'RXP',
    type: 'transfer',
    status: 'completed',
    note: params.note ?? null,
  });

  return { ok: !error, demo: false, error };
}

export async function loadWalletBalance(wallet: string) {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('balances')
    .select('amount')
    .eq('wallet', wallet)
    .maybeSingle();

  if (error) return null;
  return Number(data?.amount ?? 0);
}
