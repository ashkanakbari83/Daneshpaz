import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { gateway } from '../lib/gateway.js';
import { STORAGE_KEY } from '../lib/storage.js';
import { DEFAULT_LOCALE, LOCALES, translate } from '../i18n/index.js';
import { formatNumber, formatToman } from '../lib/format.js';
import { formatDuration, formatQty } from '../i18n/units.js';

const AppContext = createContext(null);

export function AppProvider({ children, locale = DEFAULT_LOCALE }) {
  const [db, setDb] = useState(() => gateway.load());
  const dbRef = useRef(db);

  // Runs a pure domain function against the latest state and commits the result.
  const act = useCallback((fn, ...args) => {
    const res = fn(dbRef.current, ...args);
    if (res.ok && res.db !== dbRef.current) {
      dbRef.current = res.db;
      setDb(res.db);
    }
    return res;
  }, []);

  useEffect(() => {
    const id = setTimeout(() => gateway.save(db), 120);
    return () => clearTimeout(id);
  }, [db]);

  useEffect(() => {
    const flush = () => gateway.save(dbRef.current);
    const onVisibility = () => { if (document.visibilityState === 'hidden') flush(); };
    const onStorage = (e) => {
      // another tab changed the state: adopt it
      if (e.key === STORAGE_KEY && e.newValue) {
        const fresh = gateway.load();
        dbRef.current = fresh;
        setDb(fresh);
      }
    };
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = LOCALES[locale].dir;
  }, [locale]);

  const value = useMemo(() => {
    const t = (key, params) => translate(key, params, locale);
    return {
      db,
      act,
      locale,
      t,
      now: gateway.now,
      fmt: {
        num: (n) => formatNumber(n, locale),
        toman: (n) => formatToman(n, locale),
        qty: (a, u) => formatQty(a, u, locale),
        duration: (m) => formatDuration(m, locale),
      },
      // name of a seed/user item in the current language
      name: (obj) => (locale === 'en' ? obj.en || obj.fa : obj.fa),
    };
  }, [db, act, locale]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
