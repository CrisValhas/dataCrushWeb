import { PageHeader } from '../../components/layout/PageHeader';
import { useProject } from '../../app/project';
import { useData } from '../../app/data';

export function Dashboard() {
  const { projectId } = useProject();
  const { dashboard } = useData();
  const cards = dashboard.cards ?? [];
  return (
    <div>
      <PageHeader title="Dashboard" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cards.map((c: any) => (
          <div key={c.title} className="bg-white rounded border p-4">
            <div className="text-slate-600 text-sm">{c.title}</div>
            <div className="text-3xl font-semibold">{c.value}</div>
          </div>
        ))}
      </div>
      {projectId && (
        <div className="flex gap-2 mt-4">
          <a className="bg-black text-white rounded px-4 py-2" href={`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/dashboards/${projectId}/export/csv`}>
            Exportar a CSV
          </a>
          <button className="bg-white text-black border">Exportar a PDF</button>
        </div>
      )}
      <div className="mt-2 text-sm text-slate-600">
        <a href="#">Abrir en Looker Studio</a>
      </div>
    </div>
  );
}
