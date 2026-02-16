import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';

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
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('auth_user');
    api.setToken(null);
    setToken(null);
    setUser(null);
  };

  const updateProfile = async (data: { email?: string; nombre?: string }) => {
    try {
      await api.put('/auth/profile', data);
      if (user) {
        const updatedUser = { ...user, ...data };
        setUser(updatedUser);
        await AsyncStorage.setItem('auth_user', JSON.stringify(updatedUser));
      }
    } catch (error: any) {
      throw new Error(error.message || 'Error al actualizar perfil');
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
