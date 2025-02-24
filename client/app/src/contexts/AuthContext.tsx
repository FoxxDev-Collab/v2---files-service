import React, { createContext, useState, useContext, useEffect } from 'react';
import { setToken, getToken, removeToken } from '../utils/auth';
import api from '../utils/api';

export interface User {
  id: number;  // Changed from string to number
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  timezone: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
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
      console.log('Fetched user:', response.data);
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

  const updateUser = (updatedUser: Partial<User>) => {
    setUser(prevUser => prevUser ? { ...prevUser, ...updatedUser } : null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, updateUser }}>
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