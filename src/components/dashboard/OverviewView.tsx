import React from 'react';
import {
  Users,
  Hash,
  Shield,
  Bot,
  Sparkles,
  SearchCode,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  Plus,
  CheckCircle,
} from 'lucide-react';
import { useGuild } from '../../context/GuildContext';

interface Props {
  onOpenBotModal: () => void;
}

export const OverviewView: React.FC<Props> = ({ onOpenBotModal }) => {
  const { activeGuild, overview, loadingGuildData, setActiveTab, auditLogs } = useGuild();

  if (!activeGuild) {
    return (
      <div className="p-8 text-center text-slate-400">
        Please select a Discord server from the top navigation to begin.
      </div>
    );
  }

  const botInstalled = overview?.botInstalled || false;
  const memberCount = overview?.guild?.approximate_member_count || activeGuild.approximateMemberCount || 0;
  const channelsCount = overview?.channelsCount || 0;
  const rolesCount = overview?.rolesCount || 0;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Bot Missing Warning Banner */}
      {!botInstalled && (
        <div className="p-5 rounded-2xl bg-amber-950/30 border border-amber-800/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-600/20 text-amber-400 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-200">NOVA Bot Not Yet Added to this Server</h4>
              <p className="text-xs text-amber-300/80">
                To create real channels, roles, manage members and execute AI plans, add NOVA to{' '}
                <strong>{activeGuild.name}</strong>.
              </p>
            </div>
          </div>
          <button
            onClick={onOpenBotModal}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-black font-bold text-xs shrink-0 transition-colors shadow-lg shadow-amber-600/20"
          >
            Add NOVA Bot
          </button>
        </div>
      )}

      {/* Hero Guild Header */}
      <div className="p-6 rounded-3xl bg-[#0e1017] border border-white/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          {activeGuild.icon ? (
            <img
              src={`https://cdn.discordapp.com/icons/${activeGuild.id}/${activeGuild.icon}.png?size=128`}
              alt={activeGuild.name}
              className="w-16 h-16 rounded-2xl object-cover border border-white/10"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-violet-900/60 border border-violet-700/40 flex items-center justify-center text-xl font-bold text-violet-200">
              {activeGuild.name.substring(0, 2).toUpperCase()}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-white">{activeGuild.name}</h1>
              {activeGuild.owner && (
                <span className="px-2 py-0.5 rounded-md bg-amber-950/60 text-amber-400 border border-amber-800/40 text-[10px] font-semibold">
                  OWNER
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">Guild ID: {activeGuild.id}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('ai-builder')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-semibold text-xs shadow-lg shadow-violet-600/30 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Server Builder</span>
          </button>
          <button
            onClick={() => setActiveTab('ai-optimizer')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-slate-200 font-semibold text-xs transition-colors"
          >
            <SearchCode className="w-3.5 h-3.5 text-violet-400" />
            <span>Security Scan</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#0e1017] border border-white/5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Members</span>
            <Users className="w-4 h-4 text-violet-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">
            {loadingGuildData ? '...' : memberCount.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500">Live Discord members</div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0e1017] border border-white/5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Channels & Categories</span>
            <Hash className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">
            {loadingGuildData ? '...' : channelsCount}
          </div>
          <div className="text-[11px] text-slate-500">Configured in server</div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0e1017] border border-white/5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Roles</span>
            <Shield className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">
            {loadingGuildData ? '...' : rolesCount}
          </div>
          <div className="text-[11px] text-slate-500">Permission tiers</div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0e1017] border border-white/5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Bot Status</span>
            <Bot className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-lg font-bold flex items-center gap-2">
            {botInstalled ? (
              <span className="text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Operational
              </span>
            ) : (
              <span className="text-amber-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                Needs Invite
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-500">REST API v10 connection</div>
        </div>
      </div>

      {/* Quick Launch & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Launch Tools */}
        <div className="lg:col-span-1 p-6 rounded-3xl bg-[#0e1017] border border-white/5 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider text-slate-400">Quick Actions</h3>

          <div className="space-y-2">
            <button
              onClick={() => setActiveTab('channels')}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 text-xs text-slate-200 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Plus className="w-4 h-4 text-violet-400" />
                <span>Create Channel</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-500" />
            </button>

            <button
              onClick={() => setActiveTab('roles')}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 text-xs text-slate-200 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Plus className="w-4 h-4 text-purple-400" />
                <span>Create Role</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-500" />
            </button>

            <button
              onClick={() => setActiveTab('welcome')}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 text-xs text-slate-200 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>Configure Welcome Embed</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-500" />
            </button>

            <button
              onClick={() => setActiveTab('messages')}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 text-xs text-slate-200 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>Send Rich Embed Message</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        </div>

        {/* Live Audit Log Feed */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-[#0e1017] border border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider text-slate-400">Live Server Activity</h3>
            <button
              onClick={() => setActiveTab('audit-logs')}
              className="text-xs text-violet-400 hover:text-violet-300 font-medium"
            >
              View Full Audit Log &rarr;
            </button>
          </div>

          <div className="space-y-2">
            {auditLogs.slice(0, 5).map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      log.status === 'SUCCESS' ? 'bg-emerald-400' : 'bg-red-400'
                    }`}
                  />
                  <div>
                    <span className="font-semibold text-white">{log.action}</span>
                    <span className="text-slate-400 ml-2">by {log.userName}</span>
                  </div>
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}

            {auditLogs.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-500">
                No recorded activity yet. Use the tools above or the AI Builder to start managing your server.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
