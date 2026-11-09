import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, LifeBuoy, ChevronLeft } from 'lucide-react';
import Badge from '@/components/common/Badge/Badge';
import Input from '@/components/common/Input/Input';
import Skeleton from '@/components/common/Skeleton/Skeleton';
import EmptyState from '@/components/common/EmptyState/EmptyState';
import ErrorState from '@/components/common/ErrorState/ErrorState';
import OptionGroup from '@/components/common/OptionGroup/OptionGroup';
import { getHelpIndex } from '@/services/contentService';
import { useAsync } from '@/hooks/useAsync';
import { usePageTitle } from '@/hooks/usePageTitle';
import { normalizeText, tokenize } from '@/utils/search';
import styles from './HelpPage.module.css';

export default function HelpPage() {
  usePageTitle('راهنمای آشپزی');
  const help = useAsync(getHelpIndex, []);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState(null);

  const visible = useMemo(() => {
    if (!help.data) return [];
    const tokens = tokenize(query);
    return help.data.articles.filter((a) => {
      if (category && a.category !== category) return false;
      const text = normalizeText(`${a.title} ${a.summary} ${a.causes.join(' ')}`);
      return tokens.every((t) => text.includes(t));
    });
  }, [help.data, query, category]);

  const categoryTitle = (key) => help.data?.categories.find((c) => c.key === key)?.title ?? '';

  return (
    <div className="container page">
      <h1 className="page-title">راهنمای آشپزی</h1>
      <p className={styles.lead}>وسط آشپزی به مشکل خوردی؟ مشکلت را جست‌وجو کن.</p>

      <Input
        label="جست‌وجوی مشکل"
        hideLabel
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="مثلاً برنج، شور شدن، تخم‌مرغ..."
        startIcon={<Search size={20} />}
      />

      {help.status === 'success' && (
        <div className={styles.cats}>
          <OptionGroup
            legend="دسته‌بندی"
            value={category}
            onChange={setCategory}
            options={help.data.categories.map((c) => ({ value: c.key, label: c.title }))}
          />
        </div>
      )}

      <div className={styles.list}>
        {help.status === 'loading' && <Skeleton height="12rem" />}
        {help.status === 'error' && <ErrorState onRetry={help.reload} />}
        {help.status === 'success' && (visible.length ? (
          <ul className={styles.items}>
            {visible.map((a) => (
              <li key={a.slug}>
                <Link to={`/help/${a.slug}`} className={styles.item}>
                  <span className={styles.itemMain}>
                    <span className={styles.itemTitle}>{a.title}</span>
                    <span className={styles.itemSummary}>{a.summary}</span>
                    <Badge tone="primary">{categoryTitle(a.category)}</Badge>
                  </span>
                  <ChevronLeft size={18} aria-hidden="true" className={styles.chevron} />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState icon={LifeBuoy} title="پاسخی پیدا نشد" description="عبارت دیگری را امتحان کن یا دسته‌بندی را بردار." />
        ))}
      </div>
    </div>
  );
}
