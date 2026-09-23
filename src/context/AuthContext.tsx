import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { DiscordUser, SystemStatus } from '../types';
import { api } from '../api/client';

interface AuthContextType {
  user: DiscordUser | null;
  loading: boolean;
  systemStatus: SystemStatus | null;
  loginWithDiscord: () => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  refreshSystemStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<DiscordUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);

  const refreshSystemStatus = useCallback(async () => {
    try {
      const status = await api.getSystemStatus();
      setSystemStatus(status);
    } catch (err) {
      console.error('[AuthContext] Failed to fetch system status:', err);
    }
  }, []);

  const refreshAuth = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getMe();
      if (res.authenticated && res.user) {
        setUser(res.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAuth();
    refreshSystemStatus();
  }, [refreshAuth, refreshSystemStatus]);

  // Listen for OAuth message from callback popup
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Validate origin is from AI Studio or localhost
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost') && !origin.includes('127.0.0.1')) {
        return;
      }
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        refreshAuth();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [refreshAuth]);

  const loginWithDiscord = async () => {
    try {
      const { url } = await api.getAuthUrl();
      const width = 600;
      const height = 750;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      const authWindow = window.open(
        url,
        'discord_oauth_popup',
        `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no`
      );

      if (!authWindow) {
        // Fallback if popup blocked
        window.location.href = url;
      }
    } catch (err: any) {
      console.error('[OAuth Popup Error]:', err);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await api.logout();
      setUser(null);
    } catch (err) {
      console.error('[Logout Error]:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        systemStatus,
        loginWithDiscord,
        logout,
        refreshAuth,
        refreshSystemStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
