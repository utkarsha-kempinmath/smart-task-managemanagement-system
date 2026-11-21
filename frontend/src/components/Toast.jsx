import React from 'react';
import { useNotifications } from '../context/NotificationContext';
import { AlertCircle, AlertTriangle, CheckCircle, Info, X } from 'lucide-react';

export default function Toast() {
  const { activeToast, dismissToast } = useNotifications();
  if (!activeToast) return null;

  const { title, message, severity } = activeToast;

  const getBorderColor = () => {
    if (severity === 'critical') return 'border-rose-500/40 text-rose-300';
    if (severity === 'warning') return 'border-amber-500/40 text-amber-300';
    if (severity === 'success') return 'border-emerald-500/40 text-emerald-300';
    return 'border-zinc-700 text-zinc-300';
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full animate-bounce-in">
      <div className={`p-4 rounded-xl shadow-2xl backdrop-blur-md bg-zinc-900/95 border ${getBorderColor()} flex items-start gap-3`}>
        {severity === 'critical' && <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />}
        {severity === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />}
        {severity === 'success' && <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />}
        {severity === 'info' && <Info className="w-5 h-5 text-zinc-400 shrink-0 mt-0.5" />}

        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-zinc-100">{title}</p>
          <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">{message}</p>
        </div>

        <button
          onClick={dismissToast}
          className="text-zinc-500 hover:text-zinc-200 p-0.5 rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
