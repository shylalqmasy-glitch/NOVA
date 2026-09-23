import React from 'react';
import { X, Bot, ShieldCheck, ExternalLink } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useGuild } from '../../context/GuildContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const AddBotModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { systemStatus } = useAuth();
  const { activeGuild } = useGuild();

  if (!isOpen) return null;

  const clientId = systemStatus?.discordClientId || '123456789012345678';
  const botInviteUrl = activeGuild
    ? `https://discord.com/oauth2/authorize?client_id=${clientId}&scope=bot%20applications.commands&permissions=8&guild_id=${activeGuild.id}&disable_guild_select=true`
    : `https://discord.com/oauth2/authorize?client_id=${clientId}&scope=bot%20applications.commands&permissions=8`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="relative w-full max-w-lg bg-[#0e1017] border border-violet-900/40 rounded-2xl shadow-2xl p-6 text-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-violet-600/20 border border-violet-500/30 text-violet-400">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Add NOVA Bot to Server</h3>
              <p className="text-xs text-slate-400">Official Discord Bot Authorization</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-5 space-y-4 text-xs text-slate-300 leading-relaxed">
          <p>
            To execute real operations (creating channels, roles, moderating members, and configuring welcome messages),
            NOVA requires the official bot presence in your server with administrative permissions.
          </p>

          <div className="p-3.5 rounded-xl bg-violet-950/20 border border-violet-800/30 space-y-2">
            <div className="flex items-center gap-2 text-violet-300 font-medium">
              <ShieldCheck className="w-4 h-4 text-violet-400" />
              <span>Target Server: {activeGuild?.name || 'Selected Discord Guild'}</span>
            </div>
            <p className="text-slate-400 text-[11px]">
              Requested Permissions: Administrator (Manage Channels, Manage Roles, Manage Members, Send Embeds).
            </p>
          </div>
        </div>

        <div className="pt-3 border-t border-white/5 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs transition-colors"
          >
            Cancel
          </button>
          <a
            href={botInviteUrl}
            target="_blank"
            rel="noreferrer"
            onClick={onClose}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-medium text-xs shadow-lg shadow-violet-600/30 transition-all"
          >
            Authorize NOVA Bot <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
