import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PageFallback } from './layout/Layout';

export function RequireAuth({ children }: { children: ReactNode }) {
  const { ready, isSignedIn } = useAuth();
  const location = useLocation();
  if (!ready) return <PageFallback />;
  if (!isSignedIn) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  return <>{children}</>;
}
