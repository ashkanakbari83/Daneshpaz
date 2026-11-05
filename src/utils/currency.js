import { formatNumber } from './persian.js';

export const CURRENCY_LABELS = { toman: 'تومان', rial: 'ریال' };

/** Full amount, e.g. ۸۵٬۰۰۰ تومان. Amounts are rounded to whole units. */
export function formatCurrency(amount, { currency = 'toman' } = {}) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return '';
  const label = CURRENCY_LABELS[currency] ?? CURRENCY_LABELS.toman;
  return `${formatNumber(Math.round(n), { maxFractionDigits: 0 })} ${label}`;
}

const COMPACT_STEPS = [
  { divisor: 1e9, word: 'میلیارد' },
  { divisor: 1e6, word: 'میلیون' },
  { divisor: 1e3, word: 'هزار' },
];

/** Short form common in Iranian pricing, e.g. ۸۵ هزار تومان. */
export function formatCurrencyCompact(amount, { currency = 'toman' } = {}) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return '';
  const label = CURRENCY_LABELS[currency] ?? CURRENCY_LABELS.toman;
  const abs = Math.abs(n);
  const step = COMPACT_STEPS.find((s) => abs >= s.divisor);
  if (!step) return formatCurrency(n, { currency });
  const scaled = formatNumber(n / step.divisor, { maxFractionDigits: 1 });
  return `${scaled} ${step.word} ${label}`;
}
