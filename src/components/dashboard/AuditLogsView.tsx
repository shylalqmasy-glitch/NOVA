import React, { useState, useEffect } from 'react';
import {
  ScrollText,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  User,
  Shield,
  Hash,
  Sparkles,
} from 'lucide-react';
import { useGuild } from '../../context/GuildContext';
import { api } from '../../api/client';
import { AuditLogEntry } from '../../types';

export const AuditLogsView: React.FC = () => {
  const { activeGuild } = useGuild();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('ALL');

  const fetchLogs = async () => {
    if (!activeGuild) return;
    try {
      setLoading(true);
      const data = await api.getAuditLogs(activeGuild.id, 100);
      setLogs(data);
    } catch (err: any) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [activeGuild]);

  const filteredLogs = logs.filter((log) => {
    if (filter === 'ALL') return true;
    if (filter === 'AI') return log.action.startsWith('AI_');
    if (filter === 'CHANNELS') return log.action.startsWith('CHANNEL_');
    if (filter === 'ROLES') return log.action.startsWith('ROLE_');
    if (filter === 'MEMBERS') return log.action.startsWith('MEMBER_');
    if (filter === 'MOD') return log.action.includes('WARNING') || log.action.includes('TIMEOUT') || log.action.includes('BAN') || log.action.includes('KICK');
    return true;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Audit Logs & Security Trail</h1>
          <p className="text-xs text-slate-400 mt-1">
            Immutable log of all Discord actions executed through NOVA, including user identity, timestamps, and error traces.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          disabled={loading}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-white/5 text-xs">
        {['ALL', 'AI', 'CHANNELS', 'ROLES', 'MEMBERS', 'MOD'].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-3 py-1.5 rounded-xl font-medium transition-colors ${
              filter === cat
                ? 'bg-violet-600 text-white font-bold'
                : 'bg-white/[0.02] text-slate-400 hover:text-white hover:bg-white/[0.06]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Logs Table */}
      <div className="p-4 rounded-2xl bg-[#0e1017] border border-white/5 space-y-2">
        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-2 py-1 flex items-center justify-between">
          <span>Action & Initiator</span>
          <span>Status & Time</span>
        </div>

        <div className="space-y-1.5">
          {filteredLogs.map((log) => {
            const isSuccess = log.status === 'SUCCESS';

            return (
              <div
                key={log.id}
                className="p-3.5 rounded-xl bg-white/[0.015] hover:bg-white/[0.03] border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs transition-colors"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        log.action.startsWith('AI_')
                          ? 'bg-violet-950/60 text-violet-400 border border-violet-800/40'
                          : log.action.startsWith('CHANNEL_')
                          ? 'bg-indigo-950/60 text-indigo-400 border border-indigo-800/40'
                          : log.action.startsWith('ROLE_')
                          ? 'bg-purple-950/60 text-purple-400 border border-purple-800/40'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {log.action}
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      by <strong className="text-white">{log.userName}</strong>
                    </span>
                    {log.target && (
                      <span className="text-slate-500 font-mono text-[10px] truncate max-w-[120px]">
                        Target: {log.target}
                      </span>
                    )}
                  </div>

                  {/* Details or Error */}
                  {log.details && (
                    <div className="text-[11px] text-slate-400 font-mono truncate max-w-xl">
                      {typeof log.details === 'object' ? JSON.stringify(log.details) : String(log.details)}
                    </div>
                  )}

                  {log.error && (
                    <div className="text-[11px] text-red-400 font-mono bg-red-950/30 p-1.5 rounded-lg border border-red-800/30 mt-1">
                      Error: {log.error}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 self-end md:self-center shrink-0">
                  <div
                    className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                      isSuccess
                        ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
                        : 'bg-red-950/60 text-red-400 border border-red-800/40'
                    }`}
                  >
                    {isSuccess ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                    <span>{log.status}</span>
                  </div>

                  <div className="text-[11px] text-slate-500 font-mono">
                    {new Date(log.timestamp).toLocaleDateString()}{' '}
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          })}

          {filteredLogs.length === 0 && !loading && (
            <div className="p-8 text-center text-slate-500 text-xs">
              No audit logs recorded for this category yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
