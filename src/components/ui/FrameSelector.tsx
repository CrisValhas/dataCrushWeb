import React from 'react';

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
  frames: Frame[];
  selectedSlide: number;
  onSlideChange: (index: number) => void;
  loading?: boolean;
};

export function FrameSelector({ frames, selectedSlide, onSlideChange, loading = false }: Props) {
  if (loading) {
    return (
      <div className="bg-white border rounded-xl p-4 shadow-sm mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="font-semibold text-gray-600">Frames de Figma</div>
          <div className="text-sm text-gray-500">Cargando...</div>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex-shrink-0">
              <div className="w-32 h-24 bg-gray-100 rounded-lg animate-pulse"></div>
              <div className="w-20 h-3 bg-gray-100 rounded mt-2 animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (frames.length === 0) {
    return (
      <div className="bg-white border rounded-xl p-4 shadow-sm mb-6">
        <div className="font-semibold text-gray-600 mb-4">Frames de Figma</div>
        <div className="text-center py-8 text-gray-500">
          <div className="text-sm">No se encontraron frames en el archivo de Figma</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border rounded-xl p-4 shadow-sm mb-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="font-semibold text-gray-600">Frames de Figma</div>
        <div className="text-sm text-gray-500">
          {selectedSlide + 1} de {frames.length}
        </div>
      </div>
      
      {/* Scroll lateral de frames */}
      <div className="overflow-x-auto">
        <div className="flex gap-3 pb-2" style={{ width: 'max-content' }}>
          {frames.map((frame, index) => (
            <div
              key={frame.id}
              className={`flex-shrink-0 cursor-pointer transition-all duration-200 ${
                selectedSlide === index 
                  ? 'transform scale-105' 
                  : 'hover:transform hover:scale-102'
              }`}
              onClick={() => onSlideChange(index)}
            >
              <div className={`relative border-2 rounded-lg overflow-hidden ${
                selectedSlide === index 
                  ? 'border-blue-500 shadow-lg' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}>
                <div className="w-32 h-24 relative">
                  <img
                    src={frame.thumbUrl || 'https://placehold.co/128x96/f0f0f0/666?text=Frame'}
                    alt={frame.name}
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                  {selectedSlide === index && (
                    <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                      <div className="bg-blue-500 text-white px-2 py-1 rounded text-xs font-medium">
                        Seleccionado
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className={`text-xs mt-2 text-center truncate w-32 ${
                selectedSlide === index ? 'font-medium text-blue-600' : 'text-gray-600'
              }`}>
                {frame.name}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Indicador de scroll si hay muchos frames */}
      {frames.length > 6 && (
        <div className="text-xs text-gray-400 text-center mt-2">
          ← Desliza para ver más frames →
        </div>
      )}
    </div>
  );
}