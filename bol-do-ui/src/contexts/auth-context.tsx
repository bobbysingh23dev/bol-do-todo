import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { api, setAuthToken } from '@/lib/api';
import { clearAccessToken, getAccessToken, saveAccessToken } from '@/lib/auth-storage';
import type { AuthResponse, LoginInput, SignupInput, User } from '@/types/auth';

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (input: LoginInput) => Promise<void>;
  signup: (input: SignupInput) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setSession: (token: string, user: User) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const setSession = useCallback(async (token: string, nextUser: User) => {
    await saveAccessToken(token);
    setAuthToken(token);
    setUser(nextUser);
  }, []);

  const logout = useCallback(async () => {
    await clearAccessToken();
    setAuthToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const token = await getAccessToken();

    if (!token) {
      setAuthToken(null);
      setUser(null);
      return;
    }

    setAuthToken(token);

    try {
      const { user: currentUser } = await api.getMe();
      setUser(currentUser);
    } catch {
      await logout();
    }
  }, [logout]);

  useEffect(() => {
    void (async () => {
      try {
        await refreshUser();
      } finally {
        setIsLoading(false);
      }
    })();
  }, [refreshUser]);

  const login = useCallback(
    async (input: LoginInput) => {
      const response = await api.login(input);

      if (!response.token || !response.user) {
        throw new Error(response.message);
      }

      await setSession(response.token, response.user);
    },
    [setSession],
  );

  const signup = useCallback(async (input: SignupInput) => {
    return api.signup(input);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: Boolean(user),
      login,
      signup,
      logout,
      refreshUser,
      setSession,
    }),
    [user, isLoading, login, signup, logout, refreshUser, setSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
