/**
 * Registers the service worker (public/sw.js) and tells the app when a new version is waiting.
 * The new version is only activated when the user taps «به‌روزرسانی», so a page that is open
 * never gets its files swapped underneath it.
 */
export const SW_UPDATE_EVENT = 'daneshpaz:sw-update-ready';

let waitingWorker = null;
let updateRequested = false;

export function registerServiceWorker() {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

  const start = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');

      const announce = () => {
        // `controller` is null on the very first visit: that is an install, not an update.
        if (registration.waiting && navigator.serviceWorker.controller) {
          waitingWorker = registration.waiting;
          window.dispatchEvent(new Event(SW_UPDATE_EVENT));
        }
      };
      announce();
      registration.addEventListener('updatefound', () => {
        const worker = registration.installing;
        worker?.addEventListener('statechange', () => {
          if (worker.state === 'installed') announce();
        });
      });

      // First visit: this page loaded before the worker took over, so hand it the list of files to keep.
      navigator.serviceWorker.ready.then((ready) => {
        const urls = performance.getEntriesByType('resource').map((entry) => entry.name);
        ready.active?.postMessage({ type: 'CACHE_URLS', urls });
      });
    } catch (error) {
      console.warn('Service worker registration failed:', error);
    }
  };

  if (document.readyState === 'complete') start();
  else window.addEventListener('load', start, { once: true });

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (updateRequested) window.location.reload();
  });
}

export const hasPendingUpdate = () => Boolean(waitingWorker);

export function applyUpdate() {
  if (!waitingWorker) return;
  updateRequested = true;
  waitingWorker.postMessage({ type: 'SKIP_WAITING' });
}
