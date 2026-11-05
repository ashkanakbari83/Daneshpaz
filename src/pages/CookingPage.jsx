import { Link, useParams } from 'react-router-dom';
import { ArrowRight, CookingPot } from 'lucide-react';
import EmptyState from '@/components/common/EmptyState/EmptyState';
import { usePageTitle } from '@/hooks/usePageTitle';
import styles from './CookingPage.module.css';

/** Full-screen layout: no header or bottom bar, so nothing competes with the steps. */
export default function CookingPage() {
  const { slug } = useParams();
  usePageTitle('حالت آشپزی');
  return (
    <div className={styles.screen}>
      <header className={styles.bar}>
        {/* In RTL, "back" points right, so ArrowRight is correct here. */}
        <Link to={`/recipe/${encodeURIComponent(slug ?? '')}`} className={styles.back}>
          <ArrowRight size={22} aria-hidden="true" />
          <span>بازگشت به دستور</span>
        </Link>
      </header>
      <main className={styles.main}>
        <EmptyState
          icon={CookingPot}
          title="حالت آشپزی به‌زودی آماده می‌شود"
          description="اینجا هر بار یک مرحله می‌بینی، با تایمر و نشانه‌هایی که می‌گوید مرحله کی تمام شده."
        />
      </main>
    </div>
  );
}
