import { readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'))

/**
 * Writes dist/precache-manifest.json (every built JS/CSS/font file) so public/sw.js can cache the whole
 * app at install time and the site works offline after the first visit. If this file is missing the
 * service worker still works; it just caches files as they are used.
 */
function precacheManifest() {
  return {
    name: 'daneshpaz-precache-manifest',
    apply: 'build',
    generateBundle(_options, bundle) {
      const files = Object.keys(bundle)
        .filter((file) => /\.(js|css|woff2?)$/.test(file))
        .map((file) => `/${file}`)
      this.emitFile({ type: 'asset', fileName: 'precache-manifest.json', source: JSON.stringify({ version, files }) })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), precacheManifest()],
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
