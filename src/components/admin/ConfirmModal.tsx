import React from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  isDestructive = true,
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-6 relative overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {isDestructive && (
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-red-600/10 rounded-full blur-xl pointer-events-none" />
        )}

        <div className="flex items-start gap-4">
          <div
            className={`p-3 rounded-lg flex-shrink-0 ${
              isDestructive
                ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                : 'bg-zinc-800 text-zinc-300'
            }`}
          >
            <AlertTriangle className="w-6 h-6" />
          </div>

          <div className="flex-1">
            <h3 id="modal-title" className="text-lg font-semibold text-white tracking-wide">
              {title}
            </h3>
            <p className="mt-2 text-sm text-zinc-400 leading-relaxed whitespace-pre-line">
              {message}
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700/60 rounded-lg transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 text-sm font-semibold rounded-lg flex items-center gap-2 transition-all disabled:opacity-50 ${
              isDestructive
                ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-900/30'
                : 'bg-zinc-100 hover:bg-white text-zinc-900'
            }`}
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
