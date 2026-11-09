import { ChevronDown } from 'lucide-react';
import Badge from '../Badge/Badge';
import { formatNumber } from '@/utils/persian';
import styles from './Disclosure.module.css';

/** Collapsible section built on native <details>: keyboard and screen-reader friendly, no state to manage. */
export default function Disclosure({ title, count, defaultOpen = false, children }) {
  return (
    <details className={styles.box} open={defaultOpen}>
      <summary className={styles.summary}>
        <span className={styles.title}>{title}</span>
        {count != null && <Badge tone="primary">{formatNumber(count)}</Badge>}
        <ChevronDown size={18} aria-hidden="true" className={styles.chevron} />
      </summary>
      <div className={styles.body}>{children}</div>
    </details>
  );
}
