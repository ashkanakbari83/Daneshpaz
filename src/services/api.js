/** Thin fetch wrapper for the Daneshpaz API (same origin; `/api` is proxied in dev). */
export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export async function apiRequest(path, { method = 'GET', body } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  // Cookie-authenticated writes must carry this header (the server rejects them without it).
  if (method !== 'GET') headers['X-Requested-With'] = 'daneshpaz';

  let response;
  try {
    response = await fetch(`/api${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: 'same-origin',
    });
  } catch {
    throw new ApiError(0, 'network', 'ارتباط با سرور برقرار نشد. اینترنتت را بررسی کن.');
  }
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(response.status, data?.error?.code ?? 'error', data?.error?.message ?? 'مشکلی پیش آمد.', data?.error?.details);
  }
  return data;
}

export const api = {
  get: (path) => apiRequest(path),
  post: (path, body) => apiRequest(path, { method: 'POST', body }),
};
