import React, { useEffect } from 'react';
import { Undo2, X } from 'lucide-react';

interface UndoSnackbarProps {
  message: string;
  onUndo: () => void;
  onDismiss: () => void;
  duration?: number;
}

export const UndoSnackbar: React.FC<UndoSnackbarProps> = ({
  message,
  onUndo,
  onDismiss,
  duration = 4500,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onDismiss]);

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-sm bg-slate-900/95 text-white px-4 py-3 rounded-[22px] shadow-[0_8px_30px_rgba(0,0,0,0.25)] backdrop-blur-md flex items-center justify-between gap-3 border border-slate-700/80 animate-in fade-in slide-in-from-bottom-5 duration-200">
      <span className="text-xs font-medium truncate">{message}</span>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onUndo}
          className="px-3 py-1 bg-[#5B86E5] text-white hover:bg-[#4D78DE] text-xs font-bold rounded-xl transition flex items-center gap-1 cursor-pointer active:scale-95 shadow-xs"
        >
          <Undo2 className="w-3.5 h-3.5" />
          <span>Undo</span>
        </button>
        <button
          onClick={onDismiss}
          className="text-slate-400 hover:text-white p-1 rounded-lg transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
