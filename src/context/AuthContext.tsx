import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, WebsiteSettings } from '../types.js';
import { api, authStorage } from '../services/api.js';
import { loginWithGoogle, firebaseSignOut } from '../lib/firebase.js';

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
  login: (payload: { username: string; password: string }) => Promise<void>;
  loginWithGoogleAccount: (referralCode?: string) => Promise<void>;
  register: (payload: {
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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [settings, setSettings] = useState<WebsiteSettings | null>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const refreshSettings = useCallback(async () => {
    try {
      const res = await api.settings.getPublic();
      setSettings(res.settings);
    } catch (e) {
      console.error('Failed to load site settings', e);
    }
  }, []);

  const refreshUnreadCount = useCallback(async () => {
    try {
      if (authStorage.getToken()) {
        const res = await api.notifications.getAll();
        const unread = res.notifications.filter(n => !n.isRead).length;
        setUnreadCount(unread);
      } else {
        setUnreadCount(0);
      }
    } catch {
      // ignore
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const token = authStorage.getToken();
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const freshUser = await api.auth.getMe();
      setUser(freshUser);
      refreshUnreadCount();
    } catch (e) {
      console.warn('Session expired or invalid token', e);
      authStorage.clear();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [refreshUnreadCount]);

  useEffect(() => {
    const token = authStorage.getToken();
    if (token) {
      refreshUser();
    } else {
      // Auto-load Shakib profile for regular demo user experience if no session
      api.auth.login({ username: 'shakib75', password: 'password123' })
        .then(res => {
          setUser(res.user);
          setIsLoading(false);
          refreshUnreadCount();
        })
        .catch(() => {
          setIsLoading(false);
        });
    }
    refreshSettings();
  }, [refreshUser, refreshSettings, refreshUnreadCount]);

  const login = async (payload: { username: string; password: string }) => {
    setIsLoading(true);
    try {
      const res = await api.auth.login(payload);
      setUser(res.user);
      await refreshUnreadCount();
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogleAccount = async (referralCode?: string) => {
    setIsLoading(true);
    try {
      const googleData = await loginWithGoogle();
      const res = await api.auth.firebaseLogin({
        email: googleData.email,
        displayName: googleData.displayName,
        firebaseUid: googleData.uid,
        emailVerified: googleData.emailVerified,
        referralCode
      });
      setUser(res.user);
      await refreshUnreadCount();
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: {
    fullName: string;
    username: string;
    mobile: string;
    password: string;
    confirmPassword: string;
    referralCode?: string;
  }) => {
    setIsLoading(true);
    try {
      const res = await api.auth.register(payload);
      setUser(res.user);
      await refreshUnreadCount();
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    api.auth.logout();
    firebaseSignOut();
    setUser(null);
    setUnreadCount(0);
  };

  // Strictly check that user is admin AND has the authorized email
  const isAuthenticated = !!user;
  const isAdmin = Boolean(
    user && 
    user.role === 'admin' && 
    (user.email || '').toLowerCase().trim() === AUTHORIZED_ADMIN_EMAIL
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

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
