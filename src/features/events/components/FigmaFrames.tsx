import React, { Dispatch, SetStateAction } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { IconButton } from '../../../components/ui/IconButton';

type Frame = {
  id: string;
  name: string;
  thumbUrl?: string | null;
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  components?: { id: string; name?: string; x?: number; y?: number; width?: number; height?: number }[];
};

type Props = {
  isFigmaConnected: boolean;
  currentAssociation: { figmaFileKey?: string | null } | null | undefined;
  frames: Frame[];
  loadingFrames: boolean;
  slide: number;
  setSlide: Dispatch<SetStateAction<number>>;
  figmaComponentId?: string;
  setFigmaComponentId?: (v: string) => void;
  onSelectArea?: (payload: { frameId: string; componentId?: string; regionRect?: { xPct: number; yPct: number; wPct: number; hPct: number }; suggestedName?: string }) => void;
  ga4Connected?: boolean;
  onValidateAll?: () => void;
  onOpenDevPreview?: () => void;
  selectedRegionRect?: { xPct: number; yPct: number; wPct: number; hPct: number } | null;
  selectedFrameId?: string | null;
  existingEvents?: { frameId: string; name: string; regionRect: { xPct: number; yPct: number; wPct: number; hPct: number }; implemented?: boolean }[];
};

