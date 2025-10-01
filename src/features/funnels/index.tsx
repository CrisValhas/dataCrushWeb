import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/layout/PageHeader';
import { useProject } from '../../app/project';
import { useData } from '../../app/data';
import { useToast } from '../../app/toast';
import { apiFetch } from '../../lib/api';
import { StatusPill } from '../../components/ui/StatusPill';
import { IconButton } from '../../components/ui/IconButton';
import { Input } from '../../components/ui/Input';
import { FilterTag } from '../../components/ui/FilterTag';
import { SelectDropdown } from '../../components/ui/SelectDropdown';
import { Button } from '../../components/ui/IntegrationButtons';
import { Check, Code2, Edit, GripVertical, Trash2, X, Plus } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';

export function FunnelsPage() {
  const { projectId: globalProjectId, setProjectId } = useProject();
  const { events, funnels } = useData();
  const { notify } = useToast();
  const navigate = useNavigate();
  
  // Obtener projectId de los parámetros de la ruta o usar el global
  const urlParams = useParams();
  const projectId = urlParams.projectId || globalProjectId;
  
  // Establecer el proyecto actual si viene de la URL
  useEffect(() => {
    if (urlParams.projectId && urlParams.projectId !== globalProjectId) {
      setProjectId(urlParams.projectId);
    }
  }, [urlParams.projectId, globalProjectId, setProjectId]);

  // Rango de días para verificación GA4
  const [days, setDays] = useState<number>(7);

  // GA4 counts for current project's events
  const { data: ga4Counts = {}, refetch: refetchCounts } = useQuery({
    queryKey: ['ga4-counts', projectId, (events.items ?? []).length, days],
    enabled: Boolean(projectId),
    queryFn: async () =>
      (
        await apiFetch<Record<string, number>>(
          `/integrations/ga4/event-counts?projectId=${projectId}&days=${days}`,
        )
      ).data,
  });

  // Funnel selector
  const [activeId, setActiveId] = useState('');
  const active = useMemo(
    () => (funnels.items ?? []).find((f: any) => f._id === activeId) || null,
    [funnels.items, activeId],
  );
  const stepsServer: string[] = useMemo(
    () => (active?.steps ?? []).map((s: any) => s.eventId),
    [active],
  );
  const [localSteps, setLocalSteps] = useState<string[]>([]);
  useEffect(() => {
    setLocalSteps(stepsServer);
  }, [stepsServer.join(','), activeId]);

  // Auto-seleccionar primer funnel disponible al ingresar
  useEffect(() => {
    if (!activeId && (funnels.items ?? []).length > 0) {
      const first = (funnels.items as any)[0];
      if (first?._id) setActiveId(first._id);
    }
  }, [activeId, funnels.items]);

  // DnD UI helpers
  const [isDragging, setIsDragging] = useState(false);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const createFunnel = async () => {
    // Crear funnel sin pasos por defecto y entrar en modo renombrar
    const f = await funnels.create('Nuevo funnel', []);
    await funnels.refetch();
    setActiveId((f as any)._id);
    setRenaming(true);
    setFunnelName('');
  };

  // DnD handlers
  const onDropContainer = async (e: React.DragEvent) => {
    e.preventDefault();
    if (!active) return;
    const payload = e.dataTransfer.getData('text/plain');
    const fallbackId = payload ? (payload.startsWith('step:') ? payload.slice(5) : payload) : null;
    const id = draggingId || fallbackId;
    if (!id) return;
    const from = localSteps.indexOf(id);
    // Si es drag interno y el drop no es sobre el contenedor, deja que lo maneje el item
    if (from !== -1 && e.target !== e.currentTarget) {
      return;
    }
    // Soportar tanto drag externo (desde tabla) como interno (reordenamiento)
    const cur = localSteps.filter((s) => s !== id);
    let to = hoverIndex !== null && hoverIndex >= 0 && hoverIndex <= cur.length ? hoverIndex : cur.length;
    if (from !== -1 && from < to) to = Math.max(0, to - 1);
    if (to >= 0 && to <= cur.length) {
      cur.splice(to, 0, id);
    } else {
      cur.push(id);
    }
    setLocalSteps(cur);
    await funnels.update(active._id as any, { steps: cur.map((x) => ({ eventId: x })) } as any);
    await funnels.refetch();
    // Mostrar toast solo si viene desde la tabla (agregado nuevo)
    if (from === -1) {
      notify({ type: 'success', title: 'Funnel actualizado', message: '' });
    }
    setIsDragging(false);
    setHoverIndex(null);
    setDraggingId(null);
  };
  const onDropStep = (index: number) => async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!active) return;
    const payload = e.dataTransfer.getData('text/plain');
    const fallbackId = payload ? (payload.startsWith('step:') ? payload.slice(5) : payload) : null;
    const id = draggingId || fallbackId;
    if (!id) return;
    const from = localSteps.indexOf(id);
    let cur = localSteps.filter((s) => s !== id);
    let to = index;
    if (from !== -1 && from < index) to = Math.max(0, index - 1);
    cur.splice(to, 0, id);
    setLocalSteps(cur);
    await funnels.update(active._id as any, { steps: cur.map((x) => ({ eventId: x })) } as any);
    await funnels.refetch();
    setIsDragging(false);
    setHoverIndex(null);
    setDraggingId(null);
  };
  const onDragOver = (e: React.DragEvent) => e.preventDefault();

  // Helper para soltar en index específico (ghost zones)
  const dropAt = (index: number) => async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await onDropStep(index)(e);
  };

  // Event form: se removió de esta página y se moverá a /events

  // Filtros
  const [tab, setTab] = useState<string>('all');
  const [q, setQ] = useState('');
  const filtered = useMemo(
    () =>
      (events.items ?? []).filter((e: any) => {
        const matchesQ = [e.name, e.category, e.actionType]
          .join(' ')
          .toLowerCase()
          .includes(q.toLowerCase());
        if (tab === 'all') return matchesQ;
        return matchesQ && e.category === tab;
      }),
    [events.items, tab, q],
  );

  // Inline edit/delete/duplicate
  const [deleteId, setDeleteId] = useState('');
  const [deleteFunnel, setDeleteFunnel] = useState(false);
  const [removeStepId, setRemoveStepId] = useState('');
  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await events.remove(deleteId);
      notify({ type: 'success', title: 'Evento eliminado', message: '' });
    } catch (e: any) {
      notify({
        type: 'error',
        title: 'Error al eliminar',
        message: e?.message || 'Intenta nuevamente',
      });
    }
    setDeleteId('');
    events.refetch();
    refetchCounts();
  };

  // Renombrar funnel
  const [funnelName, setFunnelName] = useState('');
  const [renaming, setRenaming] = useState(false);
  const renameInputRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    if (active && !renaming) setFunnelName(active.name);
  }, [active?._id, active?.name, renaming]);
  useEffect(() => {
    if (renaming) renameInputRef.current?.focus();
  }, [renaming]);
  const saveFunnelName = async () => {
    if (!active) return;
    try {
      await funnels.update(active._id as any, { name: funnelName } as any);
      await funnels.refetch();
      setRenaming(false);
      notify({ type: 'success', title: 'Funnel renombrado', message: funnelName });
    } catch (e: any) {
      notify({
        type: 'error',
        title: 'Error al renombrar',
        message: e?.message || 'Intenta nuevamente',
      });
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <PageHeader title="Funnel" description="Visualización y gestión de tu funnel" />
        {((funnels.items ?? []).length > 0) && (
          <div className="flex items-center gap-2">
            <SelectDropdown
              value={{7:'Últimos 7 días',30:'Últimos 30 días',90:'Últimos 90 días'}[days] || 'Últimos 7 días'}
              onChange={async (label: string) => {
                const map: Record<string, number> = {
                  'Últimos 7 días': 7,
                  'Últimos 30 días': 30,
                  'Últimos 90 días': 90,
                };
                const next = map[label] ?? 7;
                setDays(next);
                // Disparar revalidación inmediata con el nuevo rango
                setTimeout(() => { refetchCounts(); }, 0);
              }}
              options={[ 'Últimos 7 días', 'Últimos 30 días', 'Últimos 90 días' ]}
              className="w-44"
            />
            <Button
              variant="connect"
              onClick={async () => {
                const res = await refetchCounts();
                const latest = (res as any)?.data || ga4Counts;
                const items = (events.items ?? []) as any[];
                const implemented = items.filter((e) => (latest as any)[e._id] > 0).length;
                const total = items.length;
                notify({
                  type: 'success',
                  title: 'Validación GA4',
                  message: `${implemented}/${total} eventos implementados`,
                });
              }}
              size="md"
              disabled={(events.items ?? []).length === 0}
            >
              Revalidar eventos
            </Button>
            <Button variant="connect" size="md" onClick={() => navigate('/app/projects')}>
              Volver a proyectos
            </Button>
          </div>
        )}
      </div>

      {(funnels.items ?? []).length === 0 ? (
        // Empty fullscreen cuando no hay funnels creados (estilo Events)
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="min-h-[70vh] grid place-items-center">
            <div className="w-full max-w-3xl">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  {/* Icono genérico similar al de Events (se puede ajustar) */}
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 6a2 2 0 012-2h4l2 2h6a2 2 0 012 2v1H3V6z" fill="currentColor" opacity=".2"/>
                    <path d="M3 9h18v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9zm4 3h6v2H7v-2z" fill="currentColor"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-700 mb-1">Funnel</div>
                  <p className="text-sm text-gray-600 mb-4">
                    Todavía no creaste un funnel. Creá tu primer funnel para visualizar el recorrido y la conversión de tus eventos.
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button variant="connect" onClick={createFunnel} size="md">Crear nuevo funnel</Button>
                    <Button variant="primary" onClick={() => navigate(`/app/project/${projectId}/events`)} size="md">Crear eventos</Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
  ) : (
      <div className="flex flex-col md:flex-row gap-6">
        {/* Tabla de eventos (derecha) */}
  <div className="bg-white rounded-xl border p-4 md:order-2 md:flex-1 min-h-[28rem]">
          <div className="flex items-center gap-2 mb-2">
            <FilterTag active={tab === 'all'} label="Todos" onClick={() => setTab('all')} />
            {Array.from(new Set((events.items ?? []).map((e: any) => e.category).filter(Boolean))).map((c) => (
              <FilterTag key={String(c)} active={tab === String(c)} label={String(c)} onClick={() => setTab(String(c))} />
            ))}
            <div className="ml-auto w-64">
              <Input variant="borderless" placeholder="Buscar evento..." value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
          </div>
          <table className="w-full text-sm bg-white rounded border">
            <thead>
              <tr className="text-left">
                <th className="p-2">Evento</th>
                <th>Estado</th>
                <th>Categoría</th>
                <th>Plataforma</th>
                <th className="p-2 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {(events.items ?? []).length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 align-middle">
                    <div className="min-h-[22rem] grid place-items-center">
                      <div className="text-center max-w-md">
                        <div className="text-gray-800 font-medium mb-1">Aún no hay eventos</div>
                        <p className="text-sm text-gray-600 mb-4">Creá tus eventos en la sección Events para poder construir el funnel.</p>
                        <Button variant="primary" onClick={() => navigate(`/app/project/${projectId}/events`)}>Ir a Events</Button>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((e: any) => {
                  const count = (ga4Counts as any)[e._id] || 0;
                  const state = count > 0 ? 'implemented' : 'pending';
                  const inFunnel = Boolean(active) && localSteps.includes(e._id);
                  return (
                    <tr
                      key={e._id}
                      className={`border-t ${inFunnel ? 'opacity-50 cursor-not-allowed' : ''}`}
                      aria-disabled={inFunnel}
                      title={inFunnel ? 'Este evento ya está en el funnel seleccionado' : undefined}
                      draggable={!inFunnel}
                      onDragStart={(ev) => {
                        ev.dataTransfer.setData('text/plain', e._id);
                        try { ev.dataTransfer.effectAllowed = 'copyMove'; } catch {}
                        setDraggingId(e._id);
                        setIsDragging(true);
                      }}
                      onDragEnd={() => {
                        setIsDragging(false);
                        setHoverIndex(null);
                        setDraggingId(null);
                      }}
                    >
                      <td className="p-2">{e.name}</td>
                      <td className="p-2">
                        {state === 'implemented' ? (
                          <StatusPill label="Implementado" variant="success" />
                        ) : (
                          <StatusPill label="Pendiente" variant="warning" />
                        )}
                      </td>
                      <td className="p-2">{e.category || '-'}</td>
                      <td className="p-2">Web</td>
                      <td className="p-2 text-right">
                        {inFunnel && (
                          <span className="mr-2 text-xs text-slate-400 select-none">En funnel</span>
                        )}
                        <IconButton variant="danger" onClick={() => setDeleteId(e._id)} aria-label="Eliminar">
                          <Trash2 size={16} />
                        </IconButton>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
    </div>

  {/* Módulo de creación/visualización del funnel (izquierda 35%) */}
  <div className="bg-white rounded-xl border p-4 md:order-1 md:basis-[35%] md:shrink-0 md:grow-0 min-h-[28rem] flex flex-col">
            <div className="flex items-center mb-1 gap-2">
              <Button variant="connect" onClick={createFunnel} className="whitespace-nowrap">
                Crear nuevo funnel
              </Button>
              <div className="ml-auto flex items-center gap-2">
                {active && renaming ? (
                  <div className="w-64">
                    <Input
                      ref={renameInputRef}
                      className="text-sm"
                      variant="borderless"
                      value={funnelName}
                      onChange={(e) => setFunnelName(e.target.value)}
                      placeholder="Nombre del funnel"
                    />
                  </div>
                ) : (
                  <SelectDropdown
                    value={(funnels.items ?? []).find((f: any) => f._id === activeId)?.name || ''}
                    onChange={(name: string) => {
                      const f = (funnels.items ?? []).find((x: any) => x.name === name);
                      if (f) setActiveId(f._id);
                      setRenaming(false);
                    }}
                    options={(funnels.items ?? []).map((f: any) => f.name)}
                    placeholder={(funnels.items ?? []).length === 0 ? 'Sin funnels' : 'Seleccionar funnel'}
                    className="w-64"
                  />
                )}
              </div>
            </div>
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm text-slate-600">
                Overall Conversion Rate:{' '}
                {(() => {
                  const vals = Object.values(ga4Counts as any);
                  if (vals.length === 0) return '0%';
                  const top = Math.max(...(vals as any));
                  const bot = Math.min(...(vals as any));
                  const r = top ? Math.round((bot / top) * 100) : 0;
                  return `${r}%`;
                })()}
              </div>
              <div className="flex items-center gap-2">
                {active && !renaming && (
                  <>
                    <IconButton title="Renombrar" onClick={() => setRenaming(true)} aria-label="Renombrar" disabled={!active}>
                      <Edit size={16} />
                    </IconButton>
                    <IconButton variant="danger" title="Eliminar funnel" onClick={() => setDeleteFunnel(true)} aria-label="Eliminar funnel" disabled={!active}>
                      <Trash2 size={16} />
                    </IconButton>
                  </>
                )}
                {active && renaming && (
                  <>
                    <IconButton title="Guardar nombre" onClick={saveFunnelName} aria-label="Guardar nombre">
                      <Check size={16} />
                    </IconButton>
                    <IconButton title="Cancelar" onClick={() => { setRenaming(false); setFunnelName(active.name); }} aria-label="Cancelar">
                      <X size={16} />
                    </IconButton>
                  </>
                )}
              </div>
            </div>
            <div
              className="space-y-2 flex-1 overflow-visible border-2 border-dashed rounded-md p-3"
              role="list"
              onDrop={onDropContainer}
              onDragOver={(e) => {
                onDragOver(e);
                if (localSteps.length === 0) {
                  // Si no hay pasos, dropear en índice 0, sin importar el target
                  setHoverIndex(0);
                } else {
                  // Solo ajustar hoverIndex cuando el target real es el contenedor (los items/ghosts lo manejan)
                  if (e.currentTarget === e.target) {
                    setHoverIndex(localSteps.length);
                  }
                }
              }}
            >
              {/* Empty state cuando no existen funnels creados */}
              {(funnels.items ?? []).length === 0 && (
                <div className="grid place-items-center h-full text-center text-slate-600">
                  <div>
                    <div className="text-lg font-semibold mb-1">Todavía no creaste un funnel</div>
                    <div className="text-sm mb-4">Crea tu primer funnel para visualizar el recorrido y la conversión de tus eventos.</div>
                    <Button variant="connect" onClick={createFunnel} size="md">Crear nuevo funnel</Button>
                  </div>
                </div>
              )}
              {/* Empty state cuando el funnel activo no tiene pasos */}
              {active && localSteps.length === 0 && (
                <div className="h-full grid place-items-center text-center text-slate-600">
                  <div>
                    <div className="font-medium mb-1">Funnel vacío</div>
                    <div className="text-sm mb-3">Desde la tabla de eventos, arrastrá uno y soltalo aquí. Luego podrás reordenar.</div>
                  </div>
                </div>
              )}

              {/* Zona de drop inicial antes del primer paso (ghost) */}
              {isDragging && localSteps.length > 0 && (
                <div
                  key={`dz-0`}
                  className={`h-8 border-2 border-dashed rounded-md mb-2 ${hoverIndex === 0 ? 'border-blue-400 bg-blue-50' : 'border-slate-300'}`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setHoverIndex(0);
                  }}
                  onDrop={dropAt(0)}
                />
              )}

              {localSteps.map((id, idx) => {
                const ev = (events.items ?? []).find((x: any) => x._id === id);
                const label = ev?.name || id;
                const c = ga4Counts[id] || 0;
                return (
                  <Fragment key={id}>
                    {/* Contenedor a ancho completo para mejorar el hit-area de DnD */}
                    <div
                      className="w-full"
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', `step:${id}`);
                        try { e.dataTransfer.effectAllowed = 'move'; } catch {}
                        setDraggingId(id);
                        setIsDragging(true);
                      }}
                      onDragEnd={() => {
                        setIsDragging(false);
                        setHoverIndex(null);
                        setDraggingId(null);
                      }}
                      role="listitem"
                      aria-grabbed={isDragging && draggingId === id}
                      onDragOver={(e) => {
                        e.preventDefault();
                        try { e.dataTransfer.dropEffect = 'move'; } catch {}
                        const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                        const mid = rect.top + rect.height / 2;
                        const next = e.clientY < mid ? idx : idx + 1;
                        if (next !== hoverIndex) setHoverIndex(next);
                      }}
                      onDragEnter={(e) => {
                        e.preventDefault();
                        const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                        const mid = rect.top + rect.height / 2;
                        const next = e.clientY < mid ? idx : idx + 1;
                        if (next !== hoverIndex) setHoverIndex(next);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                        const mid = rect.top + rect.height / 2;
                        const targetIndex = e.clientY < mid ? idx : idx + 1;
                        // Reordenar inline para mayor estabilidad
                        const payload = e.dataTransfer.getData('text/plain');
                        const fallbackId = payload ? (payload.startsWith('step:') ? payload.slice(5) : payload) : null;
                        const incomingId = draggingId || fallbackId;
                        // Si soltamos sobre la misma posición (sin movimiento), no hagamos nada
                        const from = incomingId ? localSteps.indexOf(incomingId) : -1;
                        if (!incomingId || !active || (from !== -1 && (targetIndex === from || targetIndex === from + 1))) {
                          setIsDragging(false);
                          setHoverIndex(null);
                          setDraggingId(null);
                          return;
                        }
                        let cur = localSteps.filter((s) => s !== incomingId);
                        let to = targetIndex;
                        if (from !== -1 && from < targetIndex) to = Math.max(0, targetIndex - 1);
                        cur.splice(to, 0, incomingId);
                        setLocalSteps(cur);
                        (async () => {
                          await funnels.update(active._id as any, { steps: cur.map((x) => ({ eventId: x })) } as any);
                          await funnels.refetch();
                          setIsDragging(false);
                          setHoverIndex(null);
                          setDraggingId(null);
                        })();
                      }}
                    >
                      {/* Barra interna con ancho decreciente para simular embudo (lado derecho achica) */}
                      <div
                        className={`rounded-md text-white bg-gradient-to-r from-blue-500 to-indigo-600 overflow-hidden transition-all hover:shadow-md hover:-translate-y-px ${isDragging && (hoverIndex === idx || hoverIndex === idx + 1) ? ' ring-2 ring-blue-300' : ''}`}
                        style={{
                          width: (() => {
                            const minEnd = 40; // % mínimo para la última barra
                            const denom = Math.max(12, Math.max(1, localSteps.length - 1));
                            const t = denom > 0 ? idx / denom : 0; // 0..1 como máximo a partir de 13 barras
                            const w = 100 - t * (100 - minEnd);
                            return `${Math.max(minEnd, Math.min(100, w))}%`;
                          })(),
                        }}
                      >
                        <div className={`flex items-center justify-between gap-3 w-full h-10 px-3 select-none text-xs ${isDragging ? 'pointer-events-none' : ''}`}>
                          <span className="flex items-center gap-2 min-w-0">
                            <span title="Arrastrar para reordenar" className="opacity-80 cursor-grab active:cursor-grabbing inline-flex shrink-0">
                              <GripVertical size={16} />
                            </span>
                            <span className="truncate" title={label}>{label}</span>
                          </span>
                          <span className="flex items-center gap-2 shrink-0">
                            <span className="opacity-90 text-xs bg-white/15 rounded px-1.5 py-0.5">{c.toLocaleString()}</span>
                            <IconButton className="h-7 w-7" variant="danger" title="Quitar" onClick={() => setRemoveStepId(id)} aria-label="Quitar">
                              <X size={16} />
                            </IconButton>
                          </span>
                        </div>
                      </div>
                    </div>
                  {/* Zona de drop debajo de cada paso */}
                  {isDragging && (
                    <div
                        key={`dz-${idx + 1}`}
                        className={`h-10 border-2 border-dashed rounded-md my-2 ${hoverIndex === idx + 1 ? 'border-blue-400 bg-blue-50' : 'border-slate-300'}`}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setHoverIndex(idx + 1);
                        }}
                        onDrop={dropAt(idx + 1)}
            />
          )}
                  </Fragment>
                );
              })}
              {!active && (funnels.items ?? []).length > 0 && (
                <div className="grid place-items-center h-full text-center text-slate-600">
                  <div>
                    <div className="font-medium mb-1">Seleccioná un funnel</div>
                    <div className="text-sm mb-3">Usá el selector de la derecha para elegir uno existente.</div>
                    <Button variant="primary" onClick={createFunnel}>Crear nuevo funnel</Button>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      <Modal
        open={Boolean(deleteId)}
        title="Eliminar evento"
        description="Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId('')}
      />
      <Modal
        open={Boolean(removeStepId)}
        title="Quitar del funnel"
        description="¿Seguro que querés quitar este evento del funnel?"
        confirmText="Quitar"
        cancelText="Cancelar"
        variant="danger"
        onConfirm={async () => {
          if (!active || !removeStepId) return;
          const cur = localSteps.filter((s) => s !== removeStepId);
          setLocalSteps(cur);
          await funnels.update(active._id as any, { steps: cur.map((x) => ({ eventId: x })) } as any);
          await funnels.refetch();
          setRemoveStepId('');
        }}
        onCancel={() => setRemoveStepId('')}
      />
      <Modal
        open={Boolean(deleteFunnel)}
        title="Eliminar funnel"
        description="Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        onConfirm={async () => {
          if (!active) return;
          try {
            await funnels.remove(active._id as any);
            await funnels.refetch();
            setActiveId('');
            setLocalSteps([]);
            notify({ type: 'success', title: 'Funnel eliminado', message: '' });
          } catch (e: any) {
            notify({
              type: 'error',
              title: 'Error al eliminar',
              message: e?.message || 'Intenta nuevamente',
            });
          }
          setDeleteFunnel(false);
        }}
        onCancel={() => setDeleteFunnel(false)}
      />
    </div>
  );
}
