import { GoogleGenAI, Type } from '@google/genai';
import { config } from '../config.js';

let aiInstance: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiInstance) {
    if (!config.geminiApiKey) {
      throw new Error('Gemini API key is not configured in GEMINI_API_KEY environment variable.');
    }
    aiInstance = new GoogleGenAI({
      apiKey: config.geminiApiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiInstance;
}

export interface ProposedRole {
  name: string;
  colorHex: string;
  hoist: boolean;
  mentionable: boolean;
  hierarchyLevel: number; // 1 = highest custom role (e.g. Owner/Admin), higher = lower
  permissions: {
    administrator?: boolean;
    manageGuild?: boolean;
    manageRoles?: boolean;
    manageChannels?: boolean;
    kickMembers?: boolean;
    banMembers?: boolean;
    moderateMembers?: boolean;
    manageMessages?: boolean;
  };
  description: string;
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

export class GeminiService {
  public async generateServerArchitecture(prompt: string, serverName: string = 'NOVA Server'): Promise<ServerArchitecturePlan> {
    const ai = getAiClient();

    const systemInstruction = `You are NOVA Architect, the world's most elite Discord community architect and system engineer.
Your job is to transform a natural language description into a production-grade, highly structured Discord server layout.
Create a complete server architecture blueprint including:
- Hierarchical, color-coded roles from supreme moderation down to community tiers.
- Logical Category groups with crisp channel names (lowercase with hyphens or emojis like 'rules', 'announcements', 'general-chat').
- Appropriate channel types ('text', 'voice', 'announcement', 'forum').
- Welcoming onboarding embed design.
- Essential community automations.

Ensure role hex colors are elegant modern hex codes (e.g. #7c3aed, #06b6d4, #10b981, #f59e0b, #ef4444, #94a3b8).
Return ONLY clean, valid JSON matching the requested schema.`;

    const userMessage = `Create a complete Discord architecture plan for server "${serverName}".
User Specification / Brief:
"${prompt}"`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: userMessage,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            projectName: { type: Type.STRING },
            overview: { type: Type.STRING },
            roles: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  colorHex: { type: Type.STRING },
                  hoist: { type: Type.BOOLEAN },
                  mentionable: { type: Type.BOOLEAN },
                  hierarchyLevel: { type: Type.INTEGER },
                  description: { type: Type.STRING },
                  permissions: {
                    type: Type.OBJECT,
                    properties: {
                      administrator: { type: Type.BOOLEAN },
                      manageGuild: { type: Type.BOOLEAN },
                      manageRoles: { type: Type.BOOLEAN },
                      manageChannels: { type: Type.BOOLEAN },
                      kickMembers: { type: Type.BOOLEAN },
                      banMembers: { type: Type.BOOLEAN },
                      moderateMembers: { type: Type.BOOLEAN },
                      manageMessages: { type: Type.BOOLEAN },
                    },
                  },
                },
                required: ['name', 'colorHex', 'hoist', 'mentionable', 'hierarchyLevel', 'description'],
              },
            },
            categories: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  channels: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING },
                        type: { type: Type.STRING, enum: ['text', 'voice', 'announcement', 'forum'] },
                        topic: { type: Type.STRING },
                        isPrivate: { type: Type.BOOLEAN },
                        allowedRoleNames: {
                          type: Type.ARRAY,
                          items: { type: Type.STRING },
                        },
                      },
                      required: ['name', 'type', 'topic'],
                    },
                  },
                },
                required: ['name', 'channels'],
              },
            },
            welcomeSystem: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                recommendedChannelName: { type: Type.STRING },
                rulesSummary: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
              },
              required: ['title', 'description', 'recommendedChannelName', 'rulesSummary'],
            },
            automations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  trigger: { type: Type.STRING },
                  action: { type: Type.STRING },
                  description: { type: Type.STRING },
                },
                required: ['name', 'trigger', 'action', 'description'],
              },
            },
          },
          required: ['projectName', 'overview', 'roles', 'categories', 'welcomeSystem', 'automations'],
        },
      },
    });

    const text = response.text || '{}';
    return JSON.parse(text) as ServerArchitecturePlan;
  }

  public async analyzeAndOptimizeServer(data: {
    guildName: string;
    channels: Array<{ name?: string; type: number; parent_id?: string | null }>;
    roles: Array<{ name: string; position: number; color: number; managed: boolean }>;
  }): Promise<ServerAuditOptimization> {
    const ai = getAiClient();

    const systemInstruction = `You are NOVA Server Auditor. Analyze the real Discord server setup provided, check for architectural gaps, security issues, missing essential channels (e.g. mod-logs, rules, tickets), redundant or misconfigured roles, and role hierarchy problems.
Produce an objective audit with a health score (0-100), critical findings, and concrete actionable tasks that NOVA can execute on Discord.`;

    const userMessage = `Perform a full architectural audit for Discord Server: "${data.guildName}".
Current Real State:
- Existing Channels Count: ${data.channels.length}
- Channel List: ${JSON.stringify(data.channels.map(c => ({ name: c.name, type: c.type, parent: c.parent_id })).slice(0, 50))}
- Existing Roles Count: ${data.roles.length}
- Role List: ${JSON.stringify(data.roles.map(r => ({ name: r.name, position: r.position, managed: r.managed })).slice(0, 30))}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: userMessage,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            healthScore: { type: Type.INTEGER },
            assessmentSummary: { type: Type.STRING },
            criticalIssues: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  area: {
                    type: Type.STRING,
                    enum: ['Security & Overwrites', 'Role Hierarchy', 'Channel Architecture', 'Engagement & Onboarding'],
                  },
                  severity: { type: Type.STRING, enum: ['CRITICAL', 'WARNING', 'IMPROVEMENT'] },
                  issue: { type: Type.STRING },
                  impact: { type: Type.STRING },
                  remediation: { type: Type.STRING },
                },
                required: ['area', 'severity', 'issue', 'impact', 'remediation'],
              },
            },
            recommendedActions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  type: {
                    type: Type.STRING,
                    enum: ['CREATE_MISSING_CHANNEL', 'CREATE_SECURITY_ROLE', 'ADJUST_CATEGORY', 'APPLY_MOD_RULE'],
                  },
                  description: { type: Type.STRING },
                  channelData: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      type: { type: Type.STRING, enum: ['text', 'voice'] },
                      categoryName: { type: Type.STRING },
                      topic: { type: Type.STRING },
                    },
                  },
                  roleData: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      colorHex: { type: Type.STRING },
                      hoist: { type: Type.BOOLEAN },
                    },
                  },
                },
                required: ['id', 'title', 'type', 'description'],
              },
            },
          },
          required: ['healthScore', 'assessmentSummary', 'criticalIssues', 'recommendedActions'],
        },
      },
    });

    const text = response.text || '{}';
    return JSON.parse(text) as ServerAuditOptimization;
  }
}

export const geminiService = new GeminiService();
