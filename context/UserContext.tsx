import { createContext, useContext, useState, ReactNode } from 'react';
import { ImageSourcePropType } from 'react-native';
import { CARTOON_AVATARS } from '@/constants/brand';
import { createRippleWalletAddress } from '@/lib/wallet';

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
};

interface UserContextType {
  profile: UserProfile;
  setProfile: (updates: Partial<UserProfile>) => void;
  completeOnboarding: (name: string, email: string, avatarUri: string | null, password?: string, provider?: UserProfile['authProvider']) => string;
  submitKyc: (personalInfo: UserProfile['personalInfo'], idType: string) => void;
  uploadDocument: (doc: 'frontUploaded' | 'backUploaded' | 'selfieUploaded') => void;
  setSecurity: (updates: Partial<UserProfile['security']>) => void;
}

const UserContext = createContext<UserContextType>({
  profile: DEFAULT_PROFILE,
  setProfile: () => {},
  completeOnboarding: () => DEFAULT_PROFILE.wallet,
  submitKyc: () => {},
  uploadDocument: () => {},
  setSecurity: () => {},
});

export function UserProvider({ children }: { children: ReactNode }) {
  const [profile, setProfileState] = useState<UserProfile>(DEFAULT_PROFILE);

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

  return (
    <UserContext.Provider value={{ profile, setProfile, completeOnboarding, submitKyc, uploadDocument, setSecurity }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
