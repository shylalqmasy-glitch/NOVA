import React, { useState } from 'react';
import {
  Users,
  Search,
  Shield,
  Clock,
  UserX,
  Ban,
  Plus,
  Trash2,
  RefreshCw,
  AlertCircle,
  X,
  Check,
} from 'lucide-react';
import { useGuild } from '../../context/GuildContext';
import { api } from '../../api/client';
import { DiscordMember, DiscordRole } from '../../types';

export const MembersView: React.FC = () => {
  const { activeGuild, members, roles, refreshActiveGuildData, loadingGuildData } = useGuild();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMember, setSelectedMember] = useState<DiscordMember | null>(null);
  const [activeModal, setActiveModal] = useState<'roles' | 'timeout' | 'kick' | 'ban' | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [timeoutMinutes, setTimeoutMinutes] = useState(60);
  const [deleteMsgDays, setDeleteMsgDays] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filter members by search
  const filteredMembers = members.filter((m) => {
    const q = searchTerm.toLowerCase();
    const uname = m.user.username.toLowerCase();
    const nick = (m.nick || '').toLowerCase();
    const id = m.user.id;
    return uname.includes(q) || nick.includes(q) || id.includes(q);
  });

  const getRoleById = (roleId: string): DiscordRole | undefined => {
    return roles.find((r) => r.id === roleId);
  };

  const handleToggleRole = async (roleId: string) => {
    if (!activeGuild || !selectedMember) return;
    const hasRole = selectedMember.roles.includes(roleId);

    try {
      setProcessing(true);
      setError(null);
      if (hasRole) {
        await api.removeMemberRole(activeGuild.id, selectedMember.user.id, roleId);
        selectedMember.roles = selectedMember.roles.filter((id) => id !== roleId);
      } else {
        await api.addMemberRole(activeGuild.id, selectedMember.user.id, roleId);
        selectedMember.roles.push(roleId);
      }
      setSuccessMsg(`Role ${hasRole ? 'removed from' : 'granted to'} ${selectedMember.user.username}`);
      await refreshActiveGuildData();
    } catch (err: any) {
      setError(err.message || 'Failed to update member role on Discord.');
    } finally {
      setProcessing(false);
    }
  };

  const handleTimeout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGuild || !selectedMember) return;

    try {
      setProcessing(true);
      setError(null);
      await api.timeoutMember(activeGuild.id, selectedMember.user.id, timeoutMinutes);
      setActiveModal(null);
      setSuccessMsg(`Timed out ${selectedMember.user.username} for ${timeoutMinutes} minutes.`);
      await refreshActiveGuildData();
    } catch (err: any) {
      setError(err.message || 'Failed to timeout member on Discord.');
    } finally {
      setProcessing(false);
    }
  };

  const handleKick = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGuild || !selectedMember) return;

    try {
      setProcessing(true);
      setError(null);
      await api.kickMember(activeGuild.id, selectedMember.user.id, actionReason || 'Kicked via NOVA Dashboard');
      setActiveModal(null);
      setSuccessMsg(`Kicked ${selectedMember.user.username} from server.`);
      await refreshActiveGuildData();
    } catch (err: any) {
      setError(err.message || 'Failed to kick member.');
    } finally {
      setProcessing(false);
    }
  };

  const handleBan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGuild || !selectedMember) return;

    try {
      setProcessing(true);
      setError(null);
      await api.banMember(
        activeGuild.id,
        selectedMember.user.id,
        actionReason || 'Banned via NOVA Moderation',
        deleteMsgDays
      );
      setActiveModal(null);
      setSuccessMsg(`Permanently banned ${selectedMember.user.username} from server.`);
      await refreshActiveGuildData();
    } catch (err: any) {
      setError(err.message || 'Failed to ban member.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Members & Permissions</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real Discord server members. Manage roles, timeout rule-breakers, kick or ban with live API enforcement.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by username or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#0e1017] border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-violet-500"
          />
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-950/30 border border-red-800/40 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-emerald-300 text-xs flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{successMsg}</span>
          </span>
          <button onClick={() => setSuccessMsg(null)} className="text-slate-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Members Table */}
      <div className="p-4 rounded-2xl bg-[#0e1017] border border-white/5 space-y-2">
        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-2 py-1 flex items-center justify-between">
          <span>Member ({filteredMembers.length})</span>
          <span>Roles & Moderation</span>
        </div>

        <div className="space-y-1.5">
          {filteredMembers.map((m) => {
            const avatarUrl = m.user.avatar
              ? `https://cdn.discordapp.com/avatars/${m.user.id}/${m.user.avatar}.png?size=64`
              : null;

            return (
              <div
                key={m.user.id}
                className="p-3 rounded-xl bg-white/[0.015] hover:bg-white/[0.04] border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs transition-colors group"
              >
                {/* Member Info */}
                <div className="flex items-center gap-3 min-w-0">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={m.user.username} className="w-8 h-8 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-violet-900/60 flex items-center justify-center font-bold text-violet-300 shrink-0">
                      {m.user.username.substring(0, 1).toUpperCase()}
                    </div>
                  )}

                  <div className="truncate">
                    <div className="font-bold text-white flex items-center gap-1.5">
                      <span className="truncate">{m.nick || m.user.globalName || m.user.username}</span>
                      {m.nick && <span className="text-[11px] text-slate-500">(@{m.user.username})</span>}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      Joined: {new Date(m.joined_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* Roles Pills */}
                <div className="flex flex-wrap items-center gap-1 max-w-md">
                  {m.roles.slice(0, 4).map((rId) => {
                    const r = getRoleById(rId);
                    if (!r) return null;
                    const hex = r.color ? `#${r.color.toString(16).padStart(6, '0')}` : '#7c3aed';
                    return (
                      <span
                        key={rId}
                        className="px-2 py-0.5 rounded-full text-[10px] font-medium border flex items-center gap-1 bg-black/40 text-slate-300 border-white/10"
                      >
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: hex }} />
                        <span className="truncate max-w-[90px]">{r.name}</span>
                      </span>
                    );
                  })}
                  {m.roles.length > 4 && (
                    <span className="text-[10px] text-slate-500 font-mono">+{m.roles.length - 4} more</span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 self-end md:self-center shrink-0">
                  <button
                    onClick={() => {
                      setSelectedMember(m);
                      setActiveModal('roles');
                    }}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-violet-600/20 text-slate-300 hover:text-violet-300 border border-white/5 transition-colors"
                    title="Manage Member Roles"
                  >
                    <Shield className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => {
                      setSelectedMember(m);
                      setActiveModal('timeout');
                    }}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-amber-600/20 text-slate-300 hover:text-amber-300 border border-white/5 transition-colors"
                    title="Timeout Member"
                  >
                    <Clock className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => {
                      setSelectedMember(m);
                      setActiveModal('kick');
                    }}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-orange-600/20 text-slate-300 hover:text-orange-300 border border-white/5 transition-colors"
                    title="Kick Member"
                  >
                    <UserX className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => {
                      setSelectedMember(m);
                      setActiveModal('ban');
                    }}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-red-600/20 text-slate-300 hover:text-red-400 border border-white/5 transition-colors"
                    title="Ban Member"
                  >
                    <Ban className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}

          {filteredMembers.length === 0 && !loadingGuildData && (
            <div className="p-8 text-center text-slate-500 text-xs">
              No members found matching query.
            </div>
          )}
        </div>
      </div>

      {/* Modal: Roles Manager */}
      {activeModal === 'roles' && selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#0e1017] border border-violet-900/40 rounded-2xl shadow-2xl p-6 text-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <h3 className="font-bold text-white text-base">Roles for @{selectedMember.user.username}</h3>
              <button onClick={() => setActiveModal(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5 max-h-72 overflow-y-auto text-xs">
              {roles
                .filter((r) => r.name !== '@everyone' && !r.managed)
                .map((r) => {
                  const has = selectedMember.roles.includes(r.id);
                  const hex = r.color ? `#${r.color.toString(16).padStart(6, '0')}` : '#7c3aed';

                  return (
                    <button
                      key={r.id}
                      onClick={() => handleToggleRole(r.id)}
                      disabled={processing}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-colors ${
                        has
                          ? 'bg-violet-600/20 border-violet-500/40 text-white'
                          : 'bg-white/[0.02] border-white/5 text-slate-400 hover:bg-white/[0.05]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: hex }} />
                        <span className="font-semibold">{r.name}</span>
                      </div>
                      {has && <Check className="w-4 h-4 text-violet-400 shrink-0" />}
                    </button>
                  );
                })}
            </div>

            <div className="flex justify-end pt-3 border-t border-white/5">
              <button
                onClick={() => setActiveModal(null)}
                className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Timeout */}
      {activeModal === 'timeout' && selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#0e1017] border border-violet-900/40 rounded-2xl shadow-2xl p-6 text-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <h3 className="font-bold text-white text-base">Timeout @{selectedMember.user.username}</h3>
              <button onClick={() => setActiveModal(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleTimeout} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-400 font-medium">Timeout Duration</label>
                <select
                  value={timeoutMinutes}
                  onChange={(e) => setTimeoutMinutes(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:border-violet-500 focus:outline-none"
                >
                  <option value={5}>5 Minutes</option>
                  <option value={10}>10 Minutes</option>
                  <option value={60}>1 Hour</option>
                  <option value={1440}>24 Hours (1 Day)</option>
                  <option value={10080}>7 Days (1 Week)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold flex items-center gap-1.5"
                >
                  {processing && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Apply Timeout</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Kick */}
      {activeModal === 'kick' && selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#0e1017] border border-orange-900/40 rounded-2xl shadow-2xl p-6 text-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <h3 className="font-bold text-white text-base">Kick @{selectedMember.user.username}</h3>
              <button onClick={() => setActiveModal(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleKick} className="space-y-4 text-xs">
              <p className="text-slate-400">
                Are you sure you want to kick <strong>{selectedMember.user.username}</strong> from the server? They can
                rejoin with an invite link.
              </p>

              <div className="space-y-1.5">
                <label className="text-slate-400 font-medium">Reason (optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Breaking server rules, spamming"
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-semibold flex items-center gap-1.5"
                >
                  {processing && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Kick from Server</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Ban */}
      {activeModal === 'ban' && selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#0e1017] border border-red-900/40 rounded-2xl shadow-2xl p-6 text-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <h3 className="font-bold text-white text-base">Permanently Ban @{selectedMember.user.username}</h3>
              <button onClick={() => setActiveModal(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleBan} className="space-y-4 text-xs">
              <p className="text-red-300">
                This will ban <strong>{selectedMember.user.username}</strong> from <strong>{activeGuild?.name}</strong>.
              </p>

              <div className="space-y-1.5">
                <label className="text-slate-400 font-medium">Delete Recent Messages</label>
                <select
                  value={deleteMsgDays}
                  onChange={(e) => setDeleteMsgDays(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:border-red-500 focus:outline-none"
                >
                  <option value={0}>Don't delete any</option>
                  <option value={1}>Previous 24 Hours</option>
                  <option value={7}>Previous 7 Days</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 font-medium">Reason for Ban</label>
                <input
                  type="text"
                  placeholder="e.g. Malicious behavior, raid attempt"
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:border-red-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold flex items-center gap-1.5"
                >
                  {processing && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Confirm Ban</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