export function FigmaFrames({
  isFigmaConnected,
  currentAssociation,
  frames,
  loadingFrames,
  slide,
  setSlide,
  figmaComponentId = '',
  setFigmaComponentId = () => {},
  onSelectArea,
  ga4Connected,
  onValidateAll,
  onOpenDevPreview,
  selectedRegionRect,
  selectedFrameId,
  existingEvents = [],
}: Props) {
  const [drag, setDrag] = React.useState<null | { startX: number; startY: number; x: number; y: number; w: number; h: number }>(null);
  const [imgReady, setImgReady] = React.useState(false);
  React.useEffect(() => {
    // Reiniciar estado de carga de imagen al cambiar de slide o de frame
    setImgReady(false);
  }, [slide, frames?.[slide]?.thumbUrl]);

  return (
    <div className="space-y-4">
      {!isFigmaConnected ? (
        <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center text-gray-500">
          <div className="font-medium mb-1">Figma no conectado</div>
          <div className="text-sm">Primero tenes que conectar tu cuenta de Figma.</div>
        </div>
      ) : loadingFrames ? (
        <div>
          <div className="w-full flex items-center justify-center gap-3">
            <div
              className="relative border border-gray-300 shadow-lg bg-gray-100/70 rounded-md overflow-hidden animate-pulse w-full max-w-[1200px] h-[65vh]"
            />
          </div>
          <div className="mt-4 text-center">
            <div className="mx-auto h-4 w-56 bg-gray-200 rounded mb-2 animate-pulse" />
            <div className="mx-auto h-3 w-80 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      ) : currentAssociation && frames.length === 0 ? (
        <div>
          <div className="w-full flex items-center justify-center gap-3">
            <div
              className="relative border border-gray-300 shadow-lg bg-gray-100/70 rounded-md overflow-hidden animate-pulse w-full max-w-[1200px] h-[65vh]"
            />
          </div>
          <div className="mt-4 text-center">
            <div className="mx-auto h-4 w-56 bg-gray-200 rounded mb-2 animate-pulse" />
            <div className="mx-auto h-3 w-80 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      ) : currentAssociation && frames.length > 0 ? (
          <div>
            {/* Vista del frame seleccionado */}
            {(() => {
              const currentFrame = frames[slide];
              if (!currentFrame) {
                return (
                  <div className="text-center py-8 text-slate-600">
                    <div className="text-sm">Frame no encontrado</div>
                  </div>
                );
              }

              const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
              const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
              const baseWidth = (currentFrame.width && currentFrame.width > 100) ? currentFrame.width : 375;
              const baseHeight = (currentFrame.height && currentFrame.height > 100) ? currentFrame.height : 812;
              
              if (baseWidth <= 0 || baseHeight <= 0) {
                return (
                  <div className="text-center py-8 text-slate-600">
                    <div className="text-sm">Frame con dimensiones inválidas</div>
                  </div>
                );
              }

              const maxWidth = Math.min(viewportWidth * 0.92, 1200);
              const maxHeight = viewportHeight * 0.65; // limitar a ~65vh
              const wScale = maxWidth / baseWidth;
              const hScale = maxHeight / baseHeight;
              const scale = Math.min(wScale, hScale, 1); // no crecer más que el tamaño base
              const previewWidth = Math.max(1, Math.round(baseWidth * scale));
              const previewHeight = Math.max(1, Math.round(baseHeight * scale));
              
              const total = frames.length;
              const isFirst = slide <= 0;
              const isLast = slide >= total - 1;

              return (
                <div className="w-full">
                  <div className="w-full flex items-center justify-center gap-3">
                    {total > 1 && (
                      <IconButton
                        aria-label="Anterior"
                        size="md"
                        className="shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                        onClick={() => {
                          if (!isFirst) setSlide((s) => Math.max(0, s - 1));
                        }}
                        disabled={isFirst}
                      >
                        <ChevronLeft size={18} />
                      </IconButton>
                    )}
                    <div 
                      className="relative border border-gray-300 shadow-lg cursor-crosshair select-none bg-white" 
                      style={{ width: previewWidth, height: previewHeight }}
                      onMouseDown={(e) => {
                        if (!onSelectArea) return;
                        const rect = e.currentTarget.getBoundingClientRect();
                        const x = ((e.clientX - rect.left) / scale);
                        const y = ((e.clientY - rect.top) / scale);
                        setDrag({ startX: x, startY: y, x, y, w: 0, h: 0 });
                      }}
                      onMouseMove={(e) => {
                        if (!drag || !onSelectArea) return;
                        const rect = e.currentTarget.getBoundingClientRect();
                        const x = Math.min(drag.startX, (e.clientX - rect.left) / scale);
                        const y = Math.min(drag.startY, (e.clientY - rect.top) / scale);
                        const w = Math.abs((e.clientX - rect.left) / scale - drag.startX);
                        const h = Math.abs((e.clientY - rect.top) / scale - drag.startY);
                        setDrag({ ...drag, x, y, w, h });
                      }}
                      onMouseUp={(e) => {
                        if (!drag || !onSelectArea) {
                          setDrag(null);
                          return;
                        }
                        
                        const minSize = 10;
                        if (drag.w < minSize || drag.h < minSize) {
                          setDrag(null);
                          return;
                        }
                        
                        const regionRect = {
                          xPct: drag.x / baseWidth,
                          yPct: drag.y / baseHeight,
                          wPct: drag.w / baseWidth,
                          hPct: drag.h / baseHeight,
                        };
                        
                        onSelectArea({
                          frameId: currentFrame.id,
                          regionRect,
                          suggestedName: `${currentFrame.name}_region`,
                        });
                        
                        setDrag(null);
                      }}
                    >
                      {!imgReady && (
                        <div className="absolute inset-0 bg-gray-100/70 animate-pulse rounded-sm" />
                      )}
                      <img
                        src={currentFrame.thumbUrl || 'https://placehold.co/400x600/f0f0f0/666?text=Pantalla'}
                        alt={currentFrame.name}
                        className="w-full h-full object-cover pointer-events-none"
                        draggable={false}
                        onDragStart={(e) => e.preventDefault()}
                        onLoad={() => setImgReady(true)}
                        onError={() => setImgReady(true)}
                      />
                      
                      {/* Área de selección actual */}
                      {drag && (
                        <div
                          className="absolute border-2 border-blue-500 bg-blue-500/20 pointer-events-none"
                          style={{
                            left: drag.x * scale,
                            top: drag.y * scale,
                            width: drag.w * scale,
                            height: drag.h * scale,
                          }}
                        />
                      )}
                      
                      {/* Región seleccionada persistente */}
                      {selectedRegionRect && selectedFrameId === currentFrame.id && (
                        <div
                          className="absolute border-2 border-green-500 bg-green-500/20 pointer-events-none"
                          style={{
                            left: selectedRegionRect.xPct * baseWidth * scale,
                            top: selectedRegionRect.yPct * baseHeight * scale,
                            width: selectedRegionRect.wPct * baseWidth * scale,
                            height: selectedRegionRect.hPct * baseHeight * scale,
                          }}
                        />
                      )}
                      
                      {/* Eventos existentes en este frame */}
                      {existingEvents
                        .filter(event => event.frameId === currentFrame.id)
                        .map((event, eventIndex) => {
                          const left = event.regionRect.xPct * baseWidth * scale;
                          const top = event.regionRect.yPct * baseHeight * scale;
                          const width = event.regionRect.wPct * baseWidth * scale;
                          const height = event.regionRect.hPct * baseHeight * scale;
                          const isImplemented = Boolean(event.implemented);
                          const borderCls = isImplemented ? 'border-green-500' : 'border-orange-400';
                          const fillCls = isImplemented ? 'bg-green-500/20' : 'bg-orange-400/20';
                          const labelCls = isImplemented ? 'bg-green-600' : 'bg-orange-500';
                          return (
                            <div
                              key={eventIndex}
                              className={`absolute border-2 ${borderCls} ${fillCls} pointer-events-none`}
                              style={{ left, top, width, height }}
                              title={event.name}
                            >
                              <div className="absolute -top-5 left-0">
                                <span className={`inline-flex items-center px-2 py-0.5 text-[10px] leading-none rounded-md ${labelCls} text-white shadow-sm`}>
                                  {event.name}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                    {total > 1 && (
                      <IconButton
                        aria-label="Siguiente"
                        size="md"
                        className="shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                        onClick={() => {
                          if (!isLast) setSlide((s) => Math.min(total - 1, s + 1));
                        }}
                        disabled={isLast}
                      >
                        <ChevronRight size={18} />
                      </IconButton>
                    )}
                  </div>
                  
                  <div className="mt-4 text-center">
                    <div className="text-sm text-gray-600 mb-2">
                      <strong>{currentFrame.name}</strong>
                    </div>
                    <div className="text-xs text-gray-500">
                      Arrastra para seleccionar un área y crear un evento
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500">
            <div className="text-sm">No se encontró información del archivo Figma</div>
          </div>
        )}
    </div>
  );
}