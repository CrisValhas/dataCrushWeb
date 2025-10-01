import { PageHeader } from '../../components/layout/PageHeader';
import { useData } from '../../app/data';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../app/toast';
import { useProject } from '../../app/project';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Settings, Zap, Target, Edit, Trash2, Plus } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';

export function Projects() {
  const { projects, eventCounts, connections } = useData();
  const { notify } = useToast();
  const { setProjectId } = useProject();
  const navigate = useNavigate();
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingProject, setEditingProject] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  
  const createProject = async () => {
    if (!newProjectName.trim()) return;
    try {
      await projects.create(newProjectName, newProjectDescription);
      notify({ type: 'success', title: 'Proyecto creado', message: newProjectName });
      setNewProjectName('');
      setNewProjectDescription('');
      setShowCreateForm(false);
    } catch (e: any) {
      notify({ type: 'error', title: 'Error', message: e?.message || 'Intenta nuevamente' });
    }
  };
  
  const startEdit = (project: any) => {
    setEditingProject(project._id);
    setEditName(project.name);
    setEditDescription(project.description || '');
  };
  
  const cancelEdit = () => {
    setEditingProject(null);
    setEditName('');
    setEditDescription('');
  };
  
  const saveEdit = async (projectId: string) => {
    if (!editName.trim()) return;
    try {
      await projects.update(projectId, { name: editName, description: editDescription });
      notify({ type: 'success', title: 'Proyecto actualizado', message: editName });
      setEditingProject(null);
      setEditName('');
      setEditDescription('');
    } catch (e: any) {
      notify({ type: 'error', title: 'Error', message: e?.message || 'Intenta nuevamente' });
    }
  };
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const remove = async () => {
    if (!deleteId) return;
    try {
      await projects.remove(deleteId);
      notify({ type: 'success', title: 'Proyecto eliminado', message: '' });
    } catch (e: any) {
      notify({
        type: 'error',
        title: 'Error al eliminar',
        message: e?.message || 'Intenta nuevamente',
      });
    }
    setDeleteId(null);
  };

  return (
    <div>
      <PageHeader title="Proyectos" />
      {/* Barra superior de creación (estilo card alargada con ícono +) */}
      <div
        className="mb-4 bg-white border-2 border-dashed border-gray-300 rounded-xl p-4 hover:border-blue-400 transition-colors cursor-pointer group"
        role="button"
        tabIndex={0}
        onClick={() => setShowCreateForm(true)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setShowCreateForm(true); }}
        aria-label="Crear nuevo proyecto"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 border-2 border-current rounded-full flex items-center justify-center text-gray-500 group-hover:text-blue-600 group-hover:scale-105 transition-all">
            <Plus size={20} />
          </div>
          <div className="flex flex-col">
            <h3 className="text-base font-medium text-gray-700 group-hover:text-blue-700">Crear nuevo proyecto</h3>
            <p className="text-sm text-gray-400">Comienza un nuevo proyecto para organizar tus eventos y análisis</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        
        {/* Modal de creación inline */}
        <Modal
          open={showCreateForm}
          title="Crear nuevo proyecto"
          confirmText="Crear"
          cancelText="Cancelar"
          onConfirm={createProject}
          onCancel={() => setShowCreateForm(false)}
          confirmDisabled={!newProjectName.trim()}
        >
          <div className="space-y-3">
            <label className="text-sm text-slate-600">Nombre del proyecto</label>
            <input
              type="text"
              placeholder="p. ej. Sitio web"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              className="w-full h-10 px-3 border rounded"
              autoFocus
            />
            <label className="text-sm text-slate-600">Descripción (opcional)</label>
            <textarea
              placeholder="Una breve descripción"
              value={newProjectDescription}
              onChange={(e) => setNewProjectDescription(e.target.value)}
              className="w-full h-24 px-3 border rounded resize-none"
            />
          </div>
        </Modal>
        
        {[...(projects.items ?? [])]
          .sort((a: any, b: any) => {
            const aDate = a.createdAt || a.updatedAt || 0;
            const bDate = b.createdAt || b.updatedAt || 0;
            return new Date(bDate).getTime() - new Date(aDate).getTime();
          })
          .map((p: any) => (
          <div
            key={p._id}
            className="bg-white border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            {/* Header de la card con información del proyecto */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                {editingProject === p._id ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full text-xl font-semibold bg-transparent border-b-2 border-gray-200 focus:border-gray-300 focus:outline-none"
                      placeholder="Nombre del proyecto"
                    />
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className="w-full text-sm text-gray-600 bg-transparent border-b border-gray-200 focus:border-gray-300 focus:outline-none resize-none"
                      placeholder="Descripción (opcional)"
                      rows={2}
                    />
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => saveEdit(p._id)}
                        className="text-xs bg-white text-blue-500 border border-blue-200 px-3 py-1 rounded hover:bg-blue-50 transition-colors font-medium"
                        disabled={!editName.trim()}
                      >
                        Guardar
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="text-xs bg-white text-gray-500 border border-gray-200 px-3 py-1 rounded hover:bg-gray-50 transition-colors font-medium"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="text-xl font-semibold text-gray-700">{p.name}</div>
                    {p.description && (
                      <div className="text-sm text-gray-600 mt-1">{p.description}</div>
                    )}
                  </>
                )}
              </div>
              
              {/* Botones de editar y eliminar */}
              {editingProject !== p._id && (
                <div className="flex gap-1 ml-4">
                  <button
                    className="p-1.5 text-blue-300 hover:text-blue-500 hover:bg-blue-50 rounded-md transition-colors"
                    title="Editar proyecto"
                    onClick={() => startEdit(p)}
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    className="p-1.5 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                    title="Eliminar proyecto"
                    onClick={() => setDeleteId(p._id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>

            {/* Estado de conexiones */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {(() => {
                const arr = connections[p._id] || [];
                const hasFigma = arr.includes('FIGMA');
                const hasGa4 = arr.includes('GA4');
                return (
                  <>
                    {hasFigma ? (
                      <Badge variant="purple" size="xs">Figma conectado</Badge>
                    ) : (
                      <Badge variant="gray" size="xs">Figma sin conexión</Badge>
                    )}
                    {hasGa4 ? (
                      <Badge variant="green" size="xs">GA4 conectado</Badge>
                    ) : (
                      <Badge variant="gray" size="xs">GA4 sin conexión</Badge>
                    )}
                  </>
                );
              })()}
            </div>

            {/* Información adicional */}
            <div className="flex items-center gap-4 text-sm text-gray-600 mb-6 pb-4 border-b border-gray-100">
              <span className="flex items-center gap-1">
                <Target size={14} />
                <strong>{eventCounts[p._id] ?? 0}</strong> eventos
              </span>
              <span>•</span>
              <span>
                Actualizado: {p.updatedAt ? new Date(p.updatedAt).toLocaleDateString() : '-'}
              </span>
            </div>

            {/* Botones de acción principales */}
            <div className="grid grid-cols-3 gap-2">
              {/* Integraciones */}
              <button
                className="flex flex-col items-center gap-1.5 p-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors group"
                onClick={() => {
                  setProjectId(p._id);
                  navigate(`/app/project/${p._id}/integrations`);
                }}
              >
                <Settings size={16} className="group-hover:scale-110 transition-transform" />
                <span className="text-xs font-medium">Integraciones</span>
              </button>

              {/* Eventos */}
              <button
                className="flex flex-col items-center gap-1.5 p-3 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg transition-colors group"
                onClick={() => {
                  setProjectId(p._id);
                  navigate(`/app/project/${p._id}/events`);
                }}
              >
                <Target size={16} className="group-hover:scale-110 transition-transform" />
                <span className="text-xs font-medium">Eventos</span>
              </button>

              {/* Funnel */}
              <button
                className="flex flex-col items-center gap-1.5 p-3 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg transition-colors group"
                onClick={() => {
                  setProjectId(p._id);
                  navigate(`/app/project/${p._id}/funnels`);
                }}
              >
                <Zap size={16} className="group-hover:scale-110 transition-transform" />
                <span className="text-xs font-medium">Funnel</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal
        open={Boolean(deleteId)}
        title="Eliminar proyecto"
        description="Esta acción no se puede deshacer. Se eliminará el proyecto y sus datos asociados."
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        onConfirm={remove}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
