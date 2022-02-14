import { Message, PartialMessage } from 'discord.js'

import Managers from '../db/managers'
import { extractTitleDescFromFirstMsgEmbed } from './handlUtils'

const messageUpdateHandler = async (
  oldMessage: Message<boolean> | PartialMessage, newMessage: Message<boolean> | PartialMessage,
): Promise<void> => {
  try {
    if (!oldMessage.author?.bot && oldMessage.embeds.length === 0 && newMessage.embeds.length > 0) {
      const titleDesc = extractTitleDescFromFirstMsgEmbed(newMessage)
      if (titleDesc.title) {
        const managers = new Managers()
        await managers.submissions.update({ usr_message_id: oldMessage.id }, titleDesc)
      }
    }
  } catch (e: unknown) {
    console.log(e) // eslint-disable-line no-console
  }
}

export default messageUpdateHandler
