import { useEffect, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { SearchX, Lightbulb, LifeBuoy } from 'lucide-react';
import BottomSheet from '@/components/common/BottomSheet/BottomSheet';
import Button from '@/components/common/Button/Button';
import EmptyState from '@/components/common/EmptyState/EmptyState';
import ErrorState from '@/components/common/ErrorState/ErrorState';
import Skeleton from '@/components/common/Skeleton/Skeleton';
import CookingHeader from '@/components/cooking/CookingHeader';
import CookingBar from '@/components/cooking/CookingBar';
import StepCard from '@/components/cooking/StepCard';
import TimerPanel from '@/components/cooking/TimerPanel';
import TimerAlerts from '@/components/cooking/TimerAlerts';
import { PauseScreen, FinishScreen } from '@/components/cooking/CookingStates';
import { getRecipeBundle } from '@/services/contentService';
import { useAsync } from '@/hooks/useAsync';
import { useCookingSession } from '@/hooks/useCookingSession';
import { useNow } from '@/hooks/useNow';
import { useWakeLock } from '@/hooks/useWakeLock';
import { usePageTitle } from '@/hooks/usePageTitle';
import { findExpired, hasRunningTimers } from '@/utils/cookingSession';
import { stepIngredientAmounts } from '@/utils/cookingSteps';
import { playAlarm } from '@/utils/alarm';
import { toEnglishDigits } from '@/utils/persian';
import styles from './CookingPage.module.css';

function CookingSession({ recipe, ingredientsById, helpArticles, servingsParam }) {
  const { session, dispatch, stepCount } = useCookingSession({ recipe, servingsParam });
  const now = useNow(session ? hasRunningTimers(session) : false);
  const [tipsOpen, setTipsOpen] = useState(false);
  const [problemsOpen, setProblemsOpen] = useState(false);
  const firstRender = useRef(true);
  const stepIndex = session?.stepIndex ?? 0;

  useWakeLock(Boolean(session) && !session.finished && !session.paused);

  // Ring once when a running timer reaches zero (also catches timers that ended while the page was closed).
  useEffect(() => {
    if (session && findExpired(session, Date.now()).length > 0) {
      dispatch({ type: 'expire' });
      playAlarm();
    }
  }, [now, session, dispatch]);

  // New step: scroll to top and move focus to the title for screen readers.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    window.scrollTo({ top: 0 });
    document.getElementById('step-title')?.focus({ preventScroll: true });
  }, [stepIndex]);

  if (!session) {
    return <div className={styles.main} role="status" aria-label="در حال بارگذاری"><Skeleton height="12rem" /></div>;
  }

  const step = recipe.steps[session.stepIndex];

  if (session.finished) {
    return (
      <FinishScreen
        recipe={recipe}
        completedCount={session.completed.length}
        stepCount={stepCount}
        onBack={() => dispatch({ type: 'prev' })}
        onRestart={() => dispatch({ type: 'restart' })}
      />
    );
  }

  const ingredients = stepIngredientAmounts({ recipe, ingredientsById, step, servings: session.servings });

  return (
    <div className={styles.screen}>
      <CookingHeader
        recipe={recipe}
        stepIndex={session.stepIndex}
        stepCount={stepCount}
        completedCount={session.completed.length}
        onPause={() => dispatch({ type: 'pause' })}
      />
      <main className={styles.main}>
        <TimerAlerts
          session={session}
          steps={recipe.steps}
          currentStepId={step.id}
          now={now}
          onGoto={(index) => index >= 0 && dispatch({ type: 'goto', index })}
          onAck={(stepId) => dispatch({ type: 'timer', op: 'ack', stepId })}
        />
        <StepCard step={step} number={session.stepIndex + 1} ingredients={ingredients} completed={session.completed.includes(step.id)} />
        {step.duration && <TimerPanel step={step} timer={session.timers[step.id]} now={now} dispatch={dispatch} />}
      </main>

      <CookingBar
        isFirst={session.stepIndex === 0}
        isLast={session.stepIndex === stepCount - 1}
        tipCount={step.tips.length}
        onPrev={() => dispatch({ type: 'prev' })}
        onNext={() => dispatch({ type: 'next' })}
        onDone={() => dispatch({ type: 'complete', stepId: step.id })}
        onTips={() => setTipsOpen(true)}
        onProblems={() => setProblemsOpen(true)}
      />

      <BottomSheet open={tipsOpen} onClose={() => setTipsOpen(false)} title="نکات این مرحله">
        {step.tips.length ? (
          <ul className={styles.sheetList}>{step.tips.map((t) => <li key={t}><Lightbulb size={18} aria-hidden="true" /> <span>{t}</span></li>)}</ul>
        ) : (
          <p className={styles.muted}>برای این مرحله نکته‌ی خاصی نداریم. نشانه‌های «از کجا بفهمم آماده است؟» را دنبال کن.</p>
        )}
      </BottomSheet>

      <BottomSheet open={problemsOpen} onClose={() => setProblemsOpen(false)} title="مشکلات رایج">
        <p className={styles.muted}>پیشرفتت ذخیره می‌ماند و بعداً برمی‌گردی.</p>
        <ul className={styles.sheetLinks}>
          {helpArticles.map((a) => (
            <li key={a.slug}><Link to={`/help/${a.slug}`} className={styles.sheetLink}><LifeBuoy size={18} aria-hidden="true" /> {a.title}</Link></li>
          ))}
          <li><Link to="/help" className={styles.sheetLink}>همه‌ی راهنماهای آشپزی</Link></li>
        </ul>
      </BottomSheet>

      {session.paused && (
        <PauseScreen
          onResume={() => dispatch({ type: 'resume' })}
          onRestart={() => {
            if (window.confirm('پیشرفت این دستور پاک می‌شود و از مرحله‌ی اول شروع می‌کنی. ادامه می‌دهی؟')) dispatch({ type: 'restart' });
          }}
        />
      )}
    </div>
  );
}

/** Full-screen guided cooking: no site header or bottom bar. */
export default function CookingPage() {
  const { slug } = useParams();
  const [params] = useSearchParams();
  const bundle = useAsync(() => getRecipeBundle(slug), [slug]);
  const recipe = bundle.data?.recipe;
  usePageTitle(recipe ? `${recipe.title} — حالت آشپزی` : 'حالت آشپزی');

  const parsed = Number.parseInt(toEnglishDigits(params.get('servings') ?? ''), 10);
  const servingsParam = Number.isInteger(parsed) ? parsed : undefined;

  if (bundle.status === 'loading') {
    return <div className={styles.main} role="status" aria-label="در حال بارگذاری"><Skeleton height="14rem" /></div>;
  }
  if (bundle.status === 'error') {
    return <div className={styles.main}><ErrorState onRetry={bundle.reload} /></div>;
  }
  if (!recipe) {
    return (
      <div className={styles.main}>
        <EmptyState icon={SearchX} title="این دستور پیدا نشد" action={<Button as={Link} to="/search">جست‌وجوی غذا</Button>} />
      </div>
    );
  }
  if (recipe.steps.length === 0) {
    return (
      <div className={styles.main}>
        <EmptyState title="مراحل این دستور هنوز آماده نیست" description="به‌زودی اضافه می‌شود." action={<Button as={Link} to={`/recipe/${recipe.slug}`}>بازگشت به دستور</Button>} />
      </div>
    );
  }
  return <CookingSession key={slug} recipe={recipe} ingredientsById={bundle.data.ingredientsById} helpArticles={bundle.data.helpArticles} servingsParam={servingsParam} />;
}
