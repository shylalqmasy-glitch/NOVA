import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserGuild, DiscordChannel, DiscordRole, DiscordMember, AuditLogEntry } from '../types';
import { api } from '../api/client';
import { useAuth } from './AuthContext';

export type DashboardTab =
  | 'overview'
  | 'ai-builder'
  | 'ai-optimizer'
  | 'channels'
  | 'roles'
  | 'members'
  | 'messages'
  | 'moderation'
  | 'automation'
  | 'welcome'
  | 'audit-logs'
  | 'settings';

interface GuildContextType {
  guilds: UserGuild[];
  activeGuild: UserGuild | null;
  activeTab: DashboardTab;
  loadingGuilds: boolean;
  loadingGuildData: boolean;
  overview: any | null;
  channels: DiscordChannel[];
  roles: DiscordRole[];
  members: DiscordMember[];
  auditLogs: AuditLogEntry[];
  error: string | null;
  setActiveTab: (tab: DashboardTab) => void;
  selectGuild: (guildId: string) => void;
  refreshGuilds: () => Promise<void>;
  refreshActiveGuildData: () => Promise<void>;
  clearError: () => void;
}

const GuildContext = createContext<GuildContextType | undefined>(undefined);

export const GuildProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [guilds, setGuilds] = useState<UserGuild[]>([]);
  const [activeGuild, setActiveGuild] = useState<UserGuild | null>(null);
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [loadingGuilds, setLoadingGuilds] = useState(false);
  const [loadingGuildData, setLoadingGuildData] = useState(false);
  const [overview, setOverview] = useState<any | null>(null);
  const [channels, setChannels] = useState<DiscordChannel[]>([]);
  const [roles, setRoles] = useState<DiscordRole[]>([]);
  const [members, setMembers] = useState<DiscordMember[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  const refreshGuilds = useCallback(async () => {
    if (!user) {
      setGuilds([]);
      setActiveGuild(null);
      return;
    }

    try {
      setLoadingGuilds(true);
      setError(null);
      const data = await api.getGuilds();
      setGuilds(data);

      // Preserve active guild if it exists, or select first guild
      setActiveGuild((prev) => {
        if (prev) {
          const match = data.find((g) => g.id === prev.id);
          if (match) return match;
        }
        return data.length > 0 ? data[0] : null;
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load your Discord servers.');
    } finally {
      setLoadingGuilds(false);
    }
  }, [user]);

  useEffect(() => {
    refreshGuilds();
  }, [refreshGuilds]);

  const refreshActiveGuildData = useCallback(async () => {
    if (!activeGuild) return;

    try {
      setLoadingGuildData(true);
      setError(null);

      // Fetch overview first
      const ov = await api.getGuildOverview(activeGuild.id);
      setOverview(ov);

      // If bot is installed, fetch channels, roles, members in parallel
      if (ov.botInstalled) {
        const [cList, rList, mList, logs] = await Promise.all([
          api.getChannels(activeGuild.id).catch(() => []),
          api.getRoles(activeGuild.id).catch(() => []),
          api.getMembers(activeGuild.id).catch(() => []),
          api.getAuditLogs(activeGuild.id, 50).catch(() => []),
        ]);
        setChannels(cList);
        setRoles(rList);
        setMembers(mList);
        setAuditLogs(logs);
      } else {
        setChannels([]);
        setRoles([]);
        setMembers([]);
        setAuditLogs(ov.recentAuditLogs || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load server details.');
    } finally {
      setLoadingGuildData(false);
    }
  }, [activeGuild]);

  useEffect(() => {
    if (activeGuild) {
      refreshActiveGuildData();
    }
  }, [activeGuild, refreshActiveGuildData]);

  const selectGuild = (guildId: string) => {
    const target = guilds.find((g) => g.id === guildId);
    if (target) {
      setActiveGuild(target);
    }
  };

  return (
    <GuildContext.Provider
      value={{
        guilds,
        activeGuild,
        activeTab,
        loadingGuilds,
        loadingGuildData,
        overview,
        channels,
        roles,
        members,
        auditLogs,
        error,
        setActiveTab,
        selectGuild,
        refreshGuilds,
        refreshActiveGuildData,
        clearError,
      }}
    >
      {children}
    </GuildContext.Provider>
  );
};

export const useGuild = () => {
  const ctx = useContext(GuildContext);
  if (!ctx) throw new Error('useGuild must be used within a GuildProvider');
  return ctx;
};
