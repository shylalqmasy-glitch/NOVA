import { config } from '../config.js';

export interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  global_name?: string;
  avatar?: string;
  email?: string;
}

export interface DiscordGuild {
  id: string;
  name: string;
  icon?: string;
  owner?: boolean;
  permissions: string;
  features: string[];
  approximate_member_count?: number;
  approximate_presence_count?: number;
}

export interface DiscordRole {
  id: string;
  name: string;
  color: number;
  hoist: boolean;
  position: number;
  permissions: string;
  managed: boolean;
  mentionable: boolean;
}

export interface DiscordChannel {
  id: string;
  type: number; // 0 = text, 2 = voice, 4 = category, 5 = announcement, 15 = forum
  guild_id?: string;
  position?: number;
  permission_overwrites?: Array<{
    id: string;
    type: number;
    allow: string;
    deny: string;
  }>;
  name?: string;
  topic?: string;
  nsfw?: boolean;
  parent_id?: string | null;
  rate_limit_per_user?: number;
}

export interface DiscordMember {
  user: DiscordUser;
  nick?: string;
  avatar?: string;
  roles: string[];
  joined_at: string;
  premium_since?: string;
  deaf?: boolean;
  mute?: boolean;
  pending?: boolean;
  communication_disabled_until?: string | null;
}

export interface DiscordEmbed {
  title?: string;
  description?: string;
  url?: string;
  timestamp?: string;
  color?: number;
  footer?: { text: string; icon_url?: string };
  image?: { url: string };
  thumbnail?: { url: string };
  author?: { name: string; icon_url?: string; url?: string };
  fields?: Array<{ name: string; value: string; inline?: boolean }>;
}

export class DiscordApiError extends Error {
  public status: number;
  public code?: number;
  public details?: unknown;

