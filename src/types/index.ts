export interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  globalName?: string;
  avatar?: string;
  email?: string;
}

export interface UserGuild {
  id: string;
  name: string;
  icon?: string;
  owner?: boolean;
  permissions: string;
  approximateMemberCount?: number;
  botInstalled: boolean;
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
  name?: string;
  topic?: string;
  nsfw?: boolean;
  parent_id?: string | null;
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

export interface WelcomeConfig {
  enabled: boolean;
  channelId?: string;
  joinRoleId?: string;
  messageText: string;
  embed: {
    enabled: boolean;
    title: string;
    description: string;
    color: string;
    footerText?: string;
    thumbnailUrl?: string;
  };
}

export interface AuditLogEntry {
  id: string;
  guildId: string;
  userId: string;
  userName: string;
  action: string;
  target?: string;
  details?: Record<string, unknown> | string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  error?: string;
  timestamp: string;
}

export interface WarningEntry {
  id: string;
  guildId: string;
  userId: string;
  moderatorId: string;
  moderatorName: string;
  reason: string;
  timestamp: string;
}

export interface AutomationRule {
  id: string;
  guildId: string;
  name: string;
  enabled: boolean;
  trigger: 'ON_MEMBER_JOIN' | 'ON_MESSAGE_CONTAINING_KEYWORD' | 'ON_ROLE_ASSIGNED';
  triggerConfig: {
    keyword?: string;
    roleId?: string;
  };
  actions: Array<{
    type: 'ASSIGN_ROLE' | 'SEND_MESSAGE' | 'TIMEOUT_MEMBER' | 'LOG_EVENT';
    config: {
      roleId?: string;
      channelId?: string;
      message?: string;
      durationMinutes?: number;
    };
  }>;
  createdAt: string;
}

export interface ProposedRole {
  name: string;
  colorHex: string;
  hoist: boolean;
  mentionable: boolean;
  hierarchyLevel: number;
  description: string;
  permissions?: {
    administrator?: boolean;
    manageGuild?: boolean;
    manageRoles?: boolean;
    manageChannels?: boolean;
    kickMembers?: boolean;
    banMembers?: boolean;
    moderateMembers?: boolean;
    manageMessages?: boolean;
  };
}

export interface ProposedChannel {
  name: string;
  type: 'text' | 'voice' | 'announcement' | 'forum';
  topic: string;
  isPrivate?: boolean;
  allowedRoleNames?: string[];
}

export interface ProposedCategory {
  name: string;
  channels: ProposedChannel[];
}

export interface ServerArchitecturePlan {
  projectName: string;
  overview: string;
  roles: ProposedRole[];
  categories: ProposedCategory[];
  welcomeSystem: {
    title: string;
    description: string;
    recommendedChannelName: string;
    rulesSummary: string[];
  };
  automations: Array<{
    name: string;
    trigger: string;
    action: string;
    description: string;
  }>;
}

export interface ServerAuditOptimization {
  healthScore: number;
  assessmentSummary: string;
  criticalIssues: Array<{
    area: 'Security & Overwrites' | 'Role Hierarchy' | 'Channel Architecture' | 'Engagement & Onboarding';
    severity: 'CRITICAL' | 'WARNING' | 'IMPROVEMENT';
    issue: string;
    impact: string;
    remediation: string;
  }>;
  recommendedActions: Array<{
    id: string;
    title: string;
    type: 'CREATE_MISSING_CHANNEL' | 'CREATE_SECURITY_ROLE' | 'ADJUST_CATEGORY' | 'APPLY_MOD_RULE';
    description: string;
    channelData?: { name: string; type: 'text' | 'voice'; categoryName: string; topic: string };
    roleData?: { name: string; colorHex: string; hoist: boolean };
  }>;
}

export interface SystemStatus {
  appUrl: string;
  redirectUri: string;
  credentials: {
    hasClientId: boolean;
    hasClientSecret: boolean;
    hasBotToken: boolean;
    hasGeminiKey: boolean;
  };
  isReady: boolean;
  discordClientId?: string;
}
