import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register as registerApi } from './api';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/IntegrationButtons';

export function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const nav = useNavigate();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    try {
      await registerApi(email, password, displayName);
      nav('/login');
    } catch (e: any) {
      setErr(e?.message || 'Error');
    }
  };

  return (
    <div className="max-w-md mx-auto p-8 bg-white rounded-xl border mt-12">
      <h1 className="text-2xl font-semibold mb-1">Crear cuenta</h1>
      <p className="text-slate-600 mb-6">Comencemos tu estrategia de medición</p>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Nombre</label>
          <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Tu nombre" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="tu@email" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Contraseña</label>
          <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="••••••••" />
        </div>
        {err && <p className="text-red-600 text-sm">{err}</p>}
        <div className="pt-2">
          <Button variant="connect" onClick={() => {}} type="submit">Registrarme</Button>
        </div>
      </form>
      <div className="text-sm text-slate-600 mt-4">¿Ya tenés cuenta? <Link to="/login" className="underline">Iniciar sesión</Link></div>
    </div>
  );
}
