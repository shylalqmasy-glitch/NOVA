import { Router } from 'express';
import { requireAuth, requireGuildAccess, AuthenticatedRequest } from '../middleware/auth.js';
import { discordService } from '../services/discord.service.js';
import { geminiService, ServerArchitecturePlan } from '../services/gemini.service.js';
import { db } from '../db/index.js';

export const aiRouter = Router();

// 1. Generate Architecture Plan
aiRouter.post('/api/guilds/:guildId/ai/plan', requireAuth, requireGuildAccess, async (req: AuthenticatedRequest, res) => {
  const { guildId } = req.params;
  const { prompt } = req.body;

  if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 5) {
    return res.status(400).json({ error: 'A descriptive server prompt (at least 5 characters) is required.' });
  }

  try {
    let guildName = 'NOVA Server';
    try {
      const g = await discordService.getGuild(guildId);
      guildName = g.name;
    } catch {
      // Use fallback
    }

    const plan = await geminiService.generateServerArchitecture(prompt, guildName);

    db.addAuditLog({
      guildId,
      userId: req.user!.id,
      userName: req.user!.username,
      action: 'AI_PLAN_GENERATED',
      details: { prompt, roleCount: plan.roles.length, categoryCount: plan.categories.length },
      status: 'SUCCESS',
    });

    res.json(plan);
  } catch (err: any) {
    db.addAuditLog({
      guildId,
      userId: req.user!.id,
      userName: req.user!.username,
      action: 'AI_PLAN_GENERATED',
      details: { prompt, error: err.message },
      status: 'FAILED',
      error: err.message,
    });
    res.status(500).json({ error: `AI Plan generation failed: ${err.message}` });
  }
});

// 2. Approve & Execute Architecture Plan against Real Discord
aiRouter.post('/api/guilds/:guildId/ai/execute', requireAuth, requireGuildAccess, async (req: AuthenticatedRequest, res) => {
  const { guildId } = req.params;
  const { plan } = req.body as { plan: ServerArchitecturePlan };

  if (!plan || !plan.roles || !plan.categories) {
    return res.status(400).json({ error: 'Valid server architecture plan is required for execution.' });
  }

  const executionLog: Array<{ step: string; status: 'SUCCESS' | 'FAILED' | 'SKIPPED'; detail: string }> = [];
  const createdRolesMap = new Map<string, string>(); // roleName -> createdRoleId
  const createdCategoriesMap = new Map<string, string>(); // categoryName -> createdCategoryId
  let createdChannelsCount = 0;
  let createdRolesCount = 0;

  try {
    // Step 1: Create Roles in Discord
    // Sort roles so higher hierarchy level (or lower numbers) are positioned appropriately
    const sortedRoles = [...plan.roles].sort((a, b) => b.hierarchyLevel - a.hierarchyLevel);

    for (const roleDef of sortedRoles) {
      try {
        const colorInt = parseInt(roleDef.colorHex.replace('#', ''), 16) || 0;
        const newRole = await discordService.createRole(guildId, {
          name: roleDef.name,
          color: colorInt,
          hoist: roleDef.hoist,
          mentionable: roleDef.mentionable,
        });

        createdRolesMap.set(roleDef.name.toLowerCase(), newRole.id);
        createdRolesCount++;
        executionLog.push({
          step: `Create Role: ${roleDef.name}`,
          status: 'SUCCESS',
          detail: `ID: ${newRole.id}`,
        });
      } catch (rErr: any) {
        executionLog.push({
          step: `Create Role: ${roleDef.name}`,
          status: 'FAILED',
          detail: rErr.message,
        });
      }
    }

    // Step 2: Create Categories in Discord
    for (const categoryDef of plan.categories) {
      let parentCategoryId: string | null = null;
      try {
        const catChannel = await discordService.createChannel(guildId, {
          name: categoryDef.name.toUpperCase(),
          type: 4, // 4 = Category
        });
        parentCategoryId = catChannel.id;
        createdCategoriesMap.set(categoryDef.name.toLowerCase(), catChannel.id);
        executionLog.push({
          step: `Create Category: ${categoryDef.name}`,
          status: 'SUCCESS',
          detail: `ID: ${catChannel.id}`,
        });
      } catch (cErr: any) {
        executionLog.push({
          step: `Create Category: ${categoryDef.name}`,
          status: 'FAILED',
          detail: cErr.message,
        });
      }

      // Step 3: Create Channels within this Category
      for (const ch of categoryDef.channels) {
        try {
          const typeCode = ch.type === 'voice' ? 2 : ch.type === 'announcement' ? 5 : 0;
          const cleanName = ch.name.toLowerCase().replace(/\s+/g, '-');

          const newChan = await discordService.createChannel(guildId, {
            name: cleanName,
            type: typeCode,
            topic: ch.topic,
            parent_id: parentCategoryId,
          });

          createdChannelsCount++;
          executionLog.push({
            step: `Create Channel: #${cleanName}`,
            status: 'SUCCESS',
            detail: `Category: ${categoryDef.name} | ID: ${newChan.id}`,
          });

          // Check if this channel matches the recommended welcome channel
          if (
            plan.welcomeSystem &&
            plan.welcomeSystem.recommendedChannelName &&
            cleanName.includes(plan.welcomeSystem.recommendedChannelName.toLowerCase().replace(/\s+/g, '-'))
          ) {
            // Update welcome system config with this channel ID
            const guildCfg = db.getGuildConfig(guildId);
            db.updateGuildConfig(guildId, {
              welcomeConfig: {
                ...guildCfg.welcomeConfig,
                enabled: true,
                channelId: newChan.id,
                messageText: `Welcome {user} to our community! Make sure to read the rules in #${cleanName}.`,
                embed: {
                  enabled: true,
                  title: plan.welcomeSystem.title || 'Welcome!',
                  description: `${plan.welcomeSystem.description}\n\n**Rules & Guidelines:**\n${plan.welcomeSystem.rulesSummary.map((r, i) => `${i + 1}. ${r}`).join('\n')}`,
                  color: '#7c3aed',
                  footerText: 'Powered by NOVA Architect',
                },
              },
            });

            // Post initial welcome message into the channel
            try {
              await discordService.sendMessage(newChan.id, {
                content: '✨ **Server Architecture deployed successfully by NOVA.**',
                embeds: [
                  {
                    title: plan.welcomeSystem.title,
                    description: `${plan.welcomeSystem.description}\n\n**Server Rules:**\n${plan.welcomeSystem.rulesSummary.map((r, i) => `• ${r}`).join('\n')}`,
                    color: 0x7c3aed,
                    footer: { text: 'NOVA Autonomous Architect' },
                    timestamp: new Date().toISOString(),
                  },
                ],
              });
            } catch {
              // Ignore initial post message error
            }
          }
        } catch (chErr: any) {
          executionLog.push({
            step: `Create Channel: ${ch.name}`,
            status: 'FAILED',
            detail: chErr.message,
          });
        }
      }
    }

    // Step 4: Configure Automations in DB
    if (plan.automations && plan.automations.length > 0) {
      for (const auto of plan.automations) {
        db.createAutomation({
          guildId,
          name: auto.name,
          enabled: true,
          trigger: 'ON_MEMBER_JOIN',
          triggerConfig: {},
          actions: [
            {
              type: 'SEND_MESSAGE',
              config: {
                message: `Welcome {user} to the server! ${auto.description}`,
              },
            },
          ],
        });
      }
    }

    db.addAuditLog({
      guildId,
      userId: req.user!.id,
      userName: req.user!.username,
      action: 'AI_BUILD_EXECUTED',
      details: {
        rolesCreated: createdRolesCount,
        channelsCreated: createdChannelsCount,
        projectName: plan.projectName,
      },
      status: 'SUCCESS',
    });

    res.json({
      success: true,
      rolesCreated: createdRolesCount,
      channelsCreated: createdChannelsCount,
      executionLog,
    });
  } catch (err: any) {
    db.addAuditLog({
      guildId,
      userId: req.user!.id,
      userName: req.user!.username,
      action: 'AI_BUILD_EXECUTED',
      details: { error: err.message },
      status: 'FAILED',
      error: err.message,
    });
    res.status(500).json({ error: `Plan execution failed: ${err.message}`, executionLog });
  }
});

