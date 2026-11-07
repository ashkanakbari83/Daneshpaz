export class HttpError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const errors = {
  badRequest: (message = 'درخواست نامعتبر است.', details) => new HttpError(400, 'bad_request', message, details),
  unauthorized: (message = 'برای این کار باید وارد شوی.') => new HttpError(401, 'unauthorized', message),
  forbidden: (message = 'اجازه‌ی این کار را نداری.') => new HttpError(403, 'forbidden', message),
  notFound: (message = 'پیدا نشد.') => new HttpError(404, 'not_found', message),
  conflict: (message = 'این مورد با داده‌ی دیگری تداخل دارد.') => new HttpError(409, 'conflict', message),
  invalid: (details) => new HttpError(422, 'validation_failed', 'اطلاعات واردشده درست نیست.', details),
  tooMany: (retryAfterSeconds) => {
    const e = new HttpError(429, 'rate_limited', 'تعداد تلاش‌ها زیاد است. کمی بعد دوباره امتحان کن.');
    e.retryAfter = retryAfterSeconds;
    return e;
  },
};

export function sendJson(res, status, body, headers = {}) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(payload),
    ...headers,
  });
  res.end(payload);
}

/** Read a JSON body with a size limit; requires an application/json content type. */
export async function readJson(req, limitBytes = 1_000_000) {
  const type = String(req.headers['content-type'] ?? '');
  if (!type.toLowerCase().startsWith('application/json')) {
    throw new HttpError(415, 'unsupported_media_type', 'نوع محتوا باید application/json باشد.');
  }
  const tooLarge = () => {
    // The unread body would poison a keep-alive connection, so tell the client to close it.
    const error = new HttpError(413, 'payload_too_large', 'حجم درخواست زیاد است.');
    error.closeConnection = true;
    return error;
  };
  if (Number(req.headers['content-length']) > limitBytes) throw tooLarge();
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limitBytes) throw tooLarge();
    chunks.push(chunk);
  }
  if (size === 0) throw errors.badRequest('بدنه‌ی درخواست خالی است.');
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw errors.badRequest('JSON نامعتبر است.');
  }
}

export function parseCookies(header = '') {
  const out = {};
  for (const part of header.split(';')) {
    const index = part.indexOf('=');
    if (index < 0) continue;
    out[part.slice(0, index).trim()] = decodeURIComponent(part.slice(index + 1).trim());
  }
  return out;
}

export function serializeCookie(name, value, { maxAgeSeconds, secure, sameSite = 'Lax', path = '/' } = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`, `Path=${path}`, 'HttpOnly', `SameSite=${sameSite}`];
  if (maxAgeSeconds !== undefined) parts.push(`Max-Age=${maxAgeSeconds}`);
  if (secure) parts.push('Secure');
  return parts.join('; ');
}

export function clientIp(req, trustProxy) {
  if (trustProxy) {
    const forwarded = String(req.headers['x-forwarded-for'] ?? '').split(',')[0].trim();
    if (forwarded) return forwarded;
  }
  return req.socket.remoteAddress ?? 'unknown';
}

/** In-memory sliding-window limiter. Fine for one process; use a shared store if you scale out. */
export function createRateLimiter({ max, windowMs, now = () => Date.now() }) {
  const hits = new Map();
  const prune = (key, t) => {
    const list = (hits.get(key) ?? []).filter((time) => t - time < windowMs);
    if (list.length) hits.set(key, list);
    else hits.delete(key);
    return list;
  };
  return {
    /** Records an attempt. Returns { allowed, retryAfterSeconds }. */
    hit(key) {
      const t = now();
      const list = prune(key, t);
      if (list.length >= max) {
        return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((windowMs - (t - list[0])) / 1000)) };
      }
      hits.set(key, [...list, t]);
      return { allowed: true, retryAfterSeconds: 0 };
    },
    reset(key) {
      hits.delete(key);
    },
  };
}
