import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ImageSourcePropType, Platform } from 'react-native';
import { CARTOON_AVATARS } from '@/constants/brand';
import { createRippleWalletAddress } from '@/lib/wallet';
import { supabase, loadUserProfile, recordAuditLog } from '@/lib/supabase';

let loggedInThisSession = false;

export interface UserProfile {
  name: string;
  email: string;
  wallet: string;
  avatar: ImageSourcePropType | null;
  avatarUri: string | null;
  authProvider: 'email' | 'google' | 'local';
  passwordSet: boolean;
  kycStatus: 'unverified' | 'pending' | 'verified' | 'rejected';
  kycSubmittedAt: Date | null;
  kycDocuments: {
    idType: string | null;
    frontUploaded: boolean;
    backUploaded: boolean;
    selfieUploaded: boolean;
  };
  personalInfo: {
    firstName: string;
    lastName: string;
    dob: string;
    nationality: string;
    address: string;
    city: string;
    zip: string;
  };
  security: {
    pinEnabled: boolean;
    pinSetAt: Date | null;
    twoFactorEnabled: boolean;
    biometricEnabled: boolean;
  };
  isOnboarded: boolean;
  supabaseId: string | null;
}

const DEFAULT_PROFILE: UserProfile = {
  name: '',
  email: '',
  wallet: '',
  avatar: null,
  avatarUri: CARTOON_AVATARS[0].uri,
  authProvider: 'local',
  passwordSet: false,
  kycStatus: 'unverified',
  kycSubmittedAt: null,
  kycDocuments: {
    idType: null,
    frontUploaded: false,
    backUploaded: false,
    selfieUploaded: false,
  },
  personalInfo: {
    firstName: '',
    lastName: '',
    dob: '',
    nationality: '',
    address: '',
    city: '',
    zip: '',
  },
  security: {
    pinEnabled: false,
    pinSetAt: null,
    twoFactorEnabled: false,
    biometricEnabled: false,
  },
  isOnboarded: false,
  supabaseId: null,
};

interface UserContextType {
  profile: UserProfile;
  setProfile: (updates: Partial<UserProfile>) => void;
  completeOnboarding: (name: string, email: string, avatarUri: string | null, password?: string, provider?: UserProfile['authProvider']) => string;
  submitKyc: (personalInfo: UserProfile['personalInfo'], idType: string) => void;
  uploadDocument: (doc: 'frontUploaded' | 'backUploaded' | 'selfieUploaded') => void;
  setSecurity: (updates: Partial<UserProfile['security']>) => void;
  signOut: () => Promise<void>;
  isLoadingAuth: boolean;
}

const UserContext = createContext<UserContextType>({
  profile: DEFAULT_PROFILE,
  setProfile: () => {},
  completeOnboarding: () => DEFAULT_PROFILE.wallet,
  submitKyc: () => {},
  uploadDocument: () => {},
  setSecurity: () => {},
  signOut: async () => {},
  isLoadingAuth: false,
});

const isWeb = Platform.OS === 'web';

function saveLocalProfile(prof: UserProfile) {
  try {
    if (isWeb && typeof window !== 'undefined') {
      window.localStorage.setItem('wallex_profile', JSON.stringify(prof));
    }
  } catch (err) {
    console.error('Failed to save profile locally:', err);
  }
}

