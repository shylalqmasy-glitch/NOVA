import { Request, Response, NextFunction } from 'express';
import { db, UserRecord } from '../db/index.js';
import { discordService } from '../services/discord.service.js';

export interface AuthenticatedRequest extends Request {
  user?: UserRecord;
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const sessionId = req.cookies?.nova_session || req.headers.authorization?.replace('Bearer ', '');
  if (!sessionId) {
    return res.status(401).json({ error: 'Unauthorized: Session missing. Please log in with Discord.' });
  }

  const session = db.getSession(sessionId);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized: Session expired or invalid. Please re-authenticate.' });
  }

  const user = db.getUser(session.userId);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized: User not found in database.' });
  }

  req.user = user;
  next();
}

/**
 * Ensures the authenticated user has permissions to manage the target guild.
 * Permission bit 0x20 = MANAGE_GUILD, 0x8 = ADMINISTRATOR
 */
export async function requireGuildAccess(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized: User required' });
  }

  const guildId = req.params.guildId || req.body?.guildId;
  if (!guildId) {
    return res.status(400).json({ error: 'Guild ID is required for this operation.' });
  }

  try {
    const guilds = await discordService.getUserGuilds(req.user.accessToken);
    const targetGuild = guilds.find((g) => g.id === guildId);

    if (!targetGuild) {
      return res.status(403).json({ error: 'Forbidden: You are not a member of this Discord server.' });
    }

    const perms = BigInt(targetGuild.permissions || '0');
    const isAdmin = (perms & 8n) === 8n;
    const canManageGuild = (perms & 32n) === 32n;

    if (!isAdmin && !canManageGuild && !targetGuild.owner) {
      return res.status(403).json({
        error: 'Forbidden: You need "Manage Server" or "Administrator" permission in Discord to manage this server via NOVA.',
      });
    }

    next();
  } catch (err: any) {
    return res.status(500).json({ error: `Guild authorization failed: ${err.message}` });
  }
}
