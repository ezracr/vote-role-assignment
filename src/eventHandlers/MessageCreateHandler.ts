import { Message, MessageActionRow, ReplyMessageOptions } from 'discord.js'
import parseUrls from 'url-regex-safe'

import Managers from '../db/managers'
import { ChSettingsData, SubmissionType, Submission } from '../db/dbTypes'
import {
  unpinMessageByMessageId, pinMessage, hasSomeRoles,
} from '../discUtils'
import config from '../config'
import {
  genLikeButton, genDislikeButton, genApproveButton, fetchSubmTitle, isApprovable, genDismissButton,
} from './handlUtils'
import VotingMessage from './VotingMessage'
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
    return hasSomeRoles(msg.guildId, msg.author.id, chData.awarded_role)
  }
  return false
}

const canSubmit = async (chData: ChSettingsData, msg: Message<boolean>): Promise<boolean> => {
  if (msg.guildId && chData.submitter_roles) {
    return hasSomeRoles(msg.guildId, msg.author.id, chData.submitter_roles)
  }
  return true
}

const stringifyAllowedTypes = (allowedTypes?: SubmissionType[]): string => {
  if (allowedTypes && allowedTypes.length > 0) {
    return stringifyTypes(allowedTypes)
  }
  return stringifyTypes(allTypes)
}

type InputEntry = Pick<Parameters<Managers['documents']['insert']>[0], 'link' | 'submission_type' | 'title' | 'is_candidate' | 'message_id'>

class MessageCreateHandler {
  constructor(private chConfig: ChSettingsData, private msg: Message<boolean>, private managers: Managers) { }

  private genMessage = async (): Promise<{ newMsg: string | ReplyMessageOptions | null; entry?: Omit<InputEntry, 'message_id'> }> => {
    if (!this.msg.author.bot) {
      const canUserSubmit = await canSubmit(this.chConfig, this.msg)
      if (!canUserSubmit) { // TODO merge with `prUrl?.type && prUrl.url`
        return { newMsg: null }
      }
      const { typeUrl: prUrl, urlCount } = extractUrl(this.chConfig, this.msg)
      if (prUrl?.type && prUrl.url) {
        const isAwarded = await isAlreadyAwarded(this.chConfig, this.msg)
        if (isAwarded) {
          const title = await fetchSubmTitle(this.msg, prUrl.type, prUrl.url)
          const inputEntry = { title, submission_type: prUrl.type, link: prUrl.url, is_candidate: false }
          return { newMsg: { content: config.messages.messageCreateHandler.saved }, entry: inputEntry }
        } else {
          const inputDoc = { title: null, submission_type: prUrl.type, link: prUrl.url, is_candidate: true }
          const isAppr = isApprovable(this.chConfig)
          const actionRow = new MessageActionRow({
            components: [
              genLikeButton(),
              genDislikeButton(),
              ...(isAppr ? [genApproveButton(this.chConfig.approval_threshold ?? 0), genDismissButton()] : []),
            ]
          })
          const innerMsg = new VotingMessage({
            authorId: this.msg.author.id, url: prUrl.url, inFavorApprovals: isAppr ? [] : undefined,
            color: this.chConfig.message_color,
          })

          return {
            newMsg: {
              components: [actionRow],
              embeds: [innerMsg.toEmbed()],
            }, entry: inputDoc
          }
        }
      }
      if (urlCount > 0) {
        return {
          newMsg: {
            content: config.messages.messageCreateHandler.wrongUrl(stringifyAllowedTypes(this.chConfig.submission_types)),
          }
        }
      }
    }
    return { newMsg: null }
  }

  process = async (): Promise<void> => {
    const { newMsg, entry } = await this.genMessage()
    if (newMsg) {
      const botMsg = await this.msg.reply(newMsg)
      if (typeof newMsg !== 'string' && (newMsg.components?.length ?? 0) > 0) {
        await pinMessage(botMsg)
      }
      if (entry) {
        await this.addToDocuments({ ...entry, message_id: botMsg.id })
      }
    }
  }

  addToDocuments = async (inputDoc: InputEntry): Promise<Submission | undefined> => {
    const doc = await this.managers.documents.insert({
      user: {
        id: this.msg.author.id,
        tag: this.msg.author.tag,
      },
      link: inputDoc.link,
      channel_id: this.msg.channelId,
      title: inputDoc.title,
      submission_type: inputDoc.submission_type,
      is_candidate: inputDoc.is_candidate,
      message_id: inputDoc.message_id,
    })
    if (doc?.old_message_id && doc.message_id !== doc.old_message_id) {
      // await removeMessageByMessageId(this.msg, doc.old_message_id)
      await unpinMessageByMessageId(this.msg, doc.old_message_id)
    }
    return doc
  }
}

export default MessageCreateHandler
