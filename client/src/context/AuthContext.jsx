import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/authApi';
import { useToast } from './ToastContext';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('peoplepay360_token') || null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('peoplepay360_token');
      if (storedToken) {
        try {
          const res = await authApi.getMe();
          if (res.success && res.data) {
            setUser(res.data);
          }
        } catch (err) {
          localStorage.removeItem('peoplepay360_token');
          localStorage.removeItem('peoplepay360_user');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await authApi.login(email, password);
      if (res.success && res.data?.token) {
        localStorage.setItem('peoplepay360_token', res.data.token);
        localStorage.setItem('peoplepay360_user', JSON.stringify(res.data.user));
        setToken(res.data.token);
        setUser(res.data.user);
        showToast(`Logged in as ${res.data.user.name} (${res.data.user.role})`, 'success');
        return { success: true, user: res.data.user };
      }
      return { success: false, message: res.message || 'Login failed' };
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Authentication failed';
      showToast(msg, 'error');
      return { success: false, message: msg };
    }
  };

  const register = async (data) => {
    try {
      const res = await authApi.register(data);
      if (res.success && res.data?.token) {
        localStorage.setItem('peoplepay360_token', res.data.token);
        localStorage.setItem('peoplepay360_user', JSON.stringify(res.data.user));
        setToken(res.data.token);
        setUser(res.data.user);
        showToast('Registration successful!', 'success');
        return { success: true };
      }
      return { success: false, message: res.message };
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Registration failed';
      showToast(msg, 'error');
      return { success: false, message: msg };
    }
  };

  const logout = () => {
    localStorage.removeItem('peoplepay360_token');
    localStorage.removeItem('peoplepay360_user');
    setToken(null);
    setUser(null);
    showToast('Logged out successfully', 'info');
  };

  const hasRole = (...roles) => {
    if (!user) return false;
    if (user.role === 'Admin') return true;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        hasRole,
        isAuthenticated: !!token && !!user
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
