import { RouterProvider } from 'react-router-dom';
import { ToastProvider } from '@/components/common/Toast/Toast';
import PageLoader from '@/components/layout/PageLoader';
import { router } from './router';

export default function App() {
  return (
    <ToastProvider>
      <RouterProvider router={router} fallbackElement={<PageLoader />} />
    </ToastProvider>
  );
}
