import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Zap, Wallet, Carrot, Sprout, LifeBuoy, ChefHat, Play, X } from 'lucide-react';
import Button from '@/components/common/Button/Button';
import Card from '@/components/common/Card/Card';
import Input from '@/components/common/Input/Input';
import EmptyState from '@/components/common/EmptyState/EmptyState';
import ErrorState from '@/components/common/ErrorState/ErrorState';
import RecipeGrid from '@/components/recipe/RecipeGrid';
import RecipeGridSkeleton from '@/components/recipe/RecipeGridSkeleton';
import { getCatalog } from '@/services/contentService';
import { useAsync } from '@/hooks/useAsync';
import { useCookingResume } from '@/hooks/useCookingResume';
import { usePageTitle } from '@/hooks/usePageTitle';
import { defaultCostOf } from '@/utils/cost';
import { formatNumber } from '@/utils/persian';
import styles from './HomePage.module.css';

const QUICK_ACCESS = [
  { key: 'fast', title: 'غذای سریع', description: 'زیر ۳۰ دقیقه', icon: Zap, tone: 'accent', to: '/search?total=30&sort=fast' },
  { key: 'budget', title: 'غذای اقتصادی', description: 'کم‌هزینه', icon: Wallet, tone: 'green', to: '/search?cost=50000&sort=cost' },
  { key: 'pantry', title: 'با مواد موجود', description: 'با مواد خانه‌ات', icon: Carrot, tone: 'terracotta', to: '/search?pantry=1' },
  { key: 'beginner', title: 'مناسب مبتدی‌ها', description: 'بدون تجربه', icon: Sprout, tone: 'green', to: '/search?diff=easy&sort=easy' },
];

export default function HomePage() {
  usePageTitle('');
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const catalog = useAsync(getCatalog, []);
  const resume = useCookingResume();

  const { featured, categories } = useMemo(() => {
    if (!catalog.data) return { featured: [], categories: [] };
    const { recipes, ingredientsById, categories: all } = catalog.data;
    const featuredRecipes = [...recipes].sort((a, b) => a.featuredOrder - b.featuredOrder).slice(0, 4);
    return {
      featured: featuredRecipes.map((recipe) => ({ recipe, cost: defaultCostOf(recipe, ingredientsById) })),
      categories: all
        .map((c) => ({ ...c, count: recipes.filter((r) => r.categorySlugs.includes(c.slug)).length }))
        .filter((c) => c.count > 0),
    };
  }, [catalog.data]);

  // The most recent in-progress cook whose recipe still exists.
  const inProgress = useMemo(() => {
    if (!catalog.data) return null;
    for (const item of resume.items) {
      const recipe = catalog.data.recipes.find((r) => r.slug === item.slug);
      if (recipe) return { ...item, title: recipe.title };
    }
    return null;
  }, [catalog.data, resume.items]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const q = query.trim();
    navigate(q ? `/search?q=${encodeURIComponent(q)}` : '/search');
  };

  return (
    <>
      <section className={styles.hero} aria-labelledby="hero-title">
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
            <Button type="submit" variant="accent">جست‌وجو</Button>
          </form>
        </div>
      </section>

      <div className="container">
        {inProgress && (
          <section className={styles.resume} aria-label="ادامه‌ی آشپزی">
            <Link to={`/cook/${inProgress.slug}`} className={styles.resumeLink}>
              <span className={styles.resumeIcon} aria-hidden="true"><Play size={18} /></span>
              <span className={styles.resumeText}>
                <strong>ادامه‌ی آشپزی «{inProgress.title}»</strong>
                <small>از مرحله‌ی {formatNumber(inProgress.stepIndex + 1)} · پیشرفتت ذخیره شده</small>
              </span>
            </Link>
            <button
              type="button"
              className={styles.resumeClose}
              aria-label={`حذف پیشرفت ذخیره‌شده‌ی «${inProgress.title}»`}
              onClick={() => {
                if (window.confirm('پیشرفت ذخیره‌شده‌ی این غذا پاک می‌شود. ادامه می‌دهی؟')) resume.dismiss(inProgress.slug);
              }}
            >
              <X size={16} aria-hidden="true" />
            </button>
          </section>
        )}

        <section className={styles.section} aria-labelledby="quick-title">
          <h2 id="quick-title" className={styles.sectionTitle}>از کجا شروع کنیم؟</h2>
          <ul className={styles.quickGrid}>
            {QUICK_ACCESS.map(({ key, title, description, icon: Icon, tone, to }) => (
              <li key={key}>
                <Card as={Link} to={to} interactive className={styles.quickCard}>
                  <span className={`${styles.quickIcon} ${styles[tone]}`} aria-hidden="true"><Icon size={20} /></span>
                  <span className={styles.quickBody}>
                    <span className={styles.quickTitle}>{title}</span>
                    <span className={styles.quickText}>{description}</span>
                  </span>
                </Card>
              </li>
            ))}
          </ul>
        </section>

        <section className={styles.section} aria-labelledby="recommended-title">
          <div className={styles.sectionHead}>
            <h2 id="recommended-title" className={styles.sectionTitle}>غذاهای پیشنهادی</h2>
            <Link to="/search" className={styles.more}>همه‌ی غذاها</Link>
          </div>
          {catalog.status === 'loading' && <RecipeGridSkeleton />}
          {catalog.status === 'error' && <ErrorState onRetry={catalog.reload} />}
          {catalog.status === 'success' && (featured.length ? <RecipeGrid items={featured} /> : (
            <Card padding="none"><EmptyState icon={ChefHat} title="هنوز دستوری اضافه نشده" description="به‌زودی دستورهای ساده و اقتصادی اینجا نمایش داده می‌شوند." /></Card>
          ))}
        </section>

        {categories.length > 0 && (
          <section className={styles.section} aria-labelledby="cats-title">
            <h2 id="cats-title" className={styles.sectionTitle}>دسته‌بندی‌ها</h2>
            <ul className={styles.cats}>
              {categories.map((c) => (
                <li key={c.slug}>
                  <Link to={`/search?cat=${c.slug}`} className={styles.cat}>
                    {c.title} <span className={styles.count}>{formatNumber(c.count)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className={styles.help} aria-labelledby="help-title">
          <span className={styles.helpIcon} aria-hidden="true"><LifeBuoy size={22} /></span>
          <div className={styles.helpText}>
            <h2 id="help-title" className={styles.helpTitle}>وسط آشپزی به مشکل خوردی؟</h2>
            <p>برنج شفته شد؟ غذا شور شد؟ راهنمای آشپزی کمکت می‌کنه.</p>
          </div>
          <Button as={Link} to="/help" variant="accent" size="sm">رفتن به راهنما</Button>
        </section>
      </div>
    </>
  );
}
