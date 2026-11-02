
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback
} from 'react';

import { User, WebsiteSettings } from '../types.js';
import { api } from '../services/api.js';

import {
  auth,
  loginWithGoogle,
  loginWithEmail,
  registerWithEmail,
  firebaseSignOut
} from '../lib/firebase.js';

import { onAuthStateChanged } from 'firebase/auth';

export const AUTHORIZED_ADMIN_EMAIL = 'supportteambd@gmail.com';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  settings: WebsiteSettings | null;
  unreadCount: number;
  refreshUser: () => Promise<void>;
  refreshSettings: () => Promise<void>;
  refreshUnreadCount: () => Promise<void>;
  login: (payload: { email: string; password: string }) => Promise<void>;
  loginWithGoogleAccount: (referralCode?: string) => Promise<void>;
  register: (payload: {
    email: string;
    fullName: string;
    username: string;
    mobile: string;
    password: string;
    confirmPassword: string;
    referralCode?: string;
  }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PROFILE_KEY = 'gp_wallet_user_profile';

function createUser(firebaseUser: any, profile: any = {}): User {
  const email = (firebaseUser.email || '').toLowerCase().trim();

  return {
    id: firebaseUser.uid,
    userId: firebaseUser.uid,
    firebaseUid: firebaseUser.uid,
    fullName: profile.fullName || firebaseUser.displayName || email.split('@')[0],
    username: profile.username || email.split('@')[0],
    mobile: profile.mobile || '',
    email,
    emailVerified: firebaseUser.emailVerified,
    balance: profile.balance || 0,
    totalEarnings: profile.totalEarnings || 0,
    completedTasksCount: profile.completedTasksCount || 0,
    pendingTasksCount: profile.pendingTasksCount || 0,
    referralCode: profile.referralCode || firebaseUser.uid.slice(0, 8).toUpperCase(),
    referredBy: profile.referredBy || '',
    totalInvited: profile.totalInvited || 0,
    totalSuccessfulReferrals: profile.totalSuccessfulReferrals || 0,
    role: email === AUTHORIZED_ADMIN_EMAIL ? 'admin' : 'user',
    status: 'active',
    createdAt: profile.createdAt || new Date().toISOString()
  };
}

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState<WebsiteSettings | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshSettings = useCallback(async () => {
    try {
      const result = await api.settings.getPublic();
      setSettings(result.settings);
    } catch (error) {
      console.warn('Settings could not be loaded:', error);
    }
  }, []);

  const refreshUnreadCount = useCallback(async () => {
    setUnreadCount(0);
  }, []);

  const refreshUser = useCallback(async () => {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      setUser(null);
      return;
    }

    let profile = {};

    try {
      const saved = localStorage.getItem(PROFILE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.uid === currentUser.uid) {
          profile = parsed;
        }
      }
    } catch {
      localStorage.removeItem(PROFILE_KEY);
    }

    setUser(createUser(currentUser, profile));
  }, []);

  useEffect(() => {
    refreshSettings();

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        await refreshUser();
      } else {
        setUser(null);
      }

      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [refreshSettings, refreshUser]);

  const login = async (payload: { email: string; password: string }) => {
    setIsLoading(true);

    try {
      await loginWithEmail(payload.email, payload.password);
      await refreshUser();
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogleAccount = async (referralCode?: string) => {
    setIsLoading(true);

    try {
      const result = await loginWithGoogle();

      const profile = {
        uid: result.uid,
        fullName: result.displayName,
        referralCode: referralCode || ''
      };

      localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
      await refreshUser();
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: {
    email: string;
    fullName: string;
    username: string;
    mobile: string;
    password: string;
    confirmPassword: string;
    referralCode?: string;
  }) => {
    if (payload.password !== payload.confirmPassword) {
      throw new Error('পাসওয়ার্ড দুটি মিলছে না।');
    }

    setIsLoading(true);

    try {
      const result = await registerWithEmail(
        payload.email,
        payload.password,
        payload.fullName
      );

      const profile = {
        uid: result.uid,
        fullName: payload.fullName,
        username: payload.username,
        mobile: payload.mobile,
        referralCode: payload.referralCode || '',
        createdAt: new Date().toISOString()
      };

      localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
      await refreshUser();
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem(PROFILE_KEY);
    firebaseSignOut();
    setUser(null);
    setUnreadCount(0);
  };

  const isAuthenticated = Boolean(user);

  const isAdmin = Boolean(
    user &&
    user.email?.toLowerCase().trim() === AUTHORIZED_ADMIN_EMAIL
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isAdmin,
        isLoading,
        settings,
        unreadCount,
        refreshUser,
        refreshSettings,
        refreshUnreadCount,
        login,
        loginWithGoogleAccount,
        register,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export { AuthProvider };

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};
