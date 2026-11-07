import { createBrowserRouter } from 'react-router-dom';
import AppShell from '@/components/layout/AppShell/AppShell';
import AdminLayout from '@/admin/components/AdminLayout';
import RequireAuth from '@/admin/auth/RequireAuth';
import RouteError from './RouteError';

/** Code-split every page: each route's chunk downloads only when first visited. */
const page = (load) => async () => ({ Component: (await load()).default });

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    errorElement: <RouteError />,
    children: [
      { index: true, lazy: page(() => import('@/pages/HomePage')) },
      { path: 'search', lazy: page(() => import('@/pages/SearchPage')) },
      { path: 'recipe/:slug', lazy: page(() => import('@/pages/RecipePage')) },
      { path: 'favorites', lazy: page(() => import('@/pages/FavoritesPage')) },
      { path: 'help', lazy: page(() => import('@/pages/HelpPage')) },
      { path: 'help/:slug', lazy: page(() => import('@/pages/HelpArticlePage')) },
      { path: 'design-system', lazy: page(() => import('@/pages/DesignSystemPage')) },
      { path: '*', lazy: page(() => import('@/pages/NotFoundPage')) },
    ],
  },
  // Cooking mode is full-screen: no header or bottom navigation.
  {
    path: 'cook/:slug',
    lazy: page(() => import('@/pages/CookingPage')),
    errorElement: <RouteError />,
  },
  {
    path: 'admin/login',
    lazy: page(() => import('@/admin/pages/AdminLoginPage')),
    errorElement: <RouteError />,
  },
  {
    path: 'admin',
    element: (
      <RequireAuth>
        <AdminLayout />
      </RequireAuth>
    ),
    errorElement: <RouteError />,
    children: [
      { index: true, lazy: page(() => import('@/admin/pages/AdminDashboardPage')) },
      { path: 'recipes', lazy: page(() => import('@/admin/pages/AdminRecipesPage')) },
      { path: 'recipes/new', lazy: page(() => import('@/admin/pages/AdminRecipeFormPage')) },
      { path: 'recipes/:id/edit', lazy: page(() => import('@/admin/pages/AdminRecipeFormPage')) },
      { path: 'ingredients', lazy: page(() => import('@/admin/pages/AdminIngredientsPage')) },
      { path: 'categories', lazy: page(() => import('@/admin/pages/AdminCategoriesPage')) },
      { path: 'questions', lazy: page(() => import('@/admin/pages/AdminQuestionsPage')) },
      { path: 'prices', lazy: page(() => import('@/admin/pages/AdminPricesPage')) },
      { path: 'media', lazy: page(() => import('@/admin/pages/AdminMediaPage')) },
    ],
  },
]);
