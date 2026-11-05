import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cx } from '@/utils/classNames';
import styles from './Button.module.css';

/**
 * variant: primary | accent | secondary | ghost | danger
 * size: sm | md | lg
 * `as` lets the button render a router <Link> (or any element) while keeping the look.
 */
const Button = forwardRef(function Button(
  {
    as: Component = 'button',
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    loading = false,
    iconStart = null,
    iconEnd = null,
    className,
    children,
    disabled,
    type,
    ...rest
  },
  ref,
) {
  const isNative = Component === 'button';
  const stateProps = isNative
    ? { type: type || 'button', disabled: disabled || loading }
    : { 'aria-disabled': disabled || loading || undefined };

  return (
    <Component
      ref={ref}
      className={cx(
        styles.button,
        styles[variant],
        styles[size],
        fullWidth && styles.full,
        className,
      )}
      aria-busy={loading || undefined}
      {...stateProps}
      {...rest}
    >
      {loading ? <Loader2 className={styles.spinner} size={20} aria-hidden="true" /> : iconStart}
      <span>{children}</span>
      {!loading && iconEnd}
    </Component>
  );
});

export default Button;
