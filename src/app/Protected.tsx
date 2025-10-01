import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './auth';

export function Protected() {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-6 text-sm text-slate-600">Cargando…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}
