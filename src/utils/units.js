import { formatNumber } from './persian.js';

/** Ingredient unit keys (stored in data) -> Persian labels (shown to users). */
export const UNIT_LABELS = {
  g: 'گرم',
  kg: 'کیلوگرم',
  ml: 'میلی‌لیتر',
  l: 'لیتر',
  tsp: 'قاشق چای‌خوری',
  tbsp: 'قاشق غذاخوری',
  cup: 'لیوان',
  piece: 'عدد',
  clove: 'حبه',
  slice: 'برش',
  bunch: 'دسته',
  pack: 'بسته',
  can: 'قوطی',
  pinch: 'نیشگون',
  to_taste: 'به‌میزان لازم',
};

export function formatUnit(unit) {
  return UNIT_LABELS[unit] ?? String(unit ?? '');
}

const FRACTIONS = [
  { value: 1 / 4, word: 'ربع' },
  { value: 1 / 3, word: 'یک‌سوم' },
  { value: 1 / 2, word: 'نیم' },
  { value: 2 / 3, word: 'دوسوم' },
  { value: 3 / 4, word: 'سه‌ربع' },
];
const TOLERANCE = 0.02;

/**
 * Human quantity: whole numbers in Persian digits, common fractions as words
 * (۰٫۵ -> نیم, ۱٫۵ -> ۱ و نیم), anything else rounded to 2 decimals.
 */
export function formatQuantity(quantity) {
  const q = Number(quantity);
  if (!Number.isFinite(q) || q < 0) return '';
  const whole = Math.floor(q + 1e-9);
  const rest = q - whole;
  if (rest < TOLERANCE) return formatNumber(whole);
  if (1 - rest < TOLERANCE) return formatNumber(whole + 1);
  const fraction = FRACTIONS.find((f) => Math.abs(rest - f.value) < TOLERANCE);
  if (fraction) {
    return whole === 0 ? fraction.word : `${formatNumber(whole)} و ${fraction.word}`;
  }
  return formatNumber(Math.round(q * 100) / 100);
}

/** e.g. (1.5, 'cup') -> «۱ و نیم لیوان»; 'to_taste' ignores the quantity. */
export function formatIngredientAmount(quantity, unit) {
  if (unit === 'to_taste') return UNIT_LABELS.to_taste;
  const amount = formatQuantity(quantity);
  if (!amount) return '';
  return unit ? `${amount} ${formatUnit(unit)}` : amount;
}
