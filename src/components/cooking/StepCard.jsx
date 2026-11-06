import { CheckCircle2, AlertTriangle, Clock, Flame } from 'lucide-react';
import Badge from '@/components/common/Badge/Badge';
import { HEAT_LABELS } from '@/data/steps';
import { formatDuration, formatNumber } from '@/utils';
import styles from './StepCard.module.css';

const HEAT_LEVEL = { none: 0, low: 1, medium: 2, high: 3 };

function Heat({ heat }) {
  const level = HEAT_LEVEL[heat] ?? 0;
  return (
    <Badge tone={level >= 3 ? 'terracotta' : level > 0 ? 'accent' : 'neutral'}>
      {level > 0 && (
        <span className={styles.flames} aria-hidden="true">
          {Array.from({ length: level }, (_, i) => <Flame key={i} size={14} />)}
        </span>
      )}
      {HEAT_LABELS[heat]}
    </Badge>
  );
}

/** One step, with everything a beginner needs to do it and to know it is done. */
export default function StepCard({ step, number, ingredients, completed }) {
  return (
    <article className={styles.card} aria-labelledby="step-title">
      <div className={styles.meta}>
        <span className={styles.number} aria-hidden="true">{formatNumber(number)}</span>
        <Heat heat={step.heat} />
        {step.duration && (
          <Badge icon={<Clock size={14} />}>حدود {formatDuration(Math.round(step.duration / 60))}</Badge>
        )}
        {completed && <Badge tone="success" icon={<CheckCircle2 size={14} />}>انجام شده</Badge>}
      </div>

      <h1 id="step-title" className={styles.title} tabIndex={-1}>{step.title}</h1>
      <p className={styles.description}>{step.description}</p>

      {ingredients.length > 0 && (
        <section aria-labelledby="step-ing">
          <h2 id="step-ing" className={styles.h2}>مواد این مرحله</h2>
          <ul className={styles.ingredients}>
            {ingredients.map((i) => (
              <li key={i.ingredientId} className={styles.ingredient}>
                <span>{i.name}{i.optional && <span className={styles.optional}> (اختیاری)</span>}</span>
                <strong>{i.amount}</strong>
              </li>
            ))}
          </ul>
        </section>
      )}

      {step.warnings.length > 0 && (
        <section className={styles.warning} aria-labelledby="step-warn">
          <h2 id="step-warn" className={styles.warnTitle}><AlertTriangle size={20} aria-hidden="true" /> حواست باشه</h2>
          <ul className={styles.list}>{step.warnings.map((w) => <li key={w}>{w}</li>)}</ul>
        </section>
      )}

      <section className={styles.cues} aria-labelledby="step-cues">
        <h2 id="step-cues" className={styles.cuesTitle}>از کجا بفهمم آماده است؟</h2>
        <ul className={styles.cueList}>
          {step.doneCues.map((cue) => (
            <li key={cue} className={styles.cue}>
              <CheckCircle2 size={22} aria-hidden="true" />
              <span>{cue}</span>
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}
