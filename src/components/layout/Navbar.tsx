import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronDown,
  Bot,
  Key,
  LogOut,
  Sparkles,
  Server,
  PlusCircle,
  Check,
  Shield,
  HelpCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useGuild } from '../../context/GuildContext';
import { SetupGuideModal } from '../modals/SetupGuideModal';
import { AddBotModal } from '../modals/AddBotModal';

export const Navbar: React.FC = () => {
  const { user, logout, systemStatus } = useAuth();
  const { guilds, activeGuild, selectGuild, overview, refreshActiveGuildData } = useGuild();
  const [guildDropdownOpen, setGuildDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [showBotModal, setShowBotModal] = useState(false);

  const guildRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (guildRef.current && !guildRef.current.contains(e.target as Node)) {
        setGuildDropdownOpen(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const botInstalled = overview?.botInstalled || false;

  return (
    <>
      <header className="h-16 border-b border-white/5 bg-[#090a0f]/90 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
        {/* Left: Brand & Server Selector */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 via-purple-600 to-indigo-500 p-[1px] shadow-lg shadow-violet-600/20 flex items-center justify-center">
              <div className="w-full h-full bg-[#090a0f] rounded-xl flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-violet-400" />
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-wider text-white">NOVA</span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-violet-950/80 text-violet-400 border border-violet-800/40 font-semibold tracking-wider">
                  PROD
                </span>
              </div>
              <span className="text-[10px] text-slate-400 -mt-0.5 font-medium">Discord Server Architect</span>
            </div>
          </div>

          <div className="h-5 w-[1px] bg-white/10 hidden md:block" />

          {/* Server Switcher */}
          {user && (
            <div className="relative" ref={guildRef}>
              <button
                onClick={() => setGuildDropdownOpen(!guildDropdownOpen)}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 text-slate-200 text-xs transition-all max-w-[220px]"
              >
                {activeGuild?.icon ? (
                  <img
                    src={`https://cdn.discordapp.com/icons/${activeGuild.id}/${activeGuild.icon}.png?size=64`}
                    alt={activeGuild.name}
                    className="w-5 h-5 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-violet-900/60 flex items-center justify-center text-[10px] font-bold text-violet-300">
                    {activeGuild?.name ? activeGuild.name.substring(0, 1).toUpperCase() : 'S'}
                  </div>
                )}
                <span className="truncate font-medium">{activeGuild?.name || 'Select Server'}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
              </button>

              {guildDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-72 bg-[#0d0f17] border border-white/10 rounded-2xl shadow-2xl p-2 z-50 space-y-1">
                  <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Your Discord Servers ({guilds.length})
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-1">
                    {guilds.map((g) => (
                      <button
                        key={g.id}
                        onClick={() => {
                          selectGuild(g.id);
                          setGuildDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition-colors ${
                          activeGuild?.id === g.id
                            ? 'bg-violet-600/20 text-white border border-violet-500/30'
                            : 'hover:bg-white/5 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {g.icon ? (
                            <img
                              src={`https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png?size=64`}
                              alt={g.name}
                              className="w-6 h-6 rounded-full object-cover shrink-0"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[10px] shrink-0 font-bold">
                              {g.name.substring(0, 1).toUpperCase()}
                            </div>
                          )}
                          <span className="truncate font-medium">{g.name}</span>
                        </div>
                        {activeGuild?.id === g.id && <Check className="w-3.5 h-3.5 text-violet-400 shrink-0" />}
                      </button>
                    ))}
                    {guilds.length === 0 && (
                      <div className="p-3 text-center text-xs text-slate-400">
                        No servers found with Manage Server permission.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Actions, Bot Status, User */}
        <div className="flex items-center gap-3">
          {/* Bot Connection Indicator */}
          {activeGuild && (
            <div className="hidden sm:flex items-center gap-2">
              {botInstalled ? (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/40 border border-emerald-800/40 text-emerald-400 text-xs">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-medium">NOVA Bot Connected</span>
                </div>
              ) : (
                <button
                  onClick={() => setShowBotModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/40 border border-amber-800/40 text-amber-300 hover:bg-amber-900/40 text-xs transition-colors"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Add Bot to Server</span>
                </button>
              )}
            </div>
          )}

          {/* Setup Credentials Modal Guide */}
          <button
            onClick={() => setShowSetupModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-slate-300 text-xs transition-colors"
            title="Discord Credentials & Setup Instructions"
          >
            <Key className="w-3.5 h-3.5 text-violet-400" />
            <span className="hidden md:inline">API Setup</span>
          </button>

          {/* User Profile */}
          {user ? (
            <div className="relative" ref={userRef}>
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 p-1 pl-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 transition-colors"
              >
                <span className="text-xs font-medium text-slate-200 hidden sm:inline">{user.username}</span>
                {user.avatar ? (
                  <img
                    src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=64`}
                    alt={user.username}
                    className="w-7 h-7 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center text-xs font-bold text-white">
                    {user.username.substring(0, 1).toUpperCase()}
                  </div>
                )}
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-[#0d0f17] border border-white/10 rounded-2xl shadow-2xl p-2 z-50 text-xs text-slate-300">
                  <div className="p-3 border-b border-white/5">
                    <p className="font-semibold text-white truncate">{user.globalName || user.username}</p>
                    <p className="text-[11px] text-slate-400 font-mono">@{user.username}</p>
                  </div>
                  <div className="p-1 space-y-1">
                    <button
                      onClick={() => {
                        setShowSetupModal(true);
                        setUserDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-left"
                    >
                      <Key className="w-4 h-4 text-violet-400" />
                      <span>Discord Credentials Setup</span>
                    </button>
                    <button
                      onClick={() => {
                        logout();
                        setUserDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-500/10 text-red-400 transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </header>

      {/* Modals */}
      <SetupGuideModal isOpen={showSetupModal} onClose={() => setShowSetupModal(false)} />
      <AddBotModal isOpen={showBotModal} onClose={() => setShowBotModal(false)} />
    </>
  );
};
