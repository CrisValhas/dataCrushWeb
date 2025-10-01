import React, { useState } from 'react';
import { FigmaFile } from '../../lib/types';
import { useToast } from '../../app/toast';
// Eliminamos el modal anidado para unificar UX dentro del modal padre de Events
import { Button } from '../../components/ui/IntegrationButtons';
import { File as FileIcon, HelpCircle, Info as InfoIcon } from 'lucide-react';

interface FigmaFileSelectorProps {
  files: FigmaFile[];
  loading: boolean;
  selectedFile: string | null;
  onSelect: (fileKey: string, fileName: string, fileUrl?: string) => Promise<void>;
  onRemove: () => Promise<void>;
  hideHeader?: boolean;
  hideDescription?: boolean;
  hideSelectedNote?: boolean;
}

export function FigmaFileSelector({ files, loading, selectedFile, onSelect, onRemove, hideHeader = false, hideDescription = false, hideSelectedNote = false }: FigmaFileSelectorProps) {
  const [isSelecting, setIsSelecting] = useState(false);
  const [showManualAdd, setShowManualAdd] = useState(false);
  const [manualUrl, setManualUrl] = useState('');
  const [isManualSubmitting, setIsManualSubmitting] = useState(false);
  const { notify } = useToast();

  // Sanitiza textos: elimina emojis, contenido entre paréntesis y lo que sigue a un guion
  const sanitizeText = (text?: string) => {
    if (!text) return '';
    let t = text
      // Quitar emojis y pictogramas
      .replace(/[\p{Extended_Pictographic}\uFE0F]/gu, '')
      // Quitar contenido entre paréntesis
      .replace(/\s*\([^)]*\)/g, '')
      // Quitar todo después de un guion
      .replace(/\s*-\s.*$/, '')
      .trim();
    // Compactar espacios múltiples
    t = t.replace(/\s{2,}/g, ' ');
    return t;
  };

  const handleSelect = async (file: FigmaFile) => {
    // Manejar casos especiales para archivos helper/informativos
    if (file.key === 'personal-account-info') {
      notify({ 
        type: 'info', 
        title: 'Cuenta Personal', 
        message: 'Tu cuenta de Figma es personal. Usa la opción "Agregar archivo manualmente" para configurar archivos específicos.' 
      });
      return;
    }
    
    if (file.key === 'manual-add-file') {
      setShowManualAdd(true);
      return;
    }
    
    if (file.key === 'figma-help') {
      window.open(file.url || 'https://help.figma.com/hc/en-us/articles/360038006754-Share-files-and-prototypes', '_blank');
      return;
    }
    
    if (file.key === 'no-files-found') {
      notify({ 
        type: 'info', 
        title: 'Sin archivos', 
        message: 'No se encontraron archivos accesibles en tu cuenta de Figma.' 
      });
      return;
    }

    // Para archivos reales, proceder con la selección normal
    try {
      setIsSelecting(true);
      await onSelect(file.key, file.name);
      // No mostrar notificación aquí - se mostrará en el componente padre
    } catch (error) {
      notify({ type: 'error', title: 'Error', message: 'No se pudo asociar el archivo de Figma.' });
    } finally {
      setIsSelecting(false);
    }
  };

  const handleRemove = async () => {
    try {
      await onRemove();
      notify({ type: 'success', title: 'Archivo desasociado', message: 'El archivo de Figma se desasoció del proyecto.' });
    } catch (error) {
      notify({ type: 'error', title: 'Error', message: 'No se pudo desasociar el archivo de Figma.' });
    }
  };

  if (loading) {
    return (
      <div>
        {!hideHeader && (
          <h3 className="font-semibold text-lg mb-3">Archivo de Figma del Proyecto</h3>
        )}
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {!hideHeader && (
        <h3 className="font-semibold text-lg mb-3">Archivo de Figma del Proyecto</h3>
      )}
      {!hideDescription && (
        <p className="text-sm text-slate-700 mb-4">
          Selecciona qué archivo de Figma utilizar para este proyecto. Las pantallas de este archivo aparecerán en el módulo de eventos.
        </p>
      )}

      {selectedFile ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between border border-slate-200 bg-white text-slate-700 text-sm px-3 py-2 rounded">
            <span className="truncate">Archivo seleccionado: {files.find(f => f.key === selectedFile)?.name || 'Desconocido'}</span>
            <Button size="sm" className="w-28 justify-center" variant="disconnect" onClick={handleRemove}>Remover</Button>
          </div>
          {!hideSelectedNote && (
            <div className="text-xs text-slate-600">
              Las pantallas de este archivo están ahora disponibles en el módulo de eventos.
            </div>
          )}
        </div>
      ) : files.length === 0 ? (
        <div className="py-3 text-slate-700 space-y-3">
          <div className="text-center">
            <p className="mb-1">No se encontraron archivos de Figma.</p>
            <p className="text-xs">Podés agregarlos manualmente si conocés la URL del archivo.</p>
          </div>
          {/* Formulario inline para "Agregar archivo manualmente" cuando no hay archivos */}
          <div className="p-3 border rounded bg-slate-50 border-slate-200">
            <div className="text-sm font-medium text-slate-700 mb-2">Agregar archivo de Figma manualmente</div>
            <div className="flex items-center gap-2">
              <input
                type="url"
                value={manualUrl}
                onChange={(e) => setManualUrl(e.target.value)}
                placeholder="Pega la URL completa del archivo de Figma"
                className="flex-1 h-9 px-3 border rounded"
                disabled={isManualSubmitting}
              />
              <Button
                size="sm"
                className="w-28 justify-center"
                onClick={async () => {
                  if (!manualUrl.trim()) {
                    notify({ type: 'error', title: 'URL requerida', message: 'Ingresá la URL del archivo de Figma.' });
                    return;
                  }
                  const lower = manualUrl.toLowerCase();
                  if (!lower.includes('figma.com')) {
                    notify({ type: 'error', title: 'URL inválida', message: 'La URL debe contener figma.com' });
                    return;
                  }
                  try {
                    setIsManualSubmitting(true);
                    const parts = manualUrl.split('/');
                    const idx = parts.findIndex((p) => p === 'design' || p === 'file');
                    const fileKey = parts[idx + 1];
                    let fileName = 'Archivo de Figma';
                    if (parts[idx + 2]) {
                      fileName = decodeURIComponent(parts[idx + 2].split('?')[0]).replace(/-/g, ' ');
                    }
                    if (!fileKey || fileKey.length < 5) {
                      notify({ type: 'error', title: 'ID no encontrado', message: 'No se pudo extraer el ID del archivo. Verificá la URL.' });
                      setIsManualSubmitting(false);
                      return;
                    }
                    await onSelect(fileKey, fileName, manualUrl);
                    notify({ type: 'success', title: 'Figma asignado', message: fileName });
                    setShowManualAdd(false);
                    setManualUrl('');
                  } catch (err: any) {
                    notify({ type: 'error', title: 'Error', message: err?.message || 'No se pudo agregar el archivo' });
                  } finally {
                    setIsManualSubmitting(false);
                  }
                }}
                disabled={isManualSubmitting}
                variant="connect"
              >
                {isManualSubmitting ? 'Agregando...' : 'Agregar'}
              </Button>
            </div>
          </div>
        </div>
      ) : !Array.isArray(files) ? (
        <div className="py-3 space-y-3">
          <div className="text-center py-4 text-red-600">
            <p>Error al cargar archivos de Figma.</p>
            <p className="text-xs mt-2">Verifica tu conexión con Figma y vuelve a intentar.</p>
          </div>
          {/* Ofrecer también agregar manualmente en caso de error */}
          <div className="p-3 border rounded bg-slate-50 border-slate-200">
            <div className="text-sm font-medium text-slate-700 mb-2">Agregar archivo de Figma manualmente</div>
            <div className="flex items-center gap-2">
              <input
                type="url"
                value={manualUrl}
                onChange={(e) => setManualUrl(e.target.value)}
                placeholder="Pega la URL completa del archivo de Figma"
                className="flex-1 h-9 px-3 border rounded"
                disabled={isManualSubmitting}
              />
              <Button
                size="sm"
                className="w-28 justify-center"
                onClick={async () => {
                  if (!manualUrl.trim()) {
                    notify({ type: 'error', title: 'URL requerida', message: 'Ingresá la URL del archivo de Figma.' });
                    return;
                  }
                  const lower = manualUrl.toLowerCase();
                  if (!lower.includes('figma.com')) {
                    notify({ type: 'error', title: 'URL inválida', message: 'La URL debe contener figma.com' });
                    return;
                  }
                  try {
                    setIsManualSubmitting(true);
                    const parts = manualUrl.split('/');
                    const idx = parts.findIndex((p) => p === 'design' || p === 'file');
                    const fileKey = parts[idx + 1];
                    let fileName = 'Archivo de Figma';
                    if (parts[idx + 2]) {
                      fileName = decodeURIComponent(parts[idx + 2].split('?')[0]).replace(/-/g, ' ');
                    }
                    if (!fileKey || fileKey.length < 5) {
                      notify({ type: 'error', title: 'ID no encontrado', message: 'No se pudo extraer el ID del archivo. Verificá la URL.' });
                      setIsManualSubmitting(false);
                      return;
                    }
                    await onSelect(fileKey, fileName, manualUrl);
                    notify({ type: 'success', title: 'Figma asignado', message: fileName });
                    setShowManualAdd(false);
                    setManualUrl('');
                  } catch (err: any) {
                    notify({ type: 'error', title: 'Error', message: err?.message || 'No se pudo agregar el archivo' });
                  } finally {
                    setIsManualSubmitting(false);
                  }
                }}
                disabled={isManualSubmitting}
                variant="connect"
              >
                {isManualSubmitting ? 'Agregando...' : 'Agregar'}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {/* Formulario inline para "Agregar archivo manualmente" */}
          {showManualAdd && (
            <div className="p-3 border rounded bg-slate-50 border-slate-200">
              <div className="text-sm font-medium text-slate-700 mb-2">Agregar archivo de Figma manualmente</div>
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  value={manualUrl}
                  onChange={(e) => setManualUrl(e.target.value)}
                  placeholder="Pega la URL completa del archivo de Figma"
                  className="flex-1 h-9 px-3 border rounded"
                  disabled={isManualSubmitting}
                />
                <Button
                  size="sm"
                  className="w-28 justify-center"
                  onClick={async () => {
                    if (!manualUrl.trim()) {
                      notify({ type: 'error', title: 'URL requerida', message: 'Ingresá la URL del archivo de Figma.' });
                      return;
                    }
                    const lower = manualUrl.toLowerCase();
                    if (!lower.includes('figma.com')) {
                      notify({ type: 'error', title: 'URL inválida', message: 'La URL debe contener figma.com' });
                      return;
                    }
                    try {
                      setIsManualSubmitting(true);
                      const parts = manualUrl.split('/');
                      const idx = parts.findIndex((p) => p === 'design' || p === 'file');
                      const fileKey = parts[idx + 1];
                      let fileName = 'Archivo de Figma';
                      if (parts[idx + 2]) {
                        fileName = decodeURIComponent(parts[idx + 2].split('?')[0]).replace(/-/g, ' ');
                      }
                      if (!fileKey || fileKey.length < 5) {
                        notify({ type: 'error', title: 'ID no encontrado', message: 'No se pudo extraer el ID del archivo. Verificá la URL.' });
                        setIsManualSubmitting(false);
                        return;
                      }
                      await onSelect(fileKey, fileName, manualUrl);
                      notify({ type: 'success', title: 'Figma asignado', message: fileName });
                      setShowManualAdd(false);
                      setManualUrl('');
                    } catch (err: any) {
                      notify({ type: 'error', title: 'Error', message: err?.message || 'No se pudo agregar el archivo' });
                    } finally {
                      setIsManualSubmitting(false);
                    }
                  }}
                  disabled={isManualSubmitting}
                  variant="connect"
                >
                  {isManualSubmitting ? 'Agregando...' : 'Agregar'}
                </Button>
                <Button
                  size="sm"
                  className="w-28 justify-center"
                  variant="disconnect"
                  onClick={() => { setShowManualAdd(false); setManualUrl(''); }}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}
          {files.map((file) => {
            // Determinar el estilo según el tipo de archivo
            const isHelper = ['personal-account-info', 'no-files-found'].includes(file.key);
            const isManualAdd = file.key === 'manual-add-file';
            const isHelpGuide = file.key === 'figma-help';
            const isActionable = isManualAdd || isHelpGuide;
            const nameSafe = sanitizeText(file.name);
            const descSafe = sanitizeText(file.description);
            
            return (
              <div
                key={file.key}
                className={`flex items-center justify-between p-3 border rounded transition-colors ${
                  isHelper
                    ? 'border-slate-200 bg-slate-50'
                    : 'border-slate-200 hover:bg-slate-50 cursor-pointer'
                }`}
              >
                <div className="flex items-center space-x-3 min-w-0">
                  {file.thumbnail_url ? (
                    <img
                      src={file.thumbnail_url}
                      alt={file.name}
                      className="w-10 h-10 rounded-md border object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-md border bg-white text-slate-500 flex items-center justify-center">
                      {isHelpGuide ? <HelpCircle size={18} /> : isHelper ? <InfoIcon size={18} /> : <FileIcon size={18} />}
                    </div>
                  )}
                  <div>
                    <div className={`font-medium text-sm ${isHelper ? 'text-slate-800' : ''} truncate max-w-[56ch]`}>
                      {nameSafe}
                    </div>
                    {file.last_modified && !isHelper && !isActionable && (
                      <div className="text-xs text-slate-600">
                        Modificado: {new Date(file.last_modified).toLocaleDateString()}
                      </div>
                    )}
                    {descSafe && (
                      <div className="text-xs mt-1 text-slate-600 truncate max-w-[64ch]">{descSafe}</div>
                    )}
                  </div>
                </div>
                {isHelper ? (
                  <Button
                    size="sm"
                    className="w-28 justify-center"
                    variant="connect"
                    onClick={() => setShowManualAdd(true)}
                  >
                    Agregar
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    className="w-28 justify-center"
                    variant="connect"
                    disabled={isSelecting}
                    onClick={() => handleSelect(file)}
                  >
                    {isSelecting ? 'Procesando...' : isManualAdd ? 'Agregar' : isHelpGuide ? 'Ver Guía' : 'Seleccionar'}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
      
      {/* Se elimina el modal anidado para evitar doble overlay */}
    </div>
  );
}