import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import pkg from '../../package.json';

// Vitest runs from the project root.
const root = process.cwd();
const read = (p) => readFileSync(join(root, p), 'utf8');
const manifest = JSON.parse(read('public/manifest.webmanifest'));
const sw = read('public/sw.js');
const html = read('index.html');

function pngSize(path) {
  const b = readFileSync(join(root, path));
  const signature = b.subarray(0, 8).toString('hex') === '89504e470d0a1a0a';
  return { signature, width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
}

describe('web app manifest', () => {
  it('is a Persian, RTL, standalone app that starts at the root', () => {
    expect(manifest.lang).toBe('fa');
    expect(manifest.dir).toBe('rtl');
    expect(manifest.display).toBe('standalone');
    expect(manifest.start_url).toBe('/');
    expect(manifest.scope).toBe('/');
    expect(manifest.short_name.length > 0 && manifest.short_name.length <= 12).toBe(true);
  });
  it('uses the brand colors and matches the page theme color', () => {
    expect(manifest.theme_color).toBe('#294D3C');
    expect(manifest.background_color).toBe('#F8F5EF');
    expect(html.includes('name="theme-color" content="#294D3C"')).toBe(true);
  });
  it('declares real PNG icons of the right size, including a maskable one', () => {
    for (const icon of manifest.icons) {
      const path = `public${icon.src}`;
      expect(existsSync(join(root, path))).toBe(true);
      const { signature, width, height } = pngSize(path);
      expect(signature).toBe(true);
      expect(`${width}x${height}`).toBe(icon.sizes);
    }
    expect(manifest.icons.some((i) => i.sizes === '192x192' && i.purpose === 'any')).toBe(true);
    expect(manifest.icons.some((i) => i.sizes === '512x512' && i.purpose === 'any')).toBe(true);
    expect(manifest.icons.some((i) => i.purpose === 'maskable')).toBe(true);
  });
  it('is linked from index.html together with the iOS icon', () => {
    expect(html.includes('rel="manifest" href="/manifest.webmanifest"')).toBe(true);
    expect(html.includes('apple-touch-icon')).toBe(true);
    expect(existsSync(join(root, 'public/icons/apple-touch-icon.png'))).toBe(true);
  });
});

describe('service worker (public/sw.js)', () => {
  it('has the same version as package.json, so every release updates the cache', () => {
    expect(sw.match(/const VERSION = '([^']+)'/)[1]).toBe(pkg.version);
  });
  it('never touches admin or auth API requests', () => {
    const source = sw.match(/const PRIVATE_API = \/(.+)\/;/)[1];
    const re = new RegExp(source);
    for (const p of ['/api/admin/summary', '/api/admin/recipes/r1', '/api/auth/me', '/api/auth/login']) expect(re.test(p)).toBe(true);
    for (const p of ['/api/catalog', '/api/recipes/tomato-omelet', '/api/help']) expect(re.test(p)).toBe(false);
  });
  it('only handles GET and same-origin requests', () => {
    expect(sw.includes("request.method !== 'GET'")).toBe(true);
    expect(sw.includes('url.origin !== self.location.origin')).toBe(true);
  });
  it('precaches only files that exist', () => {
    const list = sw.match(/const PRECACHE = \[(.+)\];/)[1].match(/'([^']+)'/g).map((x) => x.slice(1, -1));
    expect(list.includes('/') && list.includes('/offline.html')).toBe(true);
    for (const p of list.filter((x) => x !== '/')) expect(existsSync(join(root, 'public', p))).toBe(true);
  });
});

describe('offline page', () => {
  const page = read('public/offline.html');
  it('is Persian, RTL and self-contained (no network needed to show it)', () => {
    expect(page.includes('lang="fa"') && page.includes('dir="rtl"')).toBe(true);
    expect(/(src|href)="https?:\/\//.test(page)).toBe(false);
    expect(/<script[^>]+src=/.test(page)).toBe(false);
    expect(/[\u0600-\u06FF]/.test(page)).toBe(true);
  });
});

describe('build integration', () => {
  it('vite.config.js emits the precache manifest the worker reads', () => {
    const config = read('vite.config.js');
    expect(config.includes("fileName: 'precache-manifest.json'")).toBe(true);
    expect(sw.includes('/precache-manifest.json')).toBe(true);
  });
});
