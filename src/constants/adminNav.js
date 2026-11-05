import { LayoutDashboard, UtensilsCrossed, Carrot, Tags, MessageCircleQuestion } from 'lucide-react';

export const ADMIN_NAV = [
  { to: '/admin', label: 'داشبورد', icon: LayoutDashboard, end: true },
  { to: '/admin/recipes', label: 'دستورها', icon: UtensilsCrossed },
  { to: '/admin/ingredients', label: 'مواد اولیه', icon: Carrot },
  { to: '/admin/categories', label: 'دسته‌بندی‌ها', icon: Tags },
  { to: '/admin/questions', label: 'پرسش و پاسخ', icon: MessageCircleQuestion },
];
