import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { authApi } from '@/services/api.service';

interface Admin {
  id: string;
  email: string;
  name: string;
}

interface AuthContextType {
  admin: Admin | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  
  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setIsLoading(false);
        return;
      }
      
      const response = await authApi.getProfile();
      if (response.success) {
        setAdmin(response.admin);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('authToken');
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    checkAuth();
  }, []);
  
  const login = async (email: string, password: string) => {
    const response = await authApi.login({ email, password });
    if (response.success) {
      setAdmin(response.admin);
    }
  };
  
  const logout = () => {
    authApi.logout();
    setAdmin(null);
    router.push('/admin/login');
  };
  
  const value = {
    admin,
    isLoading,
    isAuthenticated: !!admin,
    login,
    logout,
    checkAuth,
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};