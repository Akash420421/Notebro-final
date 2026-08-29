import React, { useState } from 'react';
import { Download, Check, X, Smartphone } from 'lucide-react';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt: any;
  onInstalled?: () => void;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({
  isOpen,
  onClose,
  deferredPrompt,
  onInstalled,
}) => {
  const [isInstalling, setIsInstalling] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      setIsInstalling(true);
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setIsSuccess(true);
          onInstalled?.();
          setTimeout(() => {
            onClose();
          }, 1500);
        }
      } catch (err) {
        console.error('Install prompt error:', err);
      } finally {
        setIsInstalling(false);
      }
    } else {
      // In unsupported browsers or iOS Safari, close after acknowledging
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-neutral-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-white rounded-xl shadow-xl border border-neutral-200 p-6 flex flex-col items-center text-center animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-12 rounded-xl bg-neutral-100 text-neutral-900 flex items-center justify-center mb-4">
          <Smartphone className="w-6 h-6 stroke-[1.8]" />
        </div>

        <h3 className="text-base font-bold text-neutral-900 tracking-tight mb-1">
          Install Note Bro
        </h3>
        <p className="text-xs text-neutral-500 max-w-xs mb-5 leading-relaxed">
          Keep your notes, projects, and resources one tap away with the Note Bro web app.
        </p>

        {!deferredPrompt && (
          <p className="text-[11px] text-neutral-400 mb-5 bg-neutral-50 p-2.5 rounded-lg border border-neutral-100 leading-normal">
            You can also add Note Bro to your home screen using your browser's share or options menu.
          </p>
        )}

        <div className="flex flex-col w-full gap-2">
          <button
            type="button"
            onClick={handleInstallClick}
            disabled={isInstalling || isSuccess}
            className="w-full py-2.5 px-4 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Installed</span>
              </>
            ) : isInstalling ? (
              <span>Installing...</span>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Install App</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 text-xs font-medium text-neutral-500 hover:text-neutral-900 transition"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
};
