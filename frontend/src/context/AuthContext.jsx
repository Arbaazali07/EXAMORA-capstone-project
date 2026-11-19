// frontend/src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('examora_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('examora_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyUser = async () => {
      if (token) {
        try {
          const res = await api.get('/auth/me');
          if (res.data.success) {
            setUser(res.data.user);
            localStorage.setItem('examora_user', JSON.stringify(res.data.user));
          }
        } catch (err) {
          console.error('Session verification error:', err);
          logout();
        }
      }
      setLoading(false);
    };

    verifyUser();
  }, [token]);

  const login = async (identifier, password) => {
    const res = await api.post('/auth/login', { identifier, password });
    if (res.data.success) {
      const { token: newToken, user: newUser } = res.data;
      setToken(newToken);
      setUser(newUser);
      localStorage.setItem('examora_token', newToken);
      localStorage.setItem('examora_user', JSON.stringify(newUser));
      return { success: true, user: newUser };
    }
    return { success: false, error: res.data.error };
  };

  const register = async (studentData) => {
    const res = await api.post('/auth/register', studentData);
    if (res.data.success) {
      const { token: newToken, user: newUser } = res.data;
      setToken(newToken);
      setUser(newUser);
      localStorage.setItem('examora_token', newToken);
      localStorage.setItem('examora_user', JSON.stringify(newUser));
      return { success: true, user: newUser };
    }
    return { success: false, error: res.data.error };
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('examora_token');
    localStorage.removeItem('examora_user');
  };

  const hasRole = (role) => user && user.role === role;
  const hasAnyRole = (...roles) => user && roles.includes(user.role);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: Boolean(user && token),
        login,
        register,
        logout,
        hasRole,
        hasAnyRole
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

