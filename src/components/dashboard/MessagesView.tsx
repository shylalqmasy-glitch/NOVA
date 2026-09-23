import React, { useState } from 'react';
import {
  MessageSquare,
  Send,
  Eye,
  Palette,
  Image,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Sparkles,
} from 'lucide-react';
import { useGuild } from '../../context/GuildContext';
import { api } from '../../api/client';

export const MessagesView: React.FC = () => {
  const { activeGuild, channels } = useGuild();
  const textChannels = channels.filter((c) => c.type === 0 || c.type === 5);

  const [targetChannelId, setTargetChannelId] = useState<string>(textChannels[0]?.id || '');
  const [content, setContent] = useState('');
  const [useEmbed, setUseEmbed] = useState(true);
  const [embedTitle, setEmbedTitle] = useState('Official Server Announcement');
  const [embedDescription, setEmbedDescription] = useState(
    'Welcome everyone! We are thrilled to introduce our new community space powered by **NOVA Architect**.'
  );
  const [embedColor, setEmbedColor] = useState('#7c3aed');
  const [embedFooter, setEmbedFooter] = useState('NOVA Dispatcher • Today at 12:00 PM');
  const [embedThumbnail, setEmbedThumbnail] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGuild) return;
    if (!targetChannelId) {
      setError('Please select a target channel.');
      return;
    }
    if (!content.trim() && !useEmbed) {
      setError('Please enter either a message or configure an embed.');
      return;
    }

    try {
      setSending(true);
      setError(null);
      setSuccess(false);

      await api.sendMessage(activeGuild.id, targetChannelId, {
        content: content.trim() || undefined,
        embed: useEmbed
          ? {
              title: embedTitle.trim() || undefined,
              description: embedDescription.trim() || undefined,
              color: embedColor,
              footerText: embedFooter.trim() || undefined,
              thumbnailUrl: embedThumbnail.trim() || undefined,
            }
          : undefined,
      });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to dispatch message to Discord.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white">Messages & Embeds System</h1>
        <p className="text-xs text-slate-400 mt-1">
          Compose rich embeds and dispatch live messages directly to any channel in your Discord server.
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-950/30 border border-red-800/40 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>Message successfully sent to Discord!</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Form: Builder */}
        <form onSubmit={handleSend} className="p-6 rounded-3xl bg-[#0e1017] border border-white/5 space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="text-slate-300 font-semibold uppercase tracking-wider text-[11px]">Target Channel</label>
            <select
              value={targetChannelId}
              onChange={(e) => setTargetChannelId(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:border-violet-500 focus:outline-none"
            >
              {textChannels.map((c) => (
                <option key={c.id} value={c.id}>
                  #{c.name} {c.type === 5 ? '(Announcement)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-300 font-semibold uppercase tracking-wider text-[11px]">
              Plain Message Content (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Hey everyone, check out this update! @everyone"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:border-violet-500 focus:outline-none"
            />
          </div>

          {/* Embed Toggle */}
          <div className="pt-2 border-t border-white/5">
            <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-300">
              <input
                type="checkbox"
                checked={useEmbed}
                onChange={(e) => setUseEmbed(e.target.checked)}
                className="rounded bg-black/40 border-white/20 text-violet-600 focus:ring-0"
              />
              <span>Attach Rich Embed</span>
            </label>
          </div>

          {useEmbed && (
            <div className="space-y-3.5 pt-2">
              <div className="space-y-1.5">
                <label className="text-slate-400 font-medium">Embed Title</label>
                <input
                  type="text"
                  value={embedTitle}
                  onChange={(e) => setEmbedTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:border-violet-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 font-medium">Embed Description (Markdown supported)</label>
                <textarea
                  rows={4}
                  value={embedDescription}
                  onChange={(e) => setEmbedDescription(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:border-violet-500 focus:outline-none font-mono text-[11px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-slate-400 font-medium">Border Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={embedColor}
                      onChange={(e) => setEmbedColor(e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                    />
                    <input
                      type="text"
                      value={embedColor}
                      onChange={(e) => setEmbedColor(e.target.value)}
                      className="w-full p-2 rounded-lg bg-black/40 border border-white/10 font-mono text-xs uppercase"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-400 font-medium">Thumbnail URL (Optional)</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={embedThumbnail}
                    onChange={(e) => setEmbedThumbnail(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:border-violet-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 font-medium">Footer Text</label>
                <input
                  type="text"
                  value={embedFooter}
                  onChange={(e) => setEmbedFooter(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:border-violet-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          <div className="pt-3 border-t border-white/5 flex justify-end">
            <button
              type="submit"
              disabled={sending}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs shadow-lg shadow-violet-600/30 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {sending ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Dispatching to Discord...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Send to Channel</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Right Preview: Live Discord Chat Simulation */}
        <div className="p-6 rounded-3xl bg-[#0b0c13] border border-white/5 space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-white/5">
            <div className="flex items-center gap-1.5 font-semibold text-slate-300">
              <Eye className="w-3.5 h-3.5 text-violet-400" />
              <span>Live Discord Preview</span>
            </div>
            <span className="font-mono text-[11px] text-slate-500">
              #{textChannels.find((c) => c.id === targetChannelId)?.name || 'channel'}
            </span>
          </div>

          {/* Discord Message Simulator */}
          <div className="p-4 rounded-2xl bg-[#1e1f22] space-y-3 font-sans text-xs shadow-inner">
            {/* Bot message header */}
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-violet-600 flex items-center justify-center font-bold text-white text-xs shadow-sm">
                NOVA
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-xs">NOVA Bot</span>
                  <span className="px-1 py-0.5 rounded bg-[#5865f2] text-white text-[9px] font-bold uppercase tracking-wider">
                    BOT
                  </span>
                  <span className="text-[10px] text-slate-400">Today at 12:00 PM</span>
                </div>
              </div>
            </div>

            {/* Content text */}
            {content && <p className="text-slate-200 text-xs pl-11 whitespace-pre-wrap">{content}</p>}

            {/* Embed container */}
            {useEmbed && (
              <div className="pl-11">
                <div
                  className="p-3.5 rounded-lg bg-[#2b2d31] border-l-4 space-y-2 max-w-lg shadow-sm"
                  style={{ borderLeftColor: embedColor || '#7c3aed' }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1.5">
                      {embedTitle && <h4 className="font-bold text-white text-sm">{embedTitle}</h4>}
                      {embedDescription && (
                        <p className="text-slate-300 text-xs whitespace-pre-wrap leading-relaxed">
                          {embedDescription}
                        </p>
                      )}
                    </div>
                    {embedThumbnail && (
                      <img
                        src={embedThumbnail}
                        alt="Thumbnail"
                        className="w-16 h-16 rounded-lg object-cover shrink-0"
                        onError={(e) => ((e.target as HTMLElement).style.display = 'none')}
                      />
                    )}
                  </div>

                  {embedFooter && (
                    <div className="pt-2 border-t border-white/5 text-[10px] text-slate-400">{embedFooter}</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
