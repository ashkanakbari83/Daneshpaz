import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, SearchX } from 'lucide-react';
import Badge from '@/components/common/Badge/Badge';
import Button from '@/components/common/Button/Button';
import Input from '@/components/common/Input/Input';
import Select from '@/components/common/Select/Select';
import EmptyState from '@/components/common/EmptyState/EmptyState';
import ErrorState from '@/components/common/ErrorState/ErrorState';
import RecipeGrid from '@/components/recipe/RecipeGrid';
import RecipeGridSkeleton from '@/components/recipe/RecipeGridSkeleton';
import FilterSheet from '@/components/search/FilterSheet';
import ActiveFilters from '@/components/search/ActiveFilters';
import { SORT_OPTIONS } from '@/constants/labels';
import { getCatalog } from '@/services/contentService';
import { useAsync } from '@/hooks/useAsync';
import { usePageTitle } from '@/hooks/usePageTitle';
import { defaultCostOf } from '@/utils/cost';
import { searchRecipes } from '@/utils/search';
import { DEFAULT_FILTERS, parseFilters, serializeFilters, describeFilters, removeFilter, countActiveFilters } from '@/utils/filters';
import { formatNumber } from '@/utils/persian';
import styles from './SearchPage.module.css';

const SUGGESTIONS = ['املت', 'ماکارونی', 'تخم‌مرغ', 'سیب‌زمینی', 'عدس'];

export default function SearchPage() {
  usePageTitle('جست‌وجوی غذا');
  const [params, setParams] = useSearchParams();
  const filters = useMemo(() => parseFilters(params), [params]);
  const catalog = useAsync(getCatalog, []);
  const [sheetOpen, setSheetOpen] = useState(params.get('pantry') === '1');

  // `?pantry=1` is a one-time UI hint from the home page; drop it from the URL.
  useEffect(() => {
    if (params.get('pantry')) {
      const next = new URLSearchParams(params);
      next.delete('pantry');
      setParams(next, { replace: true });
    }
  }, [params, setParams]);

  const update = (next) => setParams(serializeFilters(next));

  const results = useMemo(() => {
    if (!catalog.data) return [];
    const { recipes, ingredientsById, categoriesBySlug } = catalog.data;
    return searchRecipes({
      recipes,
      ctx: { ingredientsById, categoriesBySlug },
      filters,
      costOf: (recipe) => defaultCostOf(recipe, ingredientsById),
    });
  }, [catalog.data, filters]);

  const chips = catalog.data ? describeFilters(filters, catalog.data) : [];
  const activeCount = countActiveFilters(filters);

  const handleSubmit = (event) => {
    event.preventDefault();
    const q = new FormData(event.currentTarget).get('q')?.toString().trim() ?? '';
    update({ ...filters, q });
  };

  return (
    <div className="container page">
      <h1 className="page-title">جست‌وجوی غذا</h1>

      <form onSubmit={handleSubmit} role="search" className={styles.form}>
        <Input
          key={filters.q}
          label="نام غذا یا مواد اولیه"
          hideLabel
          type="search"
          name="q"
          defaultValue={filters.q}
          placeholder="نام غذا یا مواد اولیه..."
          startIcon={<Search size={20} />}
          enterKeyHint="search"
          containerClassName={styles.field}
        />
        <Button type="submit">جست‌وجو</Button>
      </form>

      {!filters.q && (
        <ul className={styles.suggestions} aria-label="پیشنهاد جست‌وجو">
          {SUGGESTIONS.map((s) => (
            <li key={s}>
              <button type="button" className={styles.suggestion} onClick={() => update({ ...filters, q: s })}>{s}</button>
            </li>
          ))}
        </ul>
      )}

      <div className={styles.toolbar}>
        <Button variant="secondary" size="sm" iconStart={<SlidersHorizontal size={16} aria-hidden="true" />} onClick={() => setSheetOpen(true)}>
          فیلترها {activeCount > 0 && <Badge tone="primary">{formatNumber(activeCount)}</Badge>}
        </Button>
        <Select
          label="مرتب‌سازی"
          hideLabel
          value={filters.sort}
          onChange={(e) => update({ ...filters, sort: e.target.value })}
          options={SORT_OPTIONS}
          className={styles.sort}
        />
      </div>

      {catalog.data && (
        <ActiveFilters
          chips={chips}
          onRemove={(chip) => update(removeFilter(filters, chip.key, chip.value))}
          onClear={() => update({ ...DEFAULT_FILTERS, q: filters.q, sort: filters.sort })}
        />
      )}

      <div className={styles.results}>
        {catalog.status === 'loading' && <RecipeGridSkeleton />}
        {catalog.status === 'error' && <ErrorState onRetry={catalog.reload} />}
        {catalog.status === 'success' && (
          <>
            <p className={styles.count} aria-live="polite">
              {results.length ? `${formatNumber(results.length)} غذا پیدا شد` : 'غذایی پیدا نشد'}
            </p>
            {results.length > 0 ? (
              <RecipeGrid items={results} />
            ) : (
              <EmptyState
                icon={SearchX}
                title="غذایی با این شرایط پیدا نشد"
                description="عبارت جست‌وجو را ساده‌تر کن یا بعضی فیلترها را بردار."
                action={<Button variant="secondary" onClick={() => update({ ...DEFAULT_FILTERS })}>پاک کردن همه‌ی فیلترها</Button>}
              />
            )}
          </>
        )}
      </div>

      {catalog.data && (
        <FilterSheet
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          filters={filters}
          ingredients={catalog.data.ingredients}
          onApply={(next) => {
            update(next);
            setSheetOpen(false);
          }}
        />
      )}
    </div>
  );
}
