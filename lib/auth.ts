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

  const { data, error } = await supabase.auth.signUp({
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

  // If user already exists and is confirmed, the sign up returns a session
  const alreadyExists = data.user && !data.session && !error;
  if (alreadyExists) {
    return { ok: false, mode: 'supabase' as const, message: 'An account with this email already exists. Please log in.' };
  }

  return { ok: true, mode: 'supabase' as const, message: 'Account created! Check your email to confirm, or log in if confirmation is off.', user: data.user };
}

export async function signInWithEmailPassword(email: string, password: string) {
  if (!supabase) {
    return { ok: true, mode: 'local' as const, message: 'Demo login — no Supabase configured.', user: null, session: null };
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return { ok: false, mode: 'supabase' as const, message: error.message, user: null, session: null };

  return {
    ok: true,
    mode: 'supabase' as const,
    message: 'Signed in successfully.',
    user: data.user,
    session: data.session,
  };
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

export async function signOutUser() {
  if (!supabase) return { ok: true };
  const { error } = await supabase.auth.signOut();
  return { ok: !error, message: error?.message };
}

export async function updateSupabasePassword(password: string) {
  if (!supabase) return { ok: true, mode: 'local' as const };
  const { error } = await supabase.auth.updateUser({ password });
  return { ok: !error, mode: 'supabase' as const, message: error?.message };
}

export async function getSupabaseSession() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function getSupabaseUser() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user;
}
