import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Clock, Flame, Timer, Users, ChefHat, SearchX, AlertTriangle, Lightbulb } from 'lucide-react';
import Badge from '@/components/common/Badge/Badge';
import Button from '@/components/common/Button/Button';
import Card from '@/components/common/Card/Card';
import Disclosure from '@/components/common/Disclosure/Disclosure';
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
import { clearCookingSession } from '@/store/cookingStore';
import { useAsync } from '@/hooks/useAsync';
import { useCookingProgress } from '@/hooks/useCookingProgress';
import { usePantry } from '@/hooks/usePantry';
import { usePageTitle } from '@/hooks/usePageTitle';
import { computeRecipeCost } from '@/utils/cost';
import { collectStepNotes } from '@/utils/recipeNotes';
import { formatDuration, formatNumber } from '@/utils';
import styles from './RecipePage.module.css';

/** Start / continue cooking. Saved progress is offered first; «شروع از اول» clears it. */
function CookingAction({ recipe, servings, progress }) {
  const slug = recipe.slug;
  if (recipe.steps.length === 0) {
    return <Button variant="accent" size="lg" fullWidth disabled>مراحل این دستور هنوز آماده نیست</Button>;
  }
  if (progress.status === 'in-progress') {
    const { session } = progress;
    return (
      <div className={styles.cta}>
        <Button as={Link} to={`/cook/${slug}`} variant="accent" size="lg" fullWidth>
          ادامه‌ی آشپزی · مرحله‌ی {formatNumber(session.stepIndex + 1)} از {formatNumber(recipe.steps.length)}
        </Button>
        {servings !== session.servings && (
          <p className={styles.ctaHint}>ادامه‌ی آشپزی با {formatNumber(session.servings)} نفر انجام می‌شود. برای تغییر، «شروع از اول» را بزن.</p>
        )}
        <Button as={Link} to={`/cook/${slug}?servings=${servings}`} variant="ghost" size="sm" onClick={() => clearCookingSession(slug)}>
          شروع از اول با {formatNumber(servings)} نفر
        </Button>
      </div>
    );
  }
  return (
    <div className={styles.cta}>
      <Button as={Link} to={`/cook/${slug}?servings=${servings}`} variant="accent" size="lg" fullWidth onClick={() => clearCookingSession(slug)}>
        شروع آشپزی
      </Button>
      <p className={styles.ctaHint}>{formatNumber(recipe.steps.length)} مرحله، با تایمر و نشانه‌هایی که می‌گوید هر مرحله کی تمام شده.</p>
    </div>
  );
}

