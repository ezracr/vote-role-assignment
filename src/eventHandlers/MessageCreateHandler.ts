import dsc = require('discord.js')

import Managers from '../db/managers'
import { ChSettingsData } from '../db/dbTypes'
import { genLikeButton, genDislikeButton, InnerMessage, fetchMember } from './handlUtils'

const escapeRegExp = (text = ''): string => text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')

const extractUrl = (msg: dsc.Message<boolean>): string | null => {
  const res = msg.content.match(new RegExp(`(?:\\s|^)(${escapeRegExp('https://docs.google.com/document/d/')}[\\S]+?)(?:\\s|$)`, 'i'))
  if (res?.[1]) {
    return res[1]
  }
  return null
}

const isAlreadyAwarded = async (config: ChSettingsData, msg: dsc.Message<boolean>): Promise<boolean> => {
  if (msg.guildId) {
    const member = await fetchMember(msg.guildId, msg.author.id)
    return member?.roles.cache.some((r) => config.awarded_role === r.id) ?? false
  }
  return false
}

class MessageCreateHandler {
  constructor(private chConfig: ChSettingsData, private msg: dsc.Message<boolean>, private managers: Managers) { } // eslint-disable-line @typescript-eslint/no-parameter-properties

  process = async (): Promise<{ messageContent: string, actionRow?: dsc.MessageActionRow } | null> => {
    if (!this.msg.author.bot) {
      const url = extractUrl(this.msg)
      if (url) {
        const isAwarded = await isAlreadyAwarded(this.chConfig, this.msg)
        if (isAwarded) {
          await this.managers.documents.insert({
            user: {
              id: this.msg.author.id,
              tag: this.msg.author.tag,
            },
            link: url,
            ch_sett_id: this.msg.channelId,
          })
          return { messageContent: 'Your document has been successfully saved to the vault.' }
        } else {
          const actionRow = new dsc.MessageActionRow({
            components: [genLikeButton(), genDislikeButton()]
          })
          const innerMsg = new InnerMessage(this.msg.author.id, url)
          return { messageContent: innerMsg.toString(), actionRow }
        }
      }
    }
    return null
  }
}

export default MessageCreateHandler
