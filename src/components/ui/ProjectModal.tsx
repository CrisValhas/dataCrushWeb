import { useEffect, useState } from 'react';

type Props = {
  open: boolean;
  title: string;
  initial?: { name?: string; description?: string };
  confirmText?: string;
  onClose: () => void;
  onSubmit: (values: { name: string; description: string }) => Promise<void> | void;
};

export function ProjectModal({ open, title, initial, confirmText = 'Guardar', onClose, onSubmit }: Props) {
  const [name, setName] = useState(initial?.name || '');
  const [description, setDescription] = useState(initial?.description || '');

  useEffect(() => {
    setName(initial?.name || '');
    setDescription(initial?.description || '');
  }, [initial, open]);

  if (!open) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({ name, description });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-[480px] max-w-[92vw]">
        <div className="p-5 border-b">
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        <form onSubmit={submit} className="p-5 space-y-3">
          <div>
            <label className="block text-sm mb-1">Nombre</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre del proyecto" />
          </div>
          <div>
            <label className="block text-sm mb-1">Descripción</label>
            <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descripción" />
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <button type="button" className="bg-white text-black border" onClick={onClose}>Cancelar</button>
            <button className="bg-blue-600" type="submit">{confirmText}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

