/**
 * Tiny schema validator (no dependencies). A validator is (value, path) =>
 * { ok: true, value } | { ok: false, errors: [{ path, message }] }.
 * Objects strip unknown keys. Messages are Persian because admins see them.
 */
const fa = (n) => String(n).replace(/[0-9]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]);
const fail = (path, message) => ({ ok: false, errors: [{ path, message }] });
const ok = (value) => ({ ok: true, value });

export const str = ({ min = 0, max = 2000, pattern, patternMessage = 'قالب این فیلد درست نیست.' } = {}) => (value, path = '') => {
  if (typeof value !== 'string') return fail(path, 'باید متن باشد.');
  const s = value.trim();
  if (s.length < min) return fail(path, min === 1 ? 'این فیلد الزامی است.' : `حداقل ${fa(min)} نویسه لازم است.`);
  if (s.length > max) return fail(path, `حداکثر ${fa(max)} نویسه مجاز است.`);
  if (pattern && !pattern.test(s)) return fail(path, patternMessage);
  return ok(s);
};

export const int = ({ min = -Infinity, max = Infinity } = {}) => (value, path = '') => {
  if (!Number.isInteger(value)) return fail(path, 'باید عدد صحیح باشد.');
  if (value < min || value > max) return fail(path, `عدد باید بین ${fa(min)} و ${fa(max)} باشد.`);
  return ok(value);
};

export const num = ({ min = -Infinity, max = Infinity, exclusiveMin = false } = {}) => (value, path = '') => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fail(path, 'باید عدد باشد.');
  if (value < min || (exclusiveMin && value === min) || value > max) return fail(path, 'عدد خارج از بازه‌ی مجاز است.');
  return ok(value);
};

export const bool = () => (value, path = '') => (typeof value === 'boolean' ? ok(value) : fail(path, 'باید درست یا نادرست باشد.'));

export const oneOf = (list) => (value, path = '') =>
  list.includes(value) ? ok(value) : fail(path, `مقدار باید یکی از این‌ها باشد: ${list.join('، ')}`);

export const optional = (validator, fallback) => (value, path = '') => (value === undefined ? ok(fallback) : validator(value, path));
export const nullable = (validator) => (value, path = '') => (value === null ? ok(null) : validator(value, path));

export const arrayOf = (item, { min = 0, max = 100, unique = false } = {}) => (value, path = '') => {
  if (!Array.isArray(value)) return fail(path, 'باید فهرست باشد.');
  if (value.length < min) return fail(path, `حداقل ${fa(min)} مورد لازم است.`);
  if (value.length > max) return fail(path, `حداکثر ${fa(max)} مورد مجاز است.`);
  const out = [];
  const errors = [];
  value.forEach((entry, i) => {
    const r = item(entry, `${path}[${i}]`);
    if (r.ok) out.push(r.value);
    else errors.push(...r.errors);
  });
  if (errors.length) return { ok: false, errors };
  if (unique && new Set(out.map((x) => JSON.stringify(x))).size !== out.length) return fail(path, 'مورد تکراری وجود دارد.');
  return ok(out);
};

export const object = (shape) => (value, path = '') => {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return fail(path, 'باید شیء باشد.');
  const out = {};
  const errors = [];
  for (const [key, validator] of Object.entries(shape)) {
    const r = validator(value[key], path ? `${path}.${key}` : key);
    if (r.ok) {
      if (r.value !== undefined) out[key] = r.value;
    } else {
      errors.push(...r.errors);
    }
  }
  return errors.length ? { ok: false, errors } : ok(out);
};

/** Required-value wrapper: undefined becomes a clear «الزامی» error instead of a type error. */
export const required = (validator) => (value, path = '') =>
  value === undefined || value === null ? fail(path, 'این فیلد الزامی است.') : validator(value, path);

export function parse(validator, input) {
  return validator(input, '');
}
