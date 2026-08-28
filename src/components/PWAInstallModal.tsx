import React, { useState, useEffect } from 'react';
import {
  Download,
  Smartphone,
  CheckCircle2,
  X,
  Share2,
  MoreVertical,
  PlusSquare,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

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
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userAgent = window.navigator.userAgent.toLowerCase();
      setIsIOS(/iphone|ipad|ipod/.test(userAgent));
    }
  }, []);

  if (!isOpen) return null;

  const handleNativeInstall = async () => {
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
          }, 2000);
        }
      } catch (err) {
        console.error('Install prompt error:', err);
      } finally {
        setIsInstalling(false);
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 pb-4 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight">
                Install Note Bro App
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Full-screen app mode without browser URL bar
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* App Preview Card */}
          <div className="p-4 rounded-2xl bg-[#F7F4EE] border border-stone-200/80 flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white font-black text-base shadow-sm shrink-0">
              NB
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-bold text-slate-900">Note Bro — Workspace</h4>
              <p className="text-xs text-slate-600 truncate">
                Fluid notes, sketches &amp; cloud sync
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                  <Sparkles className="w-2.5 h-2.5" /> No URL Bar · Native Feel
                </span>
              </div>
            </div>
          </div>

          {/* If Native Android/Desktop Prompt Available */}
          {deferredPrompt && (
            <div className="space-y-3 pt-1">
              <button
                type="button"
                onClick={handleNativeInstall}
                disabled={isInstalling || isSuccess}
                className="w-full py-3.5 px-4 rounded-2xl bg-slate-900 hover:bg-black text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-70"
              >
                {isSuccess ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span>App Installed Successfully!</span>
                  </>
                ) : isInstalling ? (
                  <span>Installing App...</span>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    <span>1-Tap Direct Install</span>
                  </>
                )}
              </button>
              <p className="text-center text-[11px] text-slate-500 font-medium">
                Installs directly to your home screen with zero storage overhead.
              </p>
            </div>
          )}

          {/* Manual Step-by-Step Guide for Android / iOS */}
          <div className="space-y-2.5 pt-2">
            <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              {isIOS ? 'How to Add on iPhone / iPad (Safari)' : 'How to Add to Phone (Chrome / Android)'}
            </h5>

            {isIOS ? (
              <div className="space-y-2 text-xs text-slate-700 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                    1
                  </div>
                  <span>Tap the <strong>Share</strong> button <Share2 className="w-3.5 h-3.5 inline mx-1 text-blue-600" /> at bottom of Safari.</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                    2
                  </div>
                  <span>Scroll down and select <strong>"Add to Home Screen"</strong> <PlusSquare className="w-3.5 h-3.5 inline mx-1 text-slate-700" />.</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                    3
                  </div>
                  <span>Tap <strong>Add</strong> in top right. App icon will appear on home screen!</span>
                </div>
              </div>
            ) : (
              <div className="space-y-2 text-xs text-slate-700 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-slate-200 text-slate-800 flex items-center justify-center font-bold text-xs shrink-0">
                    1
                  </div>
                  <span>Tap Chrome's <strong>3-dots menu (⋮)</strong> <MoreVertical className="w-3.5 h-3.5 inline text-slate-700" /> at the top right.</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-slate-200 text-slate-800 flex items-center justify-center font-bold text-xs shrink-0">
                    2
                  </div>
                  <span>Tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-slate-200 text-slate-800 flex items-center justify-center font-bold text-xs shrink-0">
                    3
                  </div>
                  <span>Open Note Bro from home screen to enjoy <strong>100% full-screen without URL bar</strong>!</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition cursor-pointer"
          >
            Got it, Close
          </button>
        </div>
      </div>
    </div>
  );
};
