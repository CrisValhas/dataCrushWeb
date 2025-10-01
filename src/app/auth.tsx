import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { apiFetch, setAccessToken } from '../lib/api';

type User = { _id: string; email: string; displayName?: string } | null;

type AuthContextType = {
  user: User;
  loading: boolean;
  loginWithToken: (token: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    const token = localStorage.getItem('aw_access_token');
    if (token) setAccessToken(token);
    // Try refresh on first load if no token
    (async () => {
      try {
        if (!token) {
          const res = await apiFetch<{ accessToken: string }>('/auth/refresh', { method: 'POST' });
          if (res.data?.accessToken) {
            localStorage.setItem('aw_access_token', res.data.accessToken);
            setAccessToken(res.data.accessToken);
          }
        }
        const me = await apiFetch<any>('/me');
        // Ensure we expose an _id for downstream query scoping
        setUser({ ...me.data, _id: (me as any).data?.sub });
      } catch (_) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const loginWithToken = async (token: string) => {
    localStorage.setItem('aw_access_token', token);
    setAccessToken(token);
    const me = await apiFetch<any>('/me');
    setUser({ ...me.data, _id: (me as any).data?.sub });
    // Clear selected project and queries for a fresh session
    localStorage.removeItem('aw_project_id');
    window.dispatchEvent(new CustomEvent('aw:project:reset'));
    queryClient.clear();
  };

  const logout = async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } catch (_) {}
    localStorage.removeItem('aw_access_token');
    localStorage.removeItem('aw_project_id');
    setAccessToken('');
    setUser(null);
    window.dispatchEvent(new CustomEvent('aw:project:reset'));
    queryClient.clear();
  };

  const value = useMemo(() => ({ user, loading, loginWithToken, logout }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
