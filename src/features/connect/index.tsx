import { PageHeader } from '../../components/layout/PageHeader';
import { useData } from '../../app/data';

export function Connect() {
  const { frames } = useData();
  return (
    <div>
      <PageHeader title="Selecciona un wireframe" description="Elegí un archivo de Figma o un frame específico para comenzar a mapear eventos." />
      <div className="flex gap-3 mb-4">
        <button>Conectar Figma (OAuth)</button>
        <button className="bg-white text-black border">Subir archivo de Figma</button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {(frames.items ?? []).map((f: any) => (
          <div key={f.id} className="bg-white rounded-lg border hover:shadow-sm overflow-hidden">
            <img src={f.thumbUrl} alt={f.name} className="w-full aspect-video object-cover" />
            <div className="p-3 text-sm">{f.name}</div>
          </div>
        ))}
        <div className="border-2 border-dashed rounded-lg grid place-items-center h-40 text-sm text-slate-600">
          Cargar nuevo archivo
        </div>
      </div>
    </div>
  );
}
