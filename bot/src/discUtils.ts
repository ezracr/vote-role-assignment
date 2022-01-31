import { GuildMember, Guild, Message } from 'discord.js'
import client from './client'

const fetchReturnGuild = async (guildId: string | Guild): Promise<Guild> => (
  typeof guildId === 'string' ? client.guilds.fetch(guildId) : guildId
)

/**
 * Fetch a discord user, it's done to get access to user's roles, ect, or to just fetch a user.
 * @param guildId Server(guild) id.
 * @param userId User id.
 */
export const fetchMember = async (guildId: string | Guild, userId: string): Promise<GuildMember | undefined> => {
  const guild = await fetchReturnGuild(guildId)
  const member = await guild.members.fetch(userId)
  return member
}

export const convertIdToUserTag = (userId: string): string => `<@!${userId}>`
export const convertIdToRoleTag = (groupId: string): string => `<@&${groupId}>`

export const convertIdsToUserTags = (userIds: string[]): string => userIds.map((id) => convertIdToUserTag(id)).join(', ')

export const convertIdsToRoleTags = (roleIds: string[]): string => roleIds.map((id) => convertIdToRoleTag(id)).join(', ')

export const assignRoleById = async (guildId: string | Guild, userId: string, roleId: string): Promise<void> => {
  try {
    const member = await fetchMember(guildId, userId)
    if (member) {
      await member.roles.add(roleId)
    }
  } catch (e: unknown) {
    console.log(e) // eslint-disable-line no-console
  }
}

const findRoleIdByName = async (guildId: string | Guild, roleName: string): Promise<string | undefined> => {
  const guild = await fetchReturnGuild(guildId)
  const roleRes = guild.roles.cache.find((role) => role.name === roleName)
  return roleRes?.id
}

export const assignRoleByName = async (guildId: string | Guild, userId: string, roleName: string): Promise<void> => {
  try {
    const guild = await fetchReturnGuild(guildId)
    const roleId = await findRoleIdByName(guild, roleName)
    if (roleId) {
      await assignRoleById(guild, userId, roleId)
    }
  } catch (e: unknown) {
    console.log(e) // eslint-disable-line no-console
  }
}

const removeRoleById = async (guildId: string | Guild, userId: string, roleId: string): Promise<void> => {
  const member = await fetchMember(guildId, userId)
  if (member) {
    await member.roles.remove(roleId)
  }
}

export const removeRoleByName = async (guildId: string | Guild, userId: string, roleName: string): Promise<void> => {
  const guild = await fetchReturnGuild(guildId)
  const roleId = await findRoleIdByName(guild, roleName)
  if (roleId) {
    await removeRoleById(guild, userId, roleId)
  }
}

export const fetchMessageById = async (currMsg: Message<boolean>, msgId: string): Promise<Message<boolean>> => (
  currMsg.channel.messages.fetch(msgId)
)

export const unpinMessageByMessageId = async (currMsg: Message<boolean>, msgId: string): Promise<void> => {
  try {
    const msg = await fetchMessageById(currMsg, msgId)
    if (msg.pinned) {
      await msg.unpin()
    }
  } catch (e: unknown) {
    console.log(e) // eslint-disable-line no-console
  }
}

export const removeMessageByMessageId = async (currMsg: Message<boolean>, msgId: string): Promise<void> => {
  const msg = await fetchMessageById(currMsg, msgId)
  await msg.delete()
}

export const pinMessage = async (msg?: Message<boolean>): Promise<void> => {
  try {
    await msg?.pin()
  } catch (e: unknown) {
    console.log(e) // eslint-disable-line no-console
  }
}

const fetchReturnMember = async (guildId: string | Guild, userId: string | GuildMember): Promise<GuildMember | undefined> => {
  const guild = await fetchReturnGuild(guildId)
  return typeof userId === 'string' ? fetchMember(guild, userId) : userId
}

export const hasSomeRoles = async (guildId: string, userId: string | GuildMember, roleIds: string | string[]): Promise<boolean> => {
  const member = await fetchReturnMember(guildId, userId)
  const normRoles = typeof roleIds === 'string' ? [roleIds] : roleIds
  return member?.roles.cache.some((r) => normRoles.includes(r.id)) ?? false
}
