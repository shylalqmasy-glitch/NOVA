import {
  DiscordUser,
  UserGuild,
  DiscordChannel,
  DiscordRole,
  DiscordMember,
  WelcomeConfig,
  AuditLogEntry,
  WarningEntry,
  AutomationRule,
  ServerArchitecturePlan,
  ServerAuditOptimization,
  SystemStatus,
} from '../types';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorMsg = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      errorMsg = data.error || errorMsg;
    } catch {
      // Ignore text fallback
    }
    throw new Error(errorMsg);
  }
  return res.json() as Promise<T>;
}

export const api = {
  // Auth
  async getAuthUrl(): Promise<{ url: string; redirectUri: string }> {
    const res = await fetch('/api/auth/url');
    return handleResponse(res);
  },

  async getMe(): Promise<{ authenticated: boolean; user: DiscordUser | null }> {
    const res = await fetch('/api/auth/me');
    return handleResponse(res);
  },

  async logout(): Promise<{ success: boolean }> {
    const res = await fetch('/api/auth/logout', { method: 'POST' });
    return handleResponse(res);
  },

  async getSystemStatus(): Promise<SystemStatus> {
    const res = await fetch('/api/auth/status');
    return handleResponse(res);
  },

  // Bot
  async getBotInvite(guildId?: string): Promise<{ inviteUrl: string; clientId: string }> {
    const url = guildId ? `/api/bot/invite?guildId=${guildId}` : '/api/bot/invite';
    const res = await fetch(url);
    return handleResponse(res);
  },

  // Guilds
  async getGuilds(): Promise<UserGuild[]> {
    const res = await fetch('/api/guilds');
    return handleResponse(res);
  },

  async getGuildOverview(guildId: string): Promise<{
    guildId: string;
    botInstalled: boolean;
    guild: any;
    rolesCount: number;
    channelsCount: number;
    config: any;
    recentAuditLogs: AuditLogEntry[];
  }> {
    const res = await fetch(`/api/guilds/${guildId}`);
    return handleResponse(res);
  },

  // Channels
  async getChannels(guildId: string): Promise<DiscordChannel[]> {
    const res = await fetch(`/api/guilds/${guildId}/channels`);
    return handleResponse(res);
  },

  async createChannel(
    guildId: string,
    data: { name: string; type: number; topic?: string; parent_id?: string | null }
  ): Promise<DiscordChannel> {
    const res = await fetch(`/api/guilds/${guildId}/channels`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async editChannel(
    guildId: string,
    channelId: string,
    data: { name?: string; topic?: string; position?: number }
  ): Promise<DiscordChannel> {
    const res = await fetch(`/api/guilds/${guildId}/channels/${channelId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async deleteChannel(guildId: string, channelId: string): Promise<{ success: boolean }> {
    const res = await fetch(`/api/guilds/${guildId}/channels/${channelId}`, {
      method: 'DELETE',
    });
    return handleResponse(res);
  },

  async lockChannel(guildId: string, channelId: string, lock: boolean): Promise<{ success: boolean; locked: boolean }> {
    const res = await fetch(`/api/guilds/${guildId}/channels/${channelId}/lock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lock }),
    });
    return handleResponse(res);
  },

  // Roles
  async getRoles(guildId: string): Promise<DiscordRole[]> {
    const res = await fetch(`/api/guilds/${guildId}/roles`);
    return handleResponse(res);
  },

  async createRole(
    guildId: string,
    data: { name: string; color?: string; hoist?: boolean; mentionable?: boolean }
  ): Promise<DiscordRole> {
    const res = await fetch(`/api/guilds/${guildId}/roles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async editRole(
    guildId: string,
    roleId: string,
    data: { name?: string; color?: string; hoist?: boolean; mentionable?: boolean }
  ): Promise<DiscordRole> {
    const res = await fetch(`/api/guilds/${guildId}/roles/${roleId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async deleteRole(guildId: string, roleId: string): Promise<{ success: boolean }> {
    const res = await fetch(`/api/guilds/${guildId}/roles/${roleId}`, {
      method: 'DELETE',
    });
    return handleResponse(res);
  },

  // Members
  async getMembers(guildId: string, limit = 100): Promise<DiscordMember[]> {
    const res = await fetch(`/api/guilds/${guildId}/members?limit=${limit}`);
    return handleResponse(res);
  },

  async addMemberRole(guildId: string, memberId: string, roleId: string): Promise<{ success: boolean }> {
    const res = await fetch(`/api/guilds/${guildId}/members/${memberId}/roles/${roleId}`, {
      method: 'PUT',
    });
    return handleResponse(res);
  },

  async removeMemberRole(guildId: string, memberId: string, roleId: string): Promise<{ success: boolean }> {
    const res = await fetch(`/api/guilds/${guildId}/members/${memberId}/roles/${roleId}`, {
      method: 'DELETE',
    });
    return handleResponse(res);
  },

  async timeoutMember(guildId: string, memberId: string, durationMinutes: number): Promise<{ success: boolean }> {
    const res = await fetch(`/api/guilds/${guildId}/members/${memberId}/timeout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ durationMinutes }),
    });
    return handleResponse(res);
  },

  async kickMember(guildId: string, memberId: string, reason?: string): Promise<{ success: boolean }> {
    const res = await fetch(`/api/guilds/${guildId}/members/${memberId}/kick`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
    return handleResponse(res);
  },

  async banMember(guildId: string, memberId: string, reason?: string, deleteMessageDays = 0): Promise<{ success: boolean }> {
    const res = await fetch(`/api/guilds/${guildId}/members/${memberId}/ban`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason, deleteMessageDays }),
    });
    return handleResponse(res);
  },

  // Messages
  async sendMessage(
    guildId: string,
    channelId: string,
    data: {
      content?: string;
      embed?: { title?: string; description?: string; color?: string; footerText?: string; thumbnailUrl?: string };
    }
  ): Promise<any> {
    const res = await fetch(`/api/guilds/${guildId}/channels/${channelId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  // AI Architect & Optimizer
  async generateAiPlan(guildId: string, prompt: string): Promise<ServerArchitecturePlan> {
    const res = await fetch(`/api/guilds/${guildId}/ai/plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
    return handleResponse(res);
  },

  async executeAiPlan(
    guildId: string,
    plan: ServerArchitecturePlan
  ): Promise<{
    success: boolean;
    rolesCreated: number;
    channelsCreated: number;
    executionLog: Array<{ step: string; status: 'SUCCESS' | 'FAILED' | 'SKIPPED'; detail: string }>;
  }> {
    const res = await fetch(`/api/guilds/${guildId}/ai/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    });
    return handleResponse(res);
  },

  async runServerAudit(guildId: string): Promise<ServerAuditOptimization> {
    const res = await fetch(`/api/guilds/${guildId}/ai/optimize`, {
      method: 'POST',
    });
    return handleResponse(res);
  },

  async applyAuditAction(guildId: string, action: any): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`/api/guilds/${guildId}/ai/optimize/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    return handleResponse(res);
  },

  // Welcome System
  async getWelcomeConfig(guildId: string): Promise<WelcomeConfig> {
    const res = await fetch(`/api/guilds/${guildId}/welcome`);
    return handleResponse(res);
  },

  async updateWelcomeConfig(guildId: string, welcomeConfig: WelcomeConfig): Promise<WelcomeConfig> {
    const res = await fetch(`/api/guilds/${guildId}/welcome`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ welcomeConfig }),
    });
    return handleResponse(res);
  },

  async testWelcomeMessage(guildId: string): Promise<{ success: boolean; messageId: string }> {
    const res = await fetch(`/api/guilds/${guildId}/welcome/test`, {
      method: 'POST',
    });
    return handleResponse(res);
  },

  // Moderation & Warnings
  async getWarnings(guildId: string): Promise<WarningEntry[]> {
    const res = await fetch(`/api/guilds/${guildId}/moderation/warnings`);
    return handleResponse(res);
  },

  async addWarning(guildId: string, userId: string, reason: string): Promise<WarningEntry> {
    const res = await fetch(`/api/guilds/${guildId}/moderation/warnings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, reason }),
    });
    return handleResponse(res);
  },

  // Automations
  async getAutomations(guildId: string): Promise<AutomationRule[]> {
    const res = await fetch(`/api/guilds/${guildId}/automations`);
    return handleResponse(res);
  },

  async createAutomation(guildId: string, rule: Partial<AutomationRule>): Promise<AutomationRule> {
    const res = await fetch(`/api/guilds/${guildId}/automations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rule),
    });
    return handleResponse(res);
  },

  async updateAutomation(guildId: string, id: string, rule: Partial<AutomationRule>): Promise<AutomationRule> {
    const res = await fetch(`/api/guilds/${guildId}/automations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rule),
    });
    return handleResponse(res);
  },

  async deleteAutomation(guildId: string, id: string): Promise<{ success: boolean }> {
    const res = await fetch(`/api/guilds/${guildId}/automations/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(res);
  },

  // Audit Logs
  async getAuditLogs(guildId: string, limit = 50): Promise<AuditLogEntry[]> {
    const res = await fetch(`/api/guilds/${guildId}/audit-logs?limit=${limit}`);
    return handleResponse(res);
  },
};
