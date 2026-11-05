import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Info } from 'lucide-react';
import Button from '@/components/common/Button/Button';
import EmptyState from '@/components/common/EmptyState/EmptyState';
import ErrorState from '@/components/common/ErrorState/ErrorState';
import RecipeGrid from '@/components/recipe/RecipeGrid';
import RecipeGridSkeleton from '@/components/recipe/RecipeGridSkeleton';
import { getCatalog } from '@/services/contentService';
import { useAsync } from '@/hooks/useAsync';
import { useFavorites } from '@/hooks/useFavorites';
import { usePageTitle } from '@/hooks/usePageTitle';
import { defaultCostOf } from '@/utils/cost';
import styles from './FavoritesPage.module.css';

export default function FavoritesPage() {
  usePageTitle('علاقه‌مندی‌ها');
  const catalog = useAsync(getCatalog, []);
  const favorites = useFavorites();

  const items = useMemo(() => {
    if (!catalog.data) return [];
    const { recipes, ingredientsById } = catalog.data;
    return favorites.items
      .map((slug) => recipes.find((r) => r.slug === slug))
      .filter(Boolean)
      .map((recipe) => ({ recipe, cost: defaultCostOf(recipe, ingredientsById) }));
  }, [catalog.data, favorites.items]);

  return (
    <div className="container page">
      <h1 className="page-title">علاقه‌مندی‌ها</h1>
      <p className={styles.note}>
        <Info size={18} aria-hidden="true" />
        <span>بدون نیاز به ثبت‌نام، علاقه‌مندی‌ها فقط در همین مرورگر ذخیره می‌شوند و روی دستگاه یا مرورگر دیگر دیده نمی‌شوند.</span>
      </p>
      {catalog.status === 'loading' && <RecipeGridSkeleton count={2} />}
      {catalog.status === 'error' && <ErrorState onRetry={catalog.reload} />}
      {catalog.status === 'success' && (items.length ? (
        <RecipeGrid items={items} />
      ) : (
        <EmptyState
          icon={Heart}
          title="هنوز چیزی ذخیره نکرده‌ای"
          description="روی قلب کنار هر دستور بزن تا اینجا ببینی‌اش."
          action={<Button as={Link} to="/search">جست‌وجوی غذا</Button>}
        />
      ))}
    </div>
  );
}
