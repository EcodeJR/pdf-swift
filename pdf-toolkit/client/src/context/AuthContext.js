import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Load user on mount if token exists
  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        try {
          const data = await authAPI.getProfile();
          setUser(data.user);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Error loading user:', error);
          localStorage.removeItem('token');
          setToken(null);
          setIsAuthenticated(false);
        }
      }
      setLoading(false);
    };

    loadUser();
  }, [token]);

  const register = async (email, password) => {
    const data = await authAPI.register(email, password);
    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data.user);
    setIsAuthenticated(true);
    return data;
  };

  const login = async (email, password) => {
    const data = await authAPI.login(email, password);
    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data.user);
    setIsAuthenticated(true);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  const refreshUser = async () => {
    if (token) {
      try {
        const data = await authAPI.getProfile();
        setUser(data.user);
      } catch (error) {
        console.error('Error refreshing user:', error);
      }
    }
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated,
    register,
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
