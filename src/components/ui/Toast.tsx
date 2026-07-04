import React, { createContext, useContext, useCallback, useState, useRef } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

/* ─── Types ─── */
type ToastVariant = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
  exiting?: boolean;
}

interface ToastContextValue {
  showToast: (message: string, variant?: ToastVariant) => void;
}

/* ─── Context ─── */
const ToastContext = createContext<ToastContextValue>({ showToast: () => {} });

export const useToast = () => useContext(ToastContext);

/* ─── Individual Toast ─── */
const ICONS: Record<ToastVariant, React.ReactNode> = {
  success: <CheckCircle2 size={16} className="shrink-0 text-success" />,
  error:   <AlertCircle  size={16} className="shrink-0 text-danger" />,
  info:    <Info         size={16} className="shrink-0 text-accent-2" />,
};

const BG: Record<ToastVariant, string> = {
  success: 'border-success/30 bg-success/8',
  error:   'border-danger/30 bg-danger/8',
  info:    'border-accent-2/30 bg-accent-2/8',
};

const ToastItem: React.FC<{ toast: Toast; onClose: (id: string) => void }> = ({ toast, onClose }) => (
  <div
    className={`flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg backdrop-blur-sm
      bg-surface/90 max-w-xs w-full pointer-events-auto
      ${BG[toast.variant]}
      ${toast.exiting ? 'animate-[toast-out_0.25s_ease_forwards]' : 'animate-toast-in'}
    `}
    role="alert"
  >
    {ICONS[toast.variant]}
    <p className="text-sm text-ink font-medium leading-snug flex-1">{toast.message}</p>
    <button
      onClick={() => onClose(toast.id)}
      className="text-ink-muted hover:text-ink transition-colors mt-0.5 shrink-0"
      aria-label="Dismiss notification"
    >
      <X size={14} />
    </button>
  </div>
);

/* ─── Provider + Container ─── */
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counterRef = useRef(0);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 280);
  }, []);

  const showToast = useCallback((message: string, variant: ToastVariant = 'info') => {
    const id = `toast-${++counterRef.current}`;
    setToasts(prev => [...prev.slice(-3), { id, message, variant }]); // max 4 at once
    setTimeout(() => dismiss(id), 3400);
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast container — fixed to bottom-right */}
      <div
        aria-live="polite"
        className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 items-end pointer-events-none"
      >
        {toasts.map(t => (
          <ToastItem key={t.id} toast={t} onClose={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export default ToastProvider;
