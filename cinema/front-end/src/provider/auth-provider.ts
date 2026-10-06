'use client';

import {
  createContext,
  createElement,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';

import type { User } from '@/types/auth';
import * as authApi from '@/lib/auth-api';

type RegisterPayload = Parameters<typeof authApi.register>[0];

interface AuthContextValue {
  user: User | null;
  isAuth: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (payload: RegisterPayload) => Promise<User>;
  loginWithGoogle: (idToken: string) => Promise<User>;
  logout: () => Promise<void>;
  refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const router = useRouter();

  const refetchUser = async () => {
    try {
      const currentUser = await authApi.fetchMe();
      setUser(currentUser);
    } catch {
      setUser(null);
    }
  };

  useEffect(() => {
    let cancelled = false;

    async function initAuth() {
      try {
        const currentUser = await authApi.fetchMe();
        if (!cancelled) {
          setUser(currentUser);
        }
      } catch {
        if (!cancelled) {
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void initAuth();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = async (email: string, password: string) => {
    const result = await authApi.login(email, password);
    setUser(result.user);
    return result.user;
  };

  const register = async (payload: RegisterPayload) => {
    const result = await authApi.register(payload);
    setUser(result.user);
    return result.user;
  };

  const loginWithGoogle = async (idToken: string) => {
    const result = await authApi.loginWithGoogle(idToken);
    setUser(result.user);
    return result.user;
  };

  const logout = async () => {
    await authApi.logout();
    setUser(null);
    router.push('/login');
  };

  const contextValue: AuthContextValue = {
    user,
    isLoading,
    isAuth: user !== null,
    login,
    register,
    loginWithGoogle,
    logout,
    refetchUser,
  };

  return createElement(AuthContext.Provider, { value: contextValue }, children);
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}