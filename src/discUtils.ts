import { GuildMember, Guild } from 'discord.js'
import client from './client'

/**
 * Fetch a discord user, it's done to get access to user's roles, ect, or to just fetch a user.
 * @param guildId Server(guild) id.
 * @param userId User id.
 */
export const fetchMember = async (guildId: string, userId: string): Promise<GuildMember | undefined> => {
  const guild = await client.guilds.fetch(guildId)
  const member = guild.members.cache.get(userId)
  return member
}

export const convertIdToUserTag = (userId: string): string => `<@!${userId}>`
export const convertIdToRoleTag = (groupId: string): string => `<@&${groupId}>`

const fetchReturnGuild = async (guildId: string | Guild): Promise<Guild> => (
  typeof guildId === 'string' ? client.guilds.fetch(guildId) : guildId
)

export const assignRoleId = async (guildId: string | Guild, userId: string, roleId: string): Promise<void> => {
  const guild = await fetchReturnGuild(guildId)
  const member = guild.members.cache.get(userId)
  if (member) {
    await member.roles.add(roleId)
  }
}

const findRoleIdByName = async (guildId: string | Guild, roleName: string): Promise<string | undefined> => {
  const guild = await fetchReturnGuild(guildId)
  const roleRes = guild.roles.cache.find((role) => role.name === roleName)
  return roleRes?.id
}

export const assignRoleName = async (guildId: string | Guild, userId: string, roleName: string): Promise<void> => {
  const guild = await fetchReturnGuild(guildId)
  const roleId = await findRoleIdByName(guild, roleName)
  if (roleId) {
    await assignRoleId(guild, userId, roleId)
  }
}
