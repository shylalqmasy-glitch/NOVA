import React from 'react';
import {
  LayoutDashboard,
  Sparkles,
  SearchCode,
  Hash,
  Shield,
  Users,
  MessageSquare,
  Flame,
  Zap,
  PartyPopper,
  ScrollText,
  Settings,
} from 'lucide-react';
import { useGuild, DashboardTab } from '../../context/GuildContext';

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, overview } = useGuild();

  const navItems: Array<{ id: DashboardTab; label: string; icon: React.ReactNode; badge?: string; special?: boolean }> = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    {
      id: 'ai-builder',
      label: 'AI Server Builder',
      icon: <Sparkles className="w-4 h-4" />,
      badge: 'PRO',
      special: true,
    },
    {
      id: 'ai-optimizer',
      label: 'AI Server Audit',
      icon: <SearchCode className="w-4 h-4" />,
      badge: 'AI',
    },
    { id: 'channels', label: 'Channels', icon: <Hash className="w-4 h-4" /> },
    { id: 'roles', label: 'Roles & Hierarchy', icon: <Shield className="w-4 h-4" /> },
    { id: 'members', label: 'Members', icon: <Users className="w-4 h-4" /> },
    { id: 'messages', label: 'Send Messages', icon: <MessageSquare className="w-4 h-4" /> },
    { id: 'moderation', label: 'Moderation', icon: <Flame className="w-4 h-4" /> },
    { id: 'automation', label: 'Automations', icon: <Zap className="w-4 h-4" /> },
    { id: 'welcome', label: 'Welcome System', icon: <PartyPopper className="w-4 h-4" /> },
    { id: 'audit-logs', label: 'Audit Logs', icon: <ScrollText className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <aside className="w-64 border-r border-white/5 bg-[#090a0f] p-4 flex flex-col justify-between shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="space-y-1">
        <div className="px-3 py-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
          Management
        </div>

        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                isActive
                  ? item.special
                    ? 'bg-gradient-to-r from-violet-600/30 to-purple-600/20 text-white border border-violet-500/40 shadow-sm'
                    : 'bg-white/10 text-white border border-white/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={isActive ? 'text-violet-400' : 'text-slate-500 group-hover:text-slate-300'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded font-bold font-mono tracking-wider ${
                    item.special
                      ? 'bg-violet-500/30 text-violet-300 border border-violet-500/40'
                      : 'bg-white/10 text-slate-300'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Server Status Quick Card */}
      {overview && (
        <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2 mt-4">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Server Health</span>
            <span className="font-semibold text-emerald-400">Optimal</span>
          </div>
          <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
            <div className="bg-gradient-to-r from-violet-500 to-emerald-400 h-full rounded-full w-[94%]" />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
            <span>Roles: {overview.rolesCount || 0}</span>
            <span>Channels: {overview.channelsCount || 0}</span>
          </div>
        </div>
      )}
    </aside>
  );
};
