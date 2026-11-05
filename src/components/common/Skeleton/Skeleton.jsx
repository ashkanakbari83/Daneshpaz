import { cx } from '@/utils/classNames';
import styles from './Skeleton.module.css';

/** Loading placeholder. shape: rect | text | circle. `lines` repeats text rows. */
export default function Skeleton({ shape = 'rect', width, height, lines = 1, className }) {
  if (shape === 'text' && lines > 1) {
    return (
      <div className={styles.stack} aria-hidden="true">
        {Array.from({ length: lines }, (_, i) => (
          <span key={i} className={cx(styles.skeleton, styles.text, className)} style={{ width: i === lines - 1 ? '60%' : '100%' }} />
        ))}
      </div>
    );
  }
  return <span aria-hidden="true" className={cx(styles.skeleton, styles[shape], className)} style={{ width, height }} />;
}
