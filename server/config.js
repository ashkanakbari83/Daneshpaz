/** Server settings from environment variables (see .env.example). Nothing secret has a default. */
export function loadConfig(env = process.env) {
  const int = (value, fallback) => {
    const n = Number.parseInt(value ?? '', 10);
    return Number.isFinite(n) && n > 0 ? n : fallback;
  };
  const nodeEnv = env.NODE_ENV || 'development';
  return {
    nodeEnv,
    port: int(env.PORT, 8787),
    databasePath: env.DATABASE_PATH || 'data/daneshpaz.sqlite',
    sessionTtlHours: int(env.SESSION_TTL_HOURS, 12),
    cookieSecure: env.COOKIE_SECURE ? env.COOKIE_SECURE === 'true' : nodeEnv === 'production',
    allowedOrigins: (env.ALLOWED_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    trustProxy: env.TRUST_PROXY === 'true',
    loginMaxAttempts: int(env.LOGIN_MAX_ATTEMPTS, 5),
    loginWindowMinutes: int(env.LOGIN_WINDOW_MINUTES, 15),
  };
}
