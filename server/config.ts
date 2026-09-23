import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const config = {
  port: 3000,
  appUrl: process.env.APP_URL || 'http://localhost:3000',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  discord: {
    clientId: process.env.DISCORD_CLIENT_ID || '',
    clientSecret: process.env.DISCORD_CLIENT_SECRET || '',
    botToken: process.env.DISCORD_BOT_TOKEN || '',
    apiBase: 'https://discord.com/api/v10',
    scopes: ['identify', 'email', 'guilds', 'guilds.members.read'],
  },
  sessionSecret: process.env.SESSION_SECRET || 'nova_default_super_secret_session_key_2026',
  dataPath: path.resolve(process.cwd(), 'data'),
};

export function getMissingCredentials(): {
  hasClientId: boolean;
  hasClientSecret: boolean;
  hasBotToken: boolean;
  hasGeminiKey: boolean;
} {
  return {
    hasClientId: Boolean(config.discord.clientId && config.discord.clientId !== '123456789012345678'),
    hasClientSecret: Boolean(config.discord.clientSecret && config.discord.clientSecret !== 'your_discord_client_secret_here'),
    hasBotToken: Boolean(config.discord.botToken && config.discord.botToken !== 'your_discord_bot_token_here'),
    hasGeminiKey: Boolean(config.geminiApiKey && config.geminiApiKey !== 'MY_GEMINI_API_KEY'),
  };
}
