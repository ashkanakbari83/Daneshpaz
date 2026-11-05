import { Home, Search, Heart, LifeBuoy } from 'lucide-react';

/** Primary public navigation, shared by the header, bottom bar and menu sheet. */
export const PRIMARY_NAV = [
  { to: '/', label: 'خانه', icon: Home, end: true },
  { to: '/search', label: 'جست‌وجو', longLabel: 'جست‌وجوی غذا', icon: Search },
  { to: '/favorites', label: 'علاقه‌مندی‌ها', icon: Heart },
  { to: '/help', label: 'راهنمای آشپزی', icon: LifeBuoy },
];
