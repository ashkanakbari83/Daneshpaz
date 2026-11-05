import { useId } from 'react';
import { ChevronDown } from 'lucide-react';
import { cx } from '@/utils/classNames';
import styles from './Select.module.css';

/** Native <select> with a visible label (best behaviour on phones). */
export default function Select({ label, options, hideLabel = false, className, ...rest }) {
  const id = useId();
  return (
    <div className={cx(styles.field, className)}>
      <label htmlFor={id} className={cx(styles.label, hideLabel && 'visually-hidden')}>{label}</label>
      <div className={styles.control}>
        <select id={id} className={styles.select} {...rest}>
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <ChevronDown size={18} aria-hidden="true" className={styles.chevron} />
      </div>
    </div>
  );
}
