import { useMemo, useSyncExternalStore } from 'react';
import { getCookingStore } from '@/store/cookingStore';
import { normalizeSession, progressStatus } from '@/utils/cookingSession';

/**
 * Saved cooking state for one recipe, for the recipe page:
 * { status: 'none' | 'in-progress' | 'finished', session }.
 */
export function useCookingProgress(recipe) {
  const store = getCookingStore(recipe.slug);
  const raw = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
  return useMemo(() => {
    const session = normalizeSession(raw, { slug: recipe.slug, stepIds: recipe.steps.map((s) => s.id) });
    return { status: progressStatus(session), session };
  }, [raw, recipe.slug, recipe.steps]);
}
