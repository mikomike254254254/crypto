import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ImageSourcePropType } from 'react-native';
import { CARTOON_AVATARS } from '@/constants/brand';
import { createRippleWalletAddress } from '@/lib/wallet';
import { supabase, loadUserProfile } from '@/lib/supabase';

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
  wallet: 'rWallexDemoXRP9s7Q8m5P2t4K6n3B1a',
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

export function UserProvider({ children }: { children: ReactNode }) {
  const [profile, setProfileState] = useState<UserProfile>(DEFAULT_PROFILE);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // On mount: check if there is an existing Supabase session and restore profile
  useEffect(() => {
    let mounted = true;

    async function restoreSession() {
      if (!supabase) {
        setIsLoadingAuth(false);
        return;
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
        setProfileState(DEFAULT_PROFILE);
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

    setProfileState((prev) => ({
      ...prev,
      name,
      email,
      wallet,
      avatarUri,
      kycStatus,
      authProvider: 'email',
      passwordSet: true,
      isOnboarded: true,
      supabaseId: user.id,
    }));
  }

  const setProfile = (updates: Partial<UserProfile>) => {
    setProfileState((prev) => ({ ...prev, ...updates }));
  };

  const completeOnboarding = (
    name: string,
    email: string,
    avatarUri: string | null,
    password?: string,
    provider: UserProfile['authProvider'] = 'email',
  ) => {
    const wallet = createRippleWalletAddress(email, name);

    setProfileState((prev) => ({
      ...prev,
      name,
      email,
      wallet,
      avatarUri,
      authProvider: provider,
      passwordSet: Boolean(password && password.length >= 8),
      isOnboarded: true,
    }));

    return wallet;
  };

  const submitKyc = (personalInfo: UserProfile['personalInfo'], idType: string) => {
    setProfileState((prev) => ({
      ...prev,
      personalInfo,
      kycDocuments: {
        ...prev.kycDocuments,
        idType,
      },
      kycStatus: 'pending',
      kycSubmittedAt: new Date(),
    }));
  };

  const uploadDocument = (doc: 'frontUploaded' | 'backUploaded' | 'selfieUploaded') => {
    setProfileState((prev) => ({
      ...prev,
      kycDocuments: {
        ...prev.kycDocuments,
        [doc]: true,
      },
    }));
  };

  const setSecurity = (updates: Partial<UserProfile['security']>) => {
    setProfileState((prev) => ({
      ...prev,
      security: {
        ...prev.security,
        ...updates,
      },
    }));
  };

  const signOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setProfileState(DEFAULT_PROFILE);
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
