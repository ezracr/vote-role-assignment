import dsc = require('discord.js')

import { SettingsData } from '../db/dbTypes'
import { genLikeButton, genDislikeButton, genMessageContent } from './handlUtils'

const escapeRegExp = (text = ''): string => text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')

const extractUrl = (msg: dsc.Message<boolean>): string | null => {
  const res = msg.content.match(new RegExp(`(?:\\s|^)(${escapeRegExp('https://docs.google.com/document/d/')}[\\S]+?)(?:\\s|$)`, 'i'))
  if (res?.[1]) {
    return res[1]
  }
  return null
}

class MessageCreateHandler {
  constructor(private config: SettingsData, private msg: dsc.Message<boolean>) { } // eslint-disable-line @typescript-eslint/no-parameter-properties

  process = (): { messageContent: string, actionRow: dsc.MessageActionRow } | null => {
    if (!this.msg.author.bot) {
      const url = extractUrl(this.msg)
      if (url) {
        const actionRow = new dsc.MessageActionRow({
          components: [genLikeButton(), genDislikeButton()]
        })
        const messageContent = genMessageContent(this.msg.author, url)
        return { messageContent, actionRow }
      }
    }
    return null
  }
}

export default MessageCreateHandler
