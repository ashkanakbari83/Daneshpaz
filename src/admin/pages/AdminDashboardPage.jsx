import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import Card from '@/components/common/Card/Card';
import { ADMIN_NAV } from '@/constants/adminNav';
import { usePageTitle } from '@/hooks/usePageTitle';
import styles from './AdminDashboardPage.module.css';

/** Links to each management area. Real statistics arrive with the backend (Phase 4). */
export default function AdminDashboardPage() {
  usePageTitle('داشبورد مدیریت');
  const sections = ADMIN_NAV.filter((item) => !item.end);
  return (
    <div className="container page">
      <h1 className="page-title">داشبورد مدیریت</h1>
      <ul className={styles.grid}>
        {sections.map(({ to, label, icon: Icon }) => (
          <li key={to}>
            <Card as={Link} to={to} interactive className={styles.card}>
              <span className={styles.icon} aria-hidden="true"><Icon size={24} /></span>
              <span className={styles.label}>{label}</span>
              <ChevronLeft size={20} aria-hidden="true" className={styles.chevron} />
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
