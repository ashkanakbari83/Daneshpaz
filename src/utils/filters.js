import { toEnglishDigits } from './persian.js';
import { formatCurrencyCompact } from './currency.js';
import { formatNumber } from './persian.js';
import { DIFFICULTY, MEAL_TYPES, EQUIPMENT, SORT_OPTIONS, SERVING_OPTIONS } from '../constants/labels.js';

export const DEFAULT_FILTERS = {
  q: '',
  cat: '',
  meal: [],
  diff: [],
  cost: null,
  prep: null,
  cook: null,
  total: null,
  ing: null,
  serv: null,
  equip: [],
  have: [],
  sort: 'recommended',
};

const toInt = (value) => {
  const n = Number.parseInt(toEnglishDigits(value ?? ''), 10);
  return Number.isFinite(n) && n > 0 && n < 10_000_000 ? n : null;
};
const toList = (value, allowed) =>
  String(value ?? '')
    .split(',')
    .map((v) => v.trim())
    .filter((v) => (allowed ? allowed.includes(v) : /^[a-z0-9-]{1,40}$/.test(v)));

/** URL search params -> validated filters. Unknown or junk values are dropped. */
export function parseFilters(params) {
  const sort = params.get('sort');
  return {
    q: (params.get('q') ?? '').slice(0, 80),
    cat: /^[a-z-]{1,30}$/.test(params.get('cat') ?? '') ? params.get('cat') : '',
    meal: toList(params.get('meal'), Object.keys(MEAL_TYPES)),
    diff: toList(params.get('diff'), Object.keys(DIFFICULTY)),
    cost: toInt(params.get('cost')),
    prep: toInt(params.get('prep')),
    cook: toInt(params.get('cook')),
    total: toInt(params.get('total')),
    ing: toInt(params.get('ing')),
    serv: [1, 2, 3].includes(toInt(params.get('serv'))) ? toInt(params.get('serv')) : null,
    equip: toList(params.get('equip'), Object.keys(EQUIPMENT)),
    have: toList(params.get('have')),
    sort: SORT_OPTIONS.some((o) => o.value === sort) ? sort : 'recommended',
  };
}

/** Filters -> plain object for setSearchParams; defaults are omitted to keep URLs short. */
export function serializeFilters(filters) {
  const out = {};
  for (const [key, value] of Object.entries(filters)) {
    const empty = value === null || value === '' || (Array.isArray(value) && value.length === 0);
    if (empty || value === DEFAULT_FILTERS[key]) continue;
    out[key] = Array.isArray(value) ? value.join(',') : String(value);
  }
  return out;
}

/** Number of filters the user can clear (search text and sort excluded). */
export function countActiveFilters(filters) {
  return describeFilters(filters, { categoriesBySlug: {}, ingredientsById: {} }).length;
}

export function removeFilter(filters, key, value) {
  const next = { ...filters };
  next[key] = Array.isArray(filters[key]) ? filters[key].filter((v) => v !== value) : DEFAULT_FILTERS[key];
  return next;
}

/** One removable chip per active filter: [{ key, value?, label }]. */
export function describeFilters(filters, { categoriesBySlug, ingredientsById }) {
  const chips = [];
  const n = (value) => formatNumber(value);
  if (filters.cat) chips.push({ key: 'cat', label: categoriesBySlug[filters.cat]?.title ?? filters.cat });
  filters.meal.forEach((v) => chips.push({ key: 'meal', value: v, label: MEAL_TYPES[v] }));
  filters.diff.forEach((v) => chips.push({ key: 'diff', value: v, label: DIFFICULTY[v].label }));
  if (filters.cost) chips.push({ key: 'cost', label: `هزینه تا ${formatCurrencyCompact(filters.cost)}` });
  if (filters.prep) chips.push({ key: 'prep', label: `آماده‌سازی تا ${n(filters.prep)} دقیقه` });
  if (filters.cook) chips.push({ key: 'cook', label: `پخت تا ${n(filters.cook)} دقیقه` });
  if (filters.total) chips.push({ key: 'total', label: `کل زمان تا ${n(filters.total)} دقیقه` });
  if (filters.ing) chips.push({ key: 'ing', label: `تا ${n(filters.ing)} ماده` });
  if (filters.serv) chips.push({ key: 'serv', label: SERVING_OPTIONS.find((o) => o.value === filters.serv)?.label });
  filters.equip.forEach((v) => chips.push({ key: 'equip', value: v, label: `وسیله دارم: ${EQUIPMENT[v]}` }));
  filters.have.forEach((v) => chips.push({ key: 'have', value: v, label: `دارم: ${ingredientsById[v]?.name ?? v}` }));
  return chips;
}
