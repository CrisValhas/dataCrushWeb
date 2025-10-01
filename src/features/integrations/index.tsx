import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useProjectIntegrations } from '../../app/data';
import { useProject } from '../../app/project';
import { apiFetch } from '../../lib/api';
import { useToast } from '../../app/toast';
import { Modal } from '../../components/ui/Modal';
import { ConnectButton, ReauthorizeButton, DisconnectButton } from '../../components/ui/IntegrationButtons';
import { CheckCircle2, XCircle, Info } from 'lucide-react';

export function Integrations() {
  const { projectId: globalProjectId, setProjectId } = useProject();
  const { notify } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const connected = params.get('connected');
  const error = params.get('error');
  
  // Obtener projectId de los parámetros de la ruta o usar el global
  const urlParams = useParams();
  const projectId = urlParams.projectId || globalProjectId;
  
  // Hook específico para integraciones del proyecto
  const {
    figmaConnected,
    ga4Connected,
    figmaFiles,
    isLoadingFigmaFiles,
    connectFigmaForProject,
    connectGA4ForProject,
    disconnectFigmaFromProject,
    disconnectGA4FromProject,
    refetchFigmaFiles
  } = useProjectIntegrations(projectId || undefined);
  
  // Estado para el modal de confirmación de desconexión
  const [disconnectModal, setDisconnectModal] = useState<{
    open: boolean;
    platform: 'FIGMA' | 'GA4' | null;
    platformName: string;
  }>({
    open: false,
    platform: null,
    platformName: ''
  });
  
  // Establecer el proyecto actual si viene de la URL
  useEffect(() => {
    if (urlParams.projectId && urlParams.projectId !== globalProjectId) {
      setProjectId(urlParams.projectId);
    }
  }, [urlParams.projectId, globalProjectId, setProjectId]);

  console.log('[INTEGRATIONS] Project ID:', projectId);
  console.log('[INTEGRATIONS] Figma connected for project:', figmaConnected);
  console.log('[INTEGRATIONS] GA4 connected for project:', ga4Connected);
  console.log('[INTEGRATIONS] Figma files count:', figmaFiles.length);

  // Funciones para manejar el modal de desconexión
  const handleDisconnectRequest = (platform: 'FIGMA' | 'GA4', platformName: string) => {
    setDisconnectModal({
      open: true,
      platform,
      platformName
    });
  };

  const handleDisconnectConfirm = async () => {
    if (disconnectModal.platform === 'FIGMA') {
      await disconnectFigmaFromProject();
    } else if (disconnectModal.platform === 'GA4') {
      await disconnectGA4FromProject();
    }
    setDisconnectModal({ open: false, platform: null, platformName: '' });
  };

  const handleDisconnectCancel = () => {
    setDisconnectModal({ open: false, platform: null, platformName: '' });
  };

  // Estado de GA4 Property ID por proyecto
  const [ga4PropertyId, setGa4PropertyId] = useState<string>('');
  const [ga4Initial, setGa4Initial] = useState<string>('');
  const [ga4Error, setGa4Error] = useState<string>('');
  const [isEditingGa4, setIsEditingGa4] = useState<boolean>(false);
  const canEditGa4 = Boolean(projectId && ga4Connected);
  useEffect(() => {
    (async () => {
      if (!projectId) return;
      try {
        const resp = await apiFetch<{ ga4PropertyId: string | null }>(`/integrations/ga4/property?projectId=${projectId}`);
        const val = (resp as any).data?.ga4PropertyId || '';
        setGa4PropertyId(val);
        setGa4Initial(val);
        setIsEditingGa4(false);
        setGa4Error('');
      } catch {}
    })();
  }, [projectId]);
  const saveGa4Property = async () => {
    if (!projectId) return;
    try {
      // Simple normalización en cliente
      const raw = ga4PropertyId.trim();
      let val = raw;
      if (val.startsWith('properties/')) val = val.replace(/^properties\//, '');
      const digits = val.match(/\d{4,}/)?.[0] || '';
      if (!digits) {
        setGa4Error('ID inválido. Usá "properties/123456789" o el número de la propiedad.');
        return;
      }
      setGa4Error('');
      await apiFetch(`/integrations/ga4/property`, {
        method: 'POST',
        body: { projectId, ga4PropertyId: `properties/${digits}` },
      });
      const normalized = `properties/${digits}`;
      setGa4PropertyId(normalized);
      setGa4Initial(normalized);
      setIsEditingGa4(false);
      notify({ type: 'success', title: 'GA4 Property ID guardado', message: normalized });
    } catch (e: any) {
      notify({ type: 'error', title: 'Error', message: e?.message || 'No se pudo guardar' });
    }
  };
  const cancelEditGa4 = () => {
    setGa4PropertyId(ga4Initial);
    setIsEditingGa4(false);
    setGa4Error('');
  };

  // Mostrar notificaciones una sola vez al cargar la página
  useEffect(() => {
    if (connected) {
      notify({ 
        type: 'success', 
        title: `${connected} conectado`, 
        message: `Se conectó correctamente ${connected} para este proyecto.` 
      });
      const sp = new URLSearchParams(location.search);
      sp.delete('connected');
      navigate({ pathname: location.pathname, search: sp.toString() }, { replace: true });
    } else if (error) {
      const errorMessages: Record<string, string> = {
        figma: 'Error al conectar con Figma. Verificá que las credenciales sean correctas y que la app esté configurada apropiadamente en Figma.',
        ga4: 'Error al conectar con Google Analytics. Asegurate de que tu cuenta tenga los permisos necesarios.',
      };
      const message = errorMessages[error] || `Error desconocido: ${error}`;
      notify({ type: 'error', title: 'Error en OAuth', message });
      const sp = new URLSearchParams(location.search);
      sp.delete('error');
      navigate({ pathname: location.pathname, search: sp.toString() }, { replace: true });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, error]);
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold leading-tight">Integraciones del Proyecto</h1>
          <p className="mt-1 text-sm text-slate-600 max-w-2xl">
            {projectId
              ? 'Conectá tus cuentas de diseño y analítica para este proyecto. Cada proyecto puede tener sus propias integraciones.'
              : 'Seleccioná un proyecto para gestionar sus integraciones.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ConnectButton onClick={() => navigate('/app/projects')}>
            Volver a proyectos
          </ConnectButton>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  <div className="bg-white border rounded-xl p-5 shadow-sm">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M15.852 8.981h-4.588V0h4.588c2.476 0 4.49 2.014 4.49 4.49s-2.014 4.491-4.49 4.491zM12.735 7.51h3.117c1.665 0 3.019-1.355 3.019-3.019s-1.354-3.019-3.019-3.019h-3.117V7.51zm0 1.471H8.148c-2.476 0-4.49-2.015-4.49-4.491S5.672 0 8.148 0h4.588v8.981zm-4.587-7.51c-1.665 0-3.019 1.355-3.019 3.019s1.354 3.019 3.019 3.019h3.117V1.471H8.148zm4.587 15.019H8.148c-2.476 0-4.49-2.014-4.49-4.49s2.014-4.49 4.49-4.49h4.588v8.98zM8.148 8.981c-1.665 0-3.019 1.355-3.019 3.019s1.354 3.019 3.019 3.019h3.117V8.981H8.148zM8.172 24c-2.489 0-4.515-2.014-4.515-4.49s2.026-4.49 4.515-4.49c2.489 0 4.515 2.014 4.515 4.49S10.661 24 8.172 24zm.026-7.51c-1.665 0-3.019 1.355-3.019 3.019s1.354 3.019 3.019 3.019 3.019-1.355 3.019-3.019-1.354-3.019-3.019-3.019zm11.854 7.51c-2.489 0-4.515-2.014-4.515-4.49s2.026-4.49 4.515-4.49c2.489 0 4.515 2.014 4.515 4.49S22.541 24 20.052 24zm.026-7.51c-1.665 0-3.019 1.355-3.019 3.019s1.354 3.019 3.019 3.019 3.019-1.355 3.019-3.019-1.354-3.019-3.019-3.019z"/>
              </svg>
            </div>
            <div>
              <div className="font-semibold text-lg text-gray-600">Figma</div>
            </div>
          </div>
          <p className="text-sm text-gray-500 mb-4">Conecta tu cuenta de Figma específicamente para este proyecto. Podrás importar diseños y hacer seguimiento de interacciones de usuarios en tus prototipos.</p>
          {figmaConnected ? (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium">Figma conectado a este proyecto</span>
              </div>
              <div className="flex gap-3">
                <ReauthorizeButton onClick={connectFigmaForProject}>
                  Reautorizar
                </ReauthorizeButton>
                <DisconnectButton onClick={() => handleDisconnectRequest('FIGMA', 'Figma')}>
                  Desconectar
                </DisconnectButton>
              </div>
              <div className="mt-3 flex items-start gap-2 text-slate-700">
                <Info className="mt-[2px]" size={16} />
                <p className="text-[13px] leading-snug">
                  Si tu cuenta de Figma es personal, es posible que no podamos listar automáticamente tus archivos y frames.
                  En ese caso, podés asignar el archivo manualmente desde Events usando la opción
                  <span className="font-medium"> “Agregar archivo manualmente”</span>.
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-6 mb-2">
              <ConnectButton
                fullWidth={true}
                onClick={() => {
                  if (!projectId) {
                    notify({ type: 'error', title: 'Error', message: 'No hay proyecto seleccionado' });
                    return;
                  }
                  connectFigmaForProject();
                }}
              >
                Connect Figma para este proyecto →
              </ConnectButton>
              <div className="mt-3 flex items-start gap-2 text-slate-700">
                <Info className="mt-[2px]" size={16} />
                <p className="text-[13px] leading-snug">
                  Si usás una cuenta personal de Figma, tal vez no podamos traer automáticamente tus archivos y frames.
                  Podés asignar un archivo manualmente luego, desde Events, con
                  <span className="font-medium"> “Agregar archivo manualmente”</span>.
                </p>
              </div>
            </div>
          )}
        </div>
        <div className="bg-white border rounded-xl p-5 shadow-sm">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            </div>
            <div>
              <div className="font-semibold text-lg text-gray-600">Google Analytics 4</div>
            </div>
          </div>
          <p className="text-sm text-gray-500 mb-4">Integra tu cuenta de GA4 específicamente para este proyecto para analizar el comportamiento de usuarios y medir el rendimiento de tus diseños.</p>
          {ga4Connected ? (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium">GA4 conectado a este proyecto</span>
              </div>
              <div className="flex gap-2 mb-3">
                <ReauthorizeButton
                  onClick={connectGA4ForProject}
                >
                  Reautorizar
                </ReauthorizeButton>
                <DisconnectButton
                  onClick={() => handleDisconnectRequest('GA4', 'Google Analytics 4')}
                >
                  Desconectar
                </DisconnectButton>
              </div>
              <div className="bg-white/60 border border-green-200 rounded p-3 text-slate-700">
                <div className="font-medium mb-1">GA4 Property ID</div>
                <p className="text-xs text-slate-600 mb-2">
                  Pegá el ID de la propiedad de GA4 asociada a este proyecto. Lo encontrás en Google Analytics → Admin → Property settings. Suele verse como "properties/123456789" o el número solo.
                </p>
                <div className="flex items-center gap-2">
                  <input
                    className={`flex-1 h-9 px-3 border rounded ${!isEditingGa4 ? 'bg-slate-100' : ''}`}
                    placeholder="properties/123456789"
                    value={ga4PropertyId}
                    onChange={(e) => setGa4PropertyId(e.target.value)}
                    disabled={!isEditingGa4}
                  />
                  <span title={ga4PropertyId?.trim() ? 'Formato del ID' : 'Ingresá un ID'}>
                    {(() => {
                      const raw = ga4PropertyId?.trim() || '';
                      let v = raw.startsWith('properties/') ? raw.replace(/^properties\//, '') : raw;
                      const ok = /\d{4,}/.test(v);
                      return ok ? (
                        <CheckCircle2 size={18} className="text-emerald-600" />
                      ) : (
                        <XCircle size={18} className="text-rose-500" />
                      );
                    })()}
                  </span>
                  {!isEditingGa4 ? (
                    <ConnectButton onClick={() => setIsEditingGa4(true)}>
                      Editar
                    </ConnectButton>
                  ) : (
                    <>
                      <ConnectButton onClick={saveGa4Property}>
                        Guardar
                      </ConnectButton>
                      <DisconnectButton onClick={cancelEditGa4}>
                        Cancelar
                      </DisconnectButton>
                    </>
                  )}
                </div>
                {ga4Error && <div className="text-xs text-red-600 mt-1">{ga4Error}</div>}
              </div>
            </div>
          ) : (
            <div className="mt-6 mb-2">
              <ConnectButton
                fullWidth={true}
                onClick={() => {
                  if (!projectId) {
                    notify({ type: 'error', title: 'Error', message: 'No hay proyecto seleccionado' });
                    return;
                  }
                  connectGA4ForProject();
                }}
              >
                Connect GA4 para este proyecto →
              </ConnectButton>
              {/* Mostrar el GA4 Property ID si existe aunque no esté conectado, solo lectura */}
              <div className="mt-4 bg-slate-50 border border-slate-200 rounded p-3 text-slate-700">
                <div className="font-medium mb-1">GA4 Property ID</div>
                <p className="text-xs text-slate-600 mb-2">
                  Pegá el ID de la propiedad de GA4 asociada a este proyecto. Lo encontrás en Google Analytics → Admin → Property settings. Suele verse como "properties/123456789" o el número solo.
                </p>
                <div className="flex items-center gap-2">
                  <input
                    className={`flex-1 h-9 px-3 border rounded ${!isEditingGa4 ? 'bg-slate-100' : ''}`}
                    placeholder="properties/123456789"
                    value={ga4PropertyId}
                    onChange={(e) => setGa4PropertyId(e.target.value)}
                    disabled={!isEditingGa4}
                    title={!isEditingGa4 ? 'Hacé clic en "Editar" para modificar' : ''}
                  />
                  <span title={ga4PropertyId?.trim() ? 'Formato del ID' : 'Ingresá un ID'}>
                    {(() => {
                      const raw = ga4PropertyId?.trim() || '';
                      let v = raw.startsWith('properties/') ? raw.replace(/^properties\//, '') : raw;
                      const ok = /\d{4,}/.test(v);
                      return ok ? (
                        <CheckCircle2 size={18} className="text-emerald-600" />
                      ) : (
                        <XCircle size={18} className="text-rose-500" />
                      );
                    })()}
                  </span>
                  {!isEditingGa4 ? (
                    <ConnectButton onClick={() => setIsEditingGa4(true)}>
                      Editar
                    </ConnectButton>
                  ) : (
                    <>
                      <ConnectButton onClick={saveGa4Property}>
                        Guardar
                      </ConnectButton>
                      <DisconnectButton onClick={cancelEditGa4}>
                        Cancelar
                      </DisconnectButton>
                    </>
                  )}
                </div>
                {ga4Error && <div className="text-xs text-red-600 mt-1">{ga4Error}</div>}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de confirmación para desconexión */}
      <Modal
        open={disconnectModal.open}
        title={`Desconectar ${disconnectModal.platformName}`}
        description={`¿Estás seguro de que quieres desconectar ${disconnectModal.platformName} de este proyecto? Esta acción deshabilitará la integración pero mantendrá tus datos de configuración.`}
        confirmText="Desconectar"
        cancelText="Cancelar"
        variant="danger"
        onConfirm={handleDisconnectConfirm}
        onCancel={handleDisconnectCancel}
      />
    </div>
  );
}
