import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // `@/components/...` resolves to `src/components/...`
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    // In dev, the browser talks to Vite and Vite forwards /api to the backend (`npm run server`),
    // so the app and API share one origin and the session cookie just works.
    proxy: { '/api': 'http://localhost:8787' },
  },
  // Read by Vitest (`npm test`); ignored by Vite itself.
  test: {
    environment: 'node',
    include: ['src/**/*.test.js', 'server/**/*.test.js'],
  },
})
