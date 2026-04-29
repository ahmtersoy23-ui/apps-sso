import { Navigate } from 'react-router-dom';
import { authService } from '../services/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireSsoAdmin?: boolean;
}

export default function ProtectedRoute({ children, requireSsoAdmin = false }: ProtectedRouteProps) {
  if (!authService.isAuthenticated()) {
    return <Navigate to="/" replace />;
  }

  if (requireSsoAdmin && !authService.isSsoAdmin()) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
