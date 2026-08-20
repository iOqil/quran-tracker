import React, { createContext, useContext, useState, useEffect } from 'react';
import type { UserSession } from '../types';

interface AuthContextType {
  currentUser: UserSession | null;
  setCurrentUser: (user: UserSession | null) => void;
  logout: () => void;
  adminMode: boolean;
  setAdminMode: (mode: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [adminMode, setAdminMode] = useState<boolean>(false);

  useEffect(() => {
    const saved = localStorage.getItem('userSession');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCurrentUser(parsed);
        if (parsed.role === 'admin') {
          setAdminMode(true);
        }
      } catch (e) {
        console.error('Failed to parse user session', e);
      }
    }
  }, []);

  const logout = () => {
    localStorage.removeItem('userSession');
    setCurrentUser(null);
    setAdminMode(false);
  };

  return (
    <AuthContext.Provider value={{ currentUser, setCurrentUser, logout, adminMode, setAdminMode }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
