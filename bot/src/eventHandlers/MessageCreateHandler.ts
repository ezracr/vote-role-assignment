import { Message, MessageActionRow, ReplyMessageOptions } from 'discord.js'
import parseUrls from 'url-regex-safe'

import Managers from '../db/managers'
import { ChSettingsData, SubmissionType, Submission, ChSetting } from '../db/dbTypes'
import {
  unpinMessageByMessageId, pinMessage, hasSomeRoles,
} from '../discUtils'
import config from '../config'
import {
  genLikeButton, genDislikeButton, genApproveButton, fetchSubmTitleDesc, isApprovable, genDismissButton,
} from './handlUtils'
import VotingMessage from './VotingMessage'
import { processUrl } from './submissionTypes'

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

const isRoleAlreadyAwarded = async (chData: ChSettingsData, msg: Message<boolean>): Promise<boolean> => {
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

type InputEntry = Pick<Parameters<
  Managers['submissions']['upsert']>[0],
  'link' | 'submission_type' | 'title' | 'is_candidate' | 'message_id'
>

class MessageCreateHandler {
  constructor(private chConfig: ChSetting, private msg: Message<boolean>, private managers: Managers) { }

  private isLinkAlreadySaved = async (url: string): Promise<boolean> => (
    Boolean(await this.managers.submissions.getByFilter({ link: url }))
  )

  private genMessage = async (): Promise<{ newMsg: string | ReplyMessageOptions | null; entry?: Omit<InputEntry, 'message_id'> }> => {
    if (!this.msg.author.bot) {
      const canUserSubmit = await canSubmit(this.chConfig.data, this.msg)
      if (!canUserSubmit) { // TODO merge with `prUrl?.type && prUrl.url`
        return { newMsg: null }
      }
      const { typeUrl: prUrl } = extractUrl(this.chConfig.data, this.msg)
      if (prUrl?.type && prUrl.url) {
        if (await this.isLinkAlreadySaved(prUrl.url)) return { newMsg: null }

        const isAwarded = await isRoleAlreadyAwarded(this.chConfig.data, this.msg)
        if (isAwarded) {
          const inputSubm = { submission_type: prUrl.type, link: prUrl.url, is_candidate: false }
          return { newMsg: { content: config.messages.messageCreateHandler.saved }, entry: inputSubm }
        } else {
          const inputSubm = { submission_type: prUrl.type, link: prUrl.url, is_candidate: true }
          const isAppr = isApprovable(this.chConfig.data)
          const actionRow = new MessageActionRow({
            components: [
              genLikeButton(),
              genDislikeButton(),
              ...(isAppr ? [genApproveButton(this.chConfig.data.approval_threshold ?? 0), genDismissButton()] : []),
            ],
          })
          const innerMsg = new VotingMessage({
            authorId: this.msg.author.id, url: prUrl.url, inFavorApprovals: isAppr ? [] : undefined,
            color: this.chConfig.data.message_color,
            chSettData: this.chConfig.data,
            channelId: this.msg.channelId,
          })

          return {
            newMsg: {
              components: [actionRow],
              embeds: [innerMsg.toEmbed()],
            }, entry: inputSubm,
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
        await this.addToSubmissions({ ...entry, message_id: botMsg.id })
      }
    }
  }

  addToSubmissions = async (inputSubm: InputEntry): Promise<Submission | undefined> => {
    const titleDesc = await fetchSubmTitleDesc(this.msg, inputSubm.link, inputSubm.submission_type)

    const entry = await this.managers.submissions.upsert({
      user: {
        id: this.msg.author.id,
        tag: this.msg.author.tag,
      },
      link: inputSubm.link,
      ch_sett_id: this.chConfig.id,
      submission_type: inputSubm.submission_type,
      is_candidate: inputSubm.is_candidate,
      message_id: inputSubm.message_id,
      usr_message_id: this.msg.id,
      ...titleDesc,
    })
    if (entry?.old_message_id && entry.message_id !== entry.old_message_id) {
      // await removeMessageByMessageId(this.msg, entry.old_message_id)
      await unpinMessageByMessageId(this.msg, entry.old_message_id)
    }
    return entry
  }
}

export default MessageCreateHandler
