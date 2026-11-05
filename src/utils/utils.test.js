import { describe, it, expect } from 'vitest';
import {
  toPersianDigits,
  toEnglishDigits,
  formatNumber,
  formatCurrency,
  formatCurrencyCompact,
  formatQuantity,
  formatIngredientAmount,
  formatUnit,
  formatDuration,
  formatClock,
} from './index.js';

describe('digits', () => {
  it('converts Latin digits to Persian', () => {
    expect(toPersianDigits('۱۲ و 345')).toBe('۱۲ و ۳۴۵');
  });
  it('converts Persian and Arabic digits to Latin', () => {
    expect(toEnglishDigits('۱۲۳٤٥')).toBe('12345');
  });
  it('handles null and undefined', () => {
    expect(toPersianDigits(null)).toBe('');
  });
});

describe('formatNumber', () => {
  it('uses Persian separators', () => {
    expect(formatNumber(1234567)).toBe('۱٬۲۳۴٬۵۶۷');
    expect(formatNumber(2.5)).toBe('۲٫۵');
  });
  it('returns empty string for invalid input', () => {
    expect(formatNumber(NaN)).toBe('');
    expect(formatNumber(undefined)).toBe('');
  });
});

describe('currency', () => {
  it('formats full toman amounts', () => {
    expect(formatCurrency(85000)).toBe('۸۵٬۰۰۰ تومان');
  });
  it('supports rial', () => {
    expect(formatCurrency(850000, { currency: 'rial' })).toBe('۸۵۰٬۰۰۰ ریال');
  });
  it('formats compact amounts', () => {
    expect(formatCurrencyCompact(85000)).toBe('۸۵ هزار تومان');
    expect(formatCurrencyCompact(1250000)).toBe('۱٫۳ میلیون تومان');
    expect(formatCurrencyCompact(500)).toBe('۵۰۰ تومان');
  });
});

describe('quantities and units', () => {
  it('formats whole numbers and fractions', () => {
    expect(formatQuantity(2)).toBe('۲');
    expect(formatQuantity(0.5)).toBe('نیم');
    expect(formatQuantity(1.5)).toBe('۱ و نیم');
    expect(formatQuantity(0.25)).toBe('ربع');
    expect(formatQuantity(2.75)).toBe('۲ و سه‌ربع');
  });
  it('rounds near-whole values', () => {
    expect(formatQuantity(1.99)).toBe('۲');
  });
  it('rounds other decimals to two places', () => {
    expect(formatQuantity(1.1)).toBe('۱٫۱');
  });
  it('formats ingredient amounts', () => {
    expect(formatIngredientAmount(250, 'g')).toBe('۲۵۰ گرم');
    expect(formatIngredientAmount(0.5, 'cup')).toBe('نیم لیوان');
    expect(formatIngredientAmount(3, 'piece')).toBe('۳ عدد');
    expect(formatIngredientAmount(1, 'to_taste')).toBe('به‌میزان لازم');
  });
  it('falls back to the raw unit when unknown', () => {
    expect(formatUnit('xyz')).toBe('xyz');
  });
});

describe('time', () => {
  it('formats durations', () => {
    expect(formatDuration(45)).toBe('۴۵ دقیقه');
    expect(formatDuration(60)).toBe('۱ ساعت');
    expect(formatDuration(80)).toBe('۱ ساعت و ۲۰ دقیقه');
    expect(formatDuration(-1)).toBe('');
  });
  it('formats timer clocks', () => {
    expect(formatClock(330)).toBe('۰۵:۳۰');
    expect(formatClock(3900)).toBe('۱:۰۵:۰۰');
    expect(formatClock(0)).toBe('۰۰:۰۰');
  });
});
