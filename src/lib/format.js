// Number, money and quantity formatting. Persian digits, no slash-style fractions
// (they flip in RTL), so 1.5 is shown as «۱٫۵».
const faNum = new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 2 });
const enNum = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });

export function formatNumber(n, locale = 'fa') {
  const v = Number.isFinite(n) ? n : 0;
  return (locale === 'fa' ? faNum : enNum).format(v);
}

export function formatToman(n, locale = 'fa') {
  const rounded = Math.round((Number.isFinite(n) ? n : 0) / 100) * 100;
  return formatNumber(rounded, locale);
}

export function formatMinutes(min) {
  const m = Math.max(0, Math.round(min));
  const h = Math.floor(m / 60);
  const rest = m % 60;
  return { hours: h, minutes: rest, total: m };
}

// mm:ss countdown, digits localized
export function formatClock(ms, locale = 'fa') {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const mm = String(Math.floor(total / 60)).padStart(2, '0');
  const ss = String(total % 60).padStart(2, '0');
  const s = `${mm}:${ss}`;
  return locale === 'fa' ? s.replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]) : s;
}
