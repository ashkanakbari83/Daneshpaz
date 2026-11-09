import { Inbox } from 'lucide-react';
import styles from './EmptyState.module.css';

/** Friendly empty screen: say what is missing and offer one action. */
export default function EmptyState({ icon: Icon = Inbox, title, description, action = null, children }) {
  return (
    <div className={styles.empty}>
      <span className={styles.badge} aria-hidden="true">
        <Icon size={26} />
      </span>
      <h2 className={styles.title}>{title}</h2>
      {description && <p className={styles.description}>{description}</p>}
      {action}
      {children}
    </div>
  );
}
