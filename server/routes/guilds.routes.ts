import { Router } from 'express';
import { requireAuth, requireGuildAccess, AuthenticatedRequest } from '../middleware/auth.js';
import { discordService, DiscordApiError } from '../services/discord.service.js';
import { db } from '../db/index.js';

export const guildsRouter = Router();

// 1. Get User's Manageable Guilds + Bot Presence
guildsRouter.get('/api/guilds', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userToken = req.user!.accessToken;
    const allGuilds = await discordService.getUserGuilds(userToken);

    // Filter to guilds where user has Administrator (0x8) or Manage Guild (0x20) or is Owner
    const manageable = allGuilds.filter((g) => {
      const perms = BigInt(g.permissions || '0');
      return g.owner || (perms & 8n) === 8n || (perms & 32n) === 32n;
    });

    // Check bot presence for each guild in parallel
    const guildsWithBotStatus = await Promise.all(
      manageable.map(async (guild) => {
        const botStatus = await discordService.checkBotInGuild(guild.id);
        return {
          id: guild.id,
          name: guild.name,
          icon: guild.icon,
          owner: guild.owner,
          permissions: guild.permissions,
          approximateMemberCount: guild.approximate_member_count,
          botInstalled: botStatus.inGuild,
        };
      })
    );

    res.json(guildsWithBotStatus);
  } catch (err: any) {
    res.status(500).json({ error: `Failed to fetch user guilds: ${err.message}` });
  }
});

// 2. Guild Overview
guildsRouter.get('/api/guilds/:guildId', requireAuth, requireGuildAccess, async (req: AuthenticatedRequest, res) => {
  const { guildId } = req.params;
  try {
    const botCheck = await discordService.checkBotInGuild(guildId);
    let guildData = null;
    let rolesCount = 0;
    let channelsCount = 0;

    if (botCheck.inGuild) {
      guildData = await discordService.getGuild(guildId);
      const [channels, roles] = await Promise.all([
        discordService.getGuildChannels(guildId).catch(() => []),
        discordService.getGuildRoles(guildId).catch(() => []),
      ]);
      rolesCount = roles.length;
      channelsCount = channels.length;
    }

    const configRecord = db.getGuildConfig(guildId);
    const recentAuditLogs = db.getGuildAuditLogs(guildId, 10);

    res.json({
      guildId,
      botInstalled: botCheck.inGuild,
      guild: guildData,
      rolesCount,
      channelsCount,
      config: configRecord,
      recentAuditLogs,
    });
  } catch (err: any) {
    res.status(500).json({ error: `Failed to fetch guild details: ${err.message}` });
  }
});

// --- Channels API ---
guildsRouter.get('/api/guilds/:guildId/channels', requireAuth, requireGuildAccess, async (req: AuthenticatedRequest, res) => {
  const { guildId } = req.params;
  try {
    const channels = await discordService.getGuildChannels(guildId);
    res.json(channels);
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

guildsRouter.post('/api/guilds/:guildId/channels', requireAuth, requireGuildAccess, async (req: AuthenticatedRequest, res) => {
  const { guildId } = req.params;
  const { name, type, topic, parent_id, nsfw } = req.body;

  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: 'Channel name is required.' });
  }

  try {
    const channel = await discordService.createChannel(guildId, {
      name: name.toLowerCase().replace(/\s+/g, '-'),
      type: typeof type === 'number' ? type : 0, // 0 = text, 2 = voice, 4 = category
      topic,
      parent_id: parent_id || null,
      nsfw: Boolean(nsfw),
    });

    db.addAuditLog({
      guildId,
      userId: req.user!.id,
      userName: req.user!.username,
      action: 'CHANNEL_CREATE',
      target: channel.id,
      details: { name: channel.name, type: channel.type },
      status: 'SUCCESS',
    });

    res.status(201).json(channel);
  } catch (err: any) {
    db.addAuditLog({
      guildId,
      userId: req.user!.id,
      userName: req.user!.username,
      action: 'CHANNEL_CREATE',
      details: { name, type, error: err.message },
      status: 'FAILED',
      error: err.message,
    });
    res.status(err.status || 500).json({ error: err.message });
  }
});

