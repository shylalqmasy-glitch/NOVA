import React, { useState } from 'react';
import {
  Sparkles,
  Bot,
  Play,
  CheckCircle,
  AlertCircle,
  Layers,
  Shield,
  Hash,
  Volume2,
  Bell,
  Trash2,
  RefreshCw,
  ArrowRight,
  Edit2,
  Check,
} from 'lucide-react';
import { useGuild } from '../../context/GuildContext';
import { api } from '../../api/client';
import { ServerArchitecturePlan, ProposedRole, ProposedCategory } from '../../types';

export const AiBuilderView: React.FC = () => {
  const { activeGuild, overview, refreshActiveGuildData } = useGuild();
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [plan, setPlan] = useState<ServerArchitecturePlan | null>(null);
  const [executing, setExecuting] = useState(false);
  const [executionPhase, setExecutionPhase] = useState<string | null>(null);
  const [executionResult, setExecutionResult] = useState<{
    success: boolean;
    rolesCreated: number;
    channelsCreated: number;
    executionLog: Array<{ step: string; status: 'SUCCESS' | 'FAILED' | 'SKIPPED'; detail: string }>;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const presets = [
    {
      title: 'Esports & Competitive Team',
      text: 'أريد سيرفر NOVA احترافي لفريق Esports تنافسي، أقسام للإدارة، اللاعبين الأساسيين، البدلاء، صناع المحتوى، مواعيد البطولات والتذاكر والمجتمع العام.',
    },
    {
      title: 'Software & Tech Community',
      text: 'Community server for software developers: announcements, general discussion, frontend, backend, AI/ML, code review, show-and-tell, bug reports, and job opportunities.',
    },
    {
      title: 'Content Creator & Streaming',
      text: 'VIP community for streamer: announcement drops, live streams notification, VIP chat, gaming lobbies, fan art, clips, and sponsor announcements.',
    },
    {
      title: 'Study & Educational Academy',
      text: 'Academic server with instructors, teaching assistants, lecture halls, study rooms, resource library, homework help, and student lounge.',
    },
  ];

  const handleGeneratePlan = async () => {
    if (!activeGuild) return;
    if (!prompt.trim() || prompt.trim().length < 5) {
      setError('Please enter a detailed description for your Discord server architecture.');
      return;
    }

    try {
      setGenerating(true);
      setError(null);
      setPlan(null);
      setExecutionResult(null);

      const generatedPlan = await api.generateAiPlan(activeGuild.id, prompt);
      setPlan(generatedPlan);
    } catch (err: any) {
      setError(err.message || 'Failed to generate AI plan. Please check server connection.');
    } finally {
      setGenerating(false);
    }
  };

  const handleExecutePlan = async () => {
    if (!activeGuild || !plan) return;

    try {
      setExecuting(true);
      setError(null);
      setExecutionPhase('Initializing Discord REST v10 connection...');

      const result = await api.executeAiPlan(activeGuild.id, plan);
      setExecutionResult(result);
      setExecutionPhase('Architecture successfully deployed to Discord!');

      // Refresh guild channels and roles
      await refreshActiveGuildData();
    } catch (err: any) {
      setError(err.message || 'Execution error during Discord API calls.');
    } finally {
      setExecuting(false);
    }
  };

  // Allow deleting a proposed role before execution
  const handleDeleteProposedRole = (roleIndex: number) => {
    if (!plan) return;
    const newRoles = [...plan.roles];
    newRoles.splice(roleIndex, 1);
    setPlan({ ...plan, roles: newRoles });
  };

  // Allow deleting a proposed channel before execution
  const handleDeleteProposedChannel = (catIndex: number, chIndex: number) => {
    if (!plan) return;
    const newCats = [...plan.categories];
    newCats[catIndex].channels.splice(chIndex, 1);
    setPlan({ ...plan, categories: newCats });
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-950/60 border border-violet-800/40 text-violet-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Autonomous Discord Server Architect</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white">AI Server Builder</h1>
        <p className="text-slate-400 text-sm">
          Describe the purpose and audience of your server. NOVA's AI will generate roles, category groups, channels,
          and permissions, then execute the deployment directly on your live Discord server.
        </p>
      </div>

      {/* Prompt Input Box */}
      <div className="p-6 rounded-3xl bg-[#0e1017] border border-white/10 space-y-4 shadow-xl">
        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
          Server Description & Requirements
        </label>
        <textarea
          rows={4}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g. أريد سيرفر NOVA لفريق Esports، قسم للإدارة، اللاعبين، المحتوى، المجتمع، البطولات، الدعم والتذاكر..."
          className="w-full p-4 rounded-2xl bg-black/40 border border-white/10 text-white text-sm focus:border-violet-500 focus:outline-none placeholder:text-slate-600 transition-colors"
        />

        {/* Quick Presets */}
        <div className="space-y-2">
          <span className="text-[11px] text-slate-500 font-medium">Quick Architect Presets:</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {presets.map((p, idx) => (
              <button
                key={idx}
                onClick={() => setPrompt(p.text)}
                className="p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 text-left text-xs transition-colors group"
              >
                <div className="font-semibold text-slate-300 group-hover:text-violet-400">{p.title}</div>
                <div className="text-[11px] text-slate-500 truncate mt-0.5">{p.text}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-3.5 rounded-xl bg-red-950/30 border border-red-800/40 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Generate Button */}
        <div className="flex justify-end pt-2">
          <button
            onClick={handleGeneratePlan}
            disabled={generating || executing}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-violet-600/30 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {generating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Architecting Server with AI...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Architecture Plan</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Proposed Plan Review & Approval */}
      {plan && (
        <div className="space-y-6 p-6 rounded-3xl bg-[#0e1017] border border-violet-900/40 shadow-2xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-white/5 gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white">{plan.projectName}</h2>
                <span className="px-2 py-0.5 rounded bg-violet-600/20 text-violet-300 border border-violet-500/30 text-[10px] font-bold">
                  PROPOSED PLAN
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-xl">{plan.overview}</p>
            </div>

            <button
              onClick={handleExecutePlan}
              disabled={executing}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {executing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Executing on Discord...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>Approve & Execute Architecture</span>
                </>
              )}
            </button>
          </div>

          {/* Execution Progress Bar */}
          {executing && (
            <div className="p-4 rounded-2xl bg-violet-950/40 border border-violet-800/40 space-y-2 text-xs">
              <div className="flex items-center justify-between text-violet-300 font-semibold">
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>{executionPhase}</span>
                </span>
                <span>Live Discord REST Sync</span>
              </div>
              <div className="w-full bg-black/40 h-2 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-violet-500 to-emerald-400 h-full rounded-full animate-pulse w-3/4" />
              </div>
            </div>
          )}

          {/* Execution Results Feedback */}
          {executionResult && (
            <div className="p-5 rounded-2xl bg-emerald-950/30 border border-emerald-800/40 space-y-3 text-xs">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <CheckCircle className="w-5 h-5" />
                <span>Architecture Executed Successfully!</span>
              </div>
              <div className="flex items-center gap-6 text-slate-300">
                <span>Roles Created: <strong>{executionResult.rolesCreated}</strong></span>
                <span>Channels & Categories Created: <strong>{executionResult.channelsCreated}</strong></span>
              </div>

              {/* Execution Steps Log */}
              <div className="mt-3 max-h-48 overflow-y-auto space-y-1.5 p-3 rounded-xl bg-black/50 border border-white/5 font-mono text-[11px]">
                {executionResult.executionLog.map((log, idx) => (
                  <div key={idx} className="flex items-center justify-between text-slate-300">
                    <span className="truncate mr-2">{log.step}</span>
                    <span
                      className={`shrink-0 font-bold ${
                        log.status === 'SUCCESS' ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      [{log.status}] {log.detail}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 1: Proposed Roles */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Shield className="w-4 h-4 text-violet-400" />
              <span>Proposed Discord Roles ({plan.roles.length})</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {plan.roles.map((r, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between group hover:border-white/10 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: r.colorHex || '#7c3aed' }}
                    />
                    <div className="truncate">
                      <div className="font-bold text-xs text-white truncate">{r.name}</div>
                      <div className="text-[10px] text-slate-500 truncate">{r.description}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteProposedRole(i)}
                    className="p-1 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove from plan"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Proposed Categories & Channels */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              <span>Proposed Categories & Channels</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {plan.categories.map((cat, catIdx) => (
                <div key={catIdx} className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
                  <div className="font-bold text-xs text-violet-300 uppercase tracking-wider flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5 text-violet-400" />
                    <span>{cat.name}</span>
                  </div>

                  <div className="space-y-1.5">
                    {cat.channels.map((ch, chIdx) => (
                      <div
                        key={chIdx}
                        className="p-2 rounded-lg bg-black/30 border border-white/5 flex items-center justify-between text-xs text-slate-300 group"
                      >
                        <div className="flex items-center gap-2 truncate">
                          {ch.type === 'voice' ? (
                            <Volume2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          ) : ch.type === 'announcement' ? (
                            <Bell className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          ) : (
                            <Hash className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          )}
                          <span className="font-medium text-slate-200 truncate">{ch.name}</span>
                          <span className="text-[10px] text-slate-500 truncate hidden sm:inline">- {ch.topic}</span>
                        </div>
                        <button
                          onClick={() => handleDeleteProposedChannel(catIdx, chIdx)}
                          className="p-1 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Proposed Welcome System */}
          {plan.welcomeSystem && (
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Automated Welcome & Rules Embed
              </h3>
              <div className="p-4 rounded-xl bg-violet-950/20 border-l-4 border-violet-500 space-y-2 text-xs">
                <div className="font-bold text-white text-sm">{plan.welcomeSystem.title}</div>
                <p className="text-slate-300 text-xs">{plan.welcomeSystem.description}</p>
                <div className="pt-2 border-t border-white/5 space-y-1 text-slate-400">
                  <span className="font-semibold text-slate-300">Rules Summary:</span>
                  {plan.welcomeSystem.rulesSummary.map((r, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-[11px]">
                      <span className="text-violet-400">•</span>
                      <span>{r}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
