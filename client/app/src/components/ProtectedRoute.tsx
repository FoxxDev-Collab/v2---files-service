// client/src/components/ProtectedRoute.tsx

import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  if (typeof window !== 'undefined' && !isAuthenticated) {
    router.push('/login');
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;