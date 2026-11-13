import { fail } from './db.js';

function toggle(list, id) {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}

export function togglePantry(db, ingredientId) {
  if (!db.ingredients[ingredientId]) return fail('ingredient_not_found');
  const has = !db.user.pantry.includes(ingredientId);
  return { ok: true, has, db: { ...db, user: { ...db.user, pantry: toggle(db.user.pantry, ingredientId) } } };
}

export function toggleEquipment(db, equipmentId) {
  if (!db.equipment[equipmentId]) return fail('equipment_not_found');
  const owned = !db.user.equipment.includes(equipmentId);
  return { ok: true, owned, db: { ...db, user: { ...db.user, equipment: toggle(db.user.equipment, equipmentId) } } };
}

export function toggleFavorite(db, recipeId) {
  if (!db.recipes[recipeId]) return fail('recipe_not_found');
  const fav = !db.user.favorites.includes(recipeId);
  return { ok: true, fav, db: { ...db, user: { ...db.user, favorites: toggle(db.user.favorites, recipeId) } } };
}
