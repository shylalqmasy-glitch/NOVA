import React, { useState } from 'react';
import {
  Sparkles,
  Bot,
  Shield,
  Layers,
  Zap,
  ArrowRight,
  CheckCircle2,
  Lock,
  Workflow,
  Server,
  Key,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { SetupGuideModal } from '../modals/SetupGuideModal';

export const LandingPage: React.FC = () => {
  const { loginWithDiscord, systemStatus } = useAuth();
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const handleConnect = async () => {
    try {
      setConnecting(true);
      await loginWithDiscord();
    } catch (err: any) {
      alert(`Could not start Discord login: ${err.message}. Please verify your Discord Client ID in setup.`);
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090a0f] text-slate-100 flex flex-col selection:bg-purple-600 selection:text-white">
      {/* Top Bar */}
      <header className="h-20 border-b border-white/5 px-8 max-w-7xl mx-auto w-full flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 to-purple-500 p-[1px] shadow-lg shadow-violet-600/30 flex items-center justify-center">
            <div className="w-full h-full bg-[#090a0f] rounded-2xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-violet-400" />
            </div>
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-wider text-white">NOVA</span>
            <span className="text-xs text-slate-400 block -mt-1 font-medium">AI Discord Architect</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowSetupModal(true)}
            className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 text-xs text-slate-300 transition-colors"
          >
            <Key className="w-3.5 h-3.5 text-violet-400" />
            <span>Setup Credentials</span>
          </button>

          <button
            onClick={handleConnect}
            disabled={connecting}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-violet-600/25 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <Bot className="w-4 h-4" />
            <span>{connecting ? 'Connecting...' : 'Connect Discord'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-6 pt-20 pb-28 max-w-6xl mx-auto text-center flex flex-col items-center">
        {/* Subtle Violet Radial Glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-violet-600/10 blur-[130px] rounded-full pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-950/60 border border-violet-800/40 text-violet-300 text-xs font-medium mb-8">
          <Sparkles className="w-3.5 h-3.5 text-violet-400" />
          <span>Production-Grade Autonomous Discord Server Engineering</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-4xl leading-[1.1] mb-6">
          Architect Real Discord Servers with{' '}
          <span className="bg-gradient-to-r from-violet-400 via-purple-300 to-indigo-300 bg-clip-text text-transparent">
            Autonomous AI
          </span>
        </h1>

        <p className="text-slate-400 text-base sm:text-lg max-w-2xl leading-relaxed mb-10">
          Transform a simple prompt into an enterprise-grade Discord community. Real role hierarchies, categorized
          channels, locked permission overwrites, welcome embeds, and automated workflows directly executed on your server.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <button
            onClick={handleConnect}
            disabled={connecting}
            className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-bold text-sm shadow-xl shadow-violet-600/30 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <Bot className="w-4 h-4" />
            <span>Launch NOVA Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowSetupModal(true)}
            className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-slate-300 font-semibold text-sm transition-colors"
          >
            Configuration & Credentials Guide
          </button>
        </div>

        {/* Live Architecture Flow Visualization */}
        <div className="w-full mt-20 p-6 rounded-3xl bg-[#0e1017] border border-white/10 shadow-2xl text-left relative overflow-hidden">
          <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="text-xs text-slate-500 font-mono ml-2">nova-architecture-pipeline.sh</span>
            </div>
            <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Real REST v10 Sync
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
              <div className="text-violet-400 font-bold">1. User Brief</div>
              <p className="text-slate-400 text-[11px]">"Professional Esports team with Player rosters, Match schedules, Sponsor hub & Ticket support"</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
              <div className="text-violet-400 font-bold">2. Gemini 3.8 Flash</div>
              <p className="text-slate-400 text-[11px]">Generates complete JSON schema with 8 roles, 6 categories, 22 channels and locked perms.</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
              <div className="text-violet-400 font-bold">3. Interactive Review</div>
              <p className="text-slate-400 text-[11px]">Server owner reviews, reorders hierarchy, tweaks role hex colors, and approves plan.</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
              <div className="text-violet-400 font-bold">4. Backend Execution</div>
              <p className="text-slate-400 text-[11px]">Secure server creates roles, categories, channels & embeds in real Discord server via Bot.</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
              <div className="text-emerald-400 font-bold">5. Production Live</div>
              <p className="text-slate-400 text-[11px]">Real Discord community populated and ready for member onboarding.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Capabilities */}
      <section className="py-20 px-8 border-t border-white/5 bg-[#0b0c13]">
        <div className="max-w-6xl mx-auto space-y-16">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-3xl font-extrabold text-white">Full-Stack Discord Management</h2>
            <p className="text-slate-400 text-sm">
              Not a simulation, not a prototype. Every single action modifies live Discord data through the official REST API v10.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4 hover:border-violet-500/30 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/30 text-violet-400 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">AI Server Architect</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Describe your vision in Arabic or English. NOVA constructs complete hierarchical setups with fine-grained permission overwrites and custom color palettes.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4 hover:border-violet-500/30 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-400 flex items-center justify-center">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Server Auditor & Fixer</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Audits real Discord channels and roles for permission leaks, missing moderation logs, and role hierarchy collisions with 1-click remediation.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4 hover:border-violet-500/30 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
                <Workflow className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Workflow Automations</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Event-driven automations. Trigger on member joins, assign auto-roles, dispatch rich dynamic welcome embeds, and track everything in persistent audit logs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-white/5 py-8 px-8 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>NOVA &copy; 2026. Production SaaS Platform for Discord Server Management.</p>
          <div className="flex items-center gap-6 text-slate-400">
            <button onClick={() => setShowSetupModal(true)} className="hover:text-white transition-colors">
              Credentials & Setup
            </button>
            <a
              href="https://discord.com/developers/docs/reference"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white transition-colors"
            >
              Discord API v10
            </a>
          </div>
        </div>
      </footer>

      <SetupGuideModal isOpen={showSetupModal} onClose={() => setShowSetupModal(false)} />
    </div>
  );
};
