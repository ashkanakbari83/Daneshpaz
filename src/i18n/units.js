import { formatNumber } from '../lib/format.js';
import { translate } from './index.js';

// «۱٫۵ کیلو», «۴ عدد», «۲ قاشق غذاخوری»
export function formatQty(amount, unit, locale = 'fa') {
  let a = amount;
  let u = unit;
  if (unit === 'g' && amount >= 1000) { a = amount / 1000; u = 'kg'; }
  if (unit === 'ml' && amount >= 1000) { a = amount / 1000; u = 'l'; }
  return `${formatNumber(a, locale)} ${translate(`unit.${u}`, {}, locale)}`;
}

export function formatDuration(minutes, locale = 'fa') {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  const p = (n) => formatNumber(n, locale);
  if (h && m) return translate('time.hourMin', { h: p(h), m: p(m) }, locale);
  if (h) return translate('time.hour', { h: p(h) }, locale);
  return translate('time.min', { n: p(m) }, locale);
}
