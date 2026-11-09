import { useCallback, useEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import { getCookingStore } from '@/store/cookingStore';
import {
  createSession, hasProgress, isStale, normalizeSession, sessionReducer, MIN_SERVINGS, MAX_SERVINGS,
} from '@/utils/cookingSession';

const clamp = (n) => Math.min(MAX_SERVINGS, Math.max(MIN_SERVINGS, n));

/**
 * Persisted cooking session for a recipe. Returns { session, dispatch, stepCount };
 * `session` is null for the first render while it is created or restored.
 * A saved session is kept only if the cook made progress and it is fresh (12 h);
 * otherwise the servings from the URL (?servings=) win. A session that was
 * already finished when the page opened is restarted.
 */
export function useCookingSession({ recipe, servingsParam }) {
  const { slug } = recipe;
  const stepIds = useMemo(() => recipe.steps.map((s) => s.id), [recipe.steps]);
  const stepCount = stepIds.length;
  const store = getCookingStore(slug);

  const raw = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
  const session = useMemo(() => normalizeSession(raw, { slug, stepIds }), [raw, slug, stepIds]);

  const firstLoad = useRef(true);
  useEffect(() => {
    const wanted = clamp(Number.isInteger(servingsParam) ? servingsParam : recipe.defaultServings);
    const opening = firstLoad.current;
    firstLoad.current = false;
    const abandoned = session && (isStale(session) || (opening && session.finished));
    if (!session || abandoned || (!hasProgress(session) && session.servings !== wanted)) {
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
