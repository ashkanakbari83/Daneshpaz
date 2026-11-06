import { useEffect } from 'react';

/** Keep the screen on while cooking (where the browser supports it). Failure is silent. */
export function useWakeLock(enabled) {
  useEffect(() => {
    if (!enabled || typeof navigator === 'undefined' || !('wakeLock' in navigator)) return undefined;
    let lock = null;
    let cancelled = false;
    const acquire = async () => {
      try {
        lock = await navigator.wakeLock.request('screen');
        if (cancelled) {
          lock.release();
          lock = null;
        }
      } catch {
        /* denied or unsupported: the screen may dim, nothing else breaks */
      }
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible') acquire();
    };
    acquire();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
      try {
        lock?.release();
      } catch {
        /* already released */
      }
    };
  }, [enabled]);
}
