import { Platform } from 'react-native';
import { WALLEX_BRAND } from '@/constants/brand';
import { supabase } from '@/lib/supabase';

type EmailSignupParams = {
  email: string;
  password: string;
  name: string;
  wallet: string;
  avatarUri: string | null;
};

export function getAuthRedirectUrl(path = '/') {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return `${window.location.origin}${path}`;
  }

  return process.env.EXPO_PUBLIC_WALLEX_WEBSITE_URL || WALLEX_BRAND.websiteUrl;
}

export async function signUpWithEmailPassword(params: EmailSignupParams) {
  if (!supabase) {
    return { ok: true, mode: 'local' as const, message: 'Local demo signup saved on this device.' };
  }

  const { error } = await supabase.auth.signUp({
    email: params.email,
    password: params.password,
    options: {
      emailRedirectTo: getAuthRedirectUrl('/'),
      data: {
        full_name: params.name,
        wallet: params.wallet,
        avatar_url: params.avatarUri,
      },
    },
  });

  if (error) return { ok: false, mode: 'supabase' as const, message: error.message };
  return { ok: true, mode: 'supabase' as const, message: 'Signup created. Check email if confirmation is enabled.' };
}

export async function signInWithGoogle() {
  if (!supabase) {
    return { ok: true, mode: 'local' as const, message: 'Supabase is not configured locally. Continue with demo setup.' };
  }

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: getAuthRedirectUrl('/'),
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  if (error) return { ok: false, mode: 'supabase' as const, message: error.message };
  return { ok: true, mode: 'supabase' as const, message: 'Google signup opened.' };
}

export async function updateSupabasePassword(password: string) {
  if (!supabase) return { ok: true, mode: 'local' as const };
  const { error } = await supabase.auth.updateUser({ password });
  return { ok: !error, mode: 'supabase' as const, message: error?.message };
}
