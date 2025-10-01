import React, { useEffect } from 'react';

type Props = {
  open: boolean;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'primary' | 'danger';
  onConfirm: () => void;
  onCancel: () => void;
  children?: React.ReactNode;
  confirmDisabled?: boolean;
};

export function Modal({ open, title, description, confirmText = 'Confirmar', cancelText = 'Cancelar', variant = 'primary', onConfirm, onCancel, children, confirmDisabled = false }: Props) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel();
    }
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div role="dialog" aria-modal="true" className="relative bg-white rounded-xl shadow-xl w-[520px] max-w-[92vw]">
        <div className="p-5 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-600">{title}</h3>
          {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
        </div>
        {children && <div className="p-4 border-b">{children}</div>}
        <div className="p-4 flex items-center justify-end gap-3">
          <button className="bg-white text-gray-500 border border-gray-200 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors" onClick={onCancel} autoFocus>
            {cancelText}
          </button>
          <button
            className={variant === 'danger' 
              ? 'bg-white text-red-500 border border-red-200 px-4 py-2 rounded-md hover:bg-red-50 transition-colors' 
              : 'bg-white text-blue-500 border border-blue-200 px-4 py-2 rounded-md hover:bg-blue-50 transition-colors'
            }
            onClick={onConfirm}
            disabled={confirmDisabled}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

