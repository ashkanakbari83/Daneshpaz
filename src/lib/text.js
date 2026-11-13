// Normalises Persian/Arabic text for searching: unify ی/ک, drop ZWNJ, diacritics, digits.
const FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩';

export function normalizeText(input) {
  return String(input ?? '')
    .replace(/[يى]/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/[‌‍‎‏]/g, '')
    .replace(/[ً-ٰٟ]/g, '')
    .replace(/[۰-۹]/g, (d) => String(FA_DIGITS.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String(AR_DIGITS.indexOf(d)))
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}
