import { Link } from 'react-router-dom';
import styles from './Logo.module.css';

export function LogoMark({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path
        d="M17 10c-2 2.5 2 4.5 0 7M24 7c-2.5 3 2.5 5.5 0 9M31 10c-2 2.5 2 4.5 0 7"
        stroke="var(--color-accent)"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <rect x="9" y="21" width="30" height="5" rx="2.5" fill="currentColor" />
      <path d="M11 26h26v8a9 9 0 0 1-9 9H20a9 9 0 0 1-9-9v-8Z" fill="currentColor" />
      <path d="M11 30H6M37 30h5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/** Pot-with-steam mark plus the «دانشپز» wordmark, linking home. */
export default function Logo({ to = '/', className }) {
  return (
    <Link to={to} className={[styles.logo, className].filter(Boolean).join(' ')} aria-label="دانشپز — صفحه اصلی">
      <LogoMark />
      <span className={styles.word}>دانشپز</span>
    </Link>
  );
}
