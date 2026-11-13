import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/vazirmatn'; // bundled locally — no CDN needed
import '@/styles/tokens.css';
import '@/styles/base.css';
import App from '@/app/App';
import '@/pwa/install';
import { registerServiceWorker } from '@/pwa/register';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Dev servers would cache stale modules, so the worker is only registered in production builds.
if (import.meta.env.PROD) registerServiceWorker();
