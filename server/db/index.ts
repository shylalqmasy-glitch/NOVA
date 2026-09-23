import fs from 'fs';
import path from 'path';
import { config } from '../config.js';

export interface UserRecord {
  id: string;
  username: string;
  globalName?: string;
  discriminator: string;
  avatar?: string;
  email?: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  updatedAt: string;
}

export interface SessionRecord {
  sessionId: string;
  userId: string;
  expiresAt: number;
  createdAt: string;
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

export interface GuildConfigRecord {
  guildId: string;
  welcomeConfig: WelcomeConfig;
  autoModEnabled: boolean;
  logsChannelId?: string;
  updatedAt: string;
}

export interface AuditLogRecord {
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

export interface WarningRecord {
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

export interface DatabaseSchema {
  users: Record<string, UserRecord>;
  sessions: Record<string, SessionRecord>;
  guildConfigs: Record<string, GuildConfigRecord>;
  auditLogs: AuditLogRecord[];
  warnings: WarningRecord[];
  automations: AutomationRule[];
}

const initialDb: DatabaseSchema = {
  users: {},
  sessions: {},
  guildConfigs: {},
  auditLogs: [],
  warnings: [],
  automations: [],
};

class NovaDatabase {
  private filePath: string;
  private memoryDb: DatabaseSchema;
  private writeQueue: Promise<void> = Promise.resolve();

  constructor() {
    const dir = config.dataPath;
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    this.filePath = path.join(dir, 'nova_db.json');
    this.memoryDb = this.load();
  }

  private load(): DatabaseSchema {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        const parsed = JSON.parse(raw);
        return {
          ...initialDb,
          ...parsed,
        };
      }
    } catch (err) {
      console.error('[DB] Failed to load database, initializing default:', err);
    }
    this.persistSync(initialDb);
    return { ...initialDb };
  }

  private persistSync(data: DatabaseSchema) {
    const tempPath = `${this.filePath}.tmp.${Date.now()}`;
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempPath, this.filePath);
  }

  private persistAsync(): Promise<void> {
    this.writeQueue = this.writeQueue.then(async () => {
      const tempPath = `${this.filePath}.tmp.${Date.now()}`;
      await fs.promises.writeFile(tempPath, JSON.stringify(this.memoryDb, null, 2), 'utf-8');
      await fs.promises.rename(tempPath, this.filePath);
    }).catch(err => {
      console.error('[DB] Error writing database to disk:', err);
    });
    return this.writeQueue;
  }

  // Users
  public getUser(id: string): UserRecord | undefined {
    return this.memoryDb.users[id];
  }

  public upsertUser(user: UserRecord): void {
    this.memoryDb.users[user.id] = user;
    this.persistAsync();
  }

  // Sessions
  public createSession(sessionId: string, userId: string, ttlHours: number = 72): SessionRecord {
    const record: SessionRecord = {
      sessionId,
      userId,
      expiresAt: Date.now() + ttlHours * 60 * 60 * 1000,
      createdAt: new Date().toISOString(),
    };
    this.memoryDb.sessions[sessionId] = record;
    this.persistAsync();
    return record;
  }

  public getSession(sessionId: string): SessionRecord | undefined {
    const session = this.memoryDb.sessions[sessionId];
    if (!session) return undefined;
    if (Date.now() > session.expiresAt) {
      delete this.memoryDb.sessions[sessionId];
      this.persistAsync();
      return undefined;
    }
    return session;
  }

  public deleteSession(sessionId: string): void {
    if (this.memoryDb.sessions[sessionId]) {
      delete this.memoryDb.sessions[sessionId];
      this.persistAsync();
    }
  }

  // Guild Configs
  public getGuildConfig(guildId: string): GuildConfigRecord {
    if (!this.memoryDb.guildConfigs[guildId]) {
      this.memoryDb.guildConfigs[guildId] = {
        guildId,
        welcomeConfig: {
          enabled: false,
          messageText: 'Welcome to the server, {user}! Make sure to check the rules.',
          embed: {
            enabled: true,
            title: 'Welcome to {server}!',
            description: 'We are thrilled to have you here! You are member #{member_count}.',
            color: '#7c3aed',
            footerText: 'Powered by NOVA Architect',
          },
        },
        autoModEnabled: true,
        updatedAt: new Date().toISOString(),
      };
      this.persistAsync();
    }
    return this.memoryDb.guildConfigs[guildId];
  }

  public updateGuildConfig(guildId: string, update: Partial<GuildConfigRecord>): GuildConfigRecord {
    const current = this.getGuildConfig(guildId);
    const updated: GuildConfigRecord = {
      ...current,
      ...update,
      guildId,
      updatedAt: new Date().toISOString(),
    };
    this.memoryDb.guildConfigs[guildId] = updated;
    this.persistAsync();
    return updated;
  }

  // Audit Logs
  public addAuditLog(entry: Omit<AuditLogRecord, 'id' | 'timestamp'>): AuditLogRecord {
    const record: AuditLogRecord = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      ...entry,
    };
    this.memoryDb.auditLogs.unshift(record);
    // Keep last 1000 records
    if (this.memoryDb.auditLogs.length > 1000) {
      this.memoryDb.auditLogs = this.memoryDb.auditLogs.slice(0, 1000);
    }
    this.persistAsync();
    return record;
  }

  public getGuildAuditLogs(guildId: string, limit: number = 50): AuditLogRecord[] {
    return this.memoryDb.auditLogs
      .filter((l) => l.guildId === guildId)
      .slice(0, limit);
  }

  // Warnings
  public addWarning(guildId: string, userId: string, moderatorId: string, moderatorName: string, reason: string): WarningRecord {
    const record: WarningRecord = {
      id: `warn_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      guildId,
      userId,
      moderatorId,
      moderatorName,
      reason,
      timestamp: new Date().toISOString(),
    };
    this.memoryDb.warnings.unshift(record);
    this.persistAsync();
    return record;
  }

  public getMemberWarnings(guildId: string, userId: string): WarningRecord[] {
    return this.memoryDb.warnings.filter((w) => w.guildId === guildId && w.userId === userId);
  }

  public getGuildWarnings(guildId: string): WarningRecord[] {
    return this.memoryDb.warnings.filter((w) => w.guildId === guildId);
  }

  // Automations
  public getGuildAutomations(guildId: string): AutomationRule[] {
    return this.memoryDb.automations.filter((a) => a.guildId === guildId);
  }

  public createAutomation(rule: Omit<AutomationRule, 'id' | 'createdAt'>): AutomationRule {
    const newRule: AutomationRule = {
      id: `auto_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
      ...rule,
    };
    this.memoryDb.automations.push(newRule);
    this.persistAsync();
    return newRule;
  }

  public updateAutomation(id: string, update: Partial<AutomationRule>): AutomationRule | undefined {
    const index = this.memoryDb.automations.findIndex((a) => a.id === id);
    if (index === -1) return undefined;
    this.memoryDb.automations[index] = {
      ...this.memoryDb.automations[index],
      ...update,
    };
    this.persistAsync();
    return this.memoryDb.automations[index];
  }

  public deleteAutomation(id: string): boolean {
    const initialLen = this.memoryDb.automations.length;
    this.memoryDb.automations = this.memoryDb.automations.filter((a) => a.id !== id);
    if (this.memoryDb.automations.length !== initialLen) {
      this.persistAsync();
      return true;
    }
    return false;
  }
}

export const db = new NovaDatabase();
