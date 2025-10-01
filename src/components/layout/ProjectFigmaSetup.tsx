import React, { useState } from 'react';
import { useProject } from '../../app/project';
import { useData, useFigmaConnection } from '../../app/data';
import { useToast } from '../../app/toast';
import { SelectDropdown } from '../ui/SelectDropdown';
import { Modal } from '../ui/Modal';
import { FigmaFileSelector } from '../../features/integrations/FigmaFileSelector';
import { Settings, Edit3, X } from 'lucide-react';

type SetupStep = 'empty' | 'select-project' | 'select-figma' | 'configured';

interface Props {
  isEditingMode?: boolean;
  onEditComplete?: () => void;
  onEditCancel?: () => void;
}

export function ProjectFigmaSetup({ isEditingMode = false, onEditComplete, onEditCancel }: Props) {
  const { projectId, setProjectId } = useProject();
  const { projects, integrations } = useData();
  const { figmaFiles, isLoadingFigmaFiles, figmaConnected } = useFigmaConnection();
  const { notify } = useToast();
  
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [tempProjectId, setTempProjectId] = useState<string>('');
  const [isEditingFigma, setIsEditingFigma] = useState(false);

  // Determinar el estado actual
  const currentProject = projects.items?.find((p: any) => p._id === projectId);
  const figmaFileName = integrations?.projectFigmaFile?.data?.figmaFileName;
  const hasFigmaFile = Boolean(figmaFileName);

  const getCurrentStep = (): SetupStep => {
    if (!projectId) return 'empty';
    if (!hasFigmaFile || isEditingFigma || isEditingMode) return 'select-figma';
    return 'configured';
  };

  const currentStep = getCurrentStep();

  const handleProjectSelect = (selectedName: string) => {
    const selectedProject = projects.items?.find((p: any) => p.name === selectedName);
    if (selectedProject) {
      setProjectId(selectedProject._id);
    }
  };

  const handleProjectModalSelect = () => {
    if (tempProjectId) {
      setProjectId(tempProjectId);
      setIsProjectModalOpen(false);
      setTempProjectId('');
    }
  };

  const handleFigmaFileSave = async (fileKey: string, fileName: string, fileUrl?: string) => {
    try {
      await integrations.projectFigmaFile.assign(fileKey, fileName, fileUrl);
      setIsEditingFigma(false);
      
      // Si estamos en modo de edición, llamamos a onEditComplete
      if (isEditingMode && onEditComplete) {
        onEditComplete();
      }
      
      notify({ 
        type: 'success', 
        title: 'Archivo de Figma configurado', 
        message: `${fileName} ha sido asignado al proyecto` 
      });
    } catch (error) {
      notify({ 
        type: 'error', 
        title: 'Error al configurar Figma', 
        message: 'No se pudo asignar el archivo al proyecto' 
      });
    }
  };

  const handleFigmaFileRemove = async () => {
    try {
      await integrations.projectFigmaFile.remove();
      notify({ 
        type: 'success', 
        title: 'Archivo removido', 
        message: 'El archivo de Figma ha sido desasignado del proyecto' 
      });
    } catch (error) {
      notify({ 
        type: 'error', 
        title: 'Error', 
        message: 'No se pudo remover el archivo' 
      });
    }
  };

  // Estado: Sin proyecto seleccionado
  if (currentStep === 'empty') {
    return (
      <div className="bg-white rounded-xl border p-8 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Settings className="w-8 h-8 text-gray-400" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Selecciona tu proyecto
        </h2>
        <p className="text-gray-600 mb-6">
          Selecciona o configura tu proyecto para comenzar a trabajar
        </p>
        
        {projects.items && projects.items.length > 0 ? (
          <div className="max-w-sm mx-auto">
            <SelectDropdown
              value=""
              onChange={handleProjectSelect}
              options={projects.items.map((p: any) => p.name)}
              placeholder="Seleccionar proyecto"
              className="mb-4"
            />
          </div>
        ) : (
          <p className="text-gray-500">No hay proyectos disponibles</p>
        )}
      </div>
    );
  }

  // Estado: Seleccionar archivo de Figma
  if (currentStep === 'select-figma') {
    return (
      <div className="bg-white rounded-xl border p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {isEditingMode ? `Editar Figma para "${currentProject?.name}"` : `Configurar Figma para "${currentProject?.name}"`}
            </h2>
            <p className="text-sm text-gray-600">
              Selecciona el archivo de Figma que utilizarás en este proyecto
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isEditingMode && (
              <button
                onClick={onEditCancel}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                Cancelar
              </button>
            )}
            <button
              onClick={() => setIsProjectModalOpen(true)}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm px-3 py-1.5 rounded-lg transition-colors"
            >
              Cambiar proyecto
            </button>
          </div>
        </div>

        <FigmaFileSelector
          files={figmaFiles || []}
          loading={isLoadingFigmaFiles}
          selectedFile={integrations?.projectFigmaFile?.data?.figmaFileKey || null}
          onSelect={handleFigmaFileSave}
          onRemove={handleFigmaFileRemove}
        />

        {/* Modal para cambiar proyecto */}
        <Modal
          open={isProjectModalOpen}
          title="Cambiar Proyecto"
          description="Selecciona un nuevo proyecto. Esta acción cambiará el contexto de trabajo."
          confirmText="Cambiar"
          cancelText="Cancelar"
          onConfirm={handleProjectModalSelect}
          onCancel={() => {
            setIsProjectModalOpen(false);
            setTempProjectId('');
          }}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Seleccionar proyecto
              </label>
              <SelectDropdown
                value={tempProjectId ? projects.items?.find((p: any) => p._id === tempProjectId)?.name || '' : ''}
                onChange={(selectedName) => {
                  const cleanName = selectedName.replace(/ 📎.*$/, '');
                  const selectedProject = projects.items?.find((p: any) => p.name === cleanName);
                  if (selectedProject) {
                    setTempProjectId(selectedProject._id);
                  }
                }}
                options={projects.items?.map((p: any) => 
                  `${p.name} ${p.metadata?.figmaFileName ? `📎 ${p.metadata.figmaFileName}` : '📎 Sin Figma'}`
                ) || []}
                placeholder="Seleccionar proyecto"
              />
            </div>
          </div>
        </Modal>
      </div>
    );
  }

  // Estado: Configurado
  if (currentStep === 'configured') {
    return (
      <div className="bg-white rounded-xl border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Settings className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">
                {currentProject?.name}
              </div>
              <div className="text-sm text-gray-600">
                {figmaFileName}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditingFigma(true)}
              className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <Edit3 className="w-3 h-3" />
              Editar Figma
            </button>
            <button
              onClick={() => setIsProjectModalOpen(true)}
              className="text-gray-600 hover:text-gray-700 text-sm px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cambiar proyecto
            </button>
          </div>
        </div>

        {/* Modal para cambiar proyecto */}
        <Modal
          open={isProjectModalOpen}
          title="Cambiar Proyecto"
          description="Selecciona un nuevo proyecto. Esta acción cambiará el contexto de trabajo."
          confirmText="Cambiar"
          cancelText="Cancelar"
          onConfirm={handleProjectModalSelect}
          onCancel={() => {
            setIsProjectModalOpen(false);
            setTempProjectId('');
          }}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Seleccionar proyecto
              </label>
              <SelectDropdown
                value={tempProjectId ? projects.items?.find((p: any) => p._id === tempProjectId)?.name || '' : ''}
                onChange={(selectedName) => {
                  const cleanName = selectedName.replace(/ 📎.*$/, '');
                  const selectedProject = projects.items?.find((p: any) => p.name === cleanName);
                  if (selectedProject) {
                    setTempProjectId(selectedProject._id);
                  }
                }}
                options={projects.items?.map((p: any) => 
                  `${p.name} ${p.metadata?.figmaFileName ? `📎 ${p.metadata.figmaFileName}` : '📎 Sin Figma'}`
                ) || []}
                placeholder="Seleccionar proyecto"
              />
            </div>
          </div>
        </Modal>
      </div>
    );
  }

  return null;
}