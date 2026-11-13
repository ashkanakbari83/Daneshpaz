// Amount scaling/rounding in the ingredient's own unit.
export function scaleAmount(amount, baseServings, servings) {
  return (amount * servings) / baseServings;
}

export function roundAmount(amount, unit) {
  if (unit === 'g' || unit === 'ml') {
    if (amount >= 100) return Math.round(amount / 10) * 10;
    if (amount >= 20) return Math.round(amount / 5) * 5;
    return Math.max(1, Math.round(amount));
  }
  if (unit === 'clove') return Math.max(1, Math.round(amount));
  if (unit === 'pcs') return Math.max(0.5, Math.round(amount * 2) / 2);
  return Math.max(0.25, Math.round(amount * 4) / 4); // tsp, tbsp
}

// How many full packs we need to cover `amount` (tolerant to float noise).
export function packsNeeded(amount, packSize) {
  if (amount <= 0) return 0;
  return Math.max(1, Math.ceil(amount / packSize - 1e-9));
}