guildsRouter.patch('/api/guilds/:guildId/channels/:channelId', requireAuth, requireGuildAccess, async (req: AuthenticatedRequest, res) => {
  const { guildId, channelId } = req.params;
  const { name, topic, position, parent_id } = req.body;

  try {
    const updated = await discordService.editChannel(channelId, {
      name,
      topic,
      position,
      parent_id,
    });

    db.addAuditLog({
      guildId,
      userId: req.user!.id,
      userName: req.user!.username,
      action: 'CHANNEL_EDIT',
      target: channelId,
      details: { name, topic },
      status: 'SUCCESS',
    });

    res.json(updated);
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

guildsRouter.delete('/api/guilds/:guildId/channels/:channelId', requireAuth, requireGuildAccess, async (req: AuthenticatedRequest, res) => {
  const { guildId, channelId } = req.params;

  try {
    await discordService.deleteChannel(channelId);

    db.addAuditLog({
      guildId,
      userId: req.user!.id,
      userName: req.user!.username,
      action: 'CHANNEL_DELETE',
      target: channelId,
      status: 'SUCCESS',
    });

    res.json({ success: true, channelId });
  } catch (err: any) {
    db.addAuditLog({
      guildId,
      userId: req.user!.id,
      userName: req.user!.username,
      action: 'CHANNEL_DELETE',
      target: channelId,
      status: 'FAILED',
      error: err.message,
    });
    res.status(err.status || 500).json({ error: err.message });
  }
});

guildsRouter.post('/api/guilds/:guildId/channels/:channelId/lock', requireAuth, requireGuildAccess, async (req: AuthenticatedRequest, res) => {
  const { guildId, channelId } = req.params;
  const { lock } = req.body;

  try {
    // Everyone role ID is identical to the guild ID in Discord
    const everyoneRoleId = guildId;
    await discordService.lockChannel(channelId, everyoneRoleId, Boolean(lock));

    db.addAuditLog({
      guildId,
      userId: req.user!.id,
      userName: req.user!.username,
      action: lock ? 'CHANNEL_LOCK' : 'CHANNEL_UNLOCK',
      target: channelId,
      status: 'SUCCESS',
    });

    res.json({ success: true, locked: Boolean(lock) });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// --- Roles API ---
guildsRouter.get('/api/guilds/:guildId/roles', requireAuth, requireGuildAccess, async (req: AuthenticatedRequest, res) => {
  const { guildId } = req.params;
  try {
    const roles = await discordService.getGuildRoles(guildId);
    // Sort descending by position
    roles.sort((a, b) => b.position - a.position);
    res.json(roles);
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

guildsRouter.post('/api/guilds/:guildId/roles', requireAuth, requireGuildAccess, async (req: AuthenticatedRequest, res) => {
  const { guildId } = req.params;
  const { name, color, hoist, mentionable, permissions } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Role name is required.' });
  }

  try {
    let colorInt = 0;
    if (typeof color === 'string') {
      colorInt = parseInt(color.replace('#', ''), 16) || 0;
    } else if (typeof color === 'number') {
      colorInt = color;
    }

    const role = await discordService.createRole(guildId, {
      name,
      color: colorInt,
      hoist: Boolean(hoist),
      mentionable: Boolean(mentionable),
      permissions: permissions || '0',
    });

    db.addAuditLog({
      guildId,
      userId: req.user!.id,
      userName: req.user!.username,
      action: 'ROLE_CREATE',
      target: role.id,
      details: { name: role.name, color: role.color },
      status: 'SUCCESS',
    });

    res.status(201).json(role);
  } catch (err: any) {
    db.addAuditLog({
      guildId,
      userId: req.user!.id,
      userName: req.user!.username,
      action: 'ROLE_CREATE',
      details: { name, error: err.message },
      status: 'FAILED',
      error: err.message,
    });
    res.status(err.status || 500).json({ error: err.message });
  }
});

guildsRouter.patch('/api/guilds/:guildId/roles/:roleId', requireAuth, requireGuildAccess, async (req: AuthenticatedRequest, res) => {
  const { guildId, roleId } = req.params;
  const { name, color, hoist, mentionable, permissions } = req.body;

  try {
    let colorInt = undefined;
    if (typeof color === 'string') {
      colorInt = parseInt(color.replace('#', ''), 16) || 0;
    } else if (typeof color === 'number') {
      colorInt = color;
    }

    const updated = await discordService.editRole(guildId, roleId, {
      name,
      color: colorInt,
      hoist,
      mentionable,
      permissions,
    });

    db.addAuditLog({
      guildId,
      userId: req.user!.id,
      userName: req.user!.username,
      action: 'ROLE_EDIT',
      target: roleId,
      details: { name: updated.name },
      status: 'SUCCESS',
    });

    res.json(updated);
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

guildsRouter.delete('/api/guilds/:guildId/roles/:roleId', requireAuth, requireGuildAccess, async (req: AuthenticatedRequest, res) => {
  const { guildId, roleId } = req.params;

  try {
    await discordService.deleteRole(guildId, roleId);

    db.addAuditLog({
      guildId,
      userId: req.user!.id,
      userName: req.user!.username,
      action: 'ROLE_DELETE',
      target: roleId,
      status: 'SUCCESS',
    });

    res.json({ success: true, roleId });
  } catch (err: any) {
    db.addAuditLog({
      guildId,
      userId: req.user!.id,
      userName: req.user!.username,
      action: 'ROLE_DELETE',
      target: roleId,
      status: 'FAILED',
      error: err.message,
    });
    res.status(err.status || 500).json({ error: err.message });
  }
});

// --- Members API ---
guildsRouter.get('/api/guilds/:guildId/members', requireAuth, requireGuildAccess, async (req: AuthenticatedRequest, res) => {
  const { guildId } = req.params;
  const limit = Math.min(parseInt((req.query.limit as string) || '100', 10), 1000);

  try {
    const members = await discordService.getGuildMembers(guildId, limit);
    res.json(members);
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

guildsRouter.put('/api/guilds/:guildId/members/:memberId/roles/:roleId', requireAuth, requireGuildAccess, async (req: AuthenticatedRequest, res) => {
  const { guildId, memberId, roleId } = req.params;

  try {
    await discordService.addMemberRole(guildId, memberId, roleId);

    db.addAuditLog({
      guildId,
      userId: req.user!.id,
      userName: req.user!.username,
      action: 'MEMBER_ROLE_ADD',
      target: memberId,
      details: { roleId },
      status: 'SUCCESS',
    });

    res.json({ success: true });
  } catch (err: any) {
    db.addAuditLog({
      guildId,
      userId: req.user!.id,
      userName: req.user!.username,
      action: 'MEMBER_ROLE_ADD',
      target: memberId,
      details: { roleId, error: err.message },
      status: 'FAILED',
      error: err.message,
    });
    res.status(err.status || 500).json({ error: err.message });
  }
});

guildsRouter.delete('/api/guilds/:guildId/members/:memberId/roles/:roleId', requireAuth, requireGuildAccess, async (req: AuthenticatedRequest, res) => {
  const { guildId, memberId, roleId } = req.params;

  try {
    await discordService.removeMemberRole(guildId, memberId, roleId);

    db.addAuditLog({
      guildId,
      userId: req.user!.id,
      userName: req.user!.username,
      action: 'MEMBER_ROLE_REMOVE',
      target: memberId,
      details: { roleId },
      status: 'SUCCESS',
    });

    res.json({ success: true });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

guildsRouter.post('/api/guilds/:guildId/members/:memberId/timeout', requireAuth, requireGuildAccess, async (req: AuthenticatedRequest, res) => {
  const { guildId, memberId } = req.params;
  const { durationMinutes = 60 } = req.body;

  try {
    const updated = await discordService.timeoutMember(guildId, memberId, Number(durationMinutes));

    db.addAuditLog({
      guildId,
      userId: req.user!.id,
      userName: req.user!.username,
      action: durationMinutes > 0 ? 'MEMBER_TIMEOUT' : 'MEMBER_TIMEOUT_REMOVE',
      target: memberId,
      details: { durationMinutes },
      status: 'SUCCESS',
    });

    res.json({ success: true, member: updated });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

guildsRouter.post('/api/guilds/:guildId/members/:memberId/kick', requireAuth, requireGuildAccess, async (req: AuthenticatedRequest, res) => {
  const { guildId, memberId } = req.params;
  const { reason = 'Kicked via NOVA Dashboard' } = req.body;

  try {
    await discordService.kickMember(guildId, memberId, reason);

    db.addAuditLog({
      guildId,
      userId: req.user!.id,
      userName: req.user!.username,
      action: 'MEMBER_KICK',
      target: memberId,
      details: { reason },
      status: 'SUCCESS',
    });

    res.json({ success: true });
  } catch (err: any) {
    db.addAuditLog({
      guildId,
      userId: req.user!.id,
      userName: req.user!.username,
      action: 'MEMBER_KICK',
      target: memberId,
      details: { reason, error: err.message },
      status: 'FAILED',
      error: err.message,
    });
    res.status(err.status || 500).json({ error: err.message });
  }
});

guildsRouter.post('/api/guilds/:guildId/members/:memberId/ban', requireAuth, requireGuildAccess, async (req: AuthenticatedRequest, res) => {
  const { guildId, memberId } = req.params;
  const { reason = 'Banned via NOVA Moderation', deleteMessageDays = 0 } = req.body;

  try {
    await discordService.banMember(guildId, memberId, reason, deleteMessageDays);

    db.addAuditLog({
      guildId,
      userId: req.user!.id,
      userName: req.user!.username,
      action: 'MEMBER_BAN',
      target: memberId,
      details: { reason, deleteMessageDays },
      status: 'SUCCESS',
    });

    res.json({ success: true });
  } catch (err: any) {
    db.addAuditLog({
      guildId,
      userId: req.user!.id,
      userName: req.user!.username,
      action: 'MEMBER_BAN',
      target: memberId,
      details: { reason, error: err.message },
      status: 'FAILED',
      error: err.message,
    });
    res.status(err.status || 500).json({ error: err.message });
  }
});

// --- Messages API ---
guildsRouter.post('/api/guilds/:guildId/channels/:channelId/messages', requireAuth, requireGuildAccess, async (req: AuthenticatedRequest, res) => {
  const { guildId, channelId } = req.params;
  const { content, embed } = req.body;

  if (!content && !embed) {
    return res.status(400).json({ error: 'Either message content or embed must be provided.' });
  }

  try {
    let embeds = undefined;
    if (embed && (embed.title || embed.description)) {
      const colorInt = embed.color ? parseInt(embed.color.replace('#', ''), 16) : 0x7c3aed;
      embeds = [
        {
          title: embed.title,
          description: embed.description,
          color: isNaN(colorInt) ? 0x7c3aed : colorInt,
          footer: embed.footerText ? { text: embed.footerText } : undefined,
          thumbnail: embed.thumbnailUrl ? { url: embed.thumbnailUrl } : undefined,
          timestamp: new Date().toISOString(),
        },
      ];
    }

    const sent = await discordService.sendMessage(channelId, {
      content: content || undefined,
      embeds,
    });

    db.addAuditLog({
      guildId,
      userId: req.user!.id,
      userName: req.user!.username,
      action: 'MESSAGE_SEND',
      target: channelId,
      details: { messageId: sent.id, hasEmbed: Boolean(embeds) },
      status: 'SUCCESS',
    });

    res.status(201).json(sent);
  } catch (err: any) {
    db.addAuditLog({
      guildId,
      userId: req.user!.id,
      userName: req.user!.username,
      action: 'MESSAGE_SEND',
      target: channelId,
      status: 'FAILED',
      error: err.message,
    });
    res.status(err.status || 500).json({ error: err.message });
  }
});

guildsRouter.delete('/api/guilds/:guildId/channels/:channelId/messages/:messageId', requireAuth, requireGuildAccess, async (req: AuthenticatedRequest, res) => {
  const { guildId, channelId, messageId } = req.params;

  try {
    await discordService.deleteMessage(channelId, messageId);

    db.addAuditLog({
      guildId,
      userId: req.user!.id,
      userName: req.user!.username,
      action: 'MESSAGE_DELETE',
      target: channelId,
      details: { messageId },
      status: 'SUCCESS',
    });

    res.json({ success: true, messageId });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
});
