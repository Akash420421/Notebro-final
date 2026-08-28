import React, { useState, useEffect, useRef } from 'react';
import { X, Lock, Shield, KeyRound, AlertCircle, CheckCircle2 } from 'lucide-react';

interface SecretAdminAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessUnlock: () => void;
}

const SEC_AUTH_TOKEN = '1f44a956333bf8f161405b630e6bf393649622d6452297120612660d1ba95e0c';

async function verifyAuthChallenge(input: string): Promise<boolean> {
  const clean = input.trim();
  if (!clean) return false;
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(clean);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    return hashHex === SEC_AUTH_TOKEN || btoa(clean) === 'MjQ2ODEwMTI=';
  } catch (e) {
    return btoa(clean) === 'MjQ2ODEwMTI=';
  }
}

export const SecretAdminAccessModal: React.FC<SecretAdminAccessModalProps> = ({
  isOpen,
  onClose,
  onSuccessUnlock,
}) => {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPasscode('');
      setError(null);
      setIsSuccess(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isValid = await verifyAuthChallenge(passcode);
    if (isValid) {
      setIsSuccess(true);
      setError(null);
      setTimeout(() => {
        onSuccessUnlock();
        onClose();
      }, 350);
    } else {
      setError('Invalid security passcode. Please enter the correct code.');
      setPasscode('');
      inputRef.current?.focus();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-white rounded-3xl border border-slate-200/90 shadow-[0_20px_50px_rgba(0,0,0,0.15)] overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">Security Access</h3>
              <p className="text-[11px] text-slate-500 font-medium">Workspace verification</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="text-center space-y-1">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200">
              <KeyRound className="w-6 h-6" />
            </div>
            <p className="text-xs text-slate-600 font-medium pt-1">
              Enter the 8-digit access key to continue
            </p>
          </div>

          <div className="space-y-1.5">
            <input
              ref={inputRef}
              type="password"
              inputMode="numeric"
              maxLength={16}
              value={passcode}
              onChange={(e) => {
                setPasscode(e.target.value);
                if (error) setError(null);
              }}
              placeholder="••••••••"
              className="w-full text-center tracking-[0.35em] text-lg font-mono px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition"
              autoComplete="off"
            />
          </div>

          {error && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {isSuccess && (
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>Passcode accepted. Loading full control console...</span>
            </div>
          )}

          <div className="pt-1 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!passcode.trim()}
              className={`w-1/2 py-2.5 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer ${
                !passcode.trim()
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-slate-900 hover:bg-slate-800 text-white'
              }`}
            >
              Unlock
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
