import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { CheckCircle2, Info, XCircle, AlertTriangle } from 'lucide-react';

type Toast = { id: string; type: 'success' | 'error' | 'info' | 'warning'; title?: string; message: string; timeout?: number };

type ToastContextType = {
  notify: (t: Omit<Toast, 'id'>) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const notify = useCallback((t: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2);
    const toast: Toast = { id, timeout: 3500, ...t };
    setToasts((prev) => [...prev, toast]);
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), toast.timeout);
  }, []);

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed right-4 top-4 z-50 space-y-2">
        {toasts.map((t) => {
          const styles = t.type === 'success'
            ? 'bg-green-50 text-green-700 border border-green-200'
            : t.type === 'error'
            ? 'bg-red-50 text-red-700 border border-red-200'
            : t.type === 'warning'
            ? 'bg-amber-50 text-amber-700 border border-amber-200'
            : 'bg-blue-50 text-blue-700 border border-blue-200';
          const Icon = t.type === 'success' ? CheckCircle2 : t.type === 'error' ? XCircle : t.type === 'warning' ? AlertTriangle : Info;
          return (
            <div key={t.id} className={`min-w-[260px] max-w-[360px] rounded-lg shadow p-3 ${styles} flex items-start gap-2`}>
              <Icon size={18} className="mt-0.5" />
              <div className="flex-1">
                {t.title && <div className="font-medium mb-0.5">{t.title}</div>}
                <div className="text-sm opacity-90">{t.message}</div>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
