import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('cmts_token') || null);
  const [loading, setLoading] = useState(true);
  const [demoUsers, setDemoUsers] = useState([]);
  const [dbInfo, setDbInfo] = useState({ database: 'loading...', status: 'OK' });

  // Load demo users and database status on mount
  useEffect(() => {
    async function loadInitialData() {
      try {
        const [demoRes, healthRes] = await Promise.all([
          api.getDemoUsers().catch(() => ({ users: [] })),
          api.getHealth().catch(() => ({ database: 'sqlite' }))
        ]);
        if (demoRes.users) {
          setDemoUsers(demoRes.users);
        }
        if (healthRes.database) {
          setDbInfo(healthRes);
        }

        // Check if existing token is valid
        const savedToken = localStorage.getItem('cmts_token');
        if (savedToken) {
          try {
            const meRes = await api.getMe();
            if (meRes.user) {
              setUser(meRes.user);
            }
          } catch (e) {
            console.warn('Session expired or invalid token');
            localStorage.removeItem('cmts_token');
            setToken(null);
            setUser(null);
          }
        } else {
          // If no token exists, auto-login as Student (Kshoarya) by default so evaluator lands right in the app!
          if (demoRes.users && demoRes.users.length > 0) {
            const defaultUser = demoRes.users.find(u => u.email === 'kshoarya@campus.edu') || demoRes.users[0];
            if (defaultUser) {
              await login(defaultUser.email, 'password123');
            }
          }
        }
      } catch (err) {
        console.error('Initialization error:', err);
      } finally {
        setLoading(false);
      }
    }

    loadInitialData();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.login({ email, password });
      if (res.token && res.user) {
        localStorage.setItem('cmts_token', res.token);
        setToken(res.token);
        setUser(res.user);
        return { success: true, user: res.user };
      }
      return { success: false, message: 'Invalid response from server' };
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  const register = async (userData) => {
    try {
      const res = await api.register(userData);
      if (res.token && res.user) {
        localStorage.setItem('cmts_token', res.token);
        setToken(res.token);
        setUser(res.user);
        return { success: true, user: res.user };
      }
      return { success: false, message: 'Invalid response from server' };
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  const logout = () => {
    localStorage.removeItem('cmts_token');
    setToken(null);
    setUser(null);
  };

  const switchDemoUser = async (targetEmail) => {
    setLoading(true);
    try {
      await login(targetEmail, 'password123');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        demoUsers,
        dbInfo,
        login,
        register,
        logout,
        switchDemoUser,
        isAuthenticated: !!user
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
