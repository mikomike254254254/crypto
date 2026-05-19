import { createContext, useContext, useState, ReactNode } from 'react';
import { ImageSourcePropType } from 'react-native';
import { CARTOON_AVATARS } from '@/constants/brand';

export interface UserProfile {
  name: string;
  email: string;
  wallet: string;
  avatar: ImageSourcePropType | null;
  avatarUri: string | null;
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
  isOnboarded: boolean;
}

const DEFAULT_PROFILE: UserProfile = {
  name: '',
  email: '',
  wallet: 'wallex-demo-wallet',
  avatar: null,
  avatarUri: CARTOON_AVATARS[0].uri,
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
  isOnboarded: false,
};

interface UserContextType {
  profile: UserProfile;
  setProfile: (updates: Partial<UserProfile>) => void;
  completeOnboarding: (name: string, email: string, avatarUri: string | null) => void;
  submitKyc: (personalInfo: UserProfile['personalInfo'], idType: string) => void;
  uploadDocument: (doc: 'frontUploaded' | 'backUploaded' | 'selfieUploaded') => void;
}

const UserContext = createContext<UserContextType>({
  profile: DEFAULT_PROFILE,
  setProfile: () => {},
  completeOnboarding: () => {},
  submitKyc: () => {},
  uploadDocument: () => {},
});

export function UserProvider({ children }: { children: ReactNode }) {
  const [profile, setProfileState] = useState<UserProfile>(DEFAULT_PROFILE);

  const setProfile = (updates: Partial<UserProfile>) => {
    setProfileState((prev) => ({ ...prev, ...updates }));
  };

  const completeOnboarding = (name: string, email: string, avatarUri: string | null) => {
    const walletSlug = email
      .split('@')[0]
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 18) || 'member';

    setProfileState((prev) => ({
      ...prev,
      name,
      email,
      wallet: `wallex-${walletSlug}`,
      avatarUri,
      isOnboarded: true,
    }));
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

  return (
    <UserContext.Provider value={{ profile, setProfile, completeOnboarding, submitKyc, uploadDocument }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
