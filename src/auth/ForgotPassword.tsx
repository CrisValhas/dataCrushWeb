import { useState } from 'react';
import { useToast } from '../app/toast';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const { notify } = useToast();
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Stub: enviarías correo de recuperación aquí
    notify({ type: 'success', title: 'Correo enviado', message: 'Si la cuenta existe, recibirás instrucciones.' });
  };
  return (
    <div className="max-w-md mx-auto p-10 bg-white rounded-lg shadow-sm mt-10">
      <h1 className="text-2xl font-semibold mb-1">Recuperar contraseña</h1>
      <p className="text-slate-600 mb-6">Ingresá tu email para restablecerla</p>
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className="block mb-1">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <button className="bg-blue-600" type="submit">Enviar</button>
      </form>
    </div>
  );
}

