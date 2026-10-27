import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../presentation/features/auth/AuthContext.js';
import { Loading, ErrorState } from '../../presentation/shared/ui/Feedback.jsx';
export function ProtectedRoute({ role }) {
  const { user, loading, error } = useAuth();
  const location = useLocation();
  if (loading) return <Loading text="Verificăm sesiunea…" />;
  if (error)
    return (
      <ErrorState error={error} onRetry={() => window.location.reload()} />
    );
  if (!user)
    return (
      <Navigate
        to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`}
        replace
      />
    );
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return <Outlet />;
}
