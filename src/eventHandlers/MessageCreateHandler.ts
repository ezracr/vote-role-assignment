import dsc = require('discord.js')

import { ChSettingsData } from '../db/dbTypes'
import { genLikeButton, genDislikeButton, InnerMessage } from './handlUtils'

const escapeRegExp = (text = ''): string => text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')

const extractUrl = (msg: dsc.Message<boolean>): string | null => {
  const res = msg.content.match(new RegExp(`(?:\\s|^)(${escapeRegExp('https://docs.google.com/document/d/')}[\\S]+?)(?:\\s|$)`, 'i'))
  if (res?.[1]) {
    return res[1]
  }
  return null
}

class MessageCreateHandler {
  constructor(private config: ChSettingsData, private msg: dsc.Message<boolean>) { } // eslint-disable-line @typescript-eslint/no-parameter-properties

  process = (): { messageContent: string, actionRow: dsc.MessageActionRow } | null => {
    if (!this.msg.author.bot) {
      const url = extractUrl(this.msg)
      if (url) {
        const actionRow = new dsc.MessageActionRow({
          components: [genLikeButton(), genDislikeButton()]
        })
        const innerMsg = new InnerMessage(this.msg.author.id, url)
        return { messageContent: innerMsg.toString(), actionRow }
      }
    }
    return null
  }
}

export default MessageCreateHandler