function getLocalProfile(): UserProfile | null {
  try {
    if (isWeb && typeof window !== 'undefined') {
      const data = window.localStorage.getItem('wallex_profile');
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed.kycSubmittedAt) parsed.kycSubmittedAt = new Date(parsed.kycSubmittedAt);
        if (parsed.security?.pinSetAt) parsed.security.pinSetAt = new Date(parsed.security.pinSetAt);
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to load profile locally:', err);
  }
  return null;
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [profile, setProfileState] = useState<UserProfile>(() => {
    const local = getLocalProfile();
    return local || DEFAULT_PROFILE;
  });
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // On mount: check if there is an existing Supabase session and restore profile
  useEffect(() => {
    let mounted = true;

    async function restoreSession() {
      if (!supabase) {
        setIsLoadingAuth(false);
        return;
      }

      // 1. Manually parse URL hash/query params on mount to capture Google OAuth redirect
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        const hash = window.location.hash;
        const search = window.location.search;
        let accessToken = '';
        let refreshToken = '';

        if (hash && hash.includes('access_token=')) {
          const params = new URLSearchParams(hash.substring(1));
          accessToken = params.get('access_token') || '';
          refreshToken = params.get('refresh_token') || '';
        } else if (search && search.includes('access_token=')) {
          const params = new URLSearchParams(search);
          accessToken = params.get('access_token') || '';
          refreshToken = params.get('refresh_token') || '';
        }

        if (accessToken && refreshToken) {
          try {
            await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            // Clean up the address bar
            if (window.history.pushState) {
              window.history.pushState('', document.title, window.location.pathname);
            } else {
              window.location.hash = '';
            }
          } catch (e) {
            console.error('Failed to manually parse/set Supabase OAuth session:', e);
          }
        }
      }

      const { data } = await supabase.auth.getSession();
      const session = data.session;

      if (session?.user && mounted) {
        await hydrateProfileFromSupabase(session.user);
      }

      if (mounted) setIsLoadingAuth(false);
    }

    restoreSession();

    // Listen to auth state changes (sign in, sign out, token refresh)
    const { data: listener } = supabase?.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      if (event === 'SIGNED_IN' && session?.user) {
        await hydrateProfileFromSupabase(session.user);
      }
      if (event === 'SIGNED_OUT') {
        loggedInThisSession = false;
        setProfileState(DEFAULT_PROFILE);
        try {
          if (isWeb && typeof window !== 'undefined') {
            window.localStorage.removeItem('wallex_profile');
          }
        } catch (e) {}
      }
    }) ?? { data: { subscription: null } };

    return () => {
      mounted = false;
      listener?.subscription?.unsubscribe();
    };
  }, []);

  async function hydrateProfileFromSupabase(user: { id: string; email?: string; user_metadata?: Record<string, string> }) {
    const dbProfile = await loadUserProfile(user.id);

    const name = dbProfile?.full_name ?? user.user_metadata?.full_name ?? '';
    const email = dbProfile?.email ?? user.email ?? '';
    const wallet = dbProfile?.wallet ?? user.user_metadata?.wallet ?? createRippleWalletAddress(email, name);
    const avatarUri = dbProfile?.avatar_url ?? user.user_metadata?.avatar_url ?? CARTOON_AVATARS[0].uri;
    const kycStatus = (dbProfile?.kyc_status ?? 'unverified') as UserProfile['kycStatus'];

    setProfileState((prev) => {
      const updated = {
        ...prev,
        name,
        email,
        wallet,
        avatarUri,
        kycStatus,
        authProvider: 'email' as const,
        passwordSet: true,
        isOnboarded: true,
        supabaseId: user.id,
      };
      saveLocalProfile(updated);
      return updated;
    });

    // Audit Log: user_login triggered exactly once per session
    if (!loggedInThisSession) {
      loggedInThisSession = true;
      recordAuditLog({
        userId: user.id,
        wallet: wallet,
        email: email,
        eventType: 'user_login',
        metadata: { source: 'session_hydration' }
      }).catch((err) => console.error('Failed to write audit log:', err));
    }
  }

  const setProfile = (updates: Partial<UserProfile>) => {
    setProfileState((prev) => {
      const updated = { ...prev, ...updates };
      saveLocalProfile(updated);
      return updated;
    });
  };

  const completeOnboarding = (
    name: string,
    email: string,
    avatarUri: string | null,
    password?: string,
    provider: UserProfile['authProvider'] = 'email',
  ) => {
    const wallet = createRippleWalletAddress(email, name);

    setProfileState((prev) => {
      const updated = {
        ...prev,
        name,
        email,
        wallet,
        avatarUri,
        authProvider: provider,
        passwordSet: Boolean(password && password.length >= 8),
        isOnboarded: true,
      };
      saveLocalProfile(updated);
      return updated;
    });

    return wallet;
  };

  const submitKyc = (personalInfo: UserProfile['personalInfo'], idType: string) => {
    setProfileState((prev) => {
      const updated = {
        ...prev,
        personalInfo,
        kycDocuments: {
          ...prev.kycDocuments,
          idType,
        },
        kycStatus: 'pending' as const,
        kycSubmittedAt: new Date(),
      };
      saveLocalProfile(updated);
      return updated;
    });
  };

  const uploadDocument = (doc: 'frontUploaded' | 'backUploaded' | 'selfieUploaded') => {
    setProfileState((prev) => {
      const updated = {
        ...prev,
        kycDocuments: {
          ...prev.kycDocuments,
          [doc]: true,
        },
      };
      saveLocalProfile(updated);
      return updated;
    });
  };

  const setSecurity = (updates: Partial<UserProfile['security']>) => {
    setProfileState((prev) => {
      const updated = {
        ...prev,
        security: {
          ...prev.security,
          ...updates,
        },
      };
      saveLocalProfile(updated);
      return updated;
    });
  };

  const signOut = async () => {
    if (supabase) {
      const currentUserId = profile.supabaseId;
      const currentWallet = profile.wallet;
      const currentEmail = profile.email;

      await recordAuditLog({
        userId: currentUserId,
        wallet: currentWallet,
        email: currentEmail,
        eventType: 'user_logout',
        metadata: { manual: true }
      }).catch((err) => console.error('Failed to write audit log:', err));

      await supabase.auth.signOut();
    }
    loggedInThisSession = false;
    setProfileState(DEFAULT_PROFILE);
    try {
      if (isWeb && typeof window !== 'undefined') {
        window.localStorage.removeItem('wallex_profile');
      }
    } catch (e) {}
  };

  return (
    <UserContext.Provider value={{ profile, setProfile, completeOnboarding, submitKyc, uploadDocument, setSecurity, signOut, isLoadingAuth }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
