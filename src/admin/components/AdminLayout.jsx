import { Link, NavLink, Outlet, ScrollRestoration } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import Logo from '@/components/layout/Logo/Logo';
import Badge from '@/components/common/Badge/Badge';
import Button from '@/components/common/Button/Button';
import { useAuth } from '@/admin/auth/AuthContext';
import { ADMIN_NAV } from '@/constants/adminNav';
import { cx } from '@/utils/classNames';
import styles from './AdminLayout.module.css';

const ROLE_LABEL = { admin: 'مدیر کل', editor: 'ویراستار' };

/** Admin shell. Rendered only for signed-in users (RequireAuth); the server re-checks every request. */
export default function AdminLayout() {
  const { user, logout } = useAuth();
  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <div className={cx('container', styles.top)}>
          <Logo to="/admin" />
          <Badge tone="accent">{ROLE_LABEL[user?.role] ?? 'پنل مدیریت'}</Badge>
          <Link to="/" className={styles.siteLink} aria-label="مشاهده‌ی سایت">سایت</Link>
          <Button size="sm" variant="ghost" iconStart={<LogOut size={16} aria-hidden="true" />} onClick={logout} aria-label={`خروج (${user?.email ?? ''})`}>خروج</Button>
        </div>
        <nav className={styles.navWrap} aria-label="بخش‌های مدیریت">
          <ul className={cx('container', styles.nav)}>
            {ADMIN_NAV.map(({ to, label, icon: Icon, end }) => (
              <li key={to}>
                <NavLink to={to} end={end} className={({ isActive }) => cx(styles.tab, isActive && styles.active)}>
                  <Icon size={18} aria-hidden="true" />
                  <span>{label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <main id="main" className={styles.main}>
        <Outlet />
      </main>
      <ScrollRestoration />
    </div>
  );
}
