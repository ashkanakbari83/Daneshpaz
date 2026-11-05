import { forwardRef, useId } from 'react';
import { cx } from '@/utils/classNames';
import styles from './Input.module.css';

/**
 * Labelled text field with hint and error text. Pass `dir="ltr"` for
 * email, password or numeric values; Persian text keeps the page's RTL.
 */
const Input = forwardRef(function Input(
  { label, hint, error, hideLabel = false, startIcon = null, id, className, containerClassName, ...rest },
  ref,
) {
  const autoId = useId();
  const inputId = id || autoId;
  const messageId = `${inputId}-message`;
  const message = error || hint;

  return (
    <div className={cx(styles.field, containerClassName)}>
      <label htmlFor={inputId} className={cx(styles.label, hideLabel && 'visually-hidden')}>
        {label}
      </label>
      <div className={cx(styles.control, error && styles.invalid)}>
        {startIcon && (
          <span className={styles.icon} aria-hidden="true">
            {startIcon}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cx(styles.input, className)}
          aria-invalid={error ? true : undefined}
          aria-describedby={message ? messageId : undefined}
          {...rest}
        />
      </div>
      {message && (
        <p id={messageId} className={cx(styles.message, error && styles.error)} role={error ? 'alert' : undefined}>
          {message}
        </p>
      )}
    </div>
  );
});

export default Input;
