import { Link } from 'react-router-dom';
import { useAuth } from '../../app/auth';
import { Settings, LogOut } from 'lucide-react';
import { BrandIcon } from '../ui/BrandIcon';
import { useState, useRef, useEffect } from 'react';

export function Header() {
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const Logo = () => <BrandIcon size={28} />;

  // Obtener iniciales del nombre del usuario
  const getInitials = (name: string | undefined) => {
    if (!name) return 'US';
    const names = name.trim().split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[1][0]).toUpperCase();
    }
    return names[0].substring(0, 2).toUpperCase();
  };

  const initials = getInitials(user?.displayName || user?.email);

  return (
    <header className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between sticky top-0 z-50">
      {/* Logo y nombre a la izquierda */}
      <Link to="/app" className="flex items-center gap-3 font-semibold text-xl text-gray-600 hover:text-gray-500 transition-colors">
        <Logo />
        <span>DataCrush</span>
      </Link>

      {/* Herramientas a la derecha */}
      <div className="flex items-center gap-4">
        {/* Botón de configuración */}
        <Link
          to="/app/settings"
          className="p-2 text-gray-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
          title="Configuración"
        >
          <Settings size={20} />
        </Link>

        {/* Avatar con dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-medium text-sm hover:bg-blue-700 transition-colors"
            title={user?.displayName || user?.email || 'Usuario'}
          >
            {initials}
          </button>

          {/* Dropdown menu */}
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
              {/* Información del usuario */}
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="font-medium text-gray-600 truncate">
                  {user?.displayName || 'Usuario'}
                </p>
                <p className="text-sm text-gray-400 truncate">
                  {user?.email}
                </p>
              </div>

              {/* Opciones */}
              <div className="py-1">
                <button
                  onClick={() => {
                    logout();
                    setShowDropdown(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-red-50 bg-transparent border-none"
                  style={{ backgroundColor: 'transparent', border: 'none', padding: '8px 16px' }}
                >
                  <LogOut size={16} />
                  Cerrar sesión
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}