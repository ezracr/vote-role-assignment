import dsc = require('discord.js')
import axios = require('axios')

import client from '../client'

/**
 * Fetch a discord user, it's done to get access to user's roles, ect, or to just fetch a user.
 * @param guildId Server(guild) id.
 * @param userId User id.
 */
export const fetchMember = async (guildId: string, userId: string): Promise<dsc.GuildMember | undefined> => {
  const guild = await client.guilds.fetch(guildId)
  const member = guild.members.cache.get(userId)
  return member
}

export const convertIdToUserTag = (userId: string): string => `<@!${userId}>`
export const convertIdToGroupTag = (groupId: string): string => `<@&${groupId}>`

export const genLikeButton = (count = 0): dsc.MessageButton => new dsc.MessageButton({
  style: 'SECONDARY',
  customId: 'like',
  label: String(count),
  emoji: '✅',
})

export const genDislikeButton = (count = 0): dsc.MessageButton => new dsc.MessageButton({
  style: 'SECONDARY',
  customId: 'dislike',
  label: String(count),
  emoji: '❌',
})

export const genButton = (id: 'like' | 'dislike', count: number): dsc.MessageButton => id === 'like' ? genLikeButton(count) : genDislikeButton(count)

export const fetchDocsTitle = async (msg: dsc.Message<boolean>, url: string): Promise<string> => {
  const msgLoaded = await msg.channel.messages.fetch(msg.id)
  if (msgLoaded.embeds[0]?.title) {
    console.log('embeds')
    return msgLoaded.embeds[0].title
  }
  const res = await axios.default.get(url, { timeout: 1000 })
  if (typeof res.data === 'string') {
    const matched = res.data.match(/<title>([^<]*)<\/title>/i)
    return matched?.[1] ?? ''
  }
  return ''
}
