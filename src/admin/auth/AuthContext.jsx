import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '@/services/api';
import { isApiMode } from '@/services/contentService';

const AuthContext = createContext(null);

/**
 * Who is signed in, according to the server (session cookie, HttpOnly, so JS
 * never sees it). This only drives the UI; every admin request is checked again
 * by the server.
 */
export function AuthProvider({ children }) {
  const [state, setState] = useState({ status: isApiMode ? 'loading' : 'anonymous', user: null });

  useEffect(() => {
    if (!isApiMode) return undefined;
    let cancelled = false;
    api.get('/auth/me').then(
      ({ user }) => !cancelled && setState({ status: 'authenticated', user }),
      () => !cancelled && setState({ status: 'anonymous', user: null }),
    );
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const { user } = await api.post('/auth/login', { email, password });
    setState({ status: 'authenticated', user });
    return user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      /* the cookie may already be gone; treat as signed out */
    }
    setState({ status: 'anonymous', user: null });
  }, []);

  const expire = useCallback(() => setState({ status: 'anonymous', user: null }), []);

  const value = useMemo(() => ({ ...state, login, logout, expire }), [state, login, logout, expire]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}
