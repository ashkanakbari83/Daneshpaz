import { useCallback, useEffect, useSyncExternalStore } from 'react';

function subscribe(cb) {
  window.addEventListener('hashchange', cb);
  return () => window.removeEventListener('hashchange', cb);
}
const getHash = () => window.location.hash || '#/';

export function parseRoute(hash) {
  const path = hash.replace(/^#/, '') || '/';
  const parts = path.split('?')[0].split('/').filter(Boolean);
  if (parts.length === 0) return { name: 'home', params: {}, path: '/' };
  if (parts[0] === 'pantry') return { name: 'pantry', params: {}, path: '/pantry' };
  if (parts[0] === 'favorites') return { name: 'favorites', params: {}, path: '/favorites' };
  if (parts[0] === 'cook') return { name: 'cook', params: {}, path: '/cook' };
  if (parts[0] === 'recipe' && parts[1]) return { name: 'recipe', params: { id: decodeURIComponent(parts[1]) }, path: `/recipe/${parts[1]}` };
  return { name: 'notfound', params: {}, path };
}

export function useHashRoute() {
  const hash = useSyncExternalStore(subscribe, getHash, () => '#/');
  const route = parseRoute(hash);
  useEffect(() => { window.scrollTo(0, 0); }, [route.path]);
  const go = useCallback((path) => { window.location.hash = path; }, []);
  const replace = useCallback((path) => { window.location.replace(`#${path}`); }, []);
  const back = useCallback(() => {
    if (window.history.length > 1) window.history.back();
    else window.location.hash = '/';
  }, []);
  return { ...route, go, replace, back };
}
