import React, { useState } from 'react';
import {
  Hash,
  Volume2,
  Bell,
  FolderPlus,
  Plus,
  Lock,
  Unlock,
  Trash2,
  Edit2,
  RefreshCw,
  AlertCircle,
  Layers,
  Check,
  X,
} from 'lucide-react';
import { useGuild } from '../../context/GuildContext';
import { api } from '../../api/client';
import { DiscordChannel } from '../../types';

export const ChannelsView: React.FC = () => {
  const { activeGuild, channels, refreshActiveGuildData, loadingGuildData } = useGuild();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [channelType, setChannelType] = useState<number>(0); // 0 = text, 2 = voice, 4 = category, 5 = announcement
  const [channelName, setChannelName] = useState('');
  const [channelTopic, setChannelTopic] = useState('');
  const [parentId, setParentId] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [lockingId, setLockingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingChannel, setEditingChannel] = useState<DiscordChannel | null>(null);
  const [editName, setEditName] = useState('');
  const [editTopic, setEditTopic] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [lockedChannels, setLockedChannels] = useState<Record<string, boolean>>({});

  // Group channels by category
  const categories = channels.filter((c) => c.type === 4);
  const nonCategories = channels.filter((c) => c.type !== 4);

  const channelsByCategory: Record<string, DiscordChannel[]> = {};
  const uncategorizedChannels: DiscordChannel[] = [];

  for (const cat of categories) {
    channelsByCategory[cat.id] = [];
  }

  for (const ch of nonCategories) {
    if (ch.parent_id && channelsByCategory[ch.parent_id]) {
      channelsByCategory[ch.parent_id].push(ch);
    } else {
      uncategorizedChannels.push(ch);
    }
  }

  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGuild) return;
    if (!channelName.trim()) {
      setError('Channel name is required.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await api.createChannel(activeGuild.id, {
        name: channelName.trim(),
        type: channelType,
        topic: channelTopic.trim() || undefined,
        parent_id: channelType === 4 ? null : parentId || null,
      });

      setShowCreateModal(false);
      setChannelName('');
      setChannelTopic('');
      setParentId('');
      await refreshActiveGuildData();
    } catch (err: any) {
      setError(err.message || 'Failed to create channel on Discord.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteChannel = async (channelId: string) => {
    if (!activeGuild) return;
    if (!confirm('Are you sure you want to permanently delete this channel from Discord?')) return;

    try {
      setDeletingId(channelId);
      setError(null);
      await api.deleteChannel(activeGuild.id, channelId);
      await refreshActiveGuildData();
    } catch (err: any) {
      setError(err.message || 'Failed to delete channel.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleLock = async (channelId: string) => {
    if (!activeGuild) return;
    const isCurrentlyLocked = lockedChannels[channelId] || false;
    const newLockState = !isCurrentlyLocked;

    try {
      setLockingId(channelId);
      setError(null);
      await api.lockChannel(activeGuild.id, channelId, newLockState);
      setLockedChannels((prev) => ({ ...prev, [channelId]: newLockState }));
    } catch (err: any) {
      setError(err.message || 'Failed to modify channel permissions.');
    } finally {
      setLockingId(null);
    }
  };

  const handleUpdateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGuild || !editingChannel) return;

    try {
      setSaving(true);
      setError(null);
      await api.editChannel(activeGuild.id, editingChannel.id, {
        name: editName.trim(),
        topic: editTopic.trim() || undefined,
      });
      setEditingChannel(null);
      await refreshActiveGuildData();
    } catch (err: any) {
      setError(err.message || 'Failed to edit channel.');
    } finally {
      setSaving(false);
    }
  };

  const renderChannelItem = (ch: DiscordChannel) => {
    const isVoice = ch.type === 2;
    const isAnnouncement = ch.type === 5;
    const isLocked = lockedChannels[ch.id] || false;

    return (
      <div
        key={ch.id}
        className="p-3 rounded-xl bg-[#0e1017] border border-white/5 flex items-center justify-between text-xs hover:border-white/10 transition-colors group"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {isVoice ? (
            <Volume2 className="w-4 h-4 text-violet-400 shrink-0" />
          ) : isAnnouncement ? (
            <Bell className="w-4 h-4 text-amber-400 shrink-0" />
          ) : (
            <Hash className="w-4 h-4 text-slate-400 shrink-0" />
          )}
          <span className="font-semibold text-white truncate">{ch.name}</span>
          {ch.topic && <span className="text-[11px] text-slate-500 truncate hidden md:inline">- {ch.topic}</span>}
        </div>

        <div className="flex items-center gap-1.5 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
          {!isVoice && (
            <button
              onClick={() => handleToggleLock(ch.id)}
              disabled={lockingId === ch.id}
              className={`p-1.5 rounded-lg border text-xs transition-colors ${
                isLocked
                  ? 'bg-red-950/40 text-red-400 border-red-800/40 hover:bg-red-900/40'
                  : 'bg-white/5 text-slate-400 border-white/5 hover:text-white'
              }`}
              title={isLocked ? 'Unlock Channel' : 'Lock Channel (@everyone)'}
            >
              {lockingId === ch.id ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : isLocked ? (
                <Lock className="w-3.5 h-3.5" />
              ) : (
                <Unlock className="w-3.5 h-3.5" />
              )}
            </button>
          )}

          <button
            onClick={() => {
              setEditingChannel(ch);
              setEditName(ch.name || '');
              setEditTopic(ch.topic || '');
            }}
            className="p-1.5 rounded-lg bg-white/5 text-slate-400 border border-white/5 hover:text-white transition-colors"
            title="Edit Channel"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => handleDeleteChannel(ch.id)}
            disabled={deletingId === ch.id}
            className="p-1.5 rounded-lg bg-white/5 text-slate-400 border border-white/5 hover:text-red-400 hover:border-red-800/30 transition-colors"
            title="Delete Channel"
          >
            {deletingId === ch.id ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Trash2 className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Channels & Categories</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real Discord channels grouped by categories. Create, edit, lock, or delete in real-time.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setChannelType(4);
              setShowCreateModal(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-semibold text-slate-200 transition-colors"
          >
            <FolderPlus className="w-3.5 h-3.5 text-violet-400" />
            <span>Create Category</span>
          </button>

          <button
            onClick={() => {
              setChannelType(0);
              setShowCreateModal(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-lg shadow-violet-600/30 transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Channel</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-950/30 border border-red-800/40 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Categories & Channel Lists */}
      <div className="space-y-6">
        {/* Uncategorized channels */}
        {uncategorizedChannels.length > 0 && (
          <div className="space-y-2">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-1">
              Uncategorized Channels ({uncategorizedChannels.length})
            </div>
            <div className="space-y-1.5">
              {uncategorizedChannels.map((ch) => renderChannelItem(ch))}
            </div>
          </div>
        )}

        {/* Categorized channels */}
        {categories.map((cat) => {
          const catChannels = channelsByCategory[cat.id] || [];
          return (
            <div key={cat.id} className="p-4 rounded-2xl bg-white/[0.015] border border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-xs text-violet-300 uppercase tracking-wider">
                  <Layers className="w-3.5 h-3.5 text-violet-400" />
                  <span>{cat.name}</span>
                  <span className="text-[10px] text-slate-500 font-mono">({catChannels.length})</span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setParentId(cat.id);
                      setChannelType(0);
                      setShowCreateModal(true);
                    }}
                    className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/5 text-xs flex items-center gap-1"
                    title="Add Channel to this Category"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span className="text-[11px] hidden sm:inline">Add</span>
                  </button>
                  <button
                    onClick={() => handleDeleteChannel(cat.id)}
                    className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-white/5"
                    title="Delete Category"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                {catChannels.map((ch) => renderChannelItem(ch))}
                {catChannels.length === 0 && (
                  <div className="p-3 text-center text-xs text-slate-600">No channels in this category.</div>
                )}
              </div>
            </div>
          );
        })}

        {channels.length === 0 && !loadingGuildData && (
          <div className="p-12 text-center text-slate-500 text-xs rounded-2xl bg-[#0e1017] border border-white/5">
            No Discord channels found. Check bot permissions or use the AI Builder to generate an architecture.
          </div>
        )}
      </div>

      {/* Modal: Create Channel or Category */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#0e1017] border border-violet-900/40 rounded-2xl shadow-2xl p-6 text-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <h3 className="font-bold text-white text-base">
                {channelType === 4 ? 'Create Category' : 'Create Real Channel'}
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateChannel} className="space-y-4 text-xs">
              {channelType !== 4 && (
                <div className="space-y-1.5">
                  <label className="text-slate-400 font-medium">Channel Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setChannelType(0)}
                      className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition-colors ${
                        channelType === 0
                          ? 'bg-violet-600/20 text-violet-300 border-violet-500/40'
                          : 'bg-white/5 border-white/5 text-slate-400'
                      }`}
                    >
                      <Hash className="w-4 h-4" />
                      <span>Text</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setChannelType(2)}
                      className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition-colors ${
                        channelType === 2
                          ? 'bg-violet-600/20 text-violet-300 border-violet-500/40'
                          : 'bg-white/5 border-white/5 text-slate-400'
                      }`}
                    >
                      <Volume2 className="w-4 h-4" />
                      <span>Voice</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setChannelType(5)}
                      className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition-colors ${
                        channelType === 5
                          ? 'bg-violet-600/20 text-violet-300 border-violet-500/40'
                          : 'bg-white/5 border-white/5 text-slate-400'
                      }`}
                    >
                      <Bell className="w-4 h-4" />
                      <span>Announce</span>
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-slate-400 font-medium">
                  {channelType === 4 ? 'Category Name' : 'Channel Name'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={channelType === 4 ? 'e.g. ESPORTS LOUNGE' : 'e.g. general-chat'}
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:border-violet-500 focus:outline-none"
                />
              </div>

              {channelType !== 4 && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-medium">Category (Optional)</label>
                    <select
                      value={parentId}
                      onChange={(e) => setParentId(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:border-violet-500 focus:outline-none"
                    >
                      <option value="">No Category</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-medium">Channel Topic</label>
                    <input
                      type="text"
                      placeholder="Purpose of this channel..."
                      value={channelTopic}
                      onChange={(e) => setChannelTopic(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:border-violet-500 focus:outline-none"
                    />
                  </div>
                </>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
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

      {/* Modal: Edit Channel */}
      {editingChannel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#0e1017] border border-violet-900/40 rounded-2xl shadow-2xl p-6 text-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <h3 className="font-bold text-white text-base">Edit Channel: #{editingChannel.name}</h3>
              <button onClick={() => setEditingChannel(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateChannel} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-400 font-medium">Channel Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:border-violet-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 font-medium">Topic</label>
                <input
                  type="text"
                  value={editTopic}
                  onChange={(e) => setEditTopic(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:border-violet-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setEditingChannel(null)}
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
