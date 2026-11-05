/**
 * Ingredient scaling. Not everything scales in a straight line:
 *  - linear:    quantity × (servings / baseServings)
 *  - nonlinear: quantity × ratio^exponent (salt, oil, spices: exponent < 1)
 *  - fixed:     quantity never changes
 *  - manual:    needs the cook's judgement; we show a linear estimate, flagged
 */
export function scaleQuantity({ quantity, baseServings, servings, rule = 'linear', exponent = 0.8 }) {
  const ratio = servings / baseServings;
  switch (rule) {
    case 'fixed':
      return quantity;
    case 'nonlinear':
      return quantity * Math.pow(ratio, exponent);
    case 'manual':
    case 'linear':
    default:
      return quantity * ratio;
  }
}

/** True when the shown amount is a rough guide rather than an exact scale. */
export function isEstimate(rule, servings, baseServings) {
  if (servings === baseServings) return false;
  return rule === 'nonlinear' || rule === 'manual';
}

/** Round to a quantity a person can actually measure. */
export function roundQuantity(quantity, unit) {
  if (!Number.isFinite(quantity) || quantity <= 0) return 0;
  if (unit === 'g' || unit === 'ml') {
    if (quantity >= 100) return Math.round(quantity / 5) * 5;
    if (quantity >= 10) return Math.round(quantity);
    return Math.round(quantity * 2) / 2 || 0.5;
  }
  if (unit === 'kg' || unit === 'l') return Math.round(quantity * 20) / 20;
  if (unit === 'piece' || unit === 'clove' || unit === 'slice' || unit === 'bunch' || unit === 'pack' || unit === 'can') {
    return Math.max(0.5, Math.round(quantity * 2) / 2);
  }
  if (unit === 'tsp' || unit === 'tbsp' || unit === 'cup' || unit === 'pinch') {
    return Math.max(0.25, Math.round(quantity * 4) / 4);
  }
  return Math.round(quantity * 100) / 100;
}
