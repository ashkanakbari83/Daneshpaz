import { useCallback, useEffect, useState } from 'react';
import { listCookingProgress, clearCookingSession } from '@/store/cookingStore';

/** In-progress cooks (for the home page card). Refreshes when the tab regains focus. */
export function useCookingResume() {
  const [items, setItems] = useState(() => listCookingProgress());
  const refresh = useCallback(() => setItems(listCookingProgress()), []);
  useEffect(() => {
    window.addEventListener('focus', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('focus', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, [refresh]);
  const dismiss = useCallback((slug) => {
    clearCookingSession(slug);
    refresh();
  }, [refresh]);
  return { items, dismiss };
}
