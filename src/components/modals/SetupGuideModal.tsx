import React, { useState } from 'react';
import { X, Copy, Check, ExternalLink, ShieldAlert, Key, Bot, Globe } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const SetupGuideModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { systemStatus } = useAuth();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const redirectUri = systemStatus?.redirectUri || `${window.location.origin}/auth/callback`;
  const appUrl = systemStatus?.appUrl || window.location.origin;

  const handleCopy = (text: string, keyName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="relative w-full max-w-2xl bg-[#0e1017] border border-violet-900/40 rounded-2xl shadow-2xl overflow-hidden text-slate-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-violet-950/40 via-transparent to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-violet-600/20 border border-violet-500/30 text-violet-400">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-wide">NOVA Discord Production Setup</h2>
              <p className="text-xs text-slate-400">Connect your real Discord Application & Bot in 3 minutes</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm">
          {/* Step 1 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-violet-400 font-semibold text-base">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-violet-600/20 text-xs border border-violet-500/40">1</span>
              <span>Discord Developer Portal & Application</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Open the Discord Developer Portal and create a new application named <strong>NOVA</strong>.
            </p>
            <a
              href="https://discord.com/developers/applications"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-violet-300 border border-white/10 text-xs transition-colors"
            >
              Open Discord Developer Portal <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Step 2 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-violet-400 font-semibold text-base">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-violet-600/20 text-xs border border-violet-500/40">2</span>
              <span>OAuth2 Redirect URI (Mandatory)</span>
            </div>
            <p className="text-slate-400 text-xs">
              In your Discord App &rarr; <strong>OAuth2 &rarr; General</strong>, click <strong>Add Redirect</strong> and paste this exact URL:
            </p>
            <div className="flex items-center justify-between p-3 rounded-xl bg-black/60 border border-white/10 font-mono text-xs text-slate-300">
              <span className="truncate mr-2">{redirectUri}</span>
              <button
                onClick={() => handleCopy(redirectUri, 'redirectUri')}
                className="flex items-center gap-1 text-violet-400 hover:text-violet-300 font-sans text-xs shrink-0"
              >
                {copiedKey === 'redirectUri' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {copiedKey === 'redirectUri' ? 'Copied' : 'Copy URL'}
              </button>
            </div>
          </div>

          {/* Step 3 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-violet-400 font-semibold text-base">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-violet-600/20 text-xs border border-violet-500/40">3</span>
              <span>Bot Privileged Gateway Intents</span>
            </div>
            <p className="text-slate-400 text-xs">
              Go to <strong>Bot</strong> tab, reset or copy your <strong>Token</strong>, and enable these Privileged Gateway Intents:
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-white/5 border border-white/5 text-slate-300 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Server Members Intent (Required for members & roles)</span>
              </div>
              <div className="p-2.5 rounded-lg bg-white/5 border border-white/5 text-slate-300 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Message Content Intent (Required for automations)</span>
              </div>
            </div>
          </div>

          {/* Step 4 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-violet-400 font-semibold text-base">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-violet-600/20 text-xs border border-violet-500/40">4</span>
              <span>Environment Secrets in AI Studio</span>
            </div>
            <p className="text-slate-400 text-xs">
              Configure these in the <strong>Settings &rarr; Secrets</strong> panel of Google AI Studio:
            </p>
            <div className="space-y-2 font-mono text-xs">
              <div className="p-2.5 rounded-lg bg-black/40 border border-white/5 flex items-center justify-between">
                <span className="text-purple-300">DISCORD_CLIENT_ID</span>
                <span className="text-slate-400 font-sans text-[11px]">Application ID</span>
              </div>
              <div className="p-2.5 rounded-lg bg-black/40 border border-white/5 flex items-center justify-between">
                <span className="text-purple-300">DISCORD_CLIENT_SECRET</span>
                <span className="text-slate-400 font-sans text-[11px]">OAuth2 Secret</span>
              </div>
              <div className="p-2.5 rounded-lg bg-black/40 border border-white/5 flex items-center justify-between">
                <span className="text-purple-300">DISCORD_BOT_TOKEN</span>
                <span className="text-slate-400 font-sans text-[11px]">Bot Token</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/5 bg-black/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium text-xs transition-colors shadow-lg shadow-violet-600/20"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
