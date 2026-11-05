import { createLocalStore } from '@/store/localStore';
import { useStoredList } from './useStoredList';

const favoritesStore = createLocalStore('daneshpaz:favorites', []);

/** Favorite recipe slugs, saved in this browser (no account needed). */
export function useFavorites() {
  return useStoredList(favoritesStore);
}
