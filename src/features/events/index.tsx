import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/layout/PageHeader';
import { FilterTag } from '../../components/ui/FilterTag';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/IntegrationButtons';
import { useProject } from '../../app/project';
import { useData, useFigmaConnection } from '../../app/data';
import { useToast } from '../../app/toast';
import { apiFetch } from '../../lib/api';
import { Modal } from '../../components/ui/Modal';
import { FigmaFrames } from './components/FigmaFrames';
import { FrameSelector } from '../../components/ui/FrameSelector';
import { EventsTable } from './components/EventsTable';
import { EventForm } from './components/EventForm';
import { generateDataLayersPDF, PDFEvent } from '../../lib/pdf';
import { Figma } from 'lucide-react';
import { FigmaFileSelector } from '../integrations/FigmaFileSelector';

export function EventsPage() {
  const { projectId: globalProjectId, setProjectId } = useProject();
  const { events, frames, connections, integrations, projects } = useData();
  const { figmaFiles, isLoadingFigmaFiles } = useFigmaConnection();
  const { notify } = useToast();
  const navigate = useNavigate();
  const [isFigmaModalOpen, setIsFigmaModalOpen] = useState(false);
  
  // Obtener projectId de los parámetros de la ruta o usar el global
  const urlParams = useParams();
  const projectId = urlParams.projectId || globalProjectId;
  
  // Establecer el proyecto actual si viene de la URL
  useEffect(() => {
    if (urlParams.projectId && urlParams.projectId !== globalProjectId) {
      setProjectId(urlParams.projectId);
    }
  }, [urlParams.projectId, globalProjectId, setProjectId]);

  // Selector de rango de días para GA4
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

  // Event form states
  const [name, setName] = useState('');
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const [category, setCategory] = useState('');
  const [actionType, setActionType] = useState('');
  const [label, setLabel] = useState('');
  const [location, setLocation] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const formRef = useRef<HTMLDivElement | null>(null);

  // Figma states
  const [figmaSlide, setFigmaSlide] = useState(0);
  const [figmaFileId, setFigmaFileId] = useState('');
  const [figmaFrameId, setFigmaFrameId] = useState('');
  const [figmaComponentId, setFigmaComponentId] = useState('');
  const [figmaRegionRect, setFigmaRegionRect] = useState<null | {
    xPct: number;
    yPct: number;
    wPct: number;
    hPct: number;
  }>(null);

  // Filter states
  const [tab, setTab] = useState<string>('all');
  const [q, setQ] = useState('');
  
  const [deleteId, setDeleteId] = useState('');

  // Derived data
  const categories = useMemo(
    () => Array.from(new Set((events.items ?? []).map((e: any) => e.category).filter(Boolean))),
    [events.items],
  );
  
  const actions = useMemo(
    () => Array.from(new Set((events.items ?? []).map((e: any) => e.actionType).filter(Boolean))),
    [events.items],
  );

  const labelSuggestions = useMemo(
    () => Array.from(new Set((events.items ?? []).map((e: any) => (e?.metadata?.label as string) || '').filter(Boolean))),
    [events.items],
  );

  const figmaFileName = integrations?.projectFigmaFile?.data?.figmaFileName || null;
  const hasFigmaFile = Boolean(figmaFileName);
  // Conexión FIGMA por proyecto (no global)
  const figmaConnectedProject = Boolean(projectId && connections?.[projectId]?.includes('FIGMA'));
  // El empty state solo depende de si hay archivo asignado al proyecto
  const shouldShowEmpty = !hasFigmaFile;

  // Filtered events
  const filtered = useMemo(() => {
    return (events.items ?? []).filter((e: any) => {
      const matchesQ = [e.name, e.category, e.actionType]
        .join(' ')
        .toLowerCase()
        .includes(q.toLowerCase());
      const matchesTab = tab === 'all' ? true : e.category === tab;
      
      // Figma filter
      const meta = (e as any).metadata || {};
      const hasFigmaFilter = Boolean(figmaComponentId || figmaFrameId || figmaFileId);
      let passesFigma = true;
      if (hasFigmaFilter) {
        passesFigma = figmaComponentId
          ? meta.figmaComponentId === figmaComponentId
          : figmaFrameId
            ? meta.figmaFrameId === figmaFrameId
            : figmaFileId
              ? meta.figmaFileId === figmaFileId
              : true;
      }
      
      return matchesQ && matchesTab && passesFigma;
    });
  }, [
    events.items,
    tab,
    q,
    figmaComponentId,
    figmaFrameId,
    figmaFileId,
  ]);

  // Form functions
  const resetForm = () => {
    setName('');
    setCategory('');
    setActionType('');
    setLabel('');
    setLocation('');
    setFigmaFileId('');
    setFigmaFrameId('');
    setFigmaComponentId('');
    setFigmaRegionRect(null);
  };

  const saveEvent = async () => {
    if (!projectId || !name) return;
    
    try {
      if (hasFigmaFile && (!figmaFileId || !figmaFrameId)) {
        notify({
          type: 'error',
          title: 'Selecciona una pantalla',
          message: 'Elige una pantalla (frame) de Figma antes de guardar.',
        });
        return;
      }

      if (editingId) {
        await events.update(editingId, {
          name,
          category,
          actionType,
          component: 'ui',
          metadata: {
            label,
            location,
            figmaFileId,
            figmaFrameId,
            figmaComponentId,
            figmaRegionRect,
          } as any,
        } as any);
        notify({ type: 'success', title: 'Evento actualizado', message: name });
      } else {
        await events.create({
          projectId,
          name,
          category,
          actionType,
          component: 'ui',
          metadata: {
            label,
            location,
            figmaFileId,
            figmaFrameId,
            figmaComponentId,
            figmaRegionRect,
          } as any,
        } as any);
        notify({ type: 'success', title: 'Evento guardado', message: name });
      }
      
      resetForm();
      setEditingId(null);
      events.refetch();
      refetchCounts();
    } catch (e: any) {
      notify({ type: 'error', title: 'Error', message: e?.message || 'Intenta nuevamente' });
    }
  };

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

  // Descargar DataLayers (PDF)
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const downloadDataLayers = async () => {
    if (generatingPdf) return;
    setGeneratingPdf(true);
    const framesList = (frames.items ?? []) as any[];
    const eventsList = (events.items ?? []) as any[];

    const pdfEvents: PDFEvent[] = eventsList
      .filter((e) => e?.metadata?.figmaFrameId)
      .map((e) => ({
        frameId: e.metadata.figmaFrameId,
        frameName:
          framesList.find((f) => f.id === e.metadata.figmaFrameId)?.name || e.metadata.figmaFrameId,
        eventName: e.name,
        category: e.category,
        actionType: e.actionType,
        label: e.metadata?.label,
        location: e.metadata?.location,
        regionRect: e.metadata?.figmaRegionRect || null,
      }));

    const framesLite = framesList.map((f) => ({ id: f.id, name: f.name, thumbUrl: f.thumbUrl }));

  const proj = (projects.items || []).find((p: any) => p._id === projectId);
  const projectName = proj?.name || 'Proyecto';
  const fileName = `DataLayers_${projectName.replace(/\s+/g, '_')}.pdf`;

    try {
      await generateDataLayersPDF(fileName, framesLite, pdfEvents, { projectName, projectId: projectId || undefined });
      notify({ type: 'success', title: 'PDF generado', message: fileName });
    } catch (e: any) {
      notify({ type: 'error', title: 'Error al generar PDF', message: e?.message || 'Intenta nuevamente' });
    } finally {
      setGeneratingPdf(false);
    }
  };

  // Effects
  useEffect(() => {
    if (editingId) {
      // Cuando entramos en modo edición, llevamos el foco al nombre y hacemos scroll al formulario
      nameInputRef.current?.focus();
      // Scroll suave al contenedor del formulario para dar contexto visual
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      // Al salir de edición, enfocamos el campo para crear rápidamente un nuevo evento
      nameInputRef.current?.focus();
    }
  }, [editingId]);

  // Update fileId/frameId when slide changes
  useEffect(() => {
    const items = frames.items ?? [];
    if (!items.length) return;
    
    const current = items[Math.min(figmaSlide, items.length - 1)] || items[0];
    if (!current) return;
    
    setFigmaFileId((current as any).fileId || '');
    setFigmaFrameId((current as any).id || '');
    setFigmaComponentId('');
    setFigmaRegionRect(null);
  }, [figmaSlide, frames.items]);

  useEffect(() => {
    if (!figmaFrameId) return;
    
    const items = frames.items ?? [];
    const idx = items.findIndex((frame: any) => frame.id === figmaFrameId);
    if (idx >= 0 && idx !== figmaSlide) setFigmaSlide(idx);
  }, [figmaFrameId, frames.items]);

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <PageHeader title="Events" description="Crea, edita y gestiona tus eventos" />
        <div className="flex items-center gap-2">
          {!shouldShowEmpty && (
            <Button variant="connect" size="md" onClick={() => setIsFigmaModalOpen(true)}>
              Cambiar wireframe
            </Button>
          )}
          <Button variant="connect" size="md" onClick={() => navigate('/app/projects')}>
            Volver a proyectos
          </Button>
        </div>
      </div>

      {/* Contenido principal */}
      {shouldShowEmpty ? (
        // Empty state full-screen
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="min-h-[70vh] grid place-items-center">
            <div className="w-full max-w-3xl">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Figma size={22} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-700 mb-1">Wireframes de Figma</div>
                  {!figmaConnectedProject ? (
                    <p className="text-sm text-gray-600 mb-4">
                      Para empezar, conectá tu cuenta de Figma y asigná un archivo. Luego podrás seleccionar un wireframe y mapear eventos sobre él.
                    </p>
                  ) : (
                    <p className="text-sm text-gray-600 mb-4">
                      No hay ningún archivo de Figma asignado a este proyecto. Seleccioná uno para cargar tus wireframes.
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="connect"
                      onClick={() => {
                        if (!projectId) return;
                        navigate(`/app/project/${projectId}/integrations`);
                      }}
                    >
                      Ir a Integraciones
                    </Button>
                    <Button variant="primary" onClick={() => setIsFigmaModalOpen(true)}>
                      Cargar wireframe
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Main Layout: Side by Side */}
          <div className="flex flex-col md:flex-row gap-6 mb-6 min-w-0">
            {/* Left Column: Figma Components */}
            <div className="flex-1 min-w-0 flex flex-col gap-4">
              <FrameSelector
                frames={(frames.items ?? []) as any}
                selectedSlide={figmaSlide}
                onSlideChange={setFigmaSlide}
                loading={frames.loading}
              />
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="font-semibold text-gray-600">Preview del Frame</div>
                </div>
                <div className="overflow-hidden">
                  <FigmaFrames
                    isFigmaConnected={figmaConnectedProject}
                    currentAssociation={integrations?.projectFigmaFile?.data}
                    frames={(frames.items ?? []) as any}
                    loadingFrames={frames.loading}
                    slide={figmaSlide}
                    setSlide={setFigmaSlide}
                    figmaComponentId={figmaComponentId}
                    setFigmaComponentId={setFigmaComponentId}
                    onSelectArea={({ frameId, componentId, regionRect, suggestedName }) => {
                      setFigmaFrameId(frameId);
                      setFigmaComponentId(componentId || '');
                      setFigmaRegionRect(regionRect || null);
                      const assocKey = (integrations?.projectFigmaFile?.data as any)?.figmaFileKey || '';
                      setFigmaFileId(assocKey);
                      if (!editingId && !name) setName(suggestedName || 'custom_event');
                    }}
                    ga4Connected={Boolean(projectId && connections?.[projectId]?.includes('GA4'))}
                    onValidateAll={async () => {
                      await refetchCounts();
                      const items = (events.items ?? []) as any[];
                      const implemented = items.filter((e) => (ga4Counts as any)[e._id] > 0).length;
                      const total = items.length;
                      notify({
                        type: 'success',
                        title: 'Validación GA4',
                        message: `${implemented}/${total} eventos implementados`,
                      });
                    }}
                    onOpenDevPreview={() => {}}
                    selectedRegionRect={figmaRegionRect}
                    selectedFrameId={figmaFrameId}
                    existingEvents={
                      ((events.items ?? []) as any[])
                        .filter((e) => e?.metadata?.figmaFrameId && e?.metadata?.figmaRegionRect)
                        .map((e) => ({
                          frameId: e.metadata.figmaFrameId,
                          name: e.name,
                          regionRect: e.metadata.figmaRegionRect,
                          implemented: ((ga4Counts as any)[e._id] || 0) > 0,
                        }))
                    }
                  />
                </div>
              </div>
            </div>

            {/* Right Column: Event Form */}
            <div ref={formRef} className="w-full md:w-[40%] bg-white rounded-xl border border-gray-200 p-4 flex-shrink-0 min-w-0">
              <div className="font-semibold text-gray-600 mb-4">
                {editingId ? 'Editar Evento' : 'Crear Evento'}
              </div>
              <EventForm
                name={name}
                setName={setName}
                category={category}
                setCategory={setCategory}
                actionType={actionType}
                setActionType={setActionType}
                label={label}
                setLabel={setLabel}
                location={location}
                setLocation={setLocation}
                categories={categories as any}
                actions={actions as any}
                labelSuggestions={labelSuggestions as any}
                onSave={saveEvent}
                nameInputRef={nameInputRef}
                editingId={editingId}
                onDownloadDataLayers={downloadDataLayers}
                downloadingPdf={generatingPdf}
              />
            </div>
          </div>

          {/* Events Table */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="font-semibold text-gray-600">Eventos Creados</div>
              <div className="flex items-center gap-2 flex-wrap md:flex-nowrap">
                <div className="w-44 md:w-64 shrink">
                  <Input
                    placeholder="Buscar evento..."
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                  />
                </div>
                <select
                    className="h-9 border rounded px-2 text-sm w-28 md:w-36 shrink"
                  value={days}
                  onChange={(e) => setDays(Number(e.target.value) || 7)}
                >
                    <option value={7}>7 días</option>
                    <option value={30}>30 días</option>
                    <option value={90}>90 días</option>
                </select>
                <Button
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
                  size="sm"
                  className="ml-1 shrink-0"
                >
                  Revalidar eventos
                </Button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <FilterTag active={tab === 'all'} label="Todos" onClick={() => setTab('all')} />
              {categories.map((c) => (
                <FilterTag key={c} active={tab === c} label={c} onClick={() => setTab(c)} />
              ))}
            </div>

            {filtered.length === 0 ? (
              <div className="min-h-[200px] grid place-items-center">
                <div className="text-center max-w-md">
                  <div className="text-gray-800 font-medium mb-1">Aún no hay eventos</div>
                  <p className="text-sm text-gray-600 mb-4">
                    Creá tu primer evento para empezar a mapear interacciones sobre tus wireframes.
                  </p>
                  <Button
                    variant="primary"
                    onClick={() => {
                      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      // Enfocamos el input de nombre para agilizar la creación
                      setTimeout(() => nameInputRef.current?.focus(), 300);
                    }}
                  >
                    Crear evento
                  </Button>
                </div>
              </div>
            ) : (
              <EventsTable
                items={filtered as any}
                ga4Counts={ga4Counts as any}
                onEdit={(e: any) => {
                  setEditingId(e._id);
                  setName(e.name || '');
                  setCategory(e.category || '');
                  setActionType(e.actionType || '');
                  const meta = (e as any).metadata || {};
                  setLabel(meta.label || '');
                  setLocation(meta.location || '');
                  setFigmaFileId(meta.figmaFileId || '');
                  setFigmaFrameId(meta.figmaFrameId || '');
                  setFigmaComponentId(meta.figmaComponentId || '');
                  setFigmaRegionRect(meta.figmaRegionRect || null);
                  const items = frames.items ?? [];
                  const idx = items.findIndex((frame: any) => frame.id === meta.figmaFrameId);
                  if (idx >= 0) setFigmaSlide(idx);
                }}
                onAskDelete={(id) => setDeleteId(id)}
              />
            )}
          </div>
        </>
      )}

      {/* Delete Modal */}
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

      {/* Modal inline para seleccionar/cargar archivo de Figma */}
      <Modal
        open={isFigmaModalOpen}
        title="Seleccionar archivo de Figma"
        description="Asigná un archivo de Figma al proyecto para poder seleccionar wireframes y mapear eventos."
        confirmText="Cerrar"
        cancelText="Cancelar"
        onConfirm={() => setIsFigmaModalOpen(false)}
        onCancel={() => setIsFigmaModalOpen(false)}
      >
        <div className="pt-2">
          <FigmaFileSelector
            files={figmaFiles || []}
            loading={isLoadingFigmaFiles}
            selectedFile={integrations?.projectFigmaFile?.data?.figmaFileKey || null}
            onSelect={async (fileKey, fileName, fileUrl) => {
              await integrations.projectFigmaFile.assign(fileKey, fileName, fileUrl);
              // Refrescar estado para que se carguen frames y la asociación quede visible inmediatamente
              if (integrations?.projectFigmaFile?.refetch) await integrations.projectFigmaFile.refetch();
              if (frames?.refetch) await frames.refetch();
              setIsFigmaModalOpen(false);
              notify({ type: 'success', title: 'Figma asignado', message: fileName });
            }}
            onRemove={async () => {
              await integrations.projectFigmaFile.remove();
              // Mantener el modal abierto y refrescar datos para permitir elegir el siguiente archivo inmediatamente
              if (integrations?.projectFigmaFile?.refetch) await integrations.projectFigmaFile.refetch();
              if (frames?.refetch) await frames.refetch();
              notify({ type: 'success', title: 'Archivo removido', message: 'Seleccioná un nuevo wireframe.' });
            }}
            hideHeader
            hideDescription
            hideSelectedNote
          />
        </div>
      </Modal>
    </div>
  );
}