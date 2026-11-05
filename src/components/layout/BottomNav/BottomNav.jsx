import { NavLink } from 'react-router-dom';
import { PRIMARY_NAV } from '@/constants/navigation';
import { cx } from '@/utils/classNames';
import styles from './BottomNav.module.css';

/** Fixed bottom navigation for phones. Hidden from 768px, where the header nav takes over. */
export default function BottomNav() {
  return (
    <nav className={styles.nav} aria-label="ناوبری سریع">
      <ul className={styles.list}>
        {PRIMARY_NAV.map(({ to, label, icon: Icon, end }) => (
          <li key={to} className={styles.cell}>
            <NavLink to={to} end={end} className={({ isActive }) => cx(styles.item, isActive && styles.active)}>
              <span className={styles.iconWrap}>
                <Icon size={22} aria-hidden="true" />
              </span>
              <span className={styles.label}>{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
