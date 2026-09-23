import React, { useState } from 'react';
import {
  Shield,
  Plus,
  Trash2,
  Edit2,
  RefreshCw,
  AlertCircle,
  Users,
  Eye,
  AtSign,
  X,
  Check,
} from 'lucide-react';
import { useGuild } from '../../context/GuildContext';
import { api } from '../../api/client';
import { DiscordRole } from '../../types';

export const RolesView: React.FC = () => {
  const { activeGuild, roles, refreshActiveGuildData, loadingGuildData } = useGuild();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [roleName, setRoleName] = useState('');
  const [roleColor, setRoleColor] = useState('#7c3aed');
  const [hoist, setHoist] = useState(false);
  const [mentionable, setMentionable] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState<DiscordRole | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('#7c3aed');
  const [editHoist, setEditHoist] = useState(false);
  const [editMentionable, setEditMentionable] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const colorPresets = [
    '#7c3aed', // Violet
    '#3b82f6', // Blue
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#ef4444', // Red
    '#ec4899', // Pink
    '#06b6d4', // Cyan
    '#94a3b8', // Slate
  ];

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGuild) return;
    if (!roleName.trim()) {
      setError('Role name is required.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await api.createRole(activeGuild.id, {
        name: roleName.trim(),
        color: roleColor,
        hoist,
        mentionable,
      });

      setShowCreateModal(false);
      setRoleName('');
      setRoleColor('#7c3aed');
      setHoist(false);
      setMentionable(false);
      await refreshActiveGuildData();
    } catch (err: any) {
      setError(err.message || 'Failed to create role on Discord.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGuild || !editingRole) return;

    try {
      setSaving(true);
      setError(null);
      await api.editRole(activeGuild.id, editingRole.id, {
        name: editName.trim(),
        color: editColor,
        hoist: editHoist,
        mentionable: editMentionable,
      });

      setEditingRole(null);
      await refreshActiveGuildData();
    } catch (err: any) {
      setError(err.message || 'Failed to edit role.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!activeGuild) return;
    if (!confirm('Are you sure you want to delete this role from Discord? This cannot be undone.')) return;

    try {
      setDeletingId(roleId);
      setError(null);
      await api.deleteRole(activeGuild.id, roleId);
      await refreshActiveGuildData();
    } catch (err: any) {
      setError(err.message || 'Failed to delete role.');
    } finally {
      setDeletingId(null);
    }
  };

  // Convert decimal color to HEX string
  const toHex = (colorInt: number) => {
    if (!colorInt) return '#94a3b8';
    return `#${colorInt.toString(16).padStart(6, '0')}`;
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Roles & Hierarchy</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real Discord roles sorted by hierarchy position. Manage permissions, display colors, and member visibility.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-lg shadow-violet-600/30 transition-all active:scale-95 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Create Role</span>
        </button>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-950/30 border border-red-800/40 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Roles List */}
      <div className="p-4 rounded-2xl bg-[#0e1017] border border-white/5 space-y-2">
        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-2 py-1 flex items-center justify-between">
          <span>Role Name & Hierarchy</span>
          <span>Attributes & Actions</span>
        </div>

        <div className="space-y-1.5">
          {roles.map((r) => {
            const hexColor = toHex(r.color);
            const isEveryone = r.name === '@everyone';

            return (
              <div
                key={r.id}
                className="p-3 rounded-xl bg-white/[0.015] hover:bg-white/[0.04] border border-white/5 flex items-center justify-between text-xs transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: hexColor }} />
                  <div className="truncate">
                    <span className="font-bold text-white truncate">{r.name}</span>
                    <span className="text-[10px] text-slate-500 font-mono ml-2">Pos #{r.position}</span>
                  </div>
                  {r.managed && (
                    <span className="px-1.5 py-0.5 rounded bg-blue-950/60 text-blue-400 border border-blue-800/30 text-[9px] font-bold uppercase tracking-wider">
                      Bot Managed
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-slate-400 text-[11px] hidden sm:flex">
                    {r.hoist && (
                      <span className="flex items-center gap-1 text-slate-300" title="Displayed separately in member list">
                        <Eye className="w-3 h-3 text-violet-400" />
                        <span>Hoisted</span>
                      </span>
                    )}
                    {r.mentionable && (
                      <span className="flex items-center gap-1 text-slate-300" title="Mentionable by anyone">
                        <AtSign className="w-3 h-3 text-indigo-400" />
                        <span>Mentionable</span>
                      </span>
                    )}
                  </div>

                  {!isEveryone && !r.managed && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingRole(r);
                          setEditName(r.name);
                          setEditColor(hexColor);
                          setEditHoist(r.hoist);
                          setEditMentionable(r.mentionable);
                        }}
                        className="p-1.5 rounded-lg bg-white/5 text-slate-400 border border-white/5 hover:text-white transition-colors"
                        title="Edit Role"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteRole(r.id)}
                        disabled={deletingId === r.id}
                        className="p-1.5 rounded-lg bg-white/5 text-slate-400 border border-white/5 hover:text-red-400 hover:border-red-800/30 transition-colors"
                        title="Delete Role"
                      >
                        {deletingId === r.id ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {roles.length === 0 && !loadingGuildData && (
            <div className="p-8 text-center text-slate-500 text-xs">
              No roles retrieved. Make sure NOVA has permissions in this server.
            </div>
          )}
        </div>
      </div>

      {/* Modal: Create Role */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#0e1017] border border-violet-900/40 rounded-2xl shadow-2xl p-6 text-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <h3 className="font-bold text-white text-base">Create Discord Role</h3>
              <button onClick={() => setShowCreateModal(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRole} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-400 font-medium">Role Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Captain, Moderator, VIP"
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:border-violet-500 focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-slate-400 font-medium">Role Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={roleColor}
                    onChange={(e) => setRoleColor(e.target.value)}
                    className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                  />
                  <input
                    type="text"
                    value={roleColor}
                    onChange={(e) => setRoleColor(e.target.value)}
                    className="w-28 p-2 rounded-lg bg-black/40 border border-white/10 font-mono text-xs uppercase"
                  />
                </div>
                <div className="flex items-center gap-1.5 pt-1">
                  {colorPresets.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setRoleColor(c)}
                      className="w-5 h-5 rounded-full border border-white/20 transition-transform hover:scale-110"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-white/5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hoist}
                    onChange={(e) => setHoist(e.target.checked)}
                    className="rounded bg-black/40 border-white/20 text-violet-600 focus:ring-0"
                  />
                  <span className="text-slate-300">Display role members separately in online list (Hoist)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={mentionable}
                    onChange={(e) => setMentionable(e.target.checked)}
                    className="rounded bg-black/40 border-white/20 text-violet-600 focus:ring-0"
                  />
                  <span className="text-slate-300">Allow anyone to @mention this role</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold flex items-center gap-1.5"
                >
                  {saving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Create on Discord</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Role */}
      {editingRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#0e1017] border border-violet-900/40 rounded-2xl shadow-2xl p-6 text-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <h3 className="font-bold text-white text-base">Edit Role: @{editingRole.name}</h3>
              <button onClick={() => setEditingRole(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateRole} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-400 font-medium">Role Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:border-violet-500 focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-slate-400 font-medium">Role Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={editColor}
                    onChange={(e) => setEditColor(e.target.value)}
                    className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                  />
                  <input
                    type="text"
                    value={editColor}
                    onChange={(e) => setEditColor(e.target.value)}
                    className="w-28 p-2 rounded-lg bg-black/40 border border-white/10 font-mono text-xs uppercase"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-white/5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editHoist}
                    onChange={(e) => setEditHoist(e.target.checked)}
                    className="rounded bg-black/40 border-white/20 text-violet-600 focus:ring-0"
                  />
                  <span className="text-slate-300">Display separately in online list (Hoist)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editMentionable}
                    onChange={(e) => setEditMentionable(e.target.checked)}
                    className="rounded bg-black/40 border-white/20 text-violet-600 focus:ring-0"
                  />
                  <span className="text-slate-300">Allow anyone to @mention this role</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setEditingRole(null)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold flex items-center gap-1.5"
                >
                  {saving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
