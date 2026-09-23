import { Router } from 'express';
import { requireAuth, requireGuildAccess, AuthenticatedRequest } from '../middleware/auth.js';
import { db } from '../db/index.js';
import { discordService } from '../services/discord.service.js';

export const featuresRouter = Router();

// --- Welcome System ---
featuresRouter.get('/api/guilds/:guildId/welcome', requireAuth, requireGuildAccess, (req: AuthenticatedRequest, res) => {
  const { guildId } = req.params;
  const cfg = db.getGuildConfig(guildId);
  res.json(cfg.welcomeConfig);
});

featuresRouter.post('/api/guilds/:guildId/welcome', requireAuth, requireGuildAccess, (req: AuthenticatedRequest, res) => {
  const { guildId } = req.params;
  const { welcomeConfig } = req.body;

  if (!welcomeConfig) {
    return res.status(400).json({ error: 'welcomeConfig object is required.' });
  }

  const updated = db.updateGuildConfig(guildId, { welcomeConfig });
  db.addAuditLog({
    guildId,
    userId: req.user!.id,
    userName: req.user!.username,
    action: 'WELCOME_CONFIG_UPDATE',
    details: { enabled: welcomeConfig.enabled, channelId: welcomeConfig.channelId },
    status: 'SUCCESS',
  });

  res.json(updated.welcomeConfig);
});

// Test Welcome Message (Sends real message to the target Discord channel)
featuresRouter.post('/api/guilds/:guildId/welcome/test', requireAuth, requireGuildAccess, async (req: AuthenticatedRequest, res) => {
  const { guildId } = req.params;
  const cfg = db.getGuildConfig(guildId);
  const welcome = cfg.welcomeConfig;

  if (!welcome.channelId) {
    return res.status(400).json({ error: 'Please select a welcome channel and save settings first.' });
  }

  try {
    const guild = await discordService.getGuild(guildId);
    const memberCount = guild.approximate_member_count || 1;

    const parsedContent = welcome.messageText
      .replace(/\{user\}/g, `<@${req.user!.id}>`)
      .replace(/\{username\}/g, req.user!.username)
      .replace(/\{server\}/g, guild.name)
      .replace(/\{member_count\}/g, String(memberCount));

    let embeds = undefined;
    if (welcome.embed?.enabled) {
      const colorInt = parseInt((welcome.embed.color || '#7c3aed').replace('#', ''), 16);
      embeds = [
        {
          title: welcome.embed.title
            .replace(/\{user\}/g, req.user!.username)
            .replace(/\{server\}/g, guild.name),
          description: welcome.embed.description
            .replace(/\{user\}/g, `<@${req.user!.id}>`)
            .replace(/\{username\}/g, req.user!.username)
            .replace(/\{server\}/g, guild.name)
            .replace(/\{member_count\}/g, String(memberCount)),
          color: isNaN(colorInt) ? 0x7c3aed : colorInt,
          footer: welcome.embed.footerText ? { text: welcome.embed.footerText } : undefined,
          thumbnail: welcome.embed.thumbnailUrl ? { url: welcome.embed.thumbnailUrl } : undefined,
          timestamp: new Date().toISOString(),
        },
      ];
    }

    const sent = await discordService.sendMessage(welcome.channelId, {
      content: `🧪 **[NOVA Test Dispatch]**\n${parsedContent}`,
      embeds,
    });

    db.addAuditLog({
      guildId,
      userId: req.user!.id,
      userName: req.user!.username,
      action: 'WELCOME_TEST_DISPATCH',
      target: welcome.channelId,
      status: 'SUCCESS',
    });

    res.json({ success: true, messageId: sent.id });
  } catch (err: any) {
    res.status(500).json({ error: `Failed to dispatch test message: ${err.message}` });
  }
});

// --- Moderation & Warnings ---
featuresRouter.get('/api/guilds/:guildId/moderation/warnings', requireAuth, requireGuildAccess, (req: AuthenticatedRequest, res) => {
  const { guildId } = req.params;
  const warnings = db.getGuildWarnings(guildId);
  res.json(warnings);
});

featuresRouter.post('/api/guilds/:guildId/moderation/warnings', requireAuth, requireGuildAccess, (req: AuthenticatedRequest, res) => {
  const { guildId } = req.params;
  const { userId, reason } = req.body;

  if (!userId || !reason) {
    return res.status(400).json({ error: 'User ID and reason are required to issue a warning.' });
  }

  const warning = db.addWarning(guildId, userId, req.user!.id, req.user!.username, reason);
  db.addAuditLog({
    guildId,
    userId: req.user!.id,
    userName: req.user!.username,
    action: 'WARNING_ISSUED',
    target: userId,
    details: { reason },
    status: 'SUCCESS',
  });

  res.status(201).json(warning);
});

// --- Automations ---
featuresRouter.get('/api/guilds/:guildId/automations', requireAuth, requireGuildAccess, (req: AuthenticatedRequest, res) => {
  const { guildId } = req.params;
  const rules = db.getGuildAutomations(guildId);
  res.json(rules);
});

featuresRouter.post('/api/guilds/:guildId/automations', requireAuth, requireGuildAccess, (req: AuthenticatedRequest, res) => {
  const { guildId } = req.params;
  const { name, trigger, triggerConfig, actions, enabled } = req.body;

  if (!name || !trigger || !actions) {
    return res.status(400).json({ error: 'Name, trigger, and actions are required.' });
  }

  const rule = db.createAutomation({
    guildId,
    name,
    enabled: enabled !== false,
    trigger,
    triggerConfig: triggerConfig || {},
    actions: actions || [],
  });

  db.addAuditLog({
    guildId,
    userId: req.user!.id,
    userName: req.user!.username,
    action: 'AUTOMATION_CREATE',
    target: rule.id,
    details: { name: rule.name, trigger: rule.trigger },
    status: 'SUCCESS',
  });

  res.status(201).json(rule);
});

featuresRouter.patch('/api/guilds/:guildId/automations/:id', requireAuth, requireGuildAccess, (req: AuthenticatedRequest, res) => {
  const { guildId, id } = req.params;
  const updated = db.updateAutomation(id, req.body);

  if (!updated) {
    return res.status(404).json({ error: 'Automation rule not found.' });
  }

  db.addAuditLog({
    guildId,
    userId: req.user!.id,
    userName: req.user!.username,
    action: 'AUTOMATION_UPDATE',
    target: id,
    details: { name: updated.name, enabled: updated.enabled },
    status: 'SUCCESS',
  });

  res.json(updated);
});

featuresRouter.delete('/api/guilds/:guildId/automations/:id', requireAuth, requireGuildAccess, (req: AuthenticatedRequest, res) => {
  const { guildId, id } = req.params;
  const deleted = db.deleteAutomation(id);

  if (!deleted) {
    return res.status(404).json({ error: 'Automation rule not found.' });
  }

  db.addAuditLog({
    guildId,
    userId: req.user!.id,
    userName: req.user!.username,
    action: 'AUTOMATION_DELETE',
    target: id,
    status: 'SUCCESS',
  });

  res.json({ success: true, id });
});

// --- Audit Logs ---
featuresRouter.get('/api/guilds/:guildId/audit-logs', requireAuth, requireGuildAccess, (req: AuthenticatedRequest, res) => {
  const { guildId } = req.params;
  const limit = Math.min(parseInt((req.query.limit as string) || '50', 10), 200);
  const logs = db.getGuildAuditLogs(guildId, limit);
  res.json(logs);
});
