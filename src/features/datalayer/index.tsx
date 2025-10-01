import { useEffect, useState } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { useProject } from '../../app/project';
import { useData } from '../../app/data';

export function DataLayer() {
  const [tab, setTab] = useState<'json' | 'js'>('json');
  const [content, setContent] = useState('');
  const { projectId } = useProject();
  const { measurement } = useData();

  useEffect(() => {
    const run = async () => {
      if (!projectId) return;
      const txt = await measurement.get(tab);
      setContent(txt);
    };
    run();
  }, [projectId, tab]);
  return (
    <div>
      <PageHeader title="Código dataLayer" description="Copiá o descargá el snippet listo para implementar." />
      <div className="bg-white rounded-lg border p-0 overflow-hidden">
        <div className="px-4 pt-4">
          <div className="flex gap-2 mb-2">
            <button onClick={() => setTab('json')} className={tab==='json' ? '' : 'bg-white text-black border'}>JSON</button>
            <button onClick={() => setTab('js')} className={tab==='js' ? '' : 'bg-white text-black border'}>JS</button>
          </div>
        </div>
        <pre className="bg-slate-900 text-green-300 p-4 overflow-auto h-80">{content || '// Seleccioná un proyecto y generá el plan'}</pre>
        <div className="flex items-center justify-between bg-slate-50 border-t px-4 py-3">
          <div className="flex gap-2">
            <button className="bg-white text-black border" onClick={() => navigator.clipboard.writeText(content)}>Copiar al portapapeles</button>
            <a
              className="bg-white text-black border px-4 py-2 rounded-md"
              href={`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/measurement/datalayer/download?projectId=${projectId}&format=${tab}`}
            >
              Descargar archivo
            </a>
          </div>
          <button>Compartir con equipo técnico</button>
        </div>
      </div>
    </div>
  );
}
