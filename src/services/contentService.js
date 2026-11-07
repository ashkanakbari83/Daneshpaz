import * as demo from './demoSource';
import * as remote from './apiSource';

/**
 * The only place pages get content from. Set VITE_CONTENT_SOURCE=api (and run
 * `npm run server`) to read from the backend; otherwise bundled demo data is used.
 */
export const isApiMode = import.meta.env.VITE_CONTENT_SOURCE === 'api';
const source = isApiMode ? remote : demo;

export const getCatalog = () => source.getCatalog();
export const getRecipeBundle = (slug) => source.getRecipeBundle(slug);
export const getHelpIndex = () => source.getHelpIndex();
export const getHelpArticle = (slug) => source.getHelpArticle(slug);
export const sendFeedback = (payload) => source.sendFeedback(payload);
