/** True for an array of strings: the shape of favorites, pantry and similar id lists. */
export const isStringList = (value) => Array.isArray(value) && value.every((x) => typeof x === 'string');

/**
 * Tiny localStorage-backed store for useSyncExternalStore. Guest data lives in
 * this browser only. Every access is wrapped: storage can be blocked or full,
 * and stored text can be missing, corrupt or the wrong shape. Anything that is
 * not valid JSON that passes `isValid` reads as `fallback`; the bad value is
 * left in storage until the user's next change replaces it.
 */
export function createLocalStore(key, fallback, isValid = () => true) {
  const listeners = new Set();
  let cache;
  let loaded = false;

  const read = () => {
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) return fallback;
      const value = JSON.parse(raw);
      return isValid(value) ? value : fallback;
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
