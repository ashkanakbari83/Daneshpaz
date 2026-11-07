import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import Badge from '@/components/common/Badge/Badge';
import Card from '@/components/common/Card/Card';
import Skeleton from '@/components/common/Skeleton/Skeleton';
import ErrorState from '@/components/common/ErrorState/ErrorState';
import { useAuth } from '@/admin/auth/AuthContext';
import { ADMIN_NAV } from '@/constants/adminNav';
import { api } from '@/services/api';
import { useAsync } from '@/hooks/useAsync';
import { usePageTitle } from '@/hooks/usePageTitle';
import { formatNumber } from '@/utils/persian';
import styles from './AdminDashboardPage.module.css';

const STATUS_LABEL = { draft: 'پیش‌نویس', review: 'در حال بررسی', published: 'منتشرشده', archived: 'بایگانی' };
const STATUS_TONE = { draft: 'neutral', review: 'accent', published: 'success', archived: 'neutral' };

function Stat({ label, value, hint }) {
  return (
    <Card className={styles.stat}>
      <span className={styles.statLabel}>{label}</span>
      <strong className={styles.statValue}>{formatNumber(value)}</strong>
      {hint && <span className={styles.statHint}>{hint}</span>}
    </Card>
  );
}

/** Real counts from the server. Editing screens arrive in Phase 5; the API for them is ready. */
export default function AdminDashboardPage() {
  usePageTitle('داشبورد مدیریت');
  const { expire } = useAuth();
  const summary = useAsync(() => api.get('/admin/summary'), []);
  const sections = ADMIN_NAV.filter((item) => !item.end);

  // The session may have expired on the server.
  useEffect(() => {
    if (summary.error?.status === 401) expire();
  }, [summary.error, expire]);

  const data = summary.data;
  return (
    <div className="container page">
      <h1 className="page-title">داشبورد مدیریت</h1>

      {summary.status === 'loading' && <Skeleton height="9rem" />}
      {summary.status === 'error' && <ErrorState message={summary.error?.message} onRetry={summary.reload} />}
      {data && (
        <>
          <div className={styles.stats}>
            <Stat label="همه‌ی دستورها" value={data.recipes.total} hint={`${formatNumber(data.recipes.published)} منتشرشده`} />
            <Stat label="پیش‌نویس" value={data.recipes.draft} />
            <Stat label="دسته‌بندی‌ها" value={data.categories} />
            <Stat label="مواد اولیه" value={data.ingredients} />
            <Stat label="پرسش و پاسخ" value={data.helpArticles.total} hint={`${formatNumber(data.helpArticles.unreviewed)} بدون بازبینی`} />
            <Stat label="بازخورد بررسی‌نشده" value={data.feedbackUnhandled} />
          </div>

          <h2 className={styles.h2}>آخرین دستورهای ویرایش‌شده</h2>
          <ul className={styles.recent}>
            {data.recentRecipes.map((r) => (
              <li key={r.id} className={styles.recentItem}>
                <span>{r.title}</span>
                <Badge tone={STATUS_TONE[r.status]}>{STATUS_LABEL[r.status]}</Badge>
              </li>
            ))}
          </ul>
        </>
      )}

      <h2 className={styles.h2}>بخش‌های مدیریت</h2>
      <p className={styles.note}>رابط ساخت و ویرایش در فاز ۵ اضافه می‌شود؛ فعلاً API آن آماده و تست‌شده است.</p>
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
