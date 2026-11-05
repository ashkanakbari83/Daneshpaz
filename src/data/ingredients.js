/**
 * DEMO DATA — every price below is a made-up sample, NOT a market price.
 * price.amount is the price of ONE package (package.quantity in baseUnit).
 * unitFactors say how many baseUnit one `unit` weighs/measures (for tbsp, piece, ...).
 */
const PRICE_DATE = '2026-11-01';

const make = (id, name, baseUnit, packQty, amount, unitFactors = {}) => ({
  id,
  name,
  baseUnit,
  unitFactors,
  package: { quantity: packQty, unit: baseUnit },
  price: { amount, recordedAt: PRICE_DATE, source: 'داده‌ی نمونه', status: 'sample', confidence: 'low' },
});

export const INGREDIENTS = [
  make('eggs', 'تخم‌مرغ', 'piece', 30, 270000),
  make('tomato', 'گوجه‌فرنگی', 'g', 1000, 60000, { piece: 130 }),
  make('onion', 'پیاز', 'g', 1000, 30000, { piece: 150 }),
  make('garlic', 'سیر', 'g', 100, 25000, { clove: 4 }),
  make('potato', 'سیب‌زمینی', 'g', 1000, 40000, { piece: 150 }),
  make('oil', 'روغن مایع', 'ml', 1000, 110000, { tbsp: 15, tsp: 5, cup: 240 }),
  make('butter', 'کره', 'g', 100, 45000, { tbsp: 14, tsp: 5 }),
  make('salt', 'نمک', 'g', 1000, 15000, { tsp: 6, tbsp: 18 }),
  make('pepper', 'فلفل سیاه', 'g', 50, 60000, { tsp: 2 }),
  make('turmeric', 'زردچوبه', 'g', 100, 50000, { tsp: 3 }),
  make('tomato-paste', 'رب گوجه‌فرنگی', 'g', 800, 80000, { tbsp: 18 }),
  make('pasta', 'ماکارونی', 'g', 500, 55000),
  make('rice', 'برنج', 'g', 1000, 130000, { cup: 190 }),
  make('lentils', 'عدس', 'g', 900, 90000, { cup: 200 }),
  make('canned-beans', 'لوبیا قرمز کنسروی', 'g', 400, 60000, { can: 400 }),
  make('chicken', 'مرغ (سینه یا ران بدون استخوان)', 'g', 1000, 280000),
  make('flour', 'آرد', 'g', 1000, 40000, { tbsp: 8, cup: 130 }),
  make('cucumber', 'خیار', 'g', 1000, 35000, { piece: 120 }),
  make('parsley', 'جعفری', 'g', 100, 25000, { bunch: 100 }),
  make('lemon-juice', 'آب‌لیمو', 'ml', 250, 40000, { tbsp: 15 }),
  make('yogurt', 'ماست', 'g', 900, 60000, { cup: 245 }),
  make('cheese', 'پنیر پیتزا', 'g', 400, 140000, { tbsp: 8 }),
  make('milk', 'شیر', 'ml', 1000, 50000, { cup: 240 }),
  make('carrot', 'هویج', 'g', 1000, 30000, { piece: 80 }),
  make('sugar', 'شکر', 'g', 1000, 50000, { tsp: 4, tbsp: 12 }),
  make('bread', 'نان', 'piece', 1, 8000),
  make('mint', 'نعناع خشک', 'g', 50, 30000, { tsp: 1 }),
  make('cumin', 'زیره', 'g', 50, 50000, { tsp: 2 }),
  make('bell-pepper', 'فلفل دلمه‌ای', 'g', 500, 70000, { piece: 150 }),
  make('mushroom', 'قارچ', 'g', 300, 80000, { piece: 20 }),
];
