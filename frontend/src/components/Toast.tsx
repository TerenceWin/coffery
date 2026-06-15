import { useState, useCallback } from 'react';

export interface ToastItem {
  id: number;
  msg: string;
  type: 'ok' | 'err';
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback((msg: string, type: 'ok' | 'err' = 'ok') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 2800);
  }, []);

  return { toasts, toast };
}

export function ToastContainer({ toasts }: { toasts: ToastItem[] }) {
  return (
    <div className="toast-wrap">
      {toasts.map(t => (
        <div key={t.id} className={`toast show ${t.type}`}>{t.msg}</div>
      ))}
    </div>
  );
}
