import { createLocalStore, isStringList } from '@/store/localStore';
import { useStoredList } from './useStoredList';

const pantryStore = createLocalStore('daneshpaz:pantry', [], isStringList);

/** Ingredient ids the user marked «دارم»; shared across recipes. */
export function usePantry() {
  return useStoredList(pantryStore);
}
