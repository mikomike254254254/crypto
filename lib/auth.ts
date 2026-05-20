import { Platform } from 'react-native';
import { WALLEX_BRAND } from '@/constants/brand';
import { supabase, recordAuditLog } from '@/lib/supabase';

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
    return { ok: false, mode: 'error' as const, message: 'Authentication service is not available. Please refresh the page and try again.' };
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

  // Record audit log for signup
  if (data.user) {
    await recordAuditLog({
      userId: data.user.id,
      wallet: params.wallet,
      email: params.email,
      eventType: 'user_signup',
      metadata: { name: params.name, avatarUri: params.avatarUri },
    });
  }

  return { ok: true, mode: 'supabase' as const, message: 'Account created! Check your email to confirm, or log in if confirmation is off.', user: data.user, session: data.session };
}

export async function signInWithEmailPassword(email: string, password: string) {
  if (!supabase) {
    return { ok: false, mode: 'error' as const, message: 'Authentication service is not available. Please refresh the page and try again.', user: null, session: null };
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return { ok: false, mode: 'supabase' as const, message: error.message, user: null, session: null };

  // Record audit log for email signin
  if (data.user) {
    await recordAuditLog({
      userId: data.user.id,
      wallet: data.user.user_metadata?.wallet ?? null,
      email: data.user.email ?? email,
      eventType: 'user_login',
      metadata: { provider: 'email' },
    });
  }

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
    return { ok: false, mode: 'error' as const, message: 'Authentication service is not available. Please refresh the page and try again.' };
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
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

  // Explicitly trigger the browser redirection on Web if the Supabase client skipped it
  if (data?.url) {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.location.href = data.url;
    } else {
      const { openURL } = require('expo-linking');
      openURL(data.url).catch((err) => console.error('Failed to open Google OAuth URL:', err));
    }
  }

  return { ok: true, mode: 'supabase' as const, message: 'Google secure signup opened.' };
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
