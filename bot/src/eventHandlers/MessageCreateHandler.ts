import { Message, MessageActionRow, MessageAttachment, ReplyMessageOptions } from 'discord.js'
import parseUrls from 'url-regex-safe'

import Managers from '../db/managers'
import { ChSettingsData, SubmissionType, Submission, ChSetting } from '../db/dbTypes'
import {
  pinMessage, hasSomeRoles,
} from '../discUtils'
import config from '../config'
import {
  genLikeButton, genDislikeButton, genApproveButton, fetchSubmTitleDesc, isApprovable, genDismissButton, isDismissible, processImage,
} from './handlUtils'
import VotingMessage from './VotingMessage'
import { processUrl } from './submissionTypes'

const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

const isImageAccepted = (chData: ChSettingsData, attachment: MessageAttachment): boolean => {
  const { submission_types } = chData
  return Boolean((submission_types?.includes('image') || !submission_types || submission_types.length === 0)
    && attachment.contentType && allowedImageTypes.includes(attachment.contentType))
}

const isAllowedSubmType = (chData: ChSettingsData, type?: SubmissionType): boolean => {
  const { submission_types } = chData
  return Boolean(!submission_types || submission_types.length === 0 || (type && submission_types.includes(type)))
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
  'link' | 'submission_type' | 'title' | 'is_candidate' | 'message_id' | 'hash'
>

type ExtractUrlOut = { type: Exclude<SubmissionType, 'image'>, url: string }
  | { type: 'image', url: string, hash: string, buffer: Buffer }
  | undefined

class MessageCreateHandler {
  constructor(private chConfig: ChSetting, private msg: Message<boolean>, private managers: Managers) { }

  private isLinkAlreadySaved = async (url: string): Promise<boolean> => (
    Boolean((await this.managers.submissions.getMany({ link: url }))[0])
  )

  private extractUrl = async (): Promise<ExtractUrlOut> => {
    const matches = this.msg.content.match(parseUrls()) ?? []

    for (const match of matches) {
      const urlType = await processUrl(new URL(match)) // eslint-disable-line no-await-in-loop
      if (urlType && isAllowedSubmType(this.chConfig.data, urlType.type)) {
        return urlType
      }
    }
    const attachment = this.msg.attachments.first()
    if (attachment && isImageAccepted(this.chConfig.data, attachment)) {
      const { fileName, hash, buffer } = await processImage(attachment)
      return { type: 'image', url: fileName, hash, buffer }
    }
  }

  private genMessage = async (): Promise<{ newMsg: string | ReplyMessageOptions | null; entry?: Omit<InputEntry, 'message_id'> }> => {
    if (!this.msg.author.bot) {
      const canUserSubmit = await canSubmit(this.chConfig.data, this.msg)
      if (!canUserSubmit) { // TODO merge with `prUrl?.type && prUrl.url`
        return { newMsg: null }
      }
      const prUrl = await this.extractUrl()

      if (prUrl?.type && prUrl.url) {
        if (prUrl.type !== 'image' && await this.isLinkAlreadySaved(prUrl.url)) return { newMsg: null }

        const isAwarded = await isRoleAlreadyAwarded(this.chConfig.data, this.msg)
        const hash = prUrl.type === 'image' ? prUrl.hash : undefined
        if (isAwarded) {
          const inputSubm = { submission_type: prUrl.type, link: prUrl.url, is_candidate: false, hash }
          return { newMsg: { content: config.messages.messageCreateHandler.saved }, entry: inputSubm }
        } else {
          const inputSubm = { submission_type: prUrl.type, link: prUrl.url, is_candidate: true, hash }
          const similar = prUrl.type === 'image'
            ? await this.managers.submissions.getMany({ hash: prUrl.hash, limit: 5 }, { orderBy: 'hash', isAsc: true })
            : undefined
          const isAppr = isApprovable(this.chConfig.data)
          const actionRow = new MessageActionRow({
            components: [
              genLikeButton(),
              genDislikeButton(),
              ...(isAppr ? [genApproveButton({ totalCount: this.chConfig.data.approval_threshold ?? 0 })] : []),
              ...(isDismissible(this.chConfig.data) ? [genDismissButton()] : []),
            ],
          })
          const innerMsg = new VotingMessage({
            authorId: this.msg.author.id,
            url: prUrl.url,
            inFavorApprovals: isAppr ? [] : undefined,
            color: this.chConfig.data.message_color,
            chSettData: this.chConfig.data,
            channelId: this.msg.channelId,
            similar,
            image: prUrl.type === 'image' ? { url: `attachment://${prUrl.url}` } : undefined,
          })

          return {
            newMsg: {
              components: [actionRow],
              embeds: [innerMsg.toEmbed()],
              files: prUrl.type === 'image' ? [new MessageAttachment(prUrl.buffer, prUrl.url)] : undefined,
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
        if (!entry.is_candidate) {
          setTimeout(() => botMsg.delete().catch(() => { }), 2000)
          await this.msg.react('✅')
        }
        await this.addToSubmissions({ ...entry, message_id: entry.is_candidate ? botMsg.id : null })
      }
    }
  }

  private addToSubmissions = async (inputSubm: InputEntry): Promise<Submission | undefined> => {
    // It also fetches the title in `messageUpdateHandler`, but if that happened before the entry was inserted,
    // then it will be added here
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
      hash: inputSubm.hash,
      ...titleDesc,
    })
    return entry
  }
}

export default MessageCreateHandler
