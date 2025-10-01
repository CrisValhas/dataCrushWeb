import React, { useState } from 'react';
import { useToast } from '../../app/toast';

interface AddFigmaFileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (fileKey: string, fileName: string, fileUrl: string) => Promise<void>;
}

export function AddFigmaFileModal({ isOpen, onClose, onAdd }: AddFigmaFileModalProps) {
  const [url, setUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { notify } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim()) {
      notify({ type: 'error', title: 'URL requerida', message: 'Por favor ingresa la URL del archivo de Figma.' });
      return;
    }

    // Validación EXTREMADAMENTE permisiva - Solo verificar que contenga figma.com
    const isFigmaUrl = url.toLowerCase().includes('figma.com');
    
    if (!isFigmaUrl) {
      notify({ 
        type: 'error', 
        title: 'URL inválida', 
        message: 'La URL debe contener figma.com' 
      });
      return;
    }

    // Extraer el ID del archivo de forma más flexible
    const urlParts = url.split('/');
    const designOrFileIndex = urlParts.findIndex(part => part === 'design' || part === 'file');
    const fileKey = urlParts[designOrFileIndex + 1];
    
    console.log('🔍 Debug URL:', url);
    console.log('🔍 URL Parts:', urlParts);
    console.log('🔍 Design/File Index:', designOrFileIndex);
    console.log('🔍 File Key:', fileKey);
    
    if (!fileKey || fileKey.length < 5) {
      notify({ 
        type: 'error', 
        title: 'ID de archivo no encontrado', 
        message: 'No se pudo extraer el ID del archivo de la URL. Asegúrate de que la URL sea completa.' 
      });
      return;
    }

    // Extraer nombre del archivo (más flexible)
    let fileName = 'Archivo de Figma';
    if (urlParts[designOrFileIndex + 2]) {
      fileName = urlParts[designOrFileIndex + 2];
      fileName = decodeURIComponent(fileName.split('?')[0]).replace(/-/g, ' ');
    }
    
    console.log('🔍 File Name:', fileName);

    try {
      setIsSubmitting(true);
      console.log('📤 Enviando:', { fileKey, fileName, url });
      console.log('📤 Llamando onAdd...');
      await onAdd(fileKey, fileName, url);
      console.log('✅ onAdd exitoso!');
      // No mostrar notificación aquí - se mostrará en el componente padre
      setUrl('');
      onClose();
    } catch (error: any) {
      console.error('❌ Error en onAdd:', error);
      notify({ 
        type: 'error', 
        title: 'Error', 
        message: `Error: ${error?.message || 'No se pudo agregar el archivo'}` 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Agregar Archivo de Figma</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
                disabled={isSubmitting}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="figma-url" className="block text-sm font-medium text-gray-700 mb-2">
                  URL del archivo de Figma
                </label>
                <input
                  id="figma-url"
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://www.figma.com/design/rvTvmtYXLZUj4H7Kagv2Ec/Untitled?node-id=0-1&t=..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isSubmitting}
                />
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <h4 className="text-sm font-medium text-blue-800 mb-1">Cómo obtener la URL</h4>
                <ol className="text-xs text-blue-700 space-y-1">
                  <li>1. Abre tu archivo en Figma</li>
                  <li>2. Haz clic en "Share" (Compartir)</li>
                  <li>3. Asegúrate que esté configurado como "Anyone with the link can view"</li>
                  <li>4. Copia la URL completa (incluyendo parámetros como ?node-id=...)</li>
                  <li>5. Pega la URL completa aquí</li>
                </ol>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !url.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Agregando...' : 'Agregar Archivo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}