import { Minus, Plus } from 'lucide-react';
import { formatNumber } from '@/utils';
import styles from './ServingStepper.module.css';

export const MIN_SERVINGS = 1;
export const MAX_SERVINGS = 12;

export default function ServingStepper({ value, onChange }) {
  return (
    <div className={styles.stepper} role="group" aria-label="تعداد نفرات">
      <button type="button" className={styles.btn} onClick={() => onChange(value - 1)} disabled={value <= MIN_SERVINGS} aria-label="یک نفر کمتر">
        <Minus size={20} aria-hidden="true" />
      </button>
      <output className={styles.value} aria-live="polite">{formatNumber(value)} نفر</output>
      <button type="button" className={styles.btn} onClick={() => onChange(value + 1)} disabled={value >= MAX_SERVINGS} aria-label="یک نفر بیشتر">
        <Plus size={20} aria-hidden="true" />
      </button>
    </div>
  );
}
