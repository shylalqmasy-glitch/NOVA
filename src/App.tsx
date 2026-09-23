/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { GuildProvider, useGuild } from './context/GuildContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { LandingPage } from './components/landing/LandingPage';
import { OverviewView } from './components/dashboard/OverviewView';
import { AiBuilderView } from './components/dashboard/AiBuilderView';
import { AiOptimizerView } from './components/dashboard/AiOptimizerView';
import { ChannelsView } from './components/dashboard/ChannelsView';
import { RolesView } from './components/dashboard/RolesView';
import { MembersView } from './components/dashboard/MembersView';
import { MessagesView } from './components/dashboard/MessagesView';
import { ModerationView } from './components/dashboard/ModerationView';
import { AutomationView } from './components/dashboard/AutomationView';
import { WelcomeView } from './components/dashboard/WelcomeView';
import { AuditLogsView } from './components/dashboard/AuditLogsView';
import { SettingsView } from './components/dashboard/SettingsView';
import { AddBotModal } from './components/modals/AddBotModal';
import { RefreshCw, AlertCircle, X } from 'lucide-react';

function DashboardContent() {
  const { user, loading: authLoading } = useAuth();
  const { activeTab, error, clearError } = useGuild();
  const [showBotModal, setShowBotModal] = useState(false);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#090a0f] flex flex-col items-center justify-center text-slate-400 gap-3">
        <RefreshCw className="w-6 h-6 animate-spin text-violet-500" />
        <span className="text-xs font-mono">Initializing NOVA Engine...</span>
      </div>
    );
  }

  if (!user) {
    return <LandingPage />;
  }

  return (
    <div className="min-h-screen bg-[#090a0f] text-slate-100 flex flex-col selection:bg-purple-600 selection:text-white">
      <Navbar />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar />

        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-red-950/40 border border-red-800/40 text-red-300 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{error}</span>
              </div>
              <button onClick={clearError} className="p-1 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {activeTab === 'overview' && <OverviewView onOpenBotModal={() => setShowBotModal(true)} />}
          {activeTab === 'ai-builder' && <AiBuilderView />}
          {activeTab === 'ai-optimizer' && <AiOptimizerView />}
          {activeTab === 'channels' && <ChannelsView />}
          {activeTab === 'roles' && <RolesView />}
          {activeTab === 'members' && <MembersView />}
          {activeTab === 'messages' && <MessagesView />}
          {activeTab === 'moderation' && <ModerationView />}
          {activeTab === 'automation' && <AutomationView />}
          {activeTab === 'welcome' && <WelcomeView />}
          {activeTab === 'audit-logs' && <AuditLogsView />}
          {activeTab === 'settings' && <SettingsView />}
        </main>
      </div>

      <AddBotModal isOpen={showBotModal} onClose={() => setShowBotModal(false)} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <GuildProvider>
        <DashboardContent />
      </GuildProvider>
    </AuthProvider>
  );
}