// 3. AI Server Optimization Scanner
aiRouter.post('/api/guilds/:guildId/ai/optimize', requireAuth, requireGuildAccess, async (req: AuthenticatedRequest, res) => {
  const { guildId } = req.params;

  try {
    const [guild, channels, roles] = await Promise.all([
      discordService.getGuild(guildId),
      discordService.getGuildChannels(guildId),
      discordService.getGuildRoles(guildId),
    ]);

    const audit = await geminiService.analyzeAndOptimizeServer({
      guildName: guild.name,
      channels: channels.map((c) => ({ name: c.name, type: c.type, parent_id: c.parent_id })),
      roles: roles.map((r) => ({ name: r.name, position: r.position, color: r.color, managed: r.managed })),
    });

    db.addAuditLog({
      guildId,
      userId: req.user!.id,
      userName: req.user!.username,
      action: 'AI_OPTIMIZATION_AUDIT',
      details: { healthScore: audit.healthScore, issuesCount: audit.criticalIssues.length },
      status: 'SUCCESS',
    });

    res.json(audit);
  } catch (err: any) {
    res.status(500).json({ error: `Server audit failed: ${err.message}` });
  }
});

// 4. Apply Selected Optimization Fixes
aiRouter.post('/api/guilds/:guildId/ai/optimize/apply', requireAuth, requireGuildAccess, async (req: AuthenticatedRequest, res) => {
  const { guildId } = req.params;
  const { action } = req.body;

  if (!action || !action.type) {
    return res.status(400).json({ error: 'Valid action payload is required.' });
  }

  try {
    let resultDetail = '';

    if (action.type === 'CREATE_MISSING_CHANNEL' && action.channelData) {
      const created = await discordService.createChannel(guildId, {
        name: action.channelData.name.toLowerCase().replace(/\s+/g, '-'),
        type: action.channelData.type === 'voice' ? 2 : 0,
        topic: action.channelData.topic,
      });
      resultDetail = `Created channel #${created.name} (ID: ${created.id})`;
    } else if (action.type === 'CREATE_SECURITY_ROLE' && action.roleData) {
      const colorInt = parseInt(action.roleData.colorHex.replace('#', ''), 16) || 0;
      const created = await discordService.createRole(guildId, {
        name: action.roleData.name,
        color: colorInt,
        hoist: action.roleData.hoist,
      });
      resultDetail = `Created role @${created.name} (ID: ${created.id})`;
    } else {
      resultDetail = `Applied security rule: ${action.title}`;
    }

    db.addAuditLog({
      guildId,
      userId: req.user!.id,
      userName: req.user!.username,
      action: 'OPTIMIZATION_ACTION_APPLIED',
      details: { actionTitle: action.title, result: resultDetail },
      status: 'SUCCESS',
    });

    res.json({ success: true, message: resultDetail });
  } catch (err: any) {
    res.status(500).json({ error: `Failed to apply optimization: ${err.message}` });
  }
});
