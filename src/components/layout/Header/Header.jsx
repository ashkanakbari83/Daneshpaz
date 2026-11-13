import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, Search, ChevronLeft, LogIn } from 'lucide-react';
import Logo from '../Logo/Logo';
import BottomSheet from '@/components/common/BottomSheet/BottomSheet';
import InstallButton from '../InstallButton/InstallButton';
import { PRIMARY_NAV } from '@/constants/navigation';
import { cx } from '@/utils/classNames';
import styles from './Header.module.css';

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  return (
    <header className={styles.header}>
      <div className={cx('container', styles.bar)}>
        <Logo />

        <nav className={styles.desktopNav} aria-label="ناوبری اصلی">
          {PRIMARY_NAV.map(({ to, label, longLabel, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => cx(styles.link, isActive && styles.active)}>
              {longLabel || label}
            </NavLink>
          ))}
        </nav>

        <div className={styles.actions}>
          <Link to="/search" className={cx(styles.iconButton, styles.mobileOnly)} aria-label="جست‌وجوی غذا">
            <Search size={20} aria-hidden="true" />
          </Link>
          <button
            type="button"
            className={cx(styles.iconButton, styles.mobileOnly)}
            onClick={() => setMenuOpen(true)}
            aria-label="باز کردن منو"
            aria-haspopup="dialog"
          >
            <Menu size={20} aria-hidden="true" />
          </button>
        </div>
      </div>

      <BottomSheet open={menuOpen} onClose={closeMenu} title="منو">
        <ul className={styles.menuList}>
          {PRIMARY_NAV.map(({ to, label, longLabel, icon: Icon, end }) => (
            <li key={to}>
              <NavLink to={to} end={end} onClick={closeMenu} className={({ isActive }) => cx(styles.menuItem, isActive && styles.menuActive)}>
                <Icon size={22} aria-hidden="true" />
                <span>{longLabel || label}</span>
                <ChevronLeft size={20} aria-hidden="true" className={styles.chevron} />
              </NavLink>
            </li>
          ))}
          <li>
            <InstallButton className={styles.menuItem} iconSize={22}>نصب برنامه روی گوشی</InstallButton>
          </li>
          <li>
            <Link to="/admin/login" onClick={closeMenu} className={styles.menuItem}>
              <LogIn size={22} aria-hidden="true" />
              <span>ورود مدیر</span>
              <ChevronLeft size={20} aria-hidden="true" className={styles.chevron} />
            </Link>
          </li>
        </ul>
      </BottomSheet>
    </header>
  );
}
