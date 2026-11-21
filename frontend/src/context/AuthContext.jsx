import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Support per-tab session isolation (sessionStorage) with localStorage fallback
  const [user, setUser] = useState(() => {
    const saved = sessionStorage.getItem('smarttask_user') || localStorage.getItem('smarttask_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => sessionStorage.getItem('smarttask_token') || localStorage.getItem('smarttask_token'));
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(() => localStorage.getItem('smarttask_theme') || 'dark');

  // Synchronize theme with HTML class
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('smarttask_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data.user);
          sessionStorage.setItem('smarttask_user', JSON.stringify(res.data.user));
          localStorage.setItem('smarttask_user', JSON.stringify(res.data.user));
        } catch (err) {
          logout();
        }
      }
      setLoading(false);
    };

    const handleLogoutEvent = () => logout();
    window.addEventListener('auth_logout', handleLogoutEvent);

    initAuth();
    return () => window.removeEventListener('auth_logout', handleLogoutEvent);
  }, [token]);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    setToken(res.data.token);
    setUser(res.data.user);
    // Store in both sessionStorage (per-tab) and localStorage
    sessionStorage.setItem('smarttask_token', res.data.token);
    sessionStorage.setItem('smarttask_user', JSON.stringify(res.data.user));
    localStorage.setItem('smarttask_token', res.data.token);
    localStorage.setItem('smarttask_user', JSON.stringify(res.data.user));
    return res.data.user;
  };

  const register = async (userData) => {
    const res = await api.post('/auth/register', userData);
    setToken(res.data.token);
    setUser(res.data.user);
    sessionStorage.setItem('smarttask_token', res.data.token);
    sessionStorage.setItem('smarttask_user', JSON.stringify(res.data.user));
    localStorage.setItem('smarttask_token', res.data.token);
    localStorage.setItem('smarttask_user', JSON.stringify(res.data.user));
    return res.data.user;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    sessionStorage.removeItem('smarttask_token');
    sessionStorage.removeItem('smarttask_user');
    localStorage.removeItem('smarttask_token');
    localStorage.removeItem('smarttask_user');
  };

  const updatePreferences = async (updates) => {
    const res = await api.put('/auth/preferences', updates);
    setUser(res.data.user);
    sessionStorage.setItem('smarttask_user', JSON.stringify(res.data.user));
    localStorage.setItem('smarttask_user', JSON.stringify(res.data.user));
    return res.data.user;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        theme,
        toggleTheme,
        login,
        register,
        logout,
        updatePreferences,
        isAdmin: user?.role === 'admin'
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
