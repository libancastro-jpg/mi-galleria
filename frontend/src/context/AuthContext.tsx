import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';
import { Platform } from 'react-native';

interface User {
  id: string;
  telefono: string;
  email?: string;
  nombre?: string;
  created_at: string;
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('auth_token');
      const storedUser = await AsyncStorage.getItem('auth_user');
      
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        api.setToken(storedToken);
      }
    } catch (error) {
      console.error('Error loading auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (telefono: string, pin: string) => {
    try {
      const response = await api.post('/auth/login', { telefono, pin });
      const { access_token, user: userData } = response;
      
      await AsyncStorage.setItem('auth_token', access_token);
      await AsyncStorage.setItem('auth_user', JSON.stringify(userData));
      
      api.setToken(access_token);
      setToken(access_token);
      setUser(userData);
    } catch (error: any) {
      throw new Error(error.message || 'Error al iniciar sesión');
    }
  };

  const register = async (telefono: string, pin: string, email?: string, nombre?: string) => {
    try {
      const response = await api.post('/auth/register', { telefono, pin, email, nombre });
      const { access_token, user: userData } = response;
      
      await AsyncStorage.setItem('auth_token', access_token);
      await AsyncStorage.setItem('auth_user', JSON.stringify(userData));
      
      api.setToken(access_token);
      setToken(access_token);
      setUser(userData);
    } catch (error: any) {
      throw new Error(error.message || 'Error al registrarse');
    }
  };

  const logout = async () => {
    try {
      // Clear AsyncStorage
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('auth_user');
      
      // Clear API token
      api.setToken(null);
      
      // Clear state
      setToken(null);
      setUser(null);
      
      // For web, also clear localStorage directly
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        try {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_user');
          // Clear all AsyncStorage items for web
          const keys = Object.keys(localStorage);
          keys.forEach(key => {
            if (key.includes('auth') || key.includes('token') || key.includes('user')) {
              localStorage.removeItem(key);
            }
          });
        } catch (e) {
          console.log('Error clearing web storage:', e);
        }
      }
      
      console.log('Logout successful');
    } catch (error) {
      console.error('Error during logout:', error);
      // Force clear state even if storage fails
      setToken(null);
      setUser(null);
    }
  };

  const updateProfile = async (data: { email?: string; nombre?: string }) => {
    try {
      const response = await api.put('/auth/profile', data);
      if (response.user) {
        setUser(response.user);
        await AsyncStorage.setItem('auth_user', JSON.stringify(response.user));
      } else if (user) {
        const updatedUser = { ...user, ...data };
        setUser(updatedUser);
        await AsyncStorage.setItem('auth_user', JSON.stringify(updatedUser));
      }
    } catch (error: any) {
      throw new Error(error.message || 'Error al actualizar perfil');
    }
  };

  const refreshUser = async () => {
    try {
      const response = await api.get('/auth/me');
      if (response) {
        setUser(response);
        await AsyncStorage.setItem('auth_user', JSON.stringify(response));
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        login,
        register,
        logout,
        updateProfile,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
