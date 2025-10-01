import { useState } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { useProject } from '../../app/project';
import { useData } from '../../app/data';
import { StatusPill } from '../../components/ui/StatusPill';

export function Verification() {
  const { projectId } = useProject();
  const { verification } = useData();
  const rows = (verification.results ?? []).map((r: any) => ({ event: r.eventId, state: r.state, last: r.lastSeenAt ? new Date(r.lastSeenAt).toLocaleString() : '-' }));
  return (
    <div>
      <PageHeader title="Validación de Eventos" description="Verificá la correcta implementación de tus eventos." />
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <button className="bg-white text-slate-900 border">Todos</button>
          <button className="bg-white text-slate-900 border">Eventos de página</button>
          <button className="bg-white text-slate-900 border">Eventos de usuario</button>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => verification.run()} disabled={!projectId}>Revalidar</button>
          <span className="text-sm text-slate-600">{verification.runId ? 'Última validación: en curso…' : 'Aún no validado'}</span>
        </div>
      </div>
      <table className="w-full text-sm bg-white rounded border">
        <thead><tr className="text-left"><th className="p-2">Evento</th><th>Estado</th><th>Última vez</th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.event} className="border-t">
              <td className="p-2">{r.event}</td>
              <td>
                {r.state === 'implemented' && <StatusPill label="Implementado" variant="success" />}
                {r.state === 'pending' && <StatusPill label="Pendiente" variant="warning" />}
                {r.state === 'error' && <StatusPill label="Error" variant="danger" />}
              </td>
              <td>{r.last}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
