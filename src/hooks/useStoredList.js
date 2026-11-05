import { useCallback, useSyncExternalStore } from 'react';

/** Shared hook for a persisted list of string ids (favorites, pantry, ...). */
export function useStoredList(store) {
  const items = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
  const has = useCallback((id) => items.includes(id), [items]);
  const toggle = useCallback(
    (id) => {
      const current = store.getSnapshot();
      store.set(current.includes(id) ? current.filter((x) => x !== id) : [...current, id]);
    },
    [store],
  );
  return { items, has, toggle };
}
