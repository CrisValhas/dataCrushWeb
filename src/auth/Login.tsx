import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from './api';
import { useAuth } from '../app/auth';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/IntegrationButtons';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const nav = useNavigate();
  const { loginWithToken } = useAuth();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    try {
      const data = await login(email, password);
      if (data?.accessToken) await loginWithToken(data.accessToken);
      nav('/app');
    } catch (e: any) {
      setErr(e?.message || 'Error');
    }
  };

  return (
    <div className="max-w-md mx-auto p-8 bg-white rounded-xl border mt-12">
      <h1 className="text-2xl font-semibold mb-1">Iniciar sesión</h1>
      <p className="text-slate-600 mb-6">Bienvenido de vuelta</p>
      <form onSubmit={onSubmit} className="space-y-4">
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
          <Button variant="connect" onClick={() => {}} type="submit">Entrar</Button>
        </div>
      </form>
      <div className="text-sm text-slate-600 mt-3">
        <Link to="/forgot-password" className="underline">¿Olvidaste tu contraseña?</Link>
      </div>
      <div className="text-sm text-slate-600 mt-4">¿No tenés cuenta? <Link to="/register" className="underline">Crear cuenta</Link></div>
    </div>
  );
}
