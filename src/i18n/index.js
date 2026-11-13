import { messages } from './messages.js';
import { messagesRecipe } from './messagesRecipe.js';
import { messagesCook } from './messagesCook.js';

export const ALL_MESSAGES = { ...messages, ...messagesRecipe, ...messagesCook };
export const DEFAULT_LOCALE = 'fa';
export const LOCALES = { fa: { dir: 'rtl' }, en: { dir: 'ltr' } };

// t('card.missing', { n: 2 }) → «۲ قلم کم». Params are already-formatted strings/numbers.
export function translate(key, params = {}, locale = DEFAULT_LOCALE) {
  const entry = ALL_MESSAGES[key];
  if (!entry) return key; // visible in UI + caught by tests
  const text = entry[locale === 'en' ? 1 : 0];
  return text.replace(/\{(\w+)\}/g, (m, name) => (name in params ? String(params[name]) : m));
}
