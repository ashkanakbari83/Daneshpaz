import { formatNumber, toPersianDigits } from './persian.js';

/** Minutes -> «۴۵ دقیقه», «۱ ساعت», «۱ ساعت و ۲۰ دقیقه». */
export function formatDuration(totalMinutes) {
  const n = Number(totalMinutes);
  if (!Number.isFinite(n) || n < 0) return '';
  const minutes = Math.round(n);
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${formatNumber(m)} دقیقه`;
  if (m === 0) return `${formatNumber(h)} ساعت`;
  return `${formatNumber(h)} ساعت و ${formatNumber(m)} دقیقه`;
}

const pad = (n) => String(n).padStart(2, '0');

/** Seconds -> timer clock «۰۵:۳۰» or «۱:۰۵:۰۰» for an hour or more. */
export function formatClock(totalSeconds) {
  const n = Number(totalSeconds);
  if (!Number.isFinite(n) || n < 0) return '';
  const s = Math.floor(n);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const text = h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
  return toPersianDigits(text);
}
