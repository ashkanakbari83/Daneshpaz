import { cx } from '@/utils/classNames';
import styles from './Card.module.css';

/** padding: none | md | lg. `interactive` adds hover/press feedback (use with as={Link}). */
export default function Card({ as: Component = 'div', padding = 'md', interactive = false, className, children, ...rest }) {
  return (
    <Component className={cx(styles.card, styles[padding], interactive && styles.interactive, className)} {...rest}>
      {children}
    </Component>
  );
}
