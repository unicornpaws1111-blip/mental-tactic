import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { api, authStorage } from '../services/api';
import { getFirebaseAuthInstance } from '../services/firebase';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  hasAdmin: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (credentials: { email: string; username: string; password: string }) => Promise<void>;
  loginWithGoogle: (credential: string, fallbackUser?: User) => Promise<void>;
  setupAdmin: (credentials: { email: string; username?: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasAdmin, setHasAdmin] = useState<boolean>(true);

  const isAdmin = Boolean(user && (user.role === 'admin' || user.id === 'admin-master'));

  const refreshStatus = async () => {
    try {
      setIsLoading(true);
      let status: any = null;
      try {
        status = await api.getAuthStatus();
      } catch {
        status = null;
      }

      if (status && status.isAuthenticated && status.user) {
        setHasAdmin(status.hasAdmin ?? true);
        setIsAuthenticated(true);
        setUser(status.user);
        return;
      }

      // Check client-side Firebase Auth state (e.g. on Firebase Hosting deployment)
      const auth = getFirebaseAuthInstance();
      if (auth && auth.currentUser) {
        const fbUser = auth.currentUser;
        setUser({
          id: fbUser.uid,
          email: fbUser.email || '',
          username: fbUser.displayName || (fbUser.email ? fbUser.email.split('@')[0] : 'Member'),
          avatar: fbUser.photoURL || '',
          role: (fbUser.email && fbUser.email.toLowerCase() === 'admin@mentaltactic.com' ? 'admin' : 'member'),
        });
        setIsAuthenticated(true);
        return;
      }

      setIsAuthenticated(false);
      setUser(null);
    } catch {
      // Graceful fallback: unauthenticated user
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshStatus();

    const auth = getFirebaseAuthInstance();
    if (auth) {
      const unsubscribe = auth.onAuthStateChanged((fbUser) => {
        if (fbUser) {
          setUser((prev) => {
            if (prev) return prev;
            return {
              id: fbUser.uid,
              email: fbUser.email || '',
              username: fbUser.displayName || (fbUser.email ? fbUser.email.split('@')[0] : 'Member'),
              avatar: fbUser.photoURL || '',
              role: (fbUser.email && fbUser.email.toLowerCase() === 'admin@mentaltactic.com' ? 'admin' : 'member'),
            };
          });
          setIsAuthenticated(true);
        }
      });
      return () => unsubscribe();
    }
  }, []);

  const login = async (credentials: { email: string; password: string }) => {
    const res = await api.login(credentials);
    setUser(res.user);
    setIsAuthenticated(true);
    setHasAdmin(true);
  };

  const register = async (credentials: { email: string; username: string; password: string }) => {
    const res = await api.register(credentials);
    setUser(res.user);
    setIsAuthenticated(true);
  };

  const loginWithGoogle = async (credential: string, fallbackUser?: User) => {
    // If authenticated via client-side Firebase (fallbackUser provided), activate session immediately
    if (fallbackUser) {
      if (credential) {
        authStorage.setToken(credential);
      }
      setUser(fallbackUser);
      setIsAuthenticated(true);

      // Best-effort sync with backend if available (e.g. in local dev or Cloud Run)
      try {
        const res = await api.loginWithGoogle(credential);
        if (res && typeof res === 'object' && 'user' in res && res.user) {
          setUser(res.user);
        }
      } catch {
        // Backend unavailable; client-side Firebase session remains fully valid
      }
      return;
    }

    // Direct backend-only login path
    let res: { token: string; user: User } | null = null;
    try {
      res = await api.loginWithGoogle(credential);
    } catch (err) {
      console.warn('Backend loginWithGoogle unavailable:', err);
    }

    if (res && typeof res === 'object' && 'user' in res && res.user) {
      authStorage.setToken(res.token);
      setUser(res.user);
      setIsAuthenticated(true);
      return;
    }

    throw new Error('Authentication failed: no session could be established.');
  };

  const setupAdmin = async (credentials: { email: string; username?: string; password: string }) => {
    const res = await api.setupAdmin(credentials);
    setUser(res.user);
    setIsAuthenticated(true);
    setHasAdmin(true);
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      // Backend may be offline
    }
    try {
      const auth = getFirebaseAuthInstance();
      if (auth) {
        await auth.signOut();
      }
    } catch {
      // Ignore
    }
    authStorage.clearToken();
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isAdmin,
        isLoading,
        hasAdmin,
        login,
        register,
        loginWithGoogle,
        setupAdmin,
        logout,
        refreshStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

