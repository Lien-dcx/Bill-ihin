import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';
import { useApp } from '../../context/useApp';

export default function ToastContainer() {
  const { toasts, dismissToast } = useApp();

  if (!toasts || toasts.length === 0) return null;

  const styleMap = {
    success: {
      box: 'bg-white border-emerald-200 text-[#1E293B]',
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />,
    },
    warning: {
      box: 'bg-white border-amber-200 text-[#1E293B]',
      icon: <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />,
    },
    error: {
      box: 'bg-white border-red-200 text-[#1E293B]',
      icon: <XCircle className="w-4 h-4 text-red-600 shrink-0" />,
    },
    info: {
      box: 'bg-white border-[#00DCE5]/60 text-[#1E293B]',
      icon: <Info className="w-4 h-4 text-[#0E7490] shrink-0" />,
    },
  };

  return (
    <div
      className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2 max-w-sm w-[calc(100%-2rem)] sm:w-96 pointer-events-none"
      aria-live="polite"
    >
      {toasts.map((toast) => {
        const s = styleMap[toast.type] || styleMap.info;
        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg ${s.box}`}
          >
            <div className="mt-0.5">{s.icon}</div>
            <div className="flex-1 min-w-0">
              {toast.title && (
                <p className="text-xs font-bold text-[#1E293B]">{toast.title}</p>
              )}
              <p className="text-xs text-[#1E293B] leading-relaxed">{toast.message}</p>
            </div>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              aria-label="Dismiss notification"
              className="text-slate-400 hover:text-[#1E293B] p-0.5 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
