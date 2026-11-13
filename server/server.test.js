import { describe, it, expect, afterAll } from 'vitest';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openDatabase } from './db.js';
import { createApp } from './app.js';
import { loadConfig } from './config.js';
import { createUser, hashPassword, verifyPassword, createSession, getSessionUser } from './auth.js';
import { seedDemo } from './seed.js';
import { recipeSchema, helpSchema, ingredientCreateSchema } from './schemas.js';
import { parse } from './validate.js';
import { CATEGORIES } from '../src/data/categories.js';
import { INGREDIENTS } from '../src/data/ingredients.js';
import { RECIPES } from '../src/data/recipes.js';
import { STEPS_BY_SLUG } from '../src/data/steps.js';
import { HELP_ARTICLES, HELP_CATEGORIES } from '../src/data/help.js';

const PASSWORD = 'correct-horse-battery';
const closers = [];
afterAll(async () => { for (const close of closers) await close(); });

async function start(envOverrides = {}, { staticDir = null } = {}) {
  const db = openDatabase(':memory:');
  seedDemo(db);
  const config = loadConfig({ NODE_ENV: 'test', ...envOverrides });
  const server = createApp({ db, config, staticDir });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  closers.push(() => new Promise((resolve) => server.close(resolve)));

  async function api(path, { method = 'GET', body, cookie, headers = {}, raw } = {}) {
    const res = await fetch(base + path, {
      method,
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(method !== 'GET' ? { 'X-Requested-With': 'daneshpaz' } : {}),
        ...(cookie ? { Cookie: cookie } : {}),
        ...headers,
      },
      body: raw ?? (body !== undefined ? JSON.stringify(body) : undefined),
    });
    const text = await res.text();
    let data = null;
    try { data = JSON.parse(text); } catch { data = text; }
    return { status: res.status, data, headers: res.headers };
  }
  async function login(email, password = PASSWORD) {
    const res = await api('/api/auth/login', { method: 'POST', body: { email, password } });
    return { ...res, cookie: (res.headers.get('set-cookie') ?? '').split(';')[0] };
  }
  await createUser(db, { email: 'admin@example.com', password: PASSWORD, role: 'admin' });
  await createUser(db, { email: 'editor@example.com', password: PASSWORD, role: 'editor' });
  return { db, api, login, base };
}

const { api, login, db } = await start();
const admin = await login('admin@example.com');
const editor = await login('editor@example.com');

const minimalRecipe = (over = {}) => ({
  slug: 'test-dish', title: 'غذای آزمایشی', description: 'برای تست', difficulty: 'easy', prepTime: 5, cookTime: 10, defaultServings: 2,
  categorySlugs: ['quick'], meals: ['dinner'],
  ingredients: [{ ingredientId: 'eggs', quantity: 2, unit: 'piece' }],
  equipment: [{ key: 'pan', required: true }],
  steps: [{ id: 's1', title: 'بپز', description: 'بپز.', heat: 'low', duration: 60, ingredients: [{ ingredientId: 'eggs' }], doneCues: ['سفیده سفت شده است.'] }],
  ...over,
});

describe('demo content round-trips through the database and the public API', () => {
  it('seed data passes the same validation admins are held to', () => {
    for (const r of RECIPES) {
      const result = parse(recipeSchema, { ...r, steps: STEPS_BY_SLUG[r.slug] });
      expect(result.ok).toBe(true);
    }
    for (const a of HELP_ARTICLES) expect(parse(helpSchema, a).ok).toBe(true);
    for (const i of INGREDIENTS) expect(parse(ingredientCreateSchema, i).ok).toBe(true);
  });
  it('catalog equals the bundled demo data', async () => {
    const { status, data } = await api('/api/catalog');
    expect(status).toBe(200);
    const byId = (list) => [...list].sort((a, b) => a.id.localeCompare(b.id));
    expect(data.categories).toEqual(CATEGORIES);
    expect(byId(data.ingredients)).toEqual(byId(INGREDIENTS));
    expect(byId(data.recipes)).toEqual(byId(RECIPES.map(({ steps, ...rest }) => rest)));
    // recipes come back in featured order
    expect(data.recipes.map((r) => r.featuredOrder)).toEqual([...data.recipes.map((r) => r.featuredOrder)].sort((a, b) => a - b));
  });
  it('recipe detail equals demo recipe plus its steps, with only its own ingredients', async () => {
    for (const r of RECIPES) {
      const { status, data } = await api(`/api/recipes/${r.slug}`);
      expect(status).toBe(200);
      expect(data.recipe).toEqual({ ...r, steps: STEPS_BY_SLUG[r.slug] });
      expect(data.ingredients.length).toBe(r.ingredients.length);
    }
  });
  it('help index and detail equal demo help data', async () => {
    const index = await api('/api/help');
    expect(index.data.articles).toEqual(HELP_ARTICLES);
    expect(index.data.categories).toEqual(HELP_CATEGORIES);
    const detail = await api('/api/help/chicken-doneness');
    expect(detail.data.article).toEqual(HELP_ARTICLES.find((a) => a.slug === 'chicken-doneness'));
    expect(detail.data.relatedRecipes.map((r) => r.slug)).toEqual(HELP_ARTICLES.find((a) => a.slug === 'chicken-doneness').relatedRecipes);
  });
  it('unknown recipe or help slug is a 404 in Persian', async () => {
    const r = await api('/api/recipes/nope');
    expect(r.status).toBe(404);
    expect(r.data.error.message).toBe('این دستور پیدا نشد.');
    expect((await api('/api/help/nope')).status).toBe(404);
  });
});

