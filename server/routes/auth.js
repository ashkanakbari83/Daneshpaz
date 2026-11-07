import { burnPasswordCheck, createSession, deleteSession, verifyPassword } from '../auth.js';
import { HttpError, errors, serializeCookie } from '../http.js';
import { loginSchema } from '../schemas.js';

export const SESSION_COOKIE = 'dp_session';

export function registerAuth(add, { db, config, loginLimiter, ipLimiter }) {
  const cookieOptions = (maxAgeSeconds) => ({ maxAgeSeconds, secure: config.cookieSecure, sameSite: 'Lax' });

  add('POST', '/api/auth/login', { auth: 'none', csrf: true }, async (ctx) => {
    const { email, password } = await ctx.body(loginSchema);
    const accountKey = email.toLowerCase();
    const ipCheck = ipLimiter.hit(ctx.ip);
    const accountCheck = loginLimiter.hit(`${ctx.ip}|${accountKey}`);
    if (!ipCheck.allowed || !accountCheck.allowed) throw errors.tooMany(Math.max(ipCheck.retryAfterSeconds, accountCheck.retryAfterSeconds));

    const user = db.prepare('SELECT id, email, role, password_hash FROM users WHERE email = ?').get(email);
    let valid = false;
    if (user) valid = await verifyPassword(password, user.password_hash);
    else await burnPasswordCheck(password); // keep timing similar for unknown emails
    if (!valid) throw new HttpError(401, 'invalid_credentials', 'ایمیل یا گذرواژه درست نیست.');

    loginLimiter.reset(`${ctx.ip}|${accountKey}`);
    const { token } = createSession(db, user.id, config.sessionTtlHours);
    return {
      body: { user: { id: user.id, email: user.email, role: user.role } },
      headers: { 'Set-Cookie': serializeCookie(SESSION_COOKIE, token, cookieOptions(config.sessionTtlHours * 3600)) },
    };
  });

  add('POST', '/api/auth/logout', { auth: 'none', csrf: true }, (ctx) => {
    deleteSession(db, ctx.sessionToken);
    return { body: { ok: true }, headers: { 'Set-Cookie': serializeCookie(SESSION_COOKIE, '', cookieOptions(0)) } };
  });

  add('GET', '/api/auth/me', { auth: 'user' }, (ctx) => ({ body: { user: ctx.user } }));
}
