import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '../../components/layout/PageHeader';
import { apiFetch } from '../../lib/api';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../app/toast';
import { useProject } from '../../app/project';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/IntegrationButtons';
import { useNavigate } from 'react-router-dom';

export function Settings() {
  const { projectId } = useProject();
  const { notify } = useToast();
  const navigate = useNavigate();
  const [disconnect, setDisconnect] = useState<null | { platform: string }>(null);

  const { data: me, refetch: refetchMe } = useQuery({
    queryKey: ['me'],
    queryFn: async () => (await apiFetch('/me')).data,
  });

  const [displayNameDraft, setDisplayNameDraft] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Inicializar el draft cuando llegan los datos de usuario
  useEffect(() => {
    if (me?.displayName && !displayNameDraft) {
      setDisplayNameDraft(me.displayName);
    }
  }, [me?.displayName]);

  const onSaveProfile = async () => {
    const nextName = displayNameDraft.trim();
    if (!nextName) {
      notify({ type: 'error', title: 'Nombre requerido', message: 'Ingresá un nombre.' });
      return;
    }
    try {
      setIsSaving(true);
      await apiFetch('/me', { method: 'PATCH', body: { displayName: nextName } });
      notify({ type: 'success', title: 'Perfil actualizado', message: nextName });
      refetchMe();
    } catch (e: any) {
      notify({ type: 'error', title: 'Error', message: e?.message || 'No se pudo guardar' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <PageHeader title="Configuración" description="Ajustá tu perfil y gestioná las conexiones de tu proyecto." />
        <div className="flex items-center gap-2">
          <Button variant="connect" size="md" onClick={() => navigate('/app/projects')}>
            Volver a proyectos
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Perfil */}
        <div className="bg-white rounded-xl border p-4 space-y-3">
          <h3 className="font-semibold">Perfil</h3>
          <div className="grid grid-cols-1 gap-2">
            <Input
              className="text-sm"
              placeholder="Nombre"
              value={displayNameDraft}
              onChange={(e) => setDisplayNameDraft(e.target.value)}
            />
            <Input
              className="text-sm opacity-70"
              placeholder="Email"
              value={me?.email || ''}
              readOnly
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="connect" size="sm" disabled={isSaving} onClick={onSaveProfile}>
              {isSaving ? 'Guardando…' : 'Guardar cambios'}
            </Button>
          </div>
          <div className="text-xs text-slate-600">El email es informativo. Podés editar tu nombre.</div>
        </div>
        {/* Mini tour interactivo */}
        <div className="bg-white rounded-xl border p-4 space-y-3">
          <h3 className="font-semibold">Cómo funciona</h3>
          <div className="text-sm text-slate-600">Un vistazo rápido al flujo:</div>
          <ol className="space-y-2 text-sm">
            <li className="flex items-center justify-between border rounded p-2">
              <span>1) Conectá Integraciones</span>
              <Button size="sm" variant="connect" onClick={() => navigate(projectId ? `/app/project/${projectId}/integrations` : '/app/integrations')}>Ir</Button>
            </li>
            <li className="flex items-center justify-between border rounded p-2">
              <span>2) Cargá tu wireframe</span>
              <Button size="sm" variant="connect" onClick={() => navigate(projectId ? `/app/project/${projectId}/events` : '/app/events')}>Ir</Button>
            </li>
            <li className="flex items-center justify-between border rounded p-2">
              <span>3) Creá eventos sobre el diseño</span>
              <Button size="sm" variant="connect" onClick={() => navigate(projectId ? `/app/project/${projectId}/events` : '/app/events')}>Ir</Button>
            </li>
            <li className="flex items-center justify-between border rounded p-2">
              <span>4) Revalidá con GA4</span>
              <Button size="sm" variant="connect" onClick={() => navigate(projectId ? `/app/project/${projectId}/events` : '/app/events')}>Ir</Button>
            </li>
            <li className="flex items-center justify-between border rounded p-2">
              <span>5) Armá funnels</span>
              <Button size="sm" variant="connect" onClick={() => navigate(projectId ? `/app/project/${projectId}/funnels` : '/app/funnels')}>Ir</Button>
            </li>
          </ol>
          <div className="text-xs text-slate-600">Tip: podés volver a este tour cuando quieras desde Configuración.</div>
        </div>
      </div>
      {/* Sin modales de desconexión: conexiones ahora son por proyecto */}
    </div>
  );
}
