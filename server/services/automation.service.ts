import { db, AutomationRule, WelcomeConfig } from '../db/index.js';
import { discordService, DiscordEmbed } from './discord.service.js';

export class AutomationService {
  /**
   * Dispatches simulation or live execution of member join automation
   */
  public async handleMemberJoin(guildId: string, member: { id: string; username: string; mention: string }): Promise<{
    rolesAssigned: string[];
    messagesSent: number;
    errors: string[];
  }> {
    const results = {
      rolesAssigned: [] as string[],
      messagesSent: 0,
      errors: [] as string[],
    };

    // 1. Check Welcome System
    const guildConfig = db.getGuildConfig(guildId);
    const welcome = guildConfig.welcomeConfig;
    if (welcome?.enabled && welcome.channelId) {
      const channelId = welcome.channelId;
      try {
        const guild = await discordService.getGuild(guildId);
        const memberCount = guild.approximate_member_count || '1';

        // Variable substitution
        const replaceVars = (str: string) => {
          return str
            .replace(/\{user\}/g, `<@${member.id}>`)
            .replace(/\{username\}/g, member.username)
            .replace(/\{server\}/g, guild.name)
            .replace(/\{member_count\}/g, String(memberCount));
        };

        const content = replaceVars(welcome.messageText || 'Welcome {user} to {server}!');
        let embeds: DiscordEmbed[] | undefined = undefined;

        if (welcome.embed?.enabled) {
          const colorInt = parseInt((welcome.embed.color || '#7c3aed').replace('#', ''), 16);
          embeds = [
            {
              title: replaceVars(welcome.embed.title || 'Welcome!'),
              description: replaceVars(welcome.embed.description || 'Welcome to our server!'),
              color: isNaN(colorInt) ? 0x7c3aed : colorInt,
              footer: welcome.embed.footerText ? { text: replaceVars(welcome.embed.footerText) } : undefined,
              thumbnail: welcome.embed.thumbnailUrl ? { url: welcome.embed.thumbnailUrl } : undefined,
              timestamp: new Date().toISOString(),
            },
          ];
        }

        await discordService.sendMessage(channelId, { content, embeds });
        results.messagesSent++;

        // Auto join role
        const joinRoleId = welcome.joinRoleId;
        if (joinRoleId) {
          try {
            await discordService.addMemberRole(guildId, member.id, joinRoleId);
            results.rolesAssigned.push(joinRoleId);
          } catch (rErr: any) {
            results.errors.push(`Join Role Error: ${rErr.message}`);
          }
        }

        db.addAuditLog({
          guildId,
          userId: member.id,
          userName: member.username,
          action: 'WELCOME_TRIGGERED',
          target: welcome.channelId,
          details: { welcomeAssigned: true, joinRoleId: welcome.joinRoleId },
          status: 'SUCCESS',
        });
      } catch (err: any) {
        results.errors.push(`Welcome dispatch failed: ${err.message}`);
        db.addAuditLog({
          guildId,
          userId: member.id,
          userName: member.username,
          action: 'WELCOME_TRIGGERED',
          details: { error: err.message },
          status: 'FAILED',
          error: err.message,
        });
      }
    }

    // 2. Check Custom Automation Rules for 'ON_MEMBER_JOIN'
    const automations = db.getGuildAutomations(guildId).filter(a => a.enabled && a.trigger === 'ON_MEMBER_JOIN');
    for (const rule of automations) {
      for (const action of rule.actions) {
        try {
          if (action.type === 'ASSIGN_ROLE' && action.config.roleId) {
            await discordService.addMemberRole(guildId, member.id, action.config.roleId);
            results.rolesAssigned.push(action.config.roleId);
          } else if (action.type === 'SEND_MESSAGE' && action.config.channelId && action.config.message) {
            const parsed = action.config.message
              .replace(/\{user\}/g, `<@${member.id}>`)
              .replace(/\{username\}/g, member.username);
            await discordService.sendMessage(action.config.channelId, { content: parsed });
            results.messagesSent++;
          }
        } catch (actErr: any) {
          results.errors.push(`Rule "${rule.name}" failed: ${actErr.message}`);
        }
      }
    }

    return results;
  }
}

export const automationService = new AutomationService();
