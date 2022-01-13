import { Message, MessageActionRow, ReplyMessageOptions } from 'discord.js'
import parseUrls from 'url-regex-safe'

import Managers from '../db/managers'
import { ChSettingsData, SubmissionType } from '../db/dbTypes'
import { fetchMember } from '../discUtils'
import config from '../config'
import { genLikeButton, genDislikeButton, fetchSubmTitle } from './handlUtils'
import InnerMessage from './InnerMessage'
import { allTypes, processUrl, stringifyTypes } from './submissionTypes'

const isAllowedSubmType = (chData: ChSettingsData, type?: SubmissionType): boolean => {
  const { submission_types } = chData
  return Boolean(!submission_types || submission_types.length === 0 || (type && submission_types.includes(type)))
}

const extractUrl = (chConfig: ChSettingsData, msg: Message<boolean>): { urlCount: number, typeUrl?: ReturnType<typeof processUrl> } => {
  const matches = msg.content.match(parseUrls()) ?? []

  for (const match of matches) {
    const urlType = processUrl(new URL(match))
    if (urlType && isAllowedSubmType(chConfig, urlType.type)) {
      return { typeUrl: urlType, urlCount: matches.length }
    }
  }

  return { urlCount: matches.length }
}

const isAlreadyAwarded = async (chData: ChSettingsData, msg: Message<boolean>): Promise<boolean> => {
  if (msg.guildId) {
    const member = await fetchMember(msg.guildId, msg.author.id)
    return member?.roles.cache.some((r) => chData.awarded_role === r.id) ?? false
  }
  return false
}

const stringifyAllowedTypes = (allowedTypes?: SubmissionType[]): string => {
  if (allowedTypes && allowedTypes.length > 0) {
    return stringifyTypes(allowedTypes)
  }
  return stringifyTypes(allTypes)
}

class MessageCreateHandler {
  constructor(private chConfig: ChSettingsData, private msg: Message<boolean>, private managers: Managers) { }

  process = async (): Promise<string | ReplyMessageOptions | null> => {
    if (!this.msg.author.bot) {
      const { typeUrl: prUrl, urlCount } = extractUrl(this.chConfig, this.msg)
      if (prUrl?.type && prUrl.url) {
        const isAwarded = await isAlreadyAwarded(this.chConfig, this.msg)
        if (isAwarded) {
          const title = await fetchSubmTitle(this.msg, prUrl.type, prUrl.url)
          await this.managers.documents.insert({
            user: {
              id: this.msg.author.id,
              tag: this.msg.author.tag,
            },
            link: prUrl.url,
            channel_id: this.msg.channelId,
            title,
            submission_type: prUrl.type,
          })
          return { content: config.messages.messageCreateHandler.saved }
        } else {
          const actionRow = new MessageActionRow({
            components: [genLikeButton(), genDislikeButton()]
          })
          const innerMsg = new InnerMessage({ authorId: this.msg.author.id, url: prUrl.url })
          return { content: innerMsg.toString(), components: [actionRow] }
        }
      }
      if (urlCount > 0) {
        return {
          content: config.messages.messageCreateHandler.wrongUrl(stringifyAllowedTypes(this.chConfig.submission_types)),
        }
      }
    }
    return null
  }
}

export default MessageCreateHandler
