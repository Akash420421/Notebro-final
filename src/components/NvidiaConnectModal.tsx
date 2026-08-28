import React, { useState, useEffect } from 'react';
import { X, Cpu, Check, AlertCircle, Loader2, Key, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { nvidiaService, NvidiaConnectionState, DEFAULT_NVIDIA_MODELS } from '../services/nvidiaProvider';

interface NvidiaConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NvidiaConnectModal({ isOpen, onClose }: NvidiaConnectModalProps) {
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [connectionState, setConnectionState] = useState<NvidiaConnectionState>(nvidiaService.getState());

  useEffect(() => {
    const unsub = nvidiaService.subscribe((state) => {
      setConnectionState(state);
      if (state.lastError) {
        setErrorMsg(state.lastError);
      }
    });
    return unsub;
  }, []);

  if (!isOpen) return null;

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKeyInput.trim()) {
      setErrorMsg('Please enter a valid API key.');
      return;
    }

    setIsConnecting(true);
    setErrorMsg(null);

    const result = await nvidiaService.connectNvidia(apiKeyInput.trim());
    setIsConnecting(false);

    if (result.success) {
      setApiKeyInput('');
    } else {
      setErrorMsg(result.error || 'Failed to connect. Please verify your API key.');
    }
  };

  const handleDisconnect = () => {
    nvidiaService.disconnect();
    setApiKeyInput('');
    setErrorMsg(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-xl text-slate-900 overflow-hidden flex flex-col my-auto animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                AI Provider Settings
              </h2>
              <p className="text-xs text-slate-500 font-normal">
                External accelerated compute and model selection
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {connectionState.isConnected ? (
            /* Connected State Screen */
            <div className="space-y-4">
              {/* Status Banner */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Provider Connected</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Active
                  </span>
                </div>
                <div className="text-xs text-slate-600 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Current Model:</span>
                    <span className="font-semibold text-slate-800">{connectionState.modelName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Vision Processing:</span>
                    <span className="font-semibold text-slate-800">
                      {connectionState.hasVision ? 'Enabled' : 'Text Only'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Model Switcher */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Select Model</label>
                <select
                  value={connectionState.activeModel}
                  onChange={(e) => nvidiaService.setActiveModel(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 transition cursor-pointer shadow-2xs"
                >
                  {DEFAULT_NVIDIA_MODELS.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name} {model.capabilities.vision ? '(Vision Enabled)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Footer Actions */}
              <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleDisconnect}
                  className="px-4 py-2.5 rounded-2xl text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition cursor-pointer"
                >
                  Disconnect
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold transition cursor-pointer shadow-sm active:scale-95"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            /* Setup Input Screen */
            <form onSubmit={handleConnect} className="space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Enter your API key from{' '}
                <a
                  href="https://build.nvidia.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-slate-900 font-semibold underline underline-offset-2 hover:text-blue-600"
                >
                  build.nvidia.com
                </a>{' '}
                to enable high-speed model execution.
              </p>

              {/* API Key Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">API Key</label>
                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={apiKeyInput}
                    onChange={(e) => {
                      setApiKeyInput(e.target.value);
                      if (errorMsg) setErrorMsg(null);
                    }}
                    placeholder="nvapi-..."
                    autoComplete="off"
                    spellCheck="false"
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition"
                  />
                  <Key className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="p-1 text-slate-400 hover:text-slate-700 absolute right-2.5 top-2.5 transition cursor-pointer"
                  >
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {errorMsg && (
                <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-2xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isConnecting || !apiKeyInput.trim()}
                  className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-sm ${
                    isConnecting || !apiKeyInput.trim()
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-slate-900 hover:bg-slate-800 text-white active:scale-95'
                  }`}
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Connecting...</span>
                    </>
                  ) : (
                    <span>Save Key</span>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
