import React, { useState, useEffect } from 'react';
import {
  PartyPopper,
  Save,
  Send,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Hash,
  Shield,
  Palette,
} from 'lucide-react';
import { useGuild } from '../../context/GuildContext';
import { api } from '../../api/client';
import { WelcomeConfig } from '../../types';

export const WelcomeView: React.FC = () => {
  const { activeGuild, channels, roles } = useGuild();
  const textChannels = channels.filter((c) => c.type === 0 || c.type === 5);
  const assignableRoles = roles.filter((r) => r.name !== '@everyone' && !r.managed);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [config, setConfig] = useState<WelcomeConfig>({
    enabled: true,
    channelId: textChannels[0]?.id || '',
    joinRoleId: '',
    messageText: 'Welcome {user} to {server}! You are member #{member_count}.',
    embed: {
      enabled: true,
      title: 'Welcome to {server}!',
      description: 'Make sure to read the rules in the rules channel and introduce yourself!',
      color: '#7c3aed',
      footerText: 'Powered by NOVA Welcome Engine',
    },
  });

  useEffect(() => {
    if (!activeGuild) return;
    const fetchConfig = async () => {
      try {
        setLoading(true);
        const data = await api.getWelcomeConfig(activeGuild.id);
        if (data) {
          setConfig(data);
        }
      } catch (err: any) {
        console.error('Failed to load welcome config:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, [activeGuild]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGuild) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      await api.updateWelcomeConfig(activeGuild.id, config);
      setSuccess('Welcome configuration saved successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save welcome configuration.');
    } finally {
      setSaving(false);
    }
  };

  const handleTestDispatch = async () => {
    if (!activeGuild) return;
    if (!config.channelId) {
      setError('Please select a welcome channel and save settings first.');
      return;
    }

    try {
      setTesting(true);
      setError(null);
      setSuccess(null);
      await api.testWelcomeMessage(activeGuild.id);
      setSuccess('Test welcome message delivered live to your Discord channel!');
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Test message failed to deliver.');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Welcome System & Join Role</h1>
          <p className="text-xs text-slate-400 mt-1">
            Greet new members automatically, grant an onboarding role, and dispatch rich welcome embeds.
          </p>
        </div>

        <button
          type="button"
          onClick={handleTestDispatch}
          disabled={testing || !config.enabled}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-slate-200 text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
        >
          {testing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5 text-violet-400" />}
          <span>Send Test Message to Discord</span>
        </button>
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
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="p-6 rounded-3xl bg-[#0e1017] border border-white/5 space-y-6 text-xs">
        {/* Enable Toggle */}
        <div className="flex items-center justify-between pb-4 border-b border-white/5">
          <div>
            <h3 className="text-sm font-bold text-white">Enable Welcome Engine</h3>
            <p className="text-slate-400 text-xs">Automatically triggers when a new user joins your Discord server.</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600"></div>
          </label>
        </div>

        {/* Channel & Role Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-slate-300 font-semibold flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-violet-400" />
              <span>Welcome Channel</span>
            </label>
            <select
              value={config.channelId || ''}
              onChange={(e) => setConfig({ ...config, channelId: e.target.value })}
              className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:border-violet-500 focus:outline-none"
            >
              <option value="">Select a channel</option>
              {textChannels.map((c) => (
                <option key={c.id} value={c.id}>
                  #{c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-300 font-semibold flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-purple-400" />
              <span>Auto Join Role (Given on Join)</span>
            </label>
            <select
              value={config.joinRoleId || ''}
              onChange={(e) => setConfig({ ...config, joinRoleId: e.target.value })}
              className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:border-violet-500 focus:outline-none"
            >
              <option value="">No automatic role</option>
              {assignableRoles.map((r) => (
                <option key={r.id} value={r.id}>
                  @{r.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Message Content */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-slate-300 font-semibold">Message Text</label>
            <span className="text-[10px] text-slate-500 font-mono">
              Tags: {'{user}'}, {'{username}'}, {'{server}'}, {'{member_count}'}
            </span>
          </div>
          <textarea
            rows={2}
            value={config.messageText}
            onChange={(e) => setConfig({ ...config, messageText: e.target.value })}
            className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:border-violet-500 focus:outline-none font-sans"
          />
        </div>

        {/* Rich Embed Section */}
        <div className="p-4 rounded-2xl bg-white/[0.015] border border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-white text-xs">Rich Welcome Embed</h4>
            <label className="flex items-center gap-2 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={config.embed.enabled}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    embed: { ...config.embed, enabled: e.target.checked },
                  })
                }
                className="rounded bg-black/40 border-white/20 text-violet-600 focus:ring-0"
              />
              <span className="text-slate-300">Include Embed</span>
            </label>
          </div>

          {config.embed.enabled && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-slate-400 font-medium">Embed Title</label>
                <input
                  type="text"
                  value={config.embed.title}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      embed: { ...config.embed, title: e.target.value },
                    })
                  }
                  className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:border-violet-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 font-medium">Embed Description</label>
                <textarea
                  rows={3}
                  value={config.embed.description}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      embed: { ...config.embed, description: e.target.value },
                    })
                  }
                  className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:border-violet-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-slate-400 font-medium">Embed Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={config.embed.color || '#7c3aed'}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          embed: { ...config.embed, color: e.target.value },
                        })
                      }
                      className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                    />
                    <input
                      type="text"
                      value={config.embed.color || '#7c3aed'}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          embed: { ...config.embed, color: e.target.value },
                        })
                      }
                      className="w-full p-2 rounded-lg bg-black/40 border border-white/10 font-mono text-xs uppercase"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-400 font-medium">Footer Text</label>
                  <input
                    type="text"
                    value={config.embed.footerText || ''}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        embed: { ...config.embed, footerText: e.target.value },
                      })
                    }
                    className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:border-violet-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-white/5 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs shadow-lg shadow-violet-600/30 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>Save Welcome Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
};
