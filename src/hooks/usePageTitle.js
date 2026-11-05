import { useEffect } from 'react';

const BRAND = 'دانشپز';

/** Sets document.title to «عنوان | دانشپز» while the page is mounted. */
export function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} | ${BRAND}` : `${BRAND} — آشپزی کن، حتی اگه بلد نیستی!`;
  }, [title]);
}
