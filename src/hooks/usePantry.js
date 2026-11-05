import { createLocalStore } from '@/store/localStore';
import { useStoredList } from './useStoredList';

const pantryStore = createLocalStore('daneshpaz:pantry', []);

/** Ingredient ids the user marked «دارم»; shared across recipes. */
export function usePantry() {
  return useStoredList(pantryStore);
}
