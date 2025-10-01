import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { BrandIcon } from '../ui/BrandIcon';
import { Button } from '../ui/IntegrationButtons';

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const p = location.pathname;
  const isLanding = p === '/';
  const isAuth = p === '/login' || p === '/register' || p === '/forgot-password' || p.startsWith('/auth/');
  return (
    <div className="min-h-screen bg-slate-50">
      {isLanding && (
        <header className="h-14 px-4 flex items-center justify-between border-b bg-white">
          <Link to="/" className="flex items-center gap-2 font-semibold text-gray-700">
            <BrandIcon size={20} />
            <span>DataCrush</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-slate-700">
            <a href="#">Features</a>
            <a href="#">Pricing</a>
            <a href="#">Resources</a>
            <a href="#">Contact</a>
          </nav>
          <Button variant="connect" size="sm" onClick={() => navigate('/login')}>Iniciar sesión</Button>
        </header>
      )}
      {isAuth && (
        <header className="h-14 px-4 flex items-center border-b bg-white">
          <Link to="/" className="flex items-center gap-2 font-semibold text-gray-700">
            <BrandIcon size={20} />
            <span>DataCrush</span>
          </Link>
        </header>
      )}
      <main>
        <Outlet />
      </main>
    </div>
  );
}
