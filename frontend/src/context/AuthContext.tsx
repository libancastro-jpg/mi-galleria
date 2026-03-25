import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
  useMemo,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';
import { Platform } from 'react-native';

interface User {
  id: string;
  telefono: string;
  email?: string;
  nombre?: string;
  created_at: string;
  plan?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (telefono: string, pin: string) => Promise<void>;
  register: (telefono: string, pin: string, email?: string, nombre?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: { email?: string; nombre?: string }) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_TOKEN_KEY = 'auth_token';
const AUTH_USER_KEY = 'auth_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  const applyAuthState = useCallback((nextToken: string | null, nextUser: User | null) => {
    api.setToken(nextToken);
    setToken(nextToken);
    setUser(nextUser);
  }, []);

  const forceLogout = useCallback(async () => {
    try {
      await clearStoredAuth();
    } finally {
      applyAuthState(null, null);
    }
  }, [applyAuthState, clearStoredAuth]);

  const persistAuth = useCallback(async (nextToken: string, nextUser: User) => {
    await AsyncStorage.multiSet([
      [AUTH_TOKEN_KEY, nextToken],
      [AUTH_USER_KEY, JSON.stringify(nextUser)],
    ]);
  }, []);

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

      try {
        const freshUser = await api.get('/auth/me', undefined, false);
        if (freshUser) {
          setUser(freshUser);
          await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(freshUser));
        }
      } catch (error: any) {
        if (
          String(error?.message || '').includes('401') ||
          String(error?.message || '').toLowerCase().includes('token') ||
          String(error?.message || '').toLowerCase().includes('autoriz')
        ) {
          await forceLogout();
        }
      }
    } catch (error) {
      console.error('Error loading auth:', error);
      await forceLogout();
    } finally {
      setIsLoading(false);
    }
  }, [applyAuthState, forceLogout]);

  useEffect(() => {
    api.setOnUnauthorized(forceLogout);
    loadStoredAuth();
  }, [forceLogout, loadStoredAuth]);

  const login = useCallback(async (telefono: string, pin: string) => {
    try {
      const response = await api.post('/auth/login', { telefono, pin });
      const accessToken = response?.access_token;
      const userData = response?.user;

      if (!accessToken || !userData) {
        throw new Error('Respuesta inválida del servidor');
      }

      await persistAuth(accessToken, userData);
      applyAuthState(accessToken, userData);
    } catch (error: any) {
      throw new Error(error.message || 'Error al iniciar sesión');
    }
  }, [applyAuthState, persistAuth]);

  const register = useCallback(
    async (telefono: string, pin: string, email?: string, nombre?: string) => {
      try {
        const response = await api.post('/auth/register', { telefono, pin, email, nombre });
        const accessToken = response?.access_token;
        const userData = response?.user;

        if (!accessToken || !userData) {
          throw new Error('Respuesta inválida del servidor');
        }

        await persistAuth(accessToken, userData);
        applyAuthState(accessToken, userData);
      } catch (error: any) {
        throw new Error(error.message || 'Error al registrarse');
      }
    },
    [applyAuthState, persistAuth]
  );

  const logout = useCallback(async () => {
    await forceLogout();
  }, [forceLogout]);

  const updateProfile = useCallback(
    async (data: { email?: string; nombre?: string }) => {
      try {
        const response = await api.put('/auth/profile', data);

        if (response?.user) {
          setUser(response.user);
          await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(response.user));
          return;
        }

        if (user) {
          const updatedUser = { ...user, ...data };
          setUser(updatedUser);
          await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(updatedUser));
        }
      } catch (error: any) {
        throw new Error(error.message || 'Error al actualizar perfil');
      }
    },
    [user]
  );

  const refreshUser = useCallback(async () => {
    try {
      const response = await api.get('/auth/me', undefined, false);
      if (response) {
        setUser(response);
        await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(response));
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  }, []);

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
    }),
    [user, token, isLoading, login, register, logout, updateProfile, refreshUser]
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