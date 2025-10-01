import { useState } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { useProject } from '../../app/project';
import { useData } from '../../app/data';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../app/toast';

type Rect = { x: number; y: number; w: number; h: number };

export function Mapping() {
  const [rects, setRects] = useState<Rect[]>([]);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('CTA');
  const [type, setType] = useState('click');
  const [component, setComponent] = useState('');
  const { projectId } = useProject();
  const { events } = useData();
  const { notify } = useToast();
  const saveEvent = async () => {
    if (!projectId || !name) return;
    try {
      await events.create({ projectId, name, category, actionType: type, component });
      notify({ type: 'success', title: 'Evento guardado', message: name });
    } catch (e: any) {
      notify({
        type: 'error',
        title: 'Error al guardar',
        message: e?.message || 'Intenta nuevamente',
      });
    }
    setName('');
    setComponent('');
  };
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const remove = async () => {
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
    setDeleteId(null);
  };

  const addRect = () => {
    setRects((r) => [...r, { x: 10, y: 10, w: 80, h: 40 }]);
  };

  return (
    <>
      <div className="grid grid-cols-[1fr_340px] gap-6">
        <div>
          <PageHeader
            title="Mapeo de eventos"
            description="Dibuja áreas clicables sobre el frame"
          />
          <div className="relative bg-white rounded border h-96">
            {rects.map((r, i) => (
              <div
                key={i}
                className="absolute border-2 border-blue-500 bg-blue-200/20"
                style={{ left: r.x, top: r.y, width: r.w, height: r.h }}
              />
            ))}
          </div>
        </div>
        <div>
          <div className="bg-white rounded border p-4 space-y-3">
            <div>
              <label className="block mb-1">Nombre del evento</label>
              <input
                placeholder="cta_click"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="block mb-1">Categoría</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option>CTA</option>
                <option>Navegación</option>
                <option>Formulario</option>
              </select>
            </div>
            <div>
              <label className="block mb-1">Tipo</label>
              <select value={type} onChange={(e) => setType(e.target.value)}>
                <option>click</option>
                <option>submit</option>
                <option>view</option>
              </select>
            </div>
            <div>
              <label className="block mb-1">Componente</label>
              <input
                placeholder="header, hero..."
                value={component}
                onChange={(e) => setComponent(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={addRect}>
                Agregar área
              </button>
              <button
                className="bg-white text-black border"
                type="button"
                onClick={saveEvent}
                disabled={!projectId || !name}
              >
                Guardar evento
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-8">
        <h3 className="font-semibold mb-2">Eventos del proyecto</h3>
        <table className="w-full text-sm bg-white rounded border">
          <thead>
            <tr className="text-left">
              <th className="p-2">Nombre</th>
              <th>Categoría</th>
              <th>Tipo</th>
              <th>Componente</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {(events.items ?? []).map((e: any) => (
              <tr key={e._id} className="border-t">
                <td className="p-2">{e.name}</td>
                <td>{e.category}</td>
                <td>{e.actionType}</td>
                <td>{e.component}</td>
                <td className="text-right p-2">
                  <button className="bg-white text-black border" onClick={() => setDeleteId(e._id)}>
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal
        open={Boolean(deleteId)}
        title="Eliminar evento"
        description="Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        onConfirm={remove}
        onCancel={() => setDeleteId(null)}
      />
    </>
  );
}
