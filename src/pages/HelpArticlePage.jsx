import { Link, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowRight, ExternalLink, SearchX } from 'lucide-react';
import Badge from '@/components/common/Badge/Badge';
import Button from '@/components/common/Button/Button';
import Card from '@/components/common/Card/Card';
import Skeleton from '@/components/common/Skeleton/Skeleton';
import EmptyState from '@/components/common/EmptyState/EmptyState';
import ErrorState from '@/components/common/ErrorState/ErrorState';
import FeedbackBar from '@/components/help/FeedbackBar';
import { getHelpArticle } from '@/services/contentService';
import { useAsync } from '@/hooks/useAsync';
import { usePageTitle } from '@/hooks/usePageTitle';
import styles from './HelpArticlePage.module.css';

export default function HelpArticlePage() {
  const { slug } = useParams();
  const result = useAsync(() => getHelpArticle(slug), [slug]);
  const article = result.data?.article;
  usePageTitle(article?.title ?? 'پاسخ مشکل آشپزی');

  return (
    <div className="container page">
      <Link to="/help" className={styles.back}>
        {/* In RTL, "back" points right. */}
        <ArrowRight size={20} aria-hidden="true" /> همه‌ی راهنماها
      </Link>

      {result.status === 'loading' && <Skeleton height="16rem" />}
      {result.status === 'error' && <ErrorState onRetry={result.reload} />}
      {result.status === 'success' && !article && (
        <EmptyState icon={SearchX} title="این راهنما پیدا نشد" action={<Button as={Link} to="/help">رفتن به راهنما</Button>} />
      )}

      {article && (
        <article className={styles.article}>
          <header>
            <Badge tone="primary">{result.data.category?.title}</Badge>
            <h1 className={styles.title}>{article.title}</h1>
          </header>

          {!article.reviewed && (
            <p className={styles.demo} role="note">این پاسخ نمونه است و هنوز توسط کارشناس آشپزی یا ایمنی غذا بازبینی نشده.</p>
          )}

          <section aria-labelledby="causes">
            <h2 id="causes" className={styles.h2}>چرا این اتفاق می‌افتد؟</h2>
            <ul className={styles.bullets}>{article.causes.map((c) => <li key={c}>{c}</li>)}</ul>
          </section>

          <section aria-labelledby="solution">
            <h2 id="solution" className={styles.h2}>راه‌حل قدم‌به‌قدم</h2>
            <ol className={styles.steps}>{article.steps.map((s) => <li key={s}>{s}</li>)}</ol>
          </section>

          {article.safety.length > 0 && (
            <section className={styles.safety} aria-labelledby="safety">
              <h2 id="safety" className={styles.safetyTitle}><AlertTriangle size={22} aria-hidden="true" /> نکته‌ی ایمنی</h2>
              <ul className={styles.bullets}>{article.safety.map((s) => <li key={s}>{s}</li>)}</ul>
            </section>
          )}

          {result.data.relatedRecipes.length > 0 && (
            <section aria-labelledby="related">
              <h2 id="related" className={styles.h2}>دستورهای مرتبط</h2>
              <ul className={styles.links}>
                {result.data.relatedRecipes.map((r) => (
                  <li key={r.slug}><Link to={`/recipe/${r.slug}`} className={styles.link}>{r.title}</Link></li>
                ))}
              </ul>
            </section>
          )}

          {article.references.length > 0 && (
            <section aria-labelledby="refs">
              <h2 id="refs" className={styles.h2}>منابع</h2>
              <ul className={styles.links}>
                {article.references.map((ref) => (
                  <li key={ref.url}>
                    <a href={ref.url} target="_blank" rel="noopener noreferrer" className={styles.link}>
                      {ref.title} <ExternalLink size={16} aria-hidden="true" />
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <FeedbackBar slug={article.slug} />
        </article>
      )}
    </div>
  );
}
