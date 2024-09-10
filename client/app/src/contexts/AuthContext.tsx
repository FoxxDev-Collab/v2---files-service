// client/src/contexts/AuthContext.tsx

import React, { createContext, useState, useContext, useEffect } from 'react';
import { setToken, getToken, removeToken, isAuthenticated as checkIsAuthenticated } from '../utils/auth';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    setIsAuth(checkIsAuthenticated());
  }, []);

  const login = (token: string) => {
    setToken(token);
    setIsAuth(true);
  };

  const logout = () => {
    removeToken();
    setIsAuth(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated: isAuth, login, logout }}>
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