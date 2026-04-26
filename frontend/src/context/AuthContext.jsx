import { createContext, useContext, useState, useEffect } from 'react';
import api, { setAccessToken } from '@/services/axios.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const response = await api.post('user/token/refresh/');
        setAccessToken(response.data.access);
        setIsAuthenticated(true);
      } catch (error) {
        setIsAuthenticated(false);
        setAccessToken(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = (AccessToken) => {
    setAccessToken(AccessToken);
    setIsAuthenticated(true);
  };

  const logout = async () => {
    try {
      await api.post('user/logout/');
    } catch (e) {
      console.error(e);
    }
    setAccessToken(null);
    setIsAuthenticated(false);
  };

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);