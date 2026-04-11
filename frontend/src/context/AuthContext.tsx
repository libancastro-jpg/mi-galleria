import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, ApiError } from '../services/api';
import { Platform } from 'react-native';

interface User {
  id: string;
  telefono: string;
  email?: string;
  nombre?: string;
  created_at: string;
  plan?: string;
  premium_expires_at?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (telefono: string, pin: string) => Promise<void>;
  register: (
    firebaseIdToken: string,
    pin: string,
    email?: string,
    nombre?: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: { email?: string; nombre?: string }) => Promise<void>;
  refreshUser: () => Promise<void>;
  syncUserFromBackend: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_TOKEN_KEY = 'auth_token';
const AUTH_USER_KEY = 'auth_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshingRef = useRef(false);
  const tokenRef = useRef<string | null>(null);

  const clearStoredAuth = useCallback(async () => {
    try {
      await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, AUTH_USER_KEY]);

      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(AUTH_USER_KEY);
        sessionStorage.removeItem(AUTH_TOKEN_KEY);
        sessionStorage.removeItem(AUTH_USER_KEY);
      }
    } catch (e) {
      console.log('Error limpiando storage:', e);
    }
  }, []);

  const applyAuthState = useCallback(
    (nextToken: string | null, nextUser: User | null) => {
      tokenRef.current = nextToken;
      api.setToken(nextToken);
      setToken(nextToken);
      setUser(nextUser);
    },
    []
  );

  const persistUser = useCallback(async (nextUser: User) => {
    await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(nextUser));
  }, []);

  const persistAuth = useCallback(async (nextToken: string, nextUser: User) => {
    await AsyncStorage.multiSet([
      [AUTH_TOKEN_KEY, nextToken],
      [AUTH_USER_KEY, JSON.stringify(nextUser)],
    ]);
  }, []);

  const forceLogout = useCallback(async () => {
    try {
      await clearStoredAuth();
    } finally {
      applyAuthState(null, null);
    }
  }, [applyAuthState, clearStoredAuth]);

  const syncUserFromBackend = useCallback(async () => {
    if (refreshingRef.current) return;

    try {
      refreshingRef.current = true;

      const currentToken = tokenRef.current;
      if (!currentToken) return;

      api.setToken(currentToken);

      const response = await api.get('/auth/me');
      const freshUser = response?.data || response;

      if (freshUser) {
        applyAuthState(currentToken, freshUser);
        await persistUser(freshUser);
      }
    } catch (error: any) {
      const isUnauthorized =
        (error instanceof ApiError && error.status === 401) ||
        String(error?.message || '').includes('401') ||
        String(error?.message || '').toLowerCase().includes('token') ||
        String(error?.message || '').toLowerCase().includes('autoriz');
    
      if (isUnauthorized) {
        await forceLogout();
      }
    } finally {
      refreshingRef.current = false;
    }
  }, [applyAuthState, forceLogout, persistUser]);

  const loadStoredAuth = useCallback(async () => {
    try {
      const [[, storedToken], [, storedUser]] = await AsyncStorage.multiGet([
        AUTH_TOKEN_KEY,
        AUTH_USER_KEY,
      ]);

      if (!storedToken || !storedUser) {
        applyAuthState(null, null);
        return;
      }

      let parsedUser: User | null = null;

      try {
        parsedUser = JSON.parse(storedUser);
      } catch {
        await forceLogout();
        return;
      }

      applyAuthState(storedToken, parsedUser);
      await syncUserFromBackend();
    } catch (error) {
      console.error('Error loading auth:', error);
      await forceLogout();
    } finally {
      setIsLoading(false);
    }
  }, [applyAuthState, forceLogout, syncUserFromBackend]);

  useEffect(() => {
    api.setOnUnauthorized(forceLogout);
    loadStoredAuth();
  }, [forceLogout, loadStoredAuth]);

  const login = useCallback(
    async (telefono: string, pin: string) => {
      const response = await api.post('/auth/login', { telefono, pin });

      const accessToken = response?.access_token;
      const userData = response?.user;

      if (!accessToken || !userData) {
        throw new Error('Respuesta inválida del servidor');
      }

      await persistAuth(accessToken, userData);
      applyAuthState(accessToken, userData);
      await syncUserFromBackend();
    },
    [applyAuthState, persistAuth, syncUserFromBackend]
  );

  const register = useCallback(
    async (firebaseIdToken: string, pin: string, email?: string, nombre?: string) => {
      const response = await api.post('/auth/register', {
        firebase_id_token: firebaseIdToken,
        pin,
        email,
        nombre,
      });

      const accessToken = response?.access_token;
      const userData = response?.user;

      if (!accessToken || !userData) {
        throw new Error('Respuesta inválida del servidor');
      }

      await persistAuth(accessToken, userData);
      applyAuthState(accessToken, userData);
      await syncUserFromBackend();
    },
    [applyAuthState, persistAuth, syncUserFromBackend]
  );

  const logout = useCallback(async () => {
    await forceLogout();
  }, [forceLogout]);

  const updateProfile = useCallback(
    async (data: { email?: string; nombre?: string }) => {
      const response = await api.put('/auth/profile', data);

      if (response?.user) {
        setUser(response.user);
        await persistUser(response.user);
        return;
      }

      if (user) {
        const updatedUser = { ...user, ...data };
        setUser(updatedUser);
        await persistUser(updatedUser);
      }
    },
    [user, persistUser]
  );

  const refreshUser = useCallback(async () => {
    await syncUserFromBackend();
  }, [syncUserFromBackend]);

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: !!token,
      isLoading,
      login,
      register,
      logout,
      updateProfile,
      refreshUser,
      syncUserFromBackend,
    }),
    [
      user,
      token,
      isLoading,
      login,
      register,
      logout,
      updateProfile,
      refreshUser,
      syncUserFromBackend,
    ]
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