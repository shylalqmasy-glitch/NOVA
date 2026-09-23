import React, { useState } from 'react';
import {
  SearchCode,
  ShieldAlert,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Wrench,
  Check,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { useGuild } from '../../context/GuildContext';
import { api } from '../../api/client';
import { ServerAuditOptimization } from '../../types';

export const AiOptimizerView: React.FC = () => {
  const { activeGuild, refreshActiveGuildData } = useGuild();
  const [scanning, setScanning] = useState(false);
  const [audit, setAudit] = useState<ServerAuditOptimization | null>(null);
  const [applyingActionId, setApplyingActionId] = useState<string | null>(null);
  const [appliedActionIds, setAppliedActionIds] = useState<string[]>([]);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRunAudit = async () => {
    if (!activeGuild) return;

    try {
      setScanning(true);
      setError(null);
      setActionSuccessMsg(null);
      const res = await api.runServerAudit(activeGuild.id);
      setAudit(res);
    } catch (err: any) {
      setError(err.message || 'Audit scan failed. Please verify bot is in server.');
    } finally {
      setScanning(false);
    }
  };

  const handleApplyAction = async (action: any) => {
    if (!activeGuild) return;

    try {
      setApplyingActionId(action.id);
      setError(null);
      const res = await api.applyAuditAction(activeGuild.id, action);
      setAppliedActionIds((prev) => [...prev, action.id]);
      setActionSuccessMsg(res.message);
      await refreshActiveGuildData();
    } catch (err: any) {
      setError(err.message || 'Failed to apply action on Discord.');
    } finally {
      setApplyingActionId(null);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-950/60 border border-violet-800/40 text-violet-400 text-xs font-semibold">
            <SearchCode className="w-3.5 h-3.5" />
            <span>AI Diagnostic Engine</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white">Server Auditor & Optimizer</h1>
          <p className="text-slate-400 text-sm">
            Analyzes existing channels, roles, permission overwrites, and role hierarchies to identify vulnerabilities
            and architectural gaps.
          </p>
        </div>

        <button
          onClick={handleRunAudit}
          disabled={scanning}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-violet-600/30 transition-all active:scale-95 disabled:opacity-50 shrink-0 cursor-pointer"
        >
          {scanning ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Scanning Discord Server...</span>
            </>
          ) : (
            <>
              <SearchCode className="w-4 h-4" />
              <span>{audit ? 'Re-run Audit' : 'Run Deep Audit'}</span>
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-950/30 border border-red-800/40 text-red-300 text-xs flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {actionSuccessMsg && (
        <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-800/40 text-emerald-300 text-xs flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {!audit && !scanning && (
        <div className="p-12 text-center rounded-3xl bg-[#0e1017] border border-white/5 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-violet-600/20 text-violet-400 mx-auto flex items-center justify-center">
            <SearchCode className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">No Audit Executed Yet</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Click <strong>Run Deep Audit</strong> to let NOVA inspect your Discord server's permission layers, role
            hierarchy, channel categorization, and moderation safeguards.
          </p>
        </div>
      )}

      {/* Audit Results */}
      {audit && (
        <div className="space-y-6">
          {/* Health Score Card */}
          <div className="p-6 rounded-3xl bg-[#0e1017] border border-white/10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
            <div className="flex items-center gap-6">
              <div
                className={`w-24 h-24 rounded-full border-4 flex flex-col items-center justify-center font-black ${
                  audit.healthScore >= 80
                    ? 'border-emerald-500 text-emerald-400 shadow-lg shadow-emerald-500/20'
                    : audit.healthScore >= 50
                    ? 'border-amber-500 text-amber-400 shadow-lg shadow-amber-500/20'
                    : 'border-red-500 text-red-400 shadow-lg shadow-red-500/20'
                }`}
              >
                <span className="text-3xl leading-none">{audit.healthScore}</span>
                <span className="text-[10px] font-sans uppercase font-bold text-slate-400 mt-1">/ 100</span>
              </div>
              <div className="space-y-1">
                <div className="text-lg font-bold text-white">
                  Server Architecture Rating:{' '}
                  <span
                    className={
                      audit.healthScore >= 80
                        ? 'text-emerald-400'
                        : audit.healthScore >= 50
                        ? 'text-amber-400'
                        : 'text-red-400'
                    }
                  >
                    {audit.healthScore >= 80 ? 'Robust' : audit.healthScore >= 50 ? 'Needs Attention' : 'Vulnerable'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 max-w-xl">{audit.assessmentSummary}</p>
              </div>
            </div>
          </div>

          {/* Critical Findings */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Diagnostic Findings ({audit.criticalIssues.length})
            </h3>
            <div className="space-y-2.5">
              {audit.criticalIssues.map((issue, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          issue.severity === 'CRITICAL'
                            ? 'bg-red-950/60 text-red-400 border border-red-800/40'
                            : issue.severity === 'WARNING'
                            ? 'bg-amber-950/60 text-amber-400 border border-amber-800/40'
                            : 'bg-blue-950/60 text-blue-400 border border-blue-800/40'
                        }`}
                      >
                        {issue.severity}
                      </span>
                      <span className="font-semibold text-white">{issue.area}: {issue.issue}</span>
                    </div>
                  </div>
                  <div className="text-slate-400 text-[11px] leading-relaxed">
                    <strong className="text-slate-300">Impact:</strong> {issue.impact}
                  </div>
                  <div className="text-violet-300 text-[11px] leading-relaxed">
                    <strong className="text-violet-400">Remediation:</strong> {issue.remediation}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actionable Fixes */}
          {audit.recommendedActions.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Automated 1-Click Fixes
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {audit.recommendedActions.map((act) => {
                  const isApplied = appliedActionIds.includes(act.id);
                  const isApplying = applyingActionId === act.id;

                  return (
                    <div
                      key={act.id}
                      className="p-4 rounded-2xl bg-[#0e1017] border border-white/5 flex flex-col justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="font-bold text-white flex items-center gap-2">
                          <Wrench className="w-3.5 h-3.5 text-violet-400" />
                          <span>{act.title}</span>
                        </div>
                        <p className="text-slate-400 text-[11px] leading-relaxed">{act.description}</p>
                      </div>

                      <div className="flex justify-end pt-2 border-t border-white/5">
                        <button
                          onClick={() => handleApplyAction(act)}
                          disabled={isApplied || isApplying}
                          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl font-semibold text-xs transition-colors ${
                            isApplied
                              ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/40 cursor-default'
                              : 'bg-violet-600 hover:bg-violet-500 text-white cursor-pointer active:scale-95'
                          }`}
                        >
                          {isApplied ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Applied on Discord</span>
                            </>
                          ) : isApplying ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Applying...</span>
                            </>
                          ) : (
                            <>
                              <Wrench className="w-3.5 h-3.5" />
                              <span>Apply Fix to Discord</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
