import { createContext, useContext, useState, useCallback } from 'react';
import { api } from './client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('marginal_user');
    return stored ? JSON.parse(stored) : null;
  });

  const persist = (token, userObj) => {
    localStorage.setItem('marginal_token', token);
    localStorage.setItem('marginal_user', JSON.stringify(userObj));
    setUser(userObj);
  };

  const login = useCallback(async (email, password) => {
    const { token, user: u } = await api.login({ email, password });
    persist(token, u);
    return u;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const { token, user: u } = await api.register({ name, email, password });
    persist(token, u);
    return u;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('marginal_token');
    localStorage.removeItem('marginal_user');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
