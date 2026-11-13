/**
 * Captures the browser's "install app" prompt as early as possible (it can fire before React mounts)
 * so a button can offer it later. Not every browser supports it; the button only shows when it does.
 */
import { useSyncExternalStore } from 'react';

let deferredPrompt = null;
const listeners = new Set();
const notify = () => listeners.forEach((l) => l());

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    notify();
  });
}

const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export function useInstallPrompt() {
  const canInstall = useSyncExternalStore(subscribe, () => deferredPrompt !== null, () => false);
  const install = async () => {
    if (!deferredPrompt) return null;
    const prompt = deferredPrompt;
    deferredPrompt = null;
    notify();
    await prompt.prompt();
    const choice = await prompt.userChoice;
    return choice?.outcome ?? null;
  };
  return { canInstall, install };
}
