import { Link, NavLink, Outlet, ScrollRestoration } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import Logo from '@/components/layout/Logo/Logo';
import Badge from '@/components/common/Badge/Badge';
import { ADMIN_NAV } from '@/constants/adminNav';
import { cx } from '@/utils/classNames';
import styles from './AdminLayout.module.css';

/**
 * Admin shell. NOTE: route protection and authentication arrive with the
 * backend in Phase 4. Until then these pages are non-functional placeholders.
 */
export default function AdminLayout() {
  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <div className={cx('container', styles.top)}>
          <Logo to="/admin" />
          <Badge tone="accent">پنل مدیریت</Badge>
          <Link to="/" className={styles.siteLink}>مشاهده‌ی سایت</Link>
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

      <div className="container">
        <p className={styles.notice} role="note">
          <ShieldAlert size={20} aria-hidden="true" />
          <span>ورود مدیر هنوز فعال نیست؛ صفحه‌های این بخش فقط نمای اولیه‌اند و داده‌ای را تغییر نمی‌دهند.</span>
        </p>
      </div>

      <main id="main" className={styles.main}>
        <Outlet />
      </main>
      <ScrollRestoration />
    </div>
  );
}
