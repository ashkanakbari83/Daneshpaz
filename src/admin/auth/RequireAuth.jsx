import { Navigate, useLocation } from 'react-router-dom';
import PageLoader from '@/components/layout/PageLoader';
import { useAuth } from './AuthContext';

/** UI guard only: sends signed-out visitors to the login page. The server enforces access. */
export default function RequireAuth({ children }) {
  const { status } = useAuth();
  const location = useLocation();
  if (status === 'loading') return <PageLoader />;
  if (status !== 'authenticated') return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  return children;
}
