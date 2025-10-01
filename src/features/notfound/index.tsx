import { Link } from 'react-router-dom';

export function NotFound() {
  return (
    <div className="min-h-[60vh] grid place-items-center">
      <div className="text-center">
        <div className="text-7xl font-bold text-slate-300">404</div>
        <h1 className="text-2xl font-semibold mt-2">Página no encontrada</h1>
        <p className="text-slate-600 mt-1">La URL que intentaste abrir no existe.</p>
        <div className="mt-4 flex items-center justify-center gap-2">
          <Link to="/app" className="bg-blue-600 text-white px-3 py-2 rounded">Ir al inicio</Link>
          <Link to="/app/projects" className="bg-white text-black border px-3 py-2 rounded">Mis proyectos</Link>
        </div>
      </div>
    </div>
  );
}
