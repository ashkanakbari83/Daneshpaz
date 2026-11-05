import { formatCurrencyCompact } from '@/utils/currency';
import { formatNumber } from '@/utils/persian';

export const DIFFICULTY = {
  easy: { label: 'آسان', rank: 1, tone: 'success' },
  medium: { label: 'متوسط', rank: 2, tone: 'accent' },
  hard: { label: 'سخت', rank: 3, tone: 'terracotta' },
};

export const MEAL_TYPES = { breakfast: 'صبحانه', lunch: 'ناهار', dinner: 'شام' };

export const EQUIPMENT = {
  pot: 'قابلمه',
  pan: 'تابه',
  knife: 'چاقو',
  board: 'تخته برش',
  oven: 'فر',
  mixer: 'همزن',
  spatula: 'کفگیر',
  strainer: 'آبکش',
  grater: 'رنده',
};

export const SORT_OPTIONS = [
  { value: 'recommended', label: 'پیشنهادی' },
  { value: 'cost', label: 'کم‌هزینه‌ترین' },
  { value: 'fast', label: 'سریع‌ترین' },
  { value: 'easy', label: 'آسان‌ترین' },
];

export const PRICE_STATUS = {
  sample: 'قیمت نمونه',
  estimated: 'قیمت تقریبی',
  verified: 'قیمت تأییدشده',
};

const upTo = (n, suffix) => `تا ${formatNumber(n)} ${suffix}`;
export const COST_OPTIONS = [50000, 100000, 150000].map((value) => ({
  value,
  label: `تا ${formatCurrencyCompact(value)}`,
}));
export const PREP_OPTIONS = [10, 20].map((value) => ({ value, label: upTo(value, 'دقیقه') }));
export const COOK_OPTIONS = [15, 30, 60].map((value) => ({ value, label: upTo(value, 'دقیقه') }));
export const TOTAL_OPTIONS = [30, 45].map((value) => ({ value, label: upTo(value, 'دقیقه') }));
export const INGREDIENT_COUNT_OPTIONS = [5, 8].map((value) => ({ value, label: upTo(value, 'ماده') }));
export const SERVING_OPTIONS = [
  { value: 1, label: '۱ نفر' },
  { value: 2, label: '۲ نفر' },
  { value: 3, label: '۳ نفر و بیشتر' },
];
