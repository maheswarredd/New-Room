import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Toast() {
  const { toast, hideToast } = useAuth();
  if (!toast) return null;

  const bgMap = {
    success: 'bg-emerald-900/90 border-emerald-500 text-white',
    error: 'bg-rose-900/90 border-rose-500 text-white',
    info: 'bg-indigo-900/90 border-indigo-500 text-white',
  };

  const IconMap = {
    success: CheckCircle2,
    error: AlertCircle,
    info: Info,
  };

  const Icon = IconMap[toast.type] || Info;

  return (
    <div className="fixed top-5 right-5 z-50 max-w-sm animate-bounce-in">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl backdrop-blur-md ${
          bgMap[toast.type] || bgMap.info
        }`}
      >
        <Icon className="w-5 h-5 flex-shrink-0" />
        <span className="text-sm font-medium pr-2">{toast.message}</span>
        <button
          onClick={hideToast}
          className="ml-auto p-1 rounded-lg hover:bg-white/20 transition text-slate-300 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
