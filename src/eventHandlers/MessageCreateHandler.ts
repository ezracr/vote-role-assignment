import { Message, MessageActionRow } from 'discord.js'

import Managers from '../db/managers'
import { ChSettingsData } from '../db/dbTypes'
import { genLikeButton, genDislikeButton, fetchMember, fetchDocsTitle } from './handlUtils'
import InnerMessage from './InnerMessage'

/**
 * Needed if you want to construct regex from a string to escape any special character
 */
const escapeRegExp = (text = ''): string => text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')

const docUrlRegex = new RegExp(
  `(?:\\s|^)((?:${escapeRegExp('https://docs.google.com/document/d/')}|${escapeRegExp('https://docs.google.com/spreadsheets/d/')})[\\S]+?)(?:\\s|$|,|\\.|;|:)`,
  'i'
)

const extractUrl = (msg: Message<boolean>): string | null => {
  const res = msg.content.match(docUrlRegex)
  if (res?.[1]) {
    return res[1]
  }
  return null
}

const isAlreadyAwarded = async (config: ChSettingsData, msg: Message<boolean>): Promise<boolean> => {
  if (msg.guildId) {
    const member = await fetchMember(msg.guildId, msg.author.id)
    return member?.roles.cache.some((r) => config.awarded_role === r.id) ?? false
  }
  return false
}

class MessageCreateHandler {
  constructor(private chConfig: ChSettingsData, private msg: Message<boolean>, private managers: Managers) { } // eslint-disable-line @typescript-eslint/no-parameter-properties

  process = async (): Promise<{ messageContent: string, actionRow?: MessageActionRow } | null> => {
    if (!this.msg.author.bot) {
      const url = extractUrl(this.msg)
      if (url) {
        const isAwarded = await isAlreadyAwarded(this.chConfig, this.msg)
        if (isAwarded) {
          const title = await fetchDocsTitle(this.msg, url)
          await this.managers.documents.insert({
            user: {
              id: this.msg.author.id,
              tag: this.msg.author.tag,
            },
            link: url,
            channel_id: this.msg.channelId,
            title,
          })
          return { messageContent: 'Your document has been successfully saved to the vault.' }
        } else {
          const actionRow = new MessageActionRow({
            components: [genLikeButton(), genDislikeButton()]
          })
          const innerMsg = new InnerMessage({ authorId: this.msg.author.id, url })
          return { messageContent: innerMsg.toString(), actionRow }
        }
      }
    }
    return null
  }
}

export default MessageCreateHandler
