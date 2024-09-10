// src/contexts/AuthContext.tsx

import React, { createContext, useState, useContext, useEffect } from 'react';
import { setToken, getToken, removeToken } from '../utils/auth';
import api from '../utils/api';

interface User {
  id: string;
  username: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const token = getToken();
    if (token) {
      fetchUser();
    }
  }, []);

  const fetchUser = async () => {
    try {
      const response = await api.get<User>('/auth/profile');
      console.log('Fetched user:', response.data); // Add this line
      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch user', error);
      removeToken();
    }
  };

  const login = async (token: string) => {
    setToken(token);
    await fetchUser();
  };

  const logout = () => {
    removeToken();
    setUser(null);
  };

  console.log('Current user:', user); // Add this line

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};