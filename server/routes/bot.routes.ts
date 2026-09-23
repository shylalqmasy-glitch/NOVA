import { Router } from 'express';
import { discordService } from '../services/discord.service.js';
import { config } from '../config.js';

export const botRouter = Router();

botRouter.get('/api/bot/invite', (req, res) => {
  const guildId = req.query.guildId as string | undefined;
  const inviteUrl = discordService.getBotInviteUrl(guildId);
  res.json({ inviteUrl, clientId: config.discord.clientId });
});

botRouter.get('/api/bot/status', async (req, res) => {
  if (!config.discord.botToken || config.discord.botToken === 'your_discord_bot_token_here') {
    return res.json({ configured: false, botUser: null });
  }

  try {
    const resBot = await fetch(`${config.discord.apiBase}/users/@me`, {
      headers: { Authorization: `Bot ${config.discord.botToken}` },
    });

    if (!resBot.ok) {
      return res.json({ configured: false, error: 'Invalid Bot Token', status: resBot.status });
    }

    const botUser = await resBot.json();
    return res.json({
      configured: true,
      botUser: {
        id: botUser.id,
        username: botUser.username,
        discriminator: botUser.discriminator,
        avatar: botUser.avatar,
      },
    });
  } catch (err: any) {
    return res.json({ configured: false, error: err.message });
  }
});
