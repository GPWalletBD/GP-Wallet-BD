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
  db,
  loginWithGoogle,
  loginWithEmail,
  registerWithEmail,
  firebaseSignOut
} from '../lib/firebase.js';

import { onAuthStateChanged } from 'firebase/auth';

import {
  doc,
  getDoc,
  setDoc
} from 'firebase/firestore';

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
    balance: profile.balance ?? 0,
    totalEarnings: profile.totalEarnings ?? 0,
    completedTasksCount: profile.completedTasksCount ?? 0,
    pendingTasksCount: profile.pendingTasksCount ?? 0,
    referralCode: profile.referralCode || firebaseUser.uid.slice(0, 8).toUpperCase(),
    referredBy: profile.referredBy || '',
    totalInvited: profile.totalInvited ?? 0,
    totalSuccessfulReferrals: profile.totalSuccessfulReferrals ?? 0,
    role: email === AUTHORIZED_ADMIN_EMAIL ? 'admin' : 'user',
    status: profile.status || 'active',
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

  // Load user profile from Firestore
  const refreshUser = useCallback(async () => {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      setUser(null);
      return;
    }

    const userRef = doc(db, 'users', currentUser.uid);
    const snapshot = await getDoc(userRef);

    let profile: any;

    if (snapshot.exists()) {
      profile = snapshot.data();
    } else {
      // Create a basic profile for a new Google or existing account
      profile = {
        fullName: currentUser.displayName || currentUser.email?.split('@')[0] || 'User',
        username: currentUser.email?.split('@')[0] || currentUser.uid.slice(0, 8),
        mobile: '',
        referralCode: currentUser.uid.slice(0, 8).toUpperCase(),
        referredBy: '',
        balance: 0,
        totalEarnings: 0,
        completedTasksCount: 0,
        pendingTasksCount: 0,
        totalInvited: 0,
        totalSuccessfulReferrals: 0,
        status: 'active',
        createdAt: new Date().toISOString()
      };

      await setDoc(userRef, profile);
    }

    setUser(createUser(currentUser, profile));
  }, []);

  useEffect(() => {
    refreshSettings();

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          await refreshUser();
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('User profile loading failed:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
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

      const userRef = doc(db, 'users', result.uid);
      const snapshot = await getDoc(userRef);

      if (!snapshot.exists()) {
        await setDoc(userRef, {
          fullName: result.displayName,
          username: result.email.split('@')[0],
          mobile: '',
          referralCode: result.uid.slice(0, 8).toUpperCase(),
          referredBy: referralCode || '',
          balance: 0,
          totalEarnings: 0,
          completedTasksCount: 0,
          pendingTasksCount: 0,
          totalInvited: 0,
          totalSuccessfulReferrals: 0,
          status: 'active',
          createdAt: new Date().toISOString()
        });
      }

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

      const userRef = doc(db, 'users', result.uid);

      const profile = {
        fullName: payload.fullName.trim(),
        username: payload.username.trim(),
        mobile: payload.mobile.trim(),
        referralCode: result.uid.slice(0, 8).toUpperCase(),
        referredBy: payload.referralCode?.trim() || '',
        balance: 0,
        totalEarnings: 0,
        completedTasksCount: 0,
        pendingTasksCount: 0,
        totalInvited: 0,
        totalSuccessfulReferrals: 0,
        status: 'active',
        createdAt: new Date().toISOString()
      };

      await setDoc(userRef, profile);
      await refreshUser();
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    firebaseSignOut().catch((error) => {
      console.error('Logout failed:', error);
    });

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
