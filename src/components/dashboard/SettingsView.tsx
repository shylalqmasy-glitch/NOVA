import React, { useState } from 'react';
import {
  Settings,
  Bot,
  Key,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useGuild } from '../../context/GuildContext';

export const SettingsView: React.FC = () => {
  const { systemStatus } = useAuth();
  const { activeGuild, overview } = useGuild();
  const [copied, setCopied] = useState(false);

  const redirectUri = systemStatus?.redirectUri || `${window.location.origin}/auth/callback`;
  const botInstalled = overview?.botInstalled || false;

  const handleCopy = () => {
    navigator.clipboard.writeText(redirectUri);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-white">Server & Integration Settings</h1>
        <p className="text-xs text-slate-400 mt-1">
          Review live credentials status, Discord bot authorization, and production connection parameters.
        </p>
      </div>

      {/* Target Server Card */}
      {activeGuild && (
        <div className="p-6 rounded-3xl bg-[#0e1017] border border-white/5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <h3 className="font-bold text-white text-sm">Active Discord Server</h3>
            <span className="font-mono text-xs text-slate-400">ID: {activeGuild.id}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
              <span className="text-slate-500">Server Name</span>
              <div className="font-bold text-white truncate">{activeGuild.name}</div>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
              <span className="text-slate-500">NOVA Bot Connection</span>
              <div className="font-bold flex items-center gap-1.5">
                {botInstalled ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Authorized</span>
                  </span>
                ) : (
                  <span className="text-amber-400 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Bot Not Present</span>
                  </span>
                )}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
              <span className="text-slate-500">Ownership</span>
              <div className="font-bold text-white">
                {activeGuild.owner ? 'Server Owner' : 'Administrator'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Discord API Configuration */}
      <div className="p-6 rounded-3xl bg-[#0e1017] border border-white/5 space-y-4">
        <h3 className="font-bold text-white text-sm">Discord Developer Portal Configuration</h3>

        <div className="space-y-3 text-xs">
          <div className="space-y-1.5">
            <label className="text-slate-400">Authorized OAuth2 Redirect URI</label>
            <div className="flex items-center justify-between p-3 rounded-xl bg-black/50 border border-white/10 font-mono text-slate-300">
              <span className="truncate mr-2">{redirectUri}</span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-violet-400 hover:text-violet-300 shrink-0 font-sans"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied' : 'Copy URI'}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              Must match exactly in Discord Developer Portal &rarr; OAuth2 &rarr; Redirects.
            </p>
          </div>

          {/* Credentials Check */}
          <div className="space-y-2 pt-2 border-t border-white/5">
            <span className="font-semibold text-slate-300">Environment Credentials Status</span>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                <span className="text-slate-400 font-mono">DISCORD_CLIENT_ID</span>
                <span
                  className={`font-bold ${
                    systemStatus?.credentials.hasClientId ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {systemStatus?.credentials.hasClientId ? 'Configured' : 'Missing'}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                <span className="text-slate-400 font-mono">DISCORD_CLIENT_SECRET</span>
                <span
                  className={`font-bold ${
                    systemStatus?.credentials.hasClientSecret ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {systemStatus?.credentials.hasClientSecret ? 'Configured' : 'Missing'}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                <span className="text-slate-400 font-mono">DISCORD_BOT_TOKEN</span>
                <span
                  className={`font-bold ${
                    systemStatus?.credentials.hasBotToken ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {systemStatus?.credentials.hasBotToken ? 'Configured' : 'Missing'}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                <span className="text-slate-400 font-mono">GEMINI_API_KEY</span>
                <span
                  className={`font-bold ${
                    systemStatus?.credentials.hasGeminiKey ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {systemStatus?.credentials.hasGeminiKey ? 'Configured' : 'Missing'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
