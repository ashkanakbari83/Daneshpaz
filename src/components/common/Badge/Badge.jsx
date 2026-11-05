import { cx } from '@/utils/classNames';
import styles from './Badge.module.css';

/** tone: neutral | primary | accent | terracotta | success | danger */
export default function Badge({ tone = 'neutral', icon = null, className, children }) {
  return (
    <span className={cx(styles.badge, styles[tone], className)}>
      {icon && <span aria-hidden="true" className={styles.icon}>{icon}</span>}
      {children}
    </span>
  );
}
