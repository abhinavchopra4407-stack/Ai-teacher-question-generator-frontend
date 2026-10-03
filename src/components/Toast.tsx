import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message?: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-3 max-w-sm w-full no-print">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';
        
        return (
          <div
            key={toast.id}
            className={`flex items-start p-4 rounded-xl shadow-lg border backdrop-blur-md transition-all duration-300 animate-in slide-in-from-bottom-5 ${
              isSuccess
                ? 'bg-emerald-900/90 text-white border-emerald-700'
                : isError
                ? 'bg-rose-900/90 text-white border-rose-700'
                : 'bg-slate-900/90 text-white border-slate-700'
            }`}
          >
            <div className="mr-3 pt-0.5">
              {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-300" />}
              {isError && <AlertCircle className="w-5 h-5 text-rose-300" />}
              {!isSuccess && !isError && <Info className="w-5 h-5 text-cyan-300" />}
            </div>
            <div className="flex-1">
              <h4 className="text-xs font-bold">{toast.title}</h4>
              {toast.message && <p className="text-xs text-slate-200 mt-0.5">{toast.message}</p>}
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="ml-2 text-slate-300 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
