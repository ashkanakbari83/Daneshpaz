import { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react';
import { getCookingStore } from '@/store/cookingStore';
import {
  createSession, hasProgress, normalizeSession, sessionReducer, MIN_SERVINGS, MAX_SERVINGS,
} from '@/utils/cookingSession';

const clamp = (n) => Math.min(MAX_SERVINGS, Math.max(MIN_SERVINGS, n));

/**
 * Persisted cooking session for a recipe. Returns { session, dispatch, stepCount };
 * `session` is null for the first render while it is created or restored.
 * A saved session is kept only if the cook made progress; otherwise the
 * servings from the URL (?servings=) win.
 */
export function useCookingSession({ recipe, servingsParam }) {
  const { slug } = recipe;
  const stepIds = useMemo(() => recipe.steps.map((s) => s.id), [recipe.steps]);
  const stepCount = stepIds.length;
  const store = getCookingStore(slug);

  const raw = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
  const session = useMemo(() => normalizeSession(raw, { slug, stepIds }), [raw, slug, stepIds]);

  useEffect(() => {
    const wanted = clamp(Number.isInteger(servingsParam) ? servingsParam : recipe.defaultServings);
    if (!session || (!hasProgress(session) && session.servings !== wanted)) {
      store.set(createSession({ slug, servings: wanted, now: Date.now() }));
    }
  }, [session, servingsParam, recipe.defaultServings, slug, store]);

  const dispatch = useCallback(
    (action) => {
      const current = normalizeSession(store.getSnapshot(), { slug, stepIds });
      if (!current) return;
      store.set(sessionReducer(current, { now: Date.now(), stepCount, ...action }));
    },
    [store, slug, stepIds, stepCount],
  );

  return { session, dispatch, stepCount };
}
