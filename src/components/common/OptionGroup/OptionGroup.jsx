import { cx } from '@/utils/classNames';
import styles from './OptionGroup.module.css';

/**
 * Pill choices. multiple: value is an array; otherwise value is one option
 * value (or null) and tapping the selected pill again clears it.
 */
export default function OptionGroup({ legend, options, value, onChange, multiple = false }) {
  const isSelected = (v) => (multiple ? value.includes(v) : value === v);
  const handle = (v) => {
    if (multiple) onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
    else onChange(value === v ? null : v);
  };
  return (
    <fieldset className={styles.group}>
      <legend className={styles.legend}>{legend}</legend>
      <div className={styles.options}>
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            aria-pressed={isSelected(o.value)}
            className={cx(styles.pill, isSelected(o.value) && styles.selected)}
            onClick={() => handle(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
