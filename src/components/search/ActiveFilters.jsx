import { X } from 'lucide-react';
import styles from './ActiveFilters.module.css';

/** chips: [{ key, value?, label }] */
export default function ActiveFilters({ chips, onRemove, onClear }) {
  if (chips.length === 0) return null;
  return (
    <ul className={styles.list} aria-label="فیلترهای فعال">
      {chips.map((chip) => (
        <li key={`${chip.key}-${chip.value ?? ''}`}>
          <button type="button" className={styles.chip} onClick={() => onRemove(chip)} aria-label={`حذف فیلتر ${chip.label}`}>
            <span>{chip.label}</span>
            <X size={14} aria-hidden="true" />
          </button>
        </li>
      ))}
      {chips.length > 1 && (
        <li>
          <button type="button" className={styles.clear} onClick={onClear}>پاک کردن همه</button>
        </li>
      )}
    </ul>
  );
}
