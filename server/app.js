import { createServer } from 'node:http';
import { existsSync, statSync, createReadStream } from 'node:fs';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { getSessionUser } from './auth.js';
import {
  HttpError, errors, sendJson, readJson, parseCookies, clientIp, createRateLimiter,
} from './http.js';
import { parse } from './validate.js';
import { registerPublic } from './routes/public.js';
import { registerAuth, SESSION_COOKIE } from './routes/auth.js';
import { registerAdmin } from './routes/admin.js';

const MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const CSRF_HEADER = 'x-requested-with';
const CSRF_VALUE = 'daneshpaz';
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8' };

/** Translate database errors into friendly HTTP errors. */
function translateError(error) {
  if (error instanceof HttpError) return error;
  if (error?.code === 'ERR_SQLITE_ERROR') {
    const message = String(error.message);
    if (/UNIQUE constraint failed/.test(message)) return errors.conflict('این مقدار تکراری است (مثلاً نشانی یا شناسه‌ی تکراری).');
    if (/FOREIGN KEY constraint failed/.test(message)) return errors.conflict('این مورد جای دیگری استفاده شده یا به چیز ناموجودی اشاره دارد.');
    if (/CHECK constraint failed|NOT NULL constraint failed/.test(message)) return errors.invalid([{ path: '', message: 'مقدار واردشده با قوانین داده سازگار نیست.' }]);
  }
  return null;
}

export function createApp({ db, config, staticDir = null }) {
  const loginLimiter = createRateLimiter({ max: config.loginMaxAttempts, windowMs: config.loginWindowMinutes * 60_000 });
  const ipLimiter = createRateLimiter({ max: config.loginMaxAttempts * 4, windowMs: config.loginWindowMinutes * 60_000 });
  const feedbackLimiter = createRateLimiter({ max: 20, windowMs: 3_600_000 });

  const routes = [];
  const add = (method, path, options, handler) => {
    const keys = [];
    const pattern = new RegExp(`^${path.replace(/:([a-z]+)/g, (_, key) => (keys.push(key), '([^/]+)'))}$`);
    routes.push({ method, pattern, keys, options, handler });
  };
  registerPublic(add, { db, feedbackLimiter });
  registerAuth(add, { db, config, loginLimiter, ipLimiter });
  registerAdmin(add, { db });

  const originAllowed = (req) => {
    const origin = req.headers.origin;
    if (!origin) return true;
    if (config.allowedOrigins.includes(origin)) return true;
    try {
      return new URL(origin).host === req.headers.host;
    } catch {
      return false;
    }
  };

  async function handleApi(req, res, url) {
    const matches = routes.filter((r) => r.pattern.test(url.pathname));
    if (matches.length === 0) throw errors.notFound('آدرس API پیدا نشد.');
    const route = matches.find((r) => r.method === req.method);
    if (!route) throw new HttpError(405, 'method_not_allowed', 'این روش درخواست مجاز نیست.');

    const { options } = route;
    if (MUTATING.has(req.method) && !originAllowed(req)) throw errors.forbidden('مبدأ درخواست مجاز نیست.');
    // Cookie-authenticated mutations also need a header a cross-site form cannot send.
    if (options.csrf && String(req.headers[CSRF_HEADER] ?? '').toLowerCase() !== CSRF_VALUE) {
      throw errors.forbidden('هدر امنیتی درخواست وجود ندارد.');
    }

    const sessionToken = parseCookies(req.headers.cookie)[SESSION_COOKIE];
    const user = getSessionUser(db, sessionToken);
    if (options.auth === 'user' && !user) throw errors.unauthorized();
    if (options.auth === 'admin') {
      if (!user) throw errors.unauthorized();
      if (user.role !== 'admin') throw errors.forbidden('فقط مدیر کل می‌تواند این کار را انجام دهد.');
    }

    const match = url.pathname.match(route.pattern);
    const params = {};
    route.keys.forEach((key, i) => {
      try {
        params[key] = decodeURIComponent(match[i + 1]);
      } catch {
        throw errors.badRequest('آدرس نامعتبر است.');
      }
    });

    const ctx = {
      req, params, query: url.searchParams, user, sessionToken, ip: clientIp(req, config.trustProxy),
      async body(schema) {
        const result = parse(schema, await readJson(req));
        if (!result.ok) throw errors.invalid(result.errors);
        return result.value;
      },
    };
    const result = (await route.handler(ctx)) ?? {};
    const private_ = options.auth !== 'none' || url.pathname.startsWith('/api/auth/');
    sendJson(res, result.status ?? 200, result.body ?? { ok: true }, {
      'Cache-Control': private_ ? 'no-store' : 'no-cache',
      ...result.headers,
    });
  }

  function serveStatic(req, res, url) {
    if (!staticDir || !['GET', 'HEAD'].includes(req.method)) return false;
    const root = resolve(staticDir);
    let relative;
    try {
      relative = normalize(decodeURIComponent(url.pathname)).replace(/^([/\\])+/, '');
    } catch {
      return false;
    }
    let file = resolve(join(root, relative));
    if (file !== root && !file.startsWith(root + sep)) return false; // path traversal guard
    if (!existsSync(file) || !statSync(file).isFile()) file = join(root, 'index.html'); // SPA fallback
    if (!existsSync(file)) return false;
    const isAsset = file.includes(`${sep}assets${sep}`);
    res.writeHead(200, {
      'Content-Type': MIME[extname(file)] ?? 'application/octet-stream',
      'Cache-Control': isAsset ? 'public, max-age=31536000, immutable' : 'no-cache',
    });
    if (req.method === 'HEAD') res.end();
    else createReadStream(file).pipe(res);
    return true;
  }

  const handler = async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('X-Frame-Options', 'DENY');
    try {
      const url = new URL(req.url, 'http://localhost');
      if (url.pathname.startsWith('/api/') || url.pathname === '/api') return await handleApi(req, res, url);
      if (serveStatic(req, res, url)) return undefined;
      throw errors.notFound('صفحه پیدا نشد.');
    } catch (raw) {
      const error = translateError(raw);
      if (!error) {
        console.error(raw);
        return sendJson(res, 500, { error: { code: 'internal_error', message: 'مشکلی در سرور پیش آمد.' } });
      }
      const headers = {
        ...(error.retryAfter ? { 'Retry-After': String(error.retryAfter) } : {}),
        ...(error.closeConnection ? { Connection: 'close' } : {}),
      };
      return sendJson(res, error.status, { error: { code: error.code, message: error.message, details: error.details } }, headers);
    }
  };

  return createServer(handler);
}
