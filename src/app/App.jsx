import { RouterProvider } from 'react-router-dom';
import { ToastProvider } from '@/components/common/Toast/Toast';
import { AuthProvider } from '@/admin/auth/AuthContext';
import PageLoader from '@/components/layout/PageLoader';
import { router } from './router';

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <RouterProvider router={router} fallbackElement={<PageLoader />} />
      </AuthProvider>
    </ToastProvider>
  );
}
