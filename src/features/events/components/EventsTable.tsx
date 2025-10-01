import React from 'react';
import { StatusPill } from '../../../components/ui/StatusPill';
import { Edit, Trash2 } from 'lucide-react';
import { IconButton } from '../../../components/ui/IconButton';

type Props = {
  items: any[];
  ga4Counts: Record<string, number>;
  onEdit: (e: any) => void;
  onAskDelete: (id: string) => void;
};

export function EventsTable({ items, ga4Counts, onEdit, onAskDelete }: Props) {
  return (
      <table className="w-full text-sm bg-white rounded border">
        <thead>
          <tr className="text-left">
            <th className="p-2 font-semibold text-gray-600">Evento</th>
            <th className="font-semibold text-gray-600">Estado</th>
            <th className="font-semibold text-gray-600">Categoria</th>
            <th className="font-semibold text-gray-600">Plataforma</th>
            <th className="p-2 text-right font-semibold text-gray-600">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {items.map((e: any) => {
            const count = (ga4Counts as any)[e._id] || 0;
            const state = count > 0 ? 'implemented' : 'pending';
            return (
              <tr key={e._id} className="border-t">
                <td className="p-2">{e.name}</td>
                <td className="p-2">
                  {state === 'implemented' ? (
                    <StatusPill label="Implementado" variant="success" />
                  ) : (
                    <StatusPill label="Pendiente" variant="warning" />
                  )}
                </td>
                <td className="p-2">{e.category || '-'}</td>
                <td className="p-2">Web</td>
                <td className="p-2 text-right">
                  <IconButton onClick={() => onEdit(e)} className="mr-1" aria-label="Editar">
                    <Edit size={16} />
                  </IconButton>
                  <IconButton variant="danger" onClick={() => onAskDelete(e._id)} aria-label="Eliminar">
                    <Trash2 size={16} />
                  </IconButton>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
  );
}