  constructor(message: string, status: number, code?: number, details?: unknown) {
    super(message);
    this.name = 'DiscordApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export class DiscordService {
  private apiBase = config.discord.apiBase;

  private async request<T>(
    endpoint: string,
    options: {
      method?: string;
      headers?: Record<string, string>;
      body?: unknown;
      useBotToken?: boolean;
      userToken?: string;
    } = {}
  ): Promise<T> {
    const { method = 'GET', headers = {}, body, useBotToken, userToken } = options;

    const reqHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
    };

    if (useBotToken) {
      if (!config.discord.botToken) {
        throw new DiscordApiError('Discord Bot Token is not configured in environment variables (DISCORD_BOT_TOKEN)', 401);
      }
      reqHeaders['Authorization'] = `Bot ${config.discord.botToken}`;
    } else if (userToken) {
      reqHeaders['Authorization'] = `Bearer ${userToken}`;
    }

    const res = await fetch(`${this.apiBase}${endpoint}`, {
      method,
      headers: reqHeaders,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      let errData: any = {};
      try {
        errData = await res.json();
      } catch {
        // Ignored
      }

      let message = errData.message || `Discord API request failed with status ${res.status}`;
      if (errData.code === 50013) {
        message = 'Missing Permissions: The NOVA Bot lacks required Discord permissions or the target role is higher than the bot in role hierarchy.';
      } else if (errData.code === 50001) {
        message = 'Missing Access: NOVA Bot cannot access this guild or channel. Verify bot permissions.';
      } else if (errData.code === 10004) {
        message = 'Unknown Guild: Guild ID not found or bot has not been added to the server.';
      } else if (res.status === 429) {
        message = `Rate Limited: Discord requested backoff (${errData.retry_after || 5}s).`;
      }

      throw new DiscordApiError(message, res.status, errData.code, errData);
    }

    if (res.status === 204) {
      return {} as T;
    }

    return (await res.json()) as T;
  }

  // --- OAuth2 ---
  public getOAuthUrl(redirectUri: string, state?: string): string {
    const params = new URLSearchParams({
      client_id: config.discord.clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: config.discord.scopes.join(' '),
      prompt: 'consent',
    });
    if (state) params.set('state', state);
    return `https://discord.com/oauth2/authorize?${params.toString()}`;
  }

  public getBotInviteUrl(guildId?: string): string {
    // Permissions: Administrator (8) or 534723950591 (Manage Guild, Roles, Channels, Kick, Ban, Send Messages, Embeds, Manage Messages)
    const permissions = '8'; // Administrator is recommended for full architecture operations
    const params = new URLSearchParams({
      client_id: config.discord.clientId,
      scope: 'bot applications.commands',
      permissions,
    });
    if (guildId) {
      params.set('guild_id', guildId);
      params.set('disable_guild_select', 'true');
    }
    return `https://discord.com/oauth2/authorize?${params.toString()}`;
  }

  public async exchangeCode(code: string, redirectUri: string) {
    if (!config.discord.clientId || !config.discord.clientSecret) {
      throw new DiscordApiError('Discord Client ID or Client Secret is missing in environment.', 400);
    }

    const body = new URLSearchParams({
      client_id: config.discord.clientId,
      client_secret: config.discord.clientSecret,
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    });

    const res = await fetch(`${this.apiBase}/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new DiscordApiError(err.error_description || 'Failed to exchange authorization code with Discord', res.status, undefined, err);
    }

    return (await res.json()) as {
      access_token: string;
      token_type: string;
      expires_in: number;
      refresh_token: string;
      scope: string;
    };
  }

  public async getCurrentUser(userToken: string): Promise<DiscordUser> {
    return this.request<DiscordUser>('/users/@me', { userToken });
  }

  public async getUserGuilds(userToken: string): Promise<DiscordGuild[]> {
    return this.request<DiscordGuild[]>('/users/@me/guilds?with_counts=true', { userToken });
  }

  // --- Guild & Bot Connection ---
  public async getGuild(guildId: string): Promise<DiscordGuild> {
    return this.request<DiscordGuild>(`/guilds/${guildId}?with_counts=true`, { useBotToken: true });
  }

  public async getBotMember(guildId: string): Promise<DiscordMember> {
    return this.request<DiscordMember>(`/guilds/${guildId}/members/@me`, { useBotToken: true });
  }

  public async checkBotInGuild(guildId: string): Promise<{ inGuild: boolean; botMember?: DiscordMember; permissions?: string }> {
    try {
      const botMember = await this.getBotMember(guildId);
      return { inGuild: true, botMember, permissions: botMember.user?.id ? 'PRESENT' : undefined };
    } catch (err: any) {
      if (err.status === 404 || err.status === 403 || err.code === 10004 || err.code === 50001) {
        return { inGuild: false };
      }
      throw err;
    }
  }

  // --- Channels ---
  public async getGuildChannels(guildId: string): Promise<DiscordChannel[]> {
    return this.request<DiscordChannel[]>(`/guilds/${guildId}/channels`, { useBotToken: true });
  }

  public async createChannel(
    guildId: string,
    data: {
      name: string;
      type: number;
      topic?: string;
      parent_id?: string | null;
      permission_overwrites?: any[];
      nsfw?: boolean;
    }
  ): Promise<DiscordChannel> {
    return this.request<DiscordChannel>(`/guilds/${guildId}/channels`, {
      method: 'POST',
      useBotToken: true,
      body: data,
    });
  }

  public async editChannel(
    channelId: string,
    data: {
      name?: string;
      topic?: string;
      position?: number;
      parent_id?: string | null;
      nsfw?: boolean;
    }
  ): Promise<DiscordChannel> {
    return this.request<DiscordChannel>(`/channels/${channelId}`, {
      method: 'PATCH',
      useBotToken: true,
      body: data,
    });
  }

  public async deleteChannel(channelId: string): Promise<void> {
    await this.request<void>(`/channels/${channelId}`, {
      method: 'DELETE',
      useBotToken: true,
    });
  }

  public async lockChannel(channelId: string, everyoneRoleId: string, lock: boolean): Promise<void> {
    // Lock: Deny SEND_MESSAGES (0x800) for @everyone
    // Unlock: Reset or allow
    const SEND_MESSAGES_BIT = 2048n; // 0x800
    await this.request<void>(`/channels/${channelId}/permissions/${everyoneRoleId}`, {
      method: 'PUT',
      useBotToken: true,
      body: {
        type: 0, // role
        deny: lock ? SEND_MESSAGES_BIT.toString() : '0',
        allow: '0',
      },
    });
  }

  // --- Roles ---
  public async getGuildRoles(guildId: string): Promise<DiscordRole[]> {
    return this.request<DiscordRole[]>(`/guilds/${guildId}/roles`, { useBotToken: true });
  }

  public async createRole(
    guildId: string,
    data: {
      name: string;
      color?: number;
      hoist?: boolean;
      mentionable?: boolean;
      permissions?: string;
    }
  ): Promise<DiscordRole> {
    return this.request<DiscordRole>(`/guilds/${guildId}/roles`, {
      method: 'POST',
      useBotToken: true,
      body: data,
    });
  }

  public async editRole(
    guildId: string,
    roleId: string,
    data: {
      name?: string;
      color?: number;
      hoist?: boolean;
      mentionable?: boolean;
      permissions?: string;
    }
  ): Promise<DiscordRole> {
    return this.request<DiscordRole>(`/guilds/${guildId}/roles/${roleId}`, {
      method: 'PATCH',
      useBotToken: true,
      body: data,
    });
  }

  public async deleteRole(guildId: string, roleId: string): Promise<void> {
    await this.request<void>(`/guilds/${guildId}/roles/${roleId}`, {
      method: 'DELETE',
      useBotToken: true,
    });
  }

  // --- Members ---
  public async getGuildMembers(guildId: string, limit: number = 100): Promise<DiscordMember[]> {
    return this.request<DiscordMember[]>(`/guilds/${guildId}/members?limit=${limit}`, { useBotToken: true });
  }

  public async getMember(guildId: string, userId: string): Promise<DiscordMember> {
    return this.request<DiscordMember>(`/guilds/${guildId}/members/${userId}`, { useBotToken: true });
  }

  public async addMemberRole(guildId: string, userId: string, roleId: string): Promise<void> {
    await this.request<void>(`/guilds/${guildId}/members/${userId}/roles/${roleId}`, {
      method: 'PUT',
      useBotToken: true,
    });
  }

  public async removeMemberRole(guildId: string, userId: string, roleId: string): Promise<void> {
    await this.request<void>(`/guilds/${guildId}/members/${userId}/roles/${roleId}`, {
      method: 'DELETE',
      useBotToken: true,
    });
  }

  public async timeoutMember(guildId: string, userId: string, durationMinutes: number): Promise<DiscordMember> {
    const until = durationMinutes > 0 ? new Date(Date.now() + durationMinutes * 60 * 1000).toISOString() : null;
    return this.request<DiscordMember>(`/guilds/${guildId}/members/${userId}`, {
      method: 'PATCH',
      useBotToken: true,
      body: {
        communication_disabled_until: until,
      },
    });
  }

  public async kickMember(guildId: string, userId: string, reason?: string): Promise<void> {
    const headers: Record<string, string> = {};
    if (reason) headers['X-Audit-Log-Reason'] = encodeURIComponent(reason);
    await this.request<void>(`/guilds/${guildId}/members/${userId}`, {
      method: 'DELETE',
      headers,
      useBotToken: true,
    });
  }

  public async banMember(guildId: string, userId: string, reason?: string, deleteMessageDays: number = 0): Promise<void> {
    const headers: Record<string, string> = {};
    if (reason) headers['X-Audit-Log-Reason'] = encodeURIComponent(reason);
    await this.request<void>(`/guilds/${guildId}/bans/${userId}`, {
      method: 'PUT',
      headers,
      useBotToken: true,
      body: {
        delete_message_seconds: deleteMessageDays * 86400,
      },
    });
  }

  // --- Messages ---
  public async sendMessage(
    channelId: string,
    payload: {
      content?: string;
      embeds?: DiscordEmbed[];
    }
  ): Promise<any> {
    return this.request<any>(`/channels/${channelId}/messages`, {
      method: 'POST',
      useBotToken: true,
      body: payload,
    });
  }

  public async deleteMessage(channelId: string, messageId: string): Promise<void> {
    await this.request<void>(`/channels/${channelId}/messages/${messageId}`, {
      method: 'DELETE',
      useBotToken: true,
    });
  }
}

export const discordService = new DiscordService();
