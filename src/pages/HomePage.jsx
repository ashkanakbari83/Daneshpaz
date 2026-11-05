import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Zap, Wallet, Carrot, Sprout, ChefHat, LifeBuoy } from 'lucide-react';
import Button from '@/components/common/Button/Button';
import Card from '@/components/common/Card/Card';
import Input from '@/components/common/Input/Input';
import EmptyState from '@/components/common/EmptyState/EmptyState';
import { usePageTitle } from '@/hooks/usePageTitle';
import styles from './HomePage.module.css';

const QUICK_ACCESS = [
  { key: 'fast', title: 'غذای سریع', description: 'زیر ۳۰ دقیقه آماده می‌شه', icon: Zap, tone: 'accent' },
  { key: 'budget', title: 'غذای اقتصادی', description: 'با کمترین هزینه', icon: Wallet, tone: 'green' },
  { key: 'pantry', title: 'با مواد موجود', description: 'هرچی داری بگو، غذا پیدا کن', icon: Carrot, tone: 'terracotta' },
  { key: 'beginner', title: 'مناسب مبتدی‌ها', description: 'بدون تجربه هم می‌شه', icon: Sprout, tone: 'green' },
];

export default function HomePage() {
  usePageTitle('');
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    const q = query.trim();
    navigate(q ? `/search?q=${encodeURIComponent(q)}` : '/search');
  };

  return (
    <>
      <section className={styles.hero} aria-labelledby="hero-title">
        <svg className={styles.steam} viewBox="0 0 120 160" fill="none" aria-hidden="true">
          <path d="M30 150c-24-30 24-50 0-80s24-50 0-70" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
          <path d="M62 150c-24-30 24-50 0-80s24-50 0-70" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
          <path d="M94 150c-24-30 24-50 0-80s24-50 0-70" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
        </svg>
        <div className="container">
          <h1 id="hero-title" className={styles.title}>امروز چی بپزیم؟</h1>
          <p className={styles.lead}>یه غذای خوشمزه، ساده و اقتصادی پیدا کن.</p>
          <form className={styles.search} onSubmit={handleSubmit} role="search">
            <Input
              label="جست‌وجوی غذا یا مواد اولیه"
              hideLabel
              type="search"
              name="q"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="نام غذا یا مواد اولیه..."
              startIcon={<Search size={20} />}
              enterKeyHint="search"
              containerClassName={styles.searchField}
            />
            <Button type="submit" variant="accent" size="lg">جست‌وجو</Button>
          </form>
        </div>
      </section>

      <div className="container">
        <section className={styles.section} aria-labelledby="quick-title">
          <h2 id="quick-title" className={styles.sectionTitle}>از کجا شروع کنیم؟</h2>
          <ul className={styles.quickGrid}>
            {QUICK_ACCESS.map(({ key, title, description, icon: Icon, tone }) => (
              <li key={key}>
                <Card as={Link} to={`/search?quick=${key}`} interactive className={styles.quickCard}>
                  <span className={`${styles.quickIcon} ${styles[tone]}`} aria-hidden="true">
                    <Icon size={26} />
                  </span>
                  <span className={styles.quickTitle}>{title}</span>
                  <span className={styles.quickText}>{description}</span>
                </Card>
              </li>
            ))}
          </ul>
        </section>

        <section className={styles.section} aria-labelledby="recommended-title">
          <h2 id="recommended-title" className={styles.sectionTitle}>غذاهای پیشنهادی</h2>
          <Card padding="none">
            <EmptyState icon={ChefHat} title="دستورهای پیشنهادی به‌زودی اینجا نمایش داده می‌شوند" description="در حال آماده‌سازی دستورهای ساده و اقتصادی هستیم." />
          </Card>
        </section>

        <section className={styles.help} aria-labelledby="help-title">
          <span className={styles.helpIcon} aria-hidden="true"><LifeBuoy size={30} /></span>
          <div className={styles.helpText}>
            <h2 id="help-title" className={styles.helpTitle}>وسط آشپزی به مشکل خوردی؟</h2>
            <p>برنج شفته شد؟ غذا شور شد؟ راهنمای آشپزی کمکت می‌کنه.</p>
          </div>
          <Button as={Link} to="/help" variant="accent">رفتن به راهنما</Button>
        </section>
      </div>
    </>
  );
}
