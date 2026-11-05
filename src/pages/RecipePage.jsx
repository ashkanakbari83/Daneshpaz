import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Clock, Flame, Timer, Users, ChefHat, SearchX } from 'lucide-react';
import Badge from '@/components/common/Badge/Badge';
import Button from '@/components/common/Button/Button';
import Card from '@/components/common/Card/Card';
import Skeleton from '@/components/common/Skeleton/Skeleton';
import EmptyState from '@/components/common/EmptyState/EmptyState';
import ErrorState from '@/components/common/ErrorState/ErrorState';
import RecipeArt from '@/components/recipe/RecipeArt';
import FavoriteButton from '@/components/recipe/FavoriteButton';
import ServingStepper from '@/components/recipe/ServingStepper';
import IngredientList from '@/components/recipe/IngredientList';
import CostSummary from '@/components/recipe/CostSummary';
import EquipmentList from '@/components/recipe/EquipmentList';
import { DIFFICULTY } from '@/constants/labels';
import { getRecipeBundle } from '@/services/contentService';
import { useAsync } from '@/hooks/useAsync';
import { usePantry } from '@/hooks/usePantry';
import { usePageTitle } from '@/hooks/usePageTitle';
import { computeRecipeCost } from '@/utils/cost';
import { formatDuration, formatNumber } from '@/utils';
import styles from './RecipePage.module.css';

function RecipeContent({ recipe, ingredientsById, helpArticles }) {
  const [servings, setServings] = useState(recipe.defaultServings);
  const pantry = usePantry();
  const difficulty = DIFFICULTY[recipe.difficulty];

  const cost = useMemo(
    () => computeRecipeCost({ recipe, ingredientsById, servings, atHomeIds: new Set(pantry.items) }),
    [recipe, ingredientsById, servings, pantry.items],
  );
  const hasEstimates = cost.lines.some((l) => l.estimate);

  return (
    <article>
      <div className={styles.top}>
        <RecipeArt recipe={recipe} className={styles.art} />
        <div className={styles.info}>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>{recipe.title}</h1>
            <FavoriteButton slug={recipe.slug} title={recipe.title} className={styles.fav} />
          </div>
          <p className={styles.desc}>{recipe.description}</p>
          <p><Badge tone="accent">دستور نمونه</Badge></p>
          <dl className={styles.facts}>
            <div><dt><Clock size={16} aria-hidden="true" /> آماده‌سازی</dt><dd>{formatDuration(recipe.prepTime)}</dd></div>
            <div><dt><Flame size={16} aria-hidden="true" /> پخت</dt><dd>{formatDuration(recipe.cookTime)}</dd></div>
            <div><dt><Timer size={16} aria-hidden="true" /> مجموع</dt><dd>{formatDuration(recipe.prepTime + recipe.cookTime)}</dd></div>
            <div><dt><ChefHat size={16} aria-hidden="true" /> سطح</dt><dd><Badge tone={difficulty.tone}>{difficulty.label}</Badge></dd></div>
            <div><dt><Users size={16} aria-hidden="true" /> پیش‌فرض</dt><dd>{formatNumber(recipe.defaultServings)} نفر</dd></div>
          </dl>
          <Button as={Link} to={`/cook/${recipe.slug}`} variant="accent" size="lg" fullWidth>شروع آشپزی</Button>
        </div>
      </div>

      <section className={styles.section} aria-labelledby="ing-title">
        <h2 id="ing-title" className={styles.h2}>مواد اولیه</h2>
        <div className={styles.servings}>
          <span>تعداد نفرات</span>
          <ServingStepper value={servings} onChange={(n) => setServings(Math.min(12, Math.max(1, n)))} />
        </div>
        {hasEstimates && (
          <p className={styles.hint}>نمک، روغن و ادویه با تعداد نفرات به‌صورت خطی زیاد نمی‌شوند؛ مقدارهای «تقریبی» را با چشم و مزه تنظیم کن.</p>
        )}
        <IngredientList lines={cost.lines} onToggleAtHome={pantry.toggle} />
      </section>

      <section className={styles.section} aria-labelledby="cost-title">
        <h2 id="cost-title" className={styles.h2}>هزینه‌ی تقریبی</h2>
        <CostSummary cost={cost} servings={servings} />
      </section>

      <section className={styles.section} aria-labelledby="eq-title">
        <h2 id="eq-title" className={styles.h2}>وسایل لازم</h2>
        <EquipmentList equipment={recipe.equipment} />
      </section>

      {recipe.beforeYouStart.length > 0 && (
        <section className={styles.section} aria-labelledby="before-title">
          <h2 id="before-title" className={styles.h2}>قبل از شروع</h2>
          <Card>
            <ul className={styles.notes}>
              {recipe.beforeYouStart.map((note) => <li key={note}>{note}</li>)}
            </ul>
          </Card>
        </section>
      )}

      {helpArticles.length > 0 && (
        <section className={styles.section} aria-labelledby="help-title">
          <h2 id="help-title" className={styles.h2}>مشکل‌های رایج این غذا</h2>
          <ul className={styles.links}>
            {helpArticles.map((a) => (
              <li key={a.slug}><Link to={`/help/${a.slug}`} className={styles.link}>{a.title}</Link></li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}

export default function RecipePage() {
  const { slug } = useParams();
  const bundle = useAsync(() => getRecipeBundle(slug), [slug]);
  usePageTitle(bundle.data?.recipe?.title ?? 'دستور غذا');

  return (
    <div className="container page">
      {bundle.status === 'loading' && (
        <div role="status" aria-label="در حال بارگذاری">
          <Skeleton height="14rem" /><div style={{ height: 'var(--space-4)' }} /><Skeleton shape="text" lines={4} />
        </div>
      )}
      {bundle.status === 'error' && <ErrorState onRetry={bundle.reload} />}
      {bundle.status === 'success' && !bundle.data.recipe && (
        <EmptyState
          icon={SearchX}
          title="این دستور پیدا نشد"
          description="شاید آدرس اشتباه است یا دستور حذف شده."
          action={<Button as={Link} to="/search">جست‌وجوی غذا</Button>}
        />
      )}
      {bundle.status === 'success' && bundle.data.recipe && <RecipeContent key={slug} {...bundle.data} />}
    </div>
  );
}
