import { defineConfig } from '@playwright/test';

// Uses the system Chrome so no browser download is needed.
const channelOrPath = process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { executablePath: '/usr/bin/google-chrome' };

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 30000,
  fullyParallel: true,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    locale: 'fa-IR',
    launchOptions: { ...channelOrPath, args: ['--no-sandbox'] },
  },
  projects: [
    { name: 'mobile-390', use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } },
    { name: 'mobile-320', use: { viewport: { width: 320, height: 640 }, isMobile: true, hasTouch: true } },
    { name: 'desktop', use: { viewport: { width: 1280, height: 800 } } },
  ],
  webServer: {
    command: 'npm run build && npm run preview',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: true,
    timeout: 60000,
  },
});
