const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';

/** Replace Latin digits (0-9) with Persian digits (۰-۹). */
export function toPersianDigits(value) {
  return String(value ?? '').replace(/[0-9]/g, (d) => PERSIAN_DIGITS[d]);
}

/** Replace Persian and Arabic-Indic digits with Latin digits (for parsing input). */
export function toEnglishDigits(value) {
  return String(value ?? '')
    .replace(/[۰-۹]/g, (d) => String(PERSIAN_DIGITS.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String(ARABIC_DIGITS.indexOf(d)));
}

/**
 * Format a number with Persian digits, Persian thousands separator (٬)
 * and Persian decimal separator (٫). Built on en-US formatting so output
 * does not depend on the runtime's fa-IR locale data.
 */
export function formatNumber(value, { maxFractionDigits = 2 } = {}) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '';
  const formatted = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: maxFractionDigits,
  }).format(n);
  return toPersianDigits(formatted).replace(/,/g, '٬').replace(/\./g, '٫');
}
