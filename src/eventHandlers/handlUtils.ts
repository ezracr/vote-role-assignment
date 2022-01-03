import dsc = require('discord.js')
import axios = require('axios')

import client from '../client'

export const fetchMember = async (guildId: string, userId: string): Promise<dsc.GuildMember | undefined> => {
  const guild = await client.guilds.fetch(guildId)
  const member = guild.members.cache.get(userId)
  return member
}

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

const genInFavorMessage = (inFavor = ''): string => `**Voted in favor**: ${inFavor}\n`
const genAgainstMessage = (against = ''): string => `**Voted against**: ${against}\n`

const genVotersString = (voters: string[]): string => voters.join(', ')

export const convertIdToUserTag = (userId: string): string => `<@!${userId}>`
export const convertIdToGroupTag = (groupId: string): string => `<@&${groupId}>`

type InnerMessageArg = {
  authorId: string;
  url: string;
  title: string;
  inFavor?: string[];
  against?: string[];
}

export class InnerMessage {
  authorId: InnerMessageArg['authorId']
  url: InnerMessageArg['url']
  title: InnerMessageArg['title']
  inFavor: NonNullable<InnerMessageArg['inFavor']>
  against: NonNullable<InnerMessageArg['against']>

  constructor(arg: InnerMessageArg) {
    this.authorId = arg.authorId
    this.url = arg.url
    this.inFavor = arg.inFavor ?? []
    this.against = arg.against ?? []
    this.title = arg.title
  }

  toString(): string {
    return `**Author**: ${convertIdToUserTag(this.authorId)}.
**Title**: ${this.title}.
**Link**: ${this.url}.
${genInFavorMessage(genVotersString(this.inFavor))}${genAgainstMessage(genVotersString(this.against))}`
  }

  static from({ oldMessage, inFavor, against }: { oldMessage: string } & Pick<InnerMessageArg, 'inFavor' | 'against'>) {
    const msgSplit = oldMessage.split('\n')
    const usrIdLine = msgSplit[0]
    const titleLine = msgSplit[1]
    const urlLine = msgSplit[2]
    if (usrIdLine && urlLine) {
      const id = usrIdLine.slice(usrIdLine.indexOf('<') + 3, usrIdLine.indexOf('>'))
      const url = urlLine.slice(10, urlLine.length - 1)
      const title = titleLine.slice(11, titleLine.length - 1)
      return new InnerMessage({ authorId: id, url, inFavor, against, title })
    }
  }
}

export const fetchDocsTitle = async (msg: dsc.Message<boolean>, url: string): Promise<string> => {
  const msgLoaded = await msg.channel.messages.fetch(msg.id)
  if (msgLoaded.embeds[0]?.title) {
    return msgLoaded.embeds[0].title
  }
  const res = await axios.default.get(url, { timeout: 1000 })
  if (typeof res.data === 'string') {
    const matched = res.data.match(/<title>([^<]*)<\/title>/i)
    return matched?.[1] ?? ''
  }
  return ''
}
