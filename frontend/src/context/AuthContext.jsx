import { useState, useEffect } from 'react';
import { AuthContext } from './auth-context-base';
import api from '../api/axios';
import { INITIAL_USERS } from '../api/mockData';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : INITIAL_USERS[0];
  });
  const [token, setToken] = useState(() => localStorage.getItem('access_token') || 'demo-jwt-token-active');
  const [loading, setLoading] = useState(false);
  const [apiConnected, setApiConnected] = useState(false);

  useEffect(() => {
    let isMounted = true;
    api.get('/../health')
      .then(() => {
        if (isMounted) setApiConnected(true);
      })
      .catch(() => {
        if (isMounted) setApiConnected(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const isAuthenticated = !!user;

  async function login(email, password) {
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      const { access_token, user: userData } = response.data;
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('user', JSON.stringify(userData));
      setToken(access_token);
      setUser(userData);
      setApiConnected(true);
      return { success: true };
    } catch (error) {
      const matched = INITIAL_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (matched) {
        const demoToken = `demo-${matched.role.toLowerCase()}-token`;
        localStorage.setItem('access_token', demoToken);
        localStorage.setItem('user', JSON.stringify(matched));
        setToken(demoToken);
        setUser(matched);
        return { success: true, isDemo: true };
      }
      
      const message = error.response?.data?.detail || 'Invalid email or password.';
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }

  function switchPersona(role) {
    const matched = INITIAL_USERS.find(u => u.role === role) || INITIAL_USERS[0];
    localStorage.setItem('access_token', `demo-${matched.role.toLowerCase()}-token`);
    localStorage.setItem('user', JSON.stringify(matched));
    setToken(`demo-${matched.role.toLowerCase()}-token`);
    setUser(matched);
  }

  function logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  }

  const value = {
    user,
    token,
    isAuthenticated,
    loading,
    apiConnected,
    login,
    logout,
    switchPersona,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthProvider;
