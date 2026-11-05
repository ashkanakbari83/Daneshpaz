/**
 * Tiny localStorage-backed store for useSyncExternalStore. Guest data lives in
 * this browser only. Every access is wrapped: storage can be blocked or full.
 */
export function createLocalStore(key, fallback) {
  const listeners = new Set();
  let cache;
  let loaded = false;

  const read = () => {
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  };
  const emit = () => listeners.forEach((l) => l());

  const store = {
    getSnapshot() {
      if (!loaded) {
        cache = read();
        loaded = true;
      }
      return cache;
    },
    getServerSnapshot: () => fallback,
    subscribe(listener) {
      listeners.add(listener);
      const onStorage = (event) => {
        if (event.key === key) {
          loaded = false;
          emit();
        }
      };
      window.addEventListener('storage', onStorage);
      return () => {
        listeners.delete(listener);
        window.removeEventListener('storage', onStorage);
      };
    },
    set(value) {
      cache = value;
      loaded = true;
      try {
        window.localStorage.setItem(key, JSON.stringify(value));
      } catch {
        /* storage unavailable: keep the in-memory value for this session */
      }
      emit();
    },
  };
  return store;
}
