import { Message, PartialMessage } from 'discord.js'

import Managers from '../db/managers'
import { extractTitleFromFirstMsgEmbed } from './handlUtils'

const messageUpdateHandler = async (oldMessage: Message<boolean> | PartialMessage, newMessage: Message<boolean> | PartialMessage): Promise<void> => {
  try {
    if (!oldMessage.author?.bot && oldMessage.embeds.length === 0 && newMessage.embeds.length > 0) {
      const title = extractTitleFromFirstMsgEmbed(newMessage)
      if (title) {
        const managers = new Managers()
        await managers.submissions.patchByFilter({ usr_message_id: oldMessage.id }, {
          title,
        })
      }
    }
  } catch (e: unknown) {
    console.log(e)
  }
}

export default messageUpdateHandler
