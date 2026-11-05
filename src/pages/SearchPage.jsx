import { useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import Button from '@/components/common/Button/Button';
import Input from '@/components/common/Input/Input';
import EmptyState from '@/components/common/EmptyState/EmptyState';
import { usePageTitle } from '@/hooks/usePageTitle';
import styles from './SearchPage.module.css';

const QUICK_LABELS = {
  fast: 'غذای سریع',
  budget: 'غذای اقتصادی',
  pantry: 'با مواد موجود',
  beginner: 'مناسب مبتدی‌ها',
};

export default function SearchPage() {
  usePageTitle('جست‌وجوی غذا');
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const quick = QUICK_LABELS[params.get('quick')];

  const handleSubmit = (event) => {
    event.preventDefault();
    const value = new FormData(event.currentTarget).get('q')?.toString().trim();
    setParams(value ? { q: value } : {});
  };

  return (
    <div className="container page">
      <h1 className="page-title">جست‌وجوی غذا</h1>
      <form onSubmit={handleSubmit} role="search" className={styles.form}>
        <Input
          key={q}
          label="نام غذا یا مواد اولیه"
          hideLabel
          type="search"
          name="q"
          defaultValue={q}
          placeholder="نام غذا یا مواد اولیه..."
          startIcon={<Search size={20} />}
          enterKeyHint="search"
          containerClassName={styles.field}
        />
        <Button type="submit">جست‌وجو</Button>
      </form>
      <EmptyState
        icon={Search}
        title="جست‌وجوی دستورها به‌زودی فعال می‌شود"
        description={
          q
            ? `عبارت «${q}» ثبت شد؛ نتایج بعد از اضافه شدن دستورها اینجا نمایش داده می‌شود.`
            : quick
              ? `دسته‌ی «${quick}» بعد از اضافه شدن دستورها اینجا نمایش داده می‌شود.`
              : 'بعد از اضافه شدن دستورها می‌تونی با نام غذا یا مواد اولیه جست‌وجو کنی.'
        }
      />
    </div>
  );
}