describe('authentication', () => {
  it('blocks every admin route without a session', async () => {
    for (const path of ['/api/admin/summary', '/api/admin/recipes', '/api/admin/ingredients', '/api/admin/categories', '/api/admin/help', '/api/admin/feedback', '/api/auth/me']) {
      expect((await api(path)).status).toBe(401);
    }
    expect((await api('/api/admin/recipes', { method: 'POST', body: minimalRecipe() })).status).toBe(401);
  });
  it('rejects a wrong password and an unknown email with the same message', async () => {
    const wrong = await login('admin@example.com', 'wrong-password-123');
    const unknown = await login('nobody@example.com', 'wrong-password-123');
    expect(wrong.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(wrong.data.error.message).toBe(unknown.data.error.message);
  });
  it('sets an HttpOnly, SameSite session cookie and never returns the hash', async () => {
    const setCookie = admin.headers.get('set-cookie');
    expect(admin.status).toBe(200);
    expect(setCookie.includes('HttpOnly')).toBe(true);
    expect(setCookie.includes('SameSite=Lax')).toBe(true);
    expect(JSON.stringify(admin.data).includes('password')).toBe(false);
    expect(admin.data.user.role).toBe('admin');
  });
  it('stores only a hash of the session token', () => {
    const token = admin.cookie.split('=')[1];
    const rows = db.prepare('SELECT token_hash FROM sessions').all().map((r) => r.token_hash);
    expect(rows.includes(token)).toBe(false);
  });
  it('logout invalidates the session', async () => {
    const tmp = await login('admin@example.com');
    expect((await api('/api/auth/me', { cookie: tmp.cookie })).status).toBe(200);
    expect((await api('/api/auth/logout', { method: 'POST', cookie: tmp.cookie })).status).toBe(200);
    expect((await api('/api/auth/me', { cookie: tmp.cookie })).status).toBe(401);
  });
  it('expired sessions are rejected', () => {
    const { token } = createSession(db, 1, 1, Date.now());
    expect(getSessionUser(db, token, Date.now()) !== null).toBe(true);
    expect(getSessionUser(db, token, Date.now() + 2 * 3_600_000)).toBe(null);
    expect(getSessionUser(db, 'garbage')).toBe(null);
  });
  it('hashes passwords with a unique salt and verifies them', async () => {
    const a = await hashPassword('another-long-password');
    const b = await hashPassword('another-long-password');
    expect(a === b).toBe(false);
    expect(await verifyPassword('another-long-password', a)).toBe(true);
    expect(await verifyPassword('wrong', a)).toBe(false);
    expect(await verifyPassword('x', 'not-a-hash')).toBe(false);
  });
});

describe('CSRF and request hygiene', () => {
  it('login requires the custom header', async () => {
    const res = await api('/api/auth/login', { method: 'POST', body: { email: 'admin@example.com', password: PASSWORD }, headers: { 'X-Requested-With': '' } });
    expect(res.status).toBe(403);
  });
  it('rejects a cross-site Origin on mutations, even with a valid cookie', async () => {
    const res = await api('/api/admin/recipes', { method: 'POST', cookie: admin.cookie, body: minimalRecipe(), headers: { Origin: 'https://evil.example' } });
    expect(res.status).toBe(403);
    expect(db.prepare("SELECT count(*) AS n FROM recipes WHERE slug = 'test-dish'").get().n).toBe(0);
  });
  it('rejects cookie-authenticated mutations without the custom header', async () => {
    const res = await api('/api/admin/recipes', { method: 'POST', cookie: admin.cookie, body: minimalRecipe(), headers: { 'X-Requested-With': '' } });
    expect(res.status).toBe(403);
  });
  it('rejects non-JSON, malformed and oversized bodies', async () => {
    const text = await api('/api/admin/categories', { method: 'POST', cookie: admin.cookie, raw: 'x', headers: { 'Content-Type': 'text/plain' } });
    expect(text.status).toBe(415);
    const broken = await api('/api/admin/categories', { method: 'POST', cookie: admin.cookie, raw: '{nope', headers: { 'Content-Type': 'application/json' } });
    expect(broken.status).toBe(400);
    const huge = await api('/api/admin/categories', { method: 'POST', cookie: admin.cookie, raw: JSON.stringify({ title: 'x'.repeat(1_200_000) }), headers: { 'Content-Type': 'application/json' } });
    expect(huge.status).toBe(413);
  });
  it('keeps working after rejecting an oversized body (connection is closed, not poisoned)', async () => {
    const huge = await api('/api/admin/categories', { method: 'POST', cookie: admin.cookie, raw: JSON.stringify({ title: 'x'.repeat(1_200_000) }), headers: { 'Content-Type': 'application/json' } });
    expect(huge.status).toBe(413);
    expect(huge.headers.get('connection')).toBe('close');
    for (let i = 0; i < 3; i++) expect((await api('/api/health')).status).toBe(200);
  });
  it('unknown API paths are 404 and wrong methods are 405', async () => {
    expect((await api('/api/nothing')).status).toBe(404);
    expect((await api('/api/catalog', { method: 'DELETE' })).status).toBe(405);
  });
  it('sends security headers and keeps admin responses uncached', async () => {
    const res = await api('/api/admin/summary', { cookie: admin.cookie });
    expect(res.headers.get('x-content-type-options')).toBe('nosniff');
    expect(res.headers.get('cache-control')).toBe('no-store');
    expect(res.headers.get('access-control-allow-origin')).toBe(null);
  });
  it('treats SQL-looking input as plain data', async () => {
    const q = encodeURIComponent("' OR 1=1; DROP TABLE recipes; --");
    const list = await api(`/api/admin/recipes?q=${q}`, { cookie: admin.cookie });
    expect(list.status).toBe(200);
    expect(list.data.recipes.length).toBe(0);
    expect((await api(`/api/recipes/${q}`)).status).toBe(404);
    expect(db.prepare('SELECT count(*) AS n FROM recipes').get().n >= 8).toBe(true);
  });
});

describe('login rate limiting', () => {
  it('locks out after repeated failures and sends Retry-After', async () => {
    const s = await start({ LOGIN_MAX_ATTEMPTS: '3' });
    await createUser(s.db, { email: 'a@example.com', password: PASSWORD, role: 'admin' });
    const codes = [];
    for (let i = 0; i < 4; i++) codes.push((await s.login('a@example.com', 'bad-password-123')).status);
    expect(codes).toEqual([401, 401, 401, 429]);
    const blocked = await s.login('a@example.com', PASSWORD);
    expect(blocked.status).toBe(429);
    expect(Number(blocked.headers.get('retry-after')) > 0).toBe(true);
  });
});

describe('roles', () => {
  it('editors can read and create but cannot delete anything', async () => {
    expect((await api('/api/admin/summary', { cookie: editor.cookie })).status).toBe(200);
    const created = await api('/api/admin/recipes', { method: 'POST', cookie: editor.cookie, body: minimalRecipe({ slug: 'editor-dish' }) });
    expect(created.status).toBe(201);
    const id = created.data.recipe.id;
    expect((await api(`/api/admin/recipes/${id}`, { method: 'DELETE', cookie: editor.cookie })).status).toBe(403);
    expect((await api('/api/admin/categories/c1', { method: 'DELETE', cookie: editor.cookie })).status).toBe(403);
    expect((await api('/api/admin/ingredients/eggs', { method: 'DELETE', cookie: editor.cookie })).status).toBe(403);
    expect((await api(`/api/admin/recipes/${id}`, { method: 'DELETE', cookie: admin.cookie })).status).toBe(200);
  });
});

describe('recipe management', () => {
  it('rejects invalid input with Persian, field-level errors and strips unknown keys', async () => {
    const res = await api('/api/admin/recipes', { method: 'POST', cookie: admin.cookie, body: { slug: 'Bad Slug!', title: '', difficulty: 'impossible', ingredients: [] } });
    expect(res.status).toBe(422);
    const paths = res.data.error.details.map((d) => d.path);
    expect(paths.includes('slug')).toBe(true);
    expect(paths.includes('title')).toBe(true);
    expect(paths.includes('ingredients')).toBe(true);
    expect(res.data.error.details.find((d) => d.path === 'title').message).toBe('این فیلد الزامی است.');
  });
  it('rejects unknown references and duplicate slugs', async () => {
    const bad = await api('/api/admin/recipes', { method: 'POST', cookie: admin.cookie, body: minimalRecipe({ ingredients: [{ ingredientId: 'unobtainium', quantity: 1, unit: 'g' }], steps: [] }) });
    expect(bad.status).toBe(422);
    expect(bad.data.error.details[0].path).toBe('ingredients[0].ingredientId');
    const dup = await api('/api/admin/recipes', { method: 'POST', cookie: admin.cookie, body: minimalRecipe({ slug: 'tomato-omelet' }) });
    expect(dup.status).toBe(409);
  });
  it('stores text containing markup verbatim without executing or rewriting it (React escapes on render)', async () => {
    const title = '<img src=x onerror=alert(1)>';
    const res = await api('/api/admin/recipes', { method: 'POST', cookie: admin.cookie, body: minimalRecipe({ slug: 'xss-test', title }) });
    expect(res.status).toBe(201);
    expect(res.data.recipe.title).toBe(title);
    await api(`/api/admin/recipes/${res.data.recipe.id}`, { method: 'DELETE', cookie: admin.cookie });
  });
  it('full lifecycle: draft is hidden, publishing exposes it, archiving hides it, delete removes it', async () => {
    const created = await api('/api/admin/recipes', { method: 'POST', cookie: admin.cookie, body: minimalRecipe() });
    expect(created.status).toBe(201);
    const id = created.data.recipe.id;
    expect(created.data.recipe.status).toBe('draft');
    expect((await api('/api/recipes/test-dish')).status).toBe(404);
    expect((await api('/api/catalog')).data.recipes.some((r) => r.slug === 'test-dish')).toBe(false);

    const published = await api(`/api/admin/recipes/${id}/status`, { method: 'PATCH', cookie: admin.cookie, body: { status: 'published' } });
    expect(published.status).toBe(200);
    expect((await api('/api/recipes/test-dish')).data.recipe.steps.length).toBe(1);

    const updated = await api(`/api/admin/recipes/${id}`, { method: 'PUT', cookie: admin.cookie, body: minimalRecipe({ title: 'عنوان جدید', status: 'published' }) });
    expect(updated.data.recipe.title).toBe('عنوان جدید');
    expect((await api('/api/recipes/test-dish')).data.recipe.title).toBe('عنوان جدید');

    await api(`/api/admin/recipes/${id}/status`, { method: 'PATCH', cookie: admin.cookie, body: { status: 'archived' } });
    expect((await api('/api/recipes/test-dish')).status).toBe(404);
    expect((await api(`/api/admin/recipes/${id}`, { method: 'DELETE', cookie: admin.cookie })).status).toBe(200);
    expect((await api(`/api/admin/recipes/${id}`, { cookie: admin.cookie })).status).toBe(404);
    expect(db.prepare('SELECT count(*) AS n FROM cooking_steps WHERE recipe_id = ?').get(id).n).toBe(0);
  });
  it('will not publish a recipe whose steps lack completion cues', async () => {
    const body = minimalRecipe({ slug: 'no-cues', steps: [{ id: 's1', title: 'بپز', description: 'بپز.', heat: 'low' }] });
    const asDraft = await api('/api/admin/recipes', { method: 'POST', cookie: admin.cookie, body });
    expect(asDraft.status).toBe(201);
    const publish = await api(`/api/admin/recipes/${asDraft.data.recipe.id}/status`, { method: 'PATCH', cookie: admin.cookie, body: { status: 'published' } });
    expect(publish.status).toBe(422);
    expect(publish.data.error.details[0].path).toBe('steps[0].doneCues');
    await api(`/api/admin/recipes/${asDraft.data.recipe.id}`, { method: 'DELETE', cookie: admin.cookie });
  });
  it('rolls back a failed save without losing the existing recipe', async () => {
    const before = (await api('/api/admin/recipes/r6', { cookie: admin.cookie })).data.recipe;
    const bad = await api('/api/admin/recipes/r6', { method: 'PUT', cookie: admin.cookie, body: { ...before, categorySlugs: ['does-not-exist'] } });
    expect(bad.status).toBe(422);
    const after = (await api('/api/admin/recipes/r6', { cookie: admin.cookie })).data.recipe;
    expect(after.updatedAt).toBe(before.updatedAt);
    expect(after.steps).toEqual(before.steps);
  });
  it('filters the admin list by status and title', async () => {
    const published = await api('/api/admin/recipes?status=published', { cookie: admin.cookie });
    expect(published.data.recipes.length >= 8).toBe(true);
    expect((await api('/api/admin/recipes?status=bogus', { cookie: admin.cookie })).status).toBe(400);
    const found = await api(`/api/admin/recipes?q=${encodeURIComponent('نیمرو')}`, { cookie: admin.cookie });
    expect(found.data.recipes.map((r) => r.slug)).toEqual(['fried-egg']);
  });
});

describe('ingredients, prices and categories', () => {
  it('adds a price record and the newest one becomes current, with history kept', async () => {
    const res = await api('/api/admin/ingredients/eggs/prices', { method: 'POST', cookie: admin.cookie, body: { amount: 300000, recordedAt: '2026-12-01', source: 'ثبت دستی', status: 'estimated', confidence: 'medium' } });
    expect(res.status).toBe(201);
    expect(res.data.ingredient.price.amount).toBe(300000);
    expect((await api('/api/catalog')).data.ingredients.find((i) => i.id === 'eggs').price.status).toBe('estimated');
    expect((await api('/api/admin/ingredients/eggs/prices', { cookie: admin.cookie })).data.prices.length).toBe(2);
  });
  it('validates price input', async () => {
    const res = await api('/api/admin/ingredients/eggs/prices', { method: 'POST', cookie: admin.cookie, body: { amount: -5, recordedAt: '1 آبان', source: '', status: 'real', confidence: 'high' } });
    expect(res.status).toBe(422);
    expect(res.data.error.details.length).toBe(4);
  });
  it('blocks deleting an ingredient or category that recipes still use', async () => {
    expect((await api('/api/admin/ingredients/eggs', { method: 'DELETE', cookie: admin.cookie })).status).toBe(409);
    expect((await api('/api/admin/categories/c4', { method: 'DELETE', cookie: admin.cookie })).status).toBe(409);
  });
  it('creates an ingredient with its first price and rejects a mismatched package unit', async () => {
    const body = { id: 'saffron', name: 'زعفران', baseUnit: 'g', unitFactors: { tsp: 1 }, package: { quantity: 1, unit: 'g' }, price: { amount: 150000, recordedAt: '2026-11-01', source: 'نمونه', status: 'sample', confidence: 'low' } };
    const created = await api('/api/admin/ingredients', { method: 'POST', cookie: admin.cookie, body });
    expect(created.status).toBe(201);
    expect(created.data.ingredient.price.amount).toBe(150000);
    const mismatch = await api('/api/admin/ingredients', { method: 'POST', cookie: admin.cookie, body: { ...body, id: 'saffron-2', package: { quantity: 1, unit: 'ml' } } });
    expect(mismatch.status).toBe(422);
    expect((await api('/api/admin/ingredients/saffron', { method: 'DELETE', cookie: admin.cookie })).status).toBe(200);
  });
  it('manages categories', async () => {
    const created = await api('/api/admin/categories', { method: 'POST', cookie: admin.cookie, body: { slug: 'snacks', title: 'تنقلات', sortOrder: 20 } });
    expect(created.status).toBe(201);
    expect((await api('/api/admin/categories', { method: 'POST', cookie: admin.cookie, body: { slug: 'snacks', title: 'تکراری' } })).status).toBe(409);
    const renamed = await api(`/api/admin/categories/${created.data.category.id}`, { method: 'PUT', cookie: admin.cookie, body: { slug: 'snacks', title: 'میان‌وعده' } });
    expect(renamed.data.category.title).toBe('میان‌وعده');
    expect((await api(`/api/admin/categories/${created.data.category.id}`, { method: 'DELETE', cookie: admin.cookie })).status).toBe(200);
  });
});

describe('help articles and feedback', () => {
  it('accepts public feedback only for published articles and valid types', async () => {
    expect((await api('/api/feedback', { method: 'POST', body: { slug: 'burnt-food', type: 'helpful' } })).status).toBe(201);
    expect((await api('/api/feedback', { method: 'POST', body: { slug: 'nope', type: 'helpful' } })).status).toBe(404);
    expect((await api('/api/feedback', { method: 'POST', body: { slug: 'burnt-food', type: 'love' } })).status).toBe(422);
    expect((await api('/api/feedback', { method: 'POST', body: { slug: 'burnt-food', type: 'report', message: 'x'.repeat(501) } })).status).toBe(422);
  });
  it('lets admins list and resolve feedback; the public cannot read it', async () => {
    expect((await api('/api/admin/feedback')).status).toBe(401);
    const list = await api('/api/admin/feedback?handled=false', { cookie: admin.cookie });
    expect(list.data.feedback.length >= 1).toBe(true);
    const id = list.data.feedback[0].id;
    expect((await api(`/api/admin/feedback/${id}`, { method: 'PATCH', cookie: admin.cookie, body: { handled: true } })).status).toBe(200);
    expect((await api('/api/admin/feedback?handled=false', { cookie: admin.cookie })).data.feedback.some((f) => f.id === id)).toBe(false);
  });
  it('rate-limits public feedback', async () => {
    const s = await start();
    const codes = [];
    for (let i = 0; i < 22; i++) codes.push((await s.api('/api/feedback', { method: 'POST', body: { slug: 'burnt-food', type: 'helpful' } })).status);
    expect(codes.slice(0, 20).every((c) => c === 201)).toBe(true);
    expect(codes[21]).toBe(429);
  });
  it('rejects javascript: URLs in help references and hides drafts from the public', async () => {
    const base = { slug: 'draft-help', category: 'rice', title: 'پیش‌نویس', summary: 'خلاصه', causes: ['a'], steps: ['b'] };
    const evil = await api('/api/admin/help', { method: 'POST', cookie: admin.cookie, body: { ...base, references: [{ title: 'x', url: 'javascript:alert(1)' }] } });
    expect(evil.status).toBe(422);
    const created = await api('/api/admin/help', { method: 'POST', cookie: admin.cookie, body: { ...base, references: [{ title: 'NHS', url: 'https://www.nhs.uk' }] } });
    expect(created.status).toBe(201);
    expect(created.data.article.status).toBe('draft');
    expect((await api('/api/help/draft-help')).status).toBe(404);
    expect((await api('/api/help')).data.articles.some((a) => a.slug === 'draft-help')).toBe(false);
    expect((await api(`/api/admin/help/${created.data.article.id}`, { method: 'DELETE', cookie: admin.cookie })).status).toBe(200);
  });
});

describe('dashboard summary', () => {
  it('reports counts', async () => {
    const { data } = await api('/api/admin/summary', { cookie: admin.cookie });
    expect(data.recipes.published >= 8).toBe(true);
    expect(data.categories >= 10).toBe(true);
    expect(data.ingredients).toBe(30);
    expect(data.helpArticles.unreviewed).toBe(9);
    expect(data.recentRecipes.length <= 5).toBe(true);
  });
});

describe('static file serving', () => {
  it('serves the SPA, falls back to index.html, and never escapes the folder', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'dp-static-'));
    writeFileSync(join(dir, 'index.html'), '<!doctype html><title>spa</title>');
    const s = await start({}, { staticDir: dir });
    const home = await s.api('/');
    expect(String(home.data).includes('<title>spa</title>')).toBe(true);
    expect(String((await s.api('/recipe/anything')).data).includes('<title>spa</title>')).toBe(true);
    for (const path of ['/%2e%2e/server/db.js', '/..%2f..%2fetc/passwd', '/%2e%2e%5cserver%5cdb.js']) {
      const res = await s.api(path);
      expect(String(res.data).includes('DatabaseSync')).toBe(false);
      expect(String(res.data).includes('root:')).toBe(false);
    }
  });
});
