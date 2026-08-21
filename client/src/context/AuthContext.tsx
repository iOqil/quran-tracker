import React, { createContext, useContext, useState, useEffect } from 'react';
import type { UserSession } from '../types';

interface AuthContextType {
  currentUser: UserSession | null;
  setCurrentUser: (user: UserSession | null) => void;
  logout: () => void;
  adminMode: boolean;
  setAdminMode: (mode: boolean) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserSession | null>(() => {
    const saved = localStorage.getItem('userSession');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse user session', e);
      }
    }
    return null;
  });

  const [adminMode, setAdminMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('userSession');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.role === 'admin';
      } catch {}
    }
    return false;
  });

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    return (saved as 'light' | 'dark') || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', next);
      return next;
    });
  };

  const logout = () => {
    localStorage.removeItem('userSession');
    setCurrentUser(null);
    setAdminMode(false);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        logout,
        adminMode,
        setAdminMode,
        theme,
        toggleTheme
      }}
    >
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
