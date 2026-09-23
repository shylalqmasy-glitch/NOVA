import React, { useState, useEffect } from 'react';
import {
  Zap,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Power,
  ArrowRight,
  Shield,
  MessageSquare,
  X,
} from 'lucide-react';
import { useGuild } from '../../context/GuildContext';
import { api } from '../../api/client';
import { AutomationRule } from '../../types';

export const AutomationView: React.FC = () => {
  const { activeGuild, channels, roles } = useGuild();
  const textChannels = channels.filter((c) => c.type === 0 || c.type === 5);
  const assignableRoles = roles.filter((r) => r.name !== '@everyone' && !r.managed);

  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [trigger, setTrigger] = useState<'ON_MEMBER_JOIN' | 'ON_MESSAGE_CONTAINING_KEYWORD'>('ON_MEMBER_JOIN');
  const [keyword, setKeyword] = useState('');
  const [actionType, setActionType] = useState<'ASSIGN_ROLE' | 'SEND_MESSAGE'>('ASSIGN_ROLE');
  const [actionRoleId, setActionRoleId] = useState('');
  const [actionChannelId, setActionChannelId] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRules = async () => {
    if (!activeGuild) return;
    try {
      setLoading(true);
      const data = await api.getAutomations(activeGuild.id);
      setRules(data);
    } catch (err: any) {
      console.error('Failed to load automations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, [activeGuild]);

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGuild) return;
    if (!name.trim()) {
      setError('Rule name is required.');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const actionConfig: any = {};
      if (actionType === 'ASSIGN_ROLE') {
        actionConfig.roleId = actionRoleId || assignableRoles[0]?.id;
      } else {
        actionConfig.channelId = actionChannelId || textChannels[0]?.id;
        actionConfig.message = actionMessage || 'Automated response dispatched.';
      }

      await api.createAutomation(activeGuild.id, {
        name: name.trim(),
        enabled: true,
        trigger,
        triggerConfig: { keyword: trigger === 'ON_MESSAGE_CONTAINING_KEYWORD' ? keyword : undefined },
        actions: [
          {
            type: actionType,
            config: actionConfig,
          },
        ],
      });

      setShowModal(false);
      setName('');
      setKeyword('');
      setActionMessage('');
      await fetchRules();
    } catch (err: any) {
      setError(err.message || 'Failed to create automation rule.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (rule: AutomationRule) => {
    if (!activeGuild) return;
    try {
      await api.updateAutomation(activeGuild.id, rule.id, { enabled: !rule.enabled });
      await fetchRules();
    } catch (err: any) {
      setError(err.message || 'Failed to toggle rule.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!activeGuild) return;
    try {
      await api.deleteAutomation(activeGuild.id, id);
      await fetchRules();
    } catch (err: any) {
      setError(err.message || 'Failed to delete rule.');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Event Automations & Workflows</h1>
          <p className="text-xs text-slate-400 mt-1">
            Build event-driven rules: trigger on member joins or keywords, then auto-assign roles or dispatch actions.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs shadow-lg shadow-violet-600/30 transition-all active:scale-95 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Workflow Rule</span>
        </button>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-950/30 border border-red-800/40 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Rules Grid */}
      <div className="space-y-3">
        {rules.map((rule) => (
          <div
            key={rule.id}
            className="p-4 rounded-2xl bg-[#0e1017] border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm">{rule.name}</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    rule.enabled
                      ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {rule.enabled ? 'ACTIVE' : 'PAUSED'}
                </span>
              </div>

              {/* Trigger -> Action Flow */}
              <div className="flex items-center gap-2 text-slate-300 font-mono text-[11px]">
                <div className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 flex items-center gap-1.5">
                  <Zap className="w-3 h-3 text-amber-400" />
                  <span>
                    WHEN:{' '}
                    {rule.trigger === 'ON_MEMBER_JOIN'
                      ? 'Member Joins'
                      : `Keyword "${rule.triggerConfig.keyword || ''}"`}
                  </span>
                </div>
                <ArrowRight className="w-3 h-3 text-slate-500" />
                <div className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 flex items-center gap-1.5">
                  <Shield className="w-3 h-3 text-violet-400" />
                  <span>
                    THEN: {rule.actions[0]?.type === 'ASSIGN_ROLE' ? 'Assign Role' : 'Send Message'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                onClick={() => handleToggle(rule)}
                className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  rule.enabled
                    ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40 hover:bg-emerald-900/40'
                    : 'bg-white/5 text-slate-400 border-white/5 hover:text-white'
                }`}
                title={rule.enabled ? 'Pause Rule' : 'Activate Rule'}
              >
                <Power className="w-3.5 h-3.5" />
                <span>{rule.enabled ? 'Enabled' : 'Disabled'}</span>
              </button>

              <button
                onClick={() => handleDelete(rule.id)}
                className="p-2 rounded-xl bg-white/5 hover:bg-red-950/40 text-slate-400 hover:text-red-400 border border-white/5 hover:border-red-800/40 transition-colors"
                title="Delete Rule"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}

        {rules.length === 0 && !loading && (
          <div className="p-12 text-center text-slate-500 text-xs rounded-2xl bg-[#0e1017] border border-white/5 space-y-2">
            <div>No custom automation workflows configured yet.</div>
            <p className="text-[11px] text-slate-600">
              Click <strong>New Workflow Rule</strong> or use the AI Builder to generate automations automatically.
            </p>
          </div>
        )}
      </div>

      {/* Modal: Create Workflow Rule */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#0e1017] border border-violet-900/40 rounded-2xl shadow-2xl p-6 text-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <h3 className="font-bold text-white text-base">New Automation Workflow</h3>
              <button onClick={() => setShowModal(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRule} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-400 font-medium">Workflow Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Auto-Verify New Members"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:border-violet-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 font-medium">Trigger Condition (WHEN)</label>
                <select
                  value={trigger}
                  onChange={(e) => setTrigger(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:border-violet-500 focus:outline-none"
                >
                  <option value="ON_MEMBER_JOIN">When a new member joins the server</option>
                  <option value="ON_MESSAGE_CONTAINING_KEYWORD">When a message contains a specific keyword</option>
                </select>
              </div>

              {trigger === 'ON_MESSAGE_CONTAINING_KEYWORD' && (
                <div className="space-y-1.5">
                  <label className="text-slate-400 font-medium">Target Keyword / Phrase</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. !help, !rules, support"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:border-violet-500 focus:outline-none"
                  />
                </div>
              )}

              <div className="space-y-1.5 pt-2 border-t border-white/5">
                <label className="text-slate-400 font-medium">Execute Action (THEN)</label>
                <select
                  value={actionType}
                  onChange={(e) => setActionType(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:border-violet-500 focus:outline-none"
                >
                  <option value="ASSIGN_ROLE">Assign a role to the user</option>
                  <option value="SEND_MESSAGE">Send an automated message to a channel</option>
                </select>
              </div>

              {actionType === 'ASSIGN_ROLE' ? (
                <div className="space-y-1.5">
                  <label className="text-slate-400 font-medium">Role to Assign</label>
                  <select
                    value={actionRoleId}
                    onChange={(e) => setActionRoleId(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:border-violet-500 focus:outline-none"
                  >
                    {assignableRoles.map((r) => (
                      <option key={r.id} value={r.id}>
                        @{r.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-medium">Channel</label>
                    <select
                      value={actionChannelId}
                      onChange={(e) => setActionChannelId(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:border-violet-500 focus:outline-none"
                    >
                      {textChannels.map((c) => (
                        <option key={c.id} value={c.id}>
                          #{c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-medium">Message Content</label>
                    <textarea
                      rows={2}
                      value={actionMessage}
                      onChange={(e) => setActionMessage(e.target.value)}
                      placeholder="Welcome to our server! Check #rules."
                      className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:border-violet-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
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
                  <span>Save Workflow</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