function RecipeContent({ recipe, ingredientsById, helpArticles }) {
  const progress = useCookingProgress(recipe);
  const [servings, setServings] = useState(progress.status === 'in-progress' ? progress.session.servings : recipe.defaultServings);
  const pantry = usePantry();
  const difficulty = DIFFICULTY[recipe.difficulty];

  const cost = useMemo(
    () => computeRecipeCost({ recipe, ingredientsById, servings, atHomeIds: new Set(pantry.items) }),
    [recipe, ingredientsById, servings, pantry.items],
  );
  const notes = useMemo(() => collectStepNotes(recipe.steps), [recipe.steps]);
  const hasEstimates = cost.lines.some((l) => l.estimate);
  const noteCount = notes.tips.length + notes.warnings.length;

  return (
    <article className={styles.article}>
      <div className={styles.top}>
        <RecipeArt recipe={recipe} className={styles.art} />
        <div className={styles.info}>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>{recipe.title}</h1>
            <FavoriteButton slug={recipe.slug} title={recipe.title} className={styles.fav} />
          </div>
          <p className={styles.desc}>{recipe.description} <Badge tone="accent">دستور نمونه</Badge></p>
          <dl className={styles.facts}>
            <div><dt><Clock size={14} aria-hidden="true" /> آماده‌سازی</dt><dd>{formatDuration(recipe.prepTime)}</dd></div>
            <div><dt><Flame size={14} aria-hidden="true" /> پخت</dt><dd>{formatDuration(recipe.cookTime)}</dd></div>
            <div><dt><Timer size={14} aria-hidden="true" /> مجموع</dt><dd>{formatDuration(recipe.prepTime + recipe.cookTime)}</dd></div>
            <div><dt><ChefHat size={14} aria-hidden="true" /> سطح</dt><dd><Badge tone={difficulty.tone}>{difficulty.label}</Badge></dd></div>
            <div><dt><Users size={14} aria-hidden="true" /> پیش‌فرض</dt><dd>{formatNumber(recipe.defaultServings)} نفر</dd></div>
          </dl>
          <CookingAction recipe={recipe} servings={servings} progress={progress} />
        </div>
      </div>

      <div className={styles.sections}>
        <section aria-labelledby="ing-title">
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

        <section aria-labelledby="cost-title">
          <h2 id="cost-title" className={styles.h2}>هزینه‌ی تقریبی</h2>
          <CostSummary cost={cost} servings={servings} />
        </section>

        <section aria-labelledby="eq-title">
          <h2 id="eq-title" className={styles.h2}>وسایل لازم</h2>
          <EquipmentList equipment={recipe.equipment} />
        </section>

        {recipe.beforeYouStart.length > 0 && (
          <section aria-labelledby="before-title">
            <h2 id="before-title" className={styles.h2}>قبل از شروع</h2>
            <Card>
              <ul className={styles.notes}>
                {recipe.beforeYouStart.map((note) => <li key={note}>{note}</li>)}
              </ul>
            </Card>
          </section>
        )}

        {recipe.steps.length > 0 && (
          <section aria-labelledby="steps-title">
            <h2 id="steps-title" className={styles.h2}>مراحل پخت</h2>
            <ol className={styles.steps}>
              {recipe.steps.map((step, i) => (
                <li key={step.id} className={styles.step}>
                  <span className={styles.stepNo} aria-hidden="true">{formatNumber(i + 1)}</span>
                  <div className={styles.stepBody}>
                    <strong className={styles.stepTitle}>{step.title}</strong>
                    <p>{step.description}</p>
                    {step.duration && <small className={styles.stepTime}><Clock size={12} aria-hidden="true" /> حدود {formatDuration(Math.max(1, Math.round(step.duration / 60)))}</small>}
                  </div>
                </li>
              ))}
            </ol>
          </section>
        )}

        {noteCount > 0 && (
          <Disclosure title="نکات و اشتباه‌های رایج" count={noteCount}>
            {notes.warnings.length > 0 && (
              <>
                <h3 className={styles.h3}><AlertTriangle size={16} aria-hidden="true" /> حواست باشه</h3>
                <ul className={styles.noteList}>
                  {notes.warnings.map((n) => <li key={n.text}>{n.text} <small>(مرحله‌ی {formatNumber(n.step)})</small></li>)}
                </ul>
              </>
            )}
            {notes.tips.length > 0 && (
              <>
                <h3 className={styles.h3}><Lightbulb size={16} aria-hidden="true" /> نکته‌ها</h3>
                <ul className={styles.noteList}>
                  {notes.tips.map((n) => <li key={n.text}>{n.text} <small>(مرحله‌ی {formatNumber(n.step)})</small></li>)}
                </ul>
              </>
            )}
          </Disclosure>
        )}

        {helpArticles.length > 0 && (
          <section aria-labelledby="help-title">
            <h2 id="help-title" className={styles.h2}>مشکل‌های رایج این غذا</h2>
            <ul className={styles.links}>
              {helpArticles.map((a) => (
                <li key={a.slug}><Link to={`/help/${a.slug}`} className={styles.link}>{a.title}</Link></li>
              ))}
            </ul>
          </section>
        )}
      </div>
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
          <Skeleton height="7rem" /><div style={{ height: 'var(--space-3)' }} /><Skeleton shape="text" lines={4} />
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
