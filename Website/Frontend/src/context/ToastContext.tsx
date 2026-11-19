import { CheckCircle2, Info, TriangleAlert, X } from 'lucide-react';
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/format';

type Tone = 'success' | 'error' | 'info';
interface Toast {
  id: number;
  tone: Tone;
  message: string;
  action?: { label: string; to: string };
}

interface ToastApi {
  success: (message: string, action?: Toast['action']) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const push = useCallback(
    (tone: Tone, message: string, action?: Toast['action']) => {
      const id = nextId.current++;
      setToasts((t) => [...t.slice(-2), { id, tone, message, action }]);
      window.setTimeout(() => dismiss(id), tone === 'error' ? 6000 : 3800);
    },
    [dismiss],
  );

  const api = useMemo<ToastApi>(
    () => ({
      success: (m, a) => push('success', m, a),
      error: (m) => push('error', m),
      info: (m) => push('info', m),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-0 bottom-20 z-[70] flex flex-col items-center gap-2 px-4 sm:bottom-6 sm:items-end sm:pr-6"
      >
        {toasts.map((t) => {
          const Icon = t.tone === 'success' ? CheckCircle2 : t.tone === 'error' ? TriangleAlert : Info;
          return (
            <div
              key={t.id}
              role={t.tone === 'error' ? 'alert' : 'status'}
              className={cn(
                'pointer-events-auto flex w-full max-w-sm animate-fade-up items-start gap-3 rounded-2xl px-4 py-3 text-sm shadow-raised',
                t.tone === 'error' ? 'bg-danger text-white' : 'bg-forest-800 text-cream',
              )}
            >
              <Icon className={cn('mt-0.5 size-4 shrink-0', t.tone === 'success' && 'text-terracotta-300')} aria-hidden />
              <p className="flex-1 leading-snug">{t.message}</p>
              {t.action && (
                <Link to={t.action.to} onClick={() => dismiss(t.id)} className="shrink-0 font-semibold text-terracotta-200 underline-offset-2 hover:underline">
                  {t.action.label}
                </Link>
              )}
              <button type="button" onClick={() => dismiss(t.id)} aria-label="Dismiss notification" className="-m-1 rounded p-1 opacity-70 hover:opacity-100">
                <X className="size-4" aria-hidden />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
