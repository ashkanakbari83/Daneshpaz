import {
  str, int, num, bool, oneOf, optional, nullable, arrayOf, object, required,
} from './validate.js';
import {
  DIFFICULTIES, MEALS, HEAT_LEVELS, SCALING_RULES, RECIPE_STATUSES, HELP_STATUSES, BASE_UNITS, UNITS,
  EQUIPMENT_KEYS, PRICE_STATUSES, CONFIDENCES, FEEDBACK_TYPES, SLUG,
} from './domain.js';

const slug = (max = 80) => str({ min: 1, max, pattern: SLUG, patternMessage: 'فقط حروف کوچک انگلیسی، عدد و خط تیره مجاز است.' });
const textList = (max = 30) => arrayOf(str({ min: 1, max: 600 }), { max });
const isoDate = str({ min: 10, max: 10, pattern: /^\d{4}-\d{2}-\d{2}$/, patternMessage: 'تاریخ باید به شکل 2026-11-01 باشد.' });
const httpUrl = str({ min: 8, max: 300, pattern: /^https?:\/\/[^\s]+$/i, patternMessage: 'آدرس باید با http:// یا https:// شروع شود.' });

const recipeIngredient = object({
  ingredientId: required(slug(60)),
  quantity: required(num({ min: 0, exclusiveMin: true, max: 100000 })),
  unit: required(oneOf(UNITS)),
  scaling: optional(
    object({ rule: required(oneOf(SCALING_RULES)), exponent: optional(num({ min: 0.1, max: 1.5 }), undefined) }),
    { rule: 'linear' },
  ),
  optional: optional(bool(), false),
});

const step = object({
  id: required(str({ min: 1, max: 30, pattern: /^[a-z0-9-]+$/, patternMessage: 'شناسه‌ی مرحله فقط حروف کوچک، عدد و خط تیره دارد.' })),
  title: required(str({ min: 1, max: 150 })),
  description: required(str({ min: 1, max: 3000 })),
  heat: optional(oneOf(HEAT_LEVELS), 'none'),
  duration: optional(nullable(int({ min: 1, max: 86400 })), null),
  ingredients: optional(
    arrayOf(object({ ingredientId: required(slug(60)), portion: optional(num({ min: 0, exclusiveMin: true, max: 1 }), 1) }), { max: 30 }),
    [],
  ),
  tips: optional(textList(), []),
  warnings: optional(textList(), []),
  doneCues: optional(textList(), []),
});

export const recipeSchema = object({
  slug: required(slug(80)),
  title: required(str({ min: 1, max: 150 })),
  description: required(str({ min: 1, max: 1000 })),
  categorySlugs: optional(arrayOf(slug(60), { max: 10, unique: true }), []),
  meals: optional(arrayOf(oneOf(MEALS), { max: 3, unique: true }), []),
  difficulty: required(oneOf(DIFFICULTIES)),
  prepTime: required(int({ min: 0, max: 1440 })),
  cookTime: required(int({ min: 0, max: 1440 })),
  defaultServings: required(int({ min: 1, max: 12 })),
  featuredOrder: optional(int({ min: 0, max: 10000 }), 100),
  status: optional(oneOf(RECIPE_STATUSES), 'draft'),
  ingredients: required(arrayOf(recipeIngredient, { min: 1, max: 60 })),
  equipment: optional(arrayOf(object({ key: required(oneOf(EQUIPMENT_KEYS)), required: required(bool()) }), { max: 20 }), []),
  beforeYouStart: optional(textList(), []),
  helpSlugs: optional(arrayOf(slug(80), { max: 20, unique: true }), []),
  steps: optional(arrayOf(step, { max: 40 }), []),
});

export const statusSchema = object({ status: required(oneOf(RECIPE_STATUSES)) });

const unitFactors = (value, path = '') => {
  if (value === undefined) return { ok: true, value: {} };
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return { ok: false, errors: [{ path, message: 'باید شیء باشد.' }] };
  const out = {};
  const errors = [];
  for (const [unit, factor] of Object.entries(value)) {
    if (!UNITS.includes(unit)) errors.push({ path: `${path}.${unit}`, message: 'واحد ناشناخته است.' });
    else if (typeof factor !== 'number' || !Number.isFinite(factor) || factor <= 0 || factor > 100000) errors.push({ path: `${path}.${unit}`, message: 'ضریب باید عدد مثبت باشد.' });
    else out[unit] = factor;
  }
  return errors.length ? { ok: false, errors } : { ok: true, value: out };
};

export const priceSchema = object({
  amount: required(num({ min: 0, max: 1e10 })),
  recordedAt: required(isoDate),
  source: required(str({ min: 1, max: 200 })),
  status: required(oneOf(PRICE_STATUSES)),
  confidence: required(oneOf(CONFIDENCES)),
  region: optional(nullable(str({ min: 1, max: 100 })), undefined),
});

const ingredientBase = {
  name: required(str({ min: 1, max: 100 })),
  baseUnit: required(oneOf(BASE_UNITS)),
  unitFactors,
  package: required(object({ quantity: required(num({ min: 0, exclusiveMin: true, max: 1e7 })), unit: required(oneOf(BASE_UNITS)) })),
  description: optional(nullable(str({ max: 500 })), undefined),
};
export const ingredientCreateSchema = object({ id: required(slug(60)), ...ingredientBase, price: required(priceSchema) });
export const ingredientUpdateSchema = object(ingredientBase);

export const categorySchema = object({
  slug: required(slug(60)),
  title: required(str({ min: 1, max: 100 })),
  sortOrder: optional(int({ min: 0, max: 10000 }), 0),
});

export const helpSchema = object({
  slug: required(slug(80)),
  category: required(slug(40)),
  title: required(str({ min: 1, max: 200 })),
  summary: required(str({ min: 1, max: 500 })),
  causes: optional(textList(), []),
  steps: optional(textList(), []),
  safety: optional(textList(), []),
  references: optional(arrayOf(object({ title: required(str({ min: 1, max: 200 })), url: required(httpUrl) }), { max: 10 }), []),
  relatedRecipes: optional(arrayOf(slug(80), { max: 20, unique: true }), []),
  reviewed: optional(bool(), false),
  status: optional(oneOf(HELP_STATUSES), 'draft'),
  sortOrder: optional(int({ min: 0, max: 10000 }), 0),
});

export const feedbackSchema = object({
  slug: required(slug(80)),
  type: required(oneOf(FEEDBACK_TYPES)),
  message: optional(nullable(str({ max: 500 })), null),
});

export const feedbackHandledSchema = object({ handled: required(bool()) });

export const loginSchema = object({
  email: required(str({ min: 3, max: 200, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, patternMessage: 'ایمیل درست نیست.' })),
  password: required(str({ min: 1, max: 200 })),
});
