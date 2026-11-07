/** Allowed values shared by validation and the database CHECK constraints. */
export const DIFFICULTIES = ['easy', 'medium', 'hard'];
export const MEALS = ['breakfast', 'lunch', 'dinner'];
export const HEAT_LEVELS = ['none', 'low', 'medium', 'high'];
export const SCALING_RULES = ['linear', 'nonlinear', 'fixed', 'manual'];
export const RECIPE_STATUSES = ['draft', 'review', 'published', 'archived'];
export const HELP_STATUSES = ['draft', 'published'];
export const BASE_UNITS = ['g', 'ml', 'piece'];
export const UNITS = ['g', 'kg', 'ml', 'l', 'tsp', 'tbsp', 'cup', 'piece', 'clove', 'slice', 'bunch', 'pack', 'can', 'pinch', 'to_taste'];
export const EQUIPMENT_KEYS = ['pot', 'pan', 'knife', 'board', 'oven', 'mixer', 'spatula', 'strainer', 'grater'];
export const PRICE_STATUSES = ['sample', 'estimated', 'verified'];
export const CONFIDENCES = ['low', 'medium', 'high'];
export const FEEDBACK_TYPES = ['helpful', 'not-helpful', 'report'];
export const ROLES = ['admin', 'editor'];
export const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
