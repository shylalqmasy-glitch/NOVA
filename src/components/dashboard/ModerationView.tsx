import React, { useState, useEffect } from 'react';
import {
  Flame,
  AlertTriangle,
  ShieldAlert,
  Clock,
  UserX,
  Ban,
  Plus,
  RefreshCw,
  CheckCircle,
  X,
} from 'lucide-react';
import { useGuild } from '../../context/GuildContext';
import { api } from '../../api/client';
import { WarningEntry } from '../../types';

export const ModerationView: React.FC = () => {
  const { activeGuild, members } = useGuild();
  const [warnings, setWarnings] = useState<WarningEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [showWarnModal, setShowWarnModal] = useState(false);
  const [warnUserId, setWarnUserId] = useState('');
  const [warnReason, setWarnReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Auto-mod toggles (stored in state / DB)
  const [antiSpam, setAntiSpam] = useState(true);
  const [massMention, setMassMention] = useState(true);
  const [profanityFilter, setProfanityFilter] = useState(true);

  const fetchWarnings = async () => {
    if (!activeGuild) return;
    try {
      setLoading(true);
      const data = await api.getWarnings(activeGuild.id);
      setWarnings(data);
    } catch (err: any) {
      console.error('Failed to load warnings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarnings();
  }, [activeGuild]);

  const handleIssueWarning = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGuild) return;
    if (!warnUserId || !warnReason.trim()) {
      setError('Both Member ID and Warning Reason are required.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await api.addWarning(activeGuild.id, warnUserId, warnReason.trim());
      setShowWarnModal(false);
      setWarnUserId('');
      setWarnReason('');
      setSuccess('Official warning issued and logged to audit trail.');
      await fetchWarnings();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to issue warning.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Moderation & Enforcement</h1>
          <p className="text-xs text-slate-400 mt-1">
            Enforce server safety with official member warnings, automated protections, and disciplinary actions.
          </p>
        </div>

        <button
          onClick={() => setShowWarnModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-black font-bold text-xs shadow-lg shadow-amber-600/20 transition-all active:scale-95 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Issue Warning</span>
        </button>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-950/30 border border-red-800/40 text-red-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{success}</span>
        </div>
      )}

      {/* Auto-Moderation Shield Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-[#0e1017] border border-white/5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-white text-xs">Anti-Spam Shield</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={antiSpam}
                onChange={(e) => setAntiSpam(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-violet-600"></div>
            </label>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            Rate-limits rapid message floods and automatically times out malicious raiders.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[#0e1017] border border-white/5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-white text-xs">Mass @Mention Filter</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={massMention}
                onChange={(e) => setMassMention(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-violet-600"></div>
            </label>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            Blocks unauthorized @everyone and @here pings, deleting the message and alerting moderators.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[#0e1017] border border-white/5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-white text-xs">Toxicity & Slur Filter</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={profanityFilter}
                onChange={(e) => setProfanityFilter(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-violet-600"></div>
            </label>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            Filters out harmful words, slurs, and discord phishing links from public chat channels.
          </p>
        </div>
      </div>

      {/* Warnings History Table */}
      <div className="p-4 rounded-2xl bg-[#0e1017] border border-white/5 space-y-3">
        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-2 py-1 flex items-center justify-between">
          <span>Official Warnings Log ({warnings.length})</span>
          <span>Logged by Moderator</span>
        </div>

        <div className="space-y-1.5">
          {warnings.map((w) => (
            <div
              key={w.id}
              className="p-3.5 rounded-xl bg-white/[0.015] border border-white/5 flex items-center justify-between text-xs"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-amber-950/60 text-amber-400 border border-amber-800/40 text-[10px] font-bold">
                    WARNING
                  </span>
                  <span className="font-mono text-white text-xs font-semibold">User ID: {w.userId}</span>
                </div>
                <p className="text-slate-300 text-xs">{w.reason}</p>
              </div>

              <div className="text-right text-[11px] text-slate-500 shrink-0">
                <div className="text-slate-300 font-medium">by {w.moderatorName}</div>
                <div>{new Date(w.timestamp).toLocaleDateString()} {new Date(w.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
              </div>
            </div>
          ))}

          {warnings.length === 0 && !loading && (
            <div className="p-8 text-center text-slate-500 text-xs">
              No active warnings on record for this server.
            </div>
          )}
        </div>
      </div>

      {/* Modal: Issue Warning */}
      {showWarnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#0e1017] border border-amber-900/40 rounded-2xl shadow-2xl p-6 text-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <h3 className="font-bold text-white text-base">Issue Official Warning</h3>
              <button onClick={() => setShowWarnModal(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleIssueWarning} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-400 font-medium">Target Member</label>
                <select
                  value={warnUserId}
                  onChange={(e) => setWarnUserId(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:border-amber-500 focus:outline-none"
                >
                  <option value="">Select a member or type ID below</option>
                  {members.map((m) => (
                    <option key={m.user.id} value={m.user.id}>
                      {m.user.username} ({m.user.id})
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Or enter Discord User ID manually"
                  value={warnUserId}
                  onChange={(e) => setWarnUserId(e.target.value)}
                  className="w-full p-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs font-mono mt-1"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 font-medium">Reason for Warning</label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Inappropriate language in general chat after verbal warning"
                  value={warnReason}
                  onChange={(e) => setWarnReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowWarnModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-black font-bold flex items-center gap-1.5"
                >
                  {submitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Issue Warning</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
