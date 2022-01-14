import {
  Message, MessageActionRow, ButtonInteraction, CacheType, MessagePayload, InteractionUpdateOptions, GuildMember,
} from 'discord.js'

import client from '../client'
import { ChSettingsData } from '../db/dbTypes'
import Managers from '../db/managers'
import { fetchMember, assignRoleById } from '../discUtils'
import {
  fetchSubmTitle, genLikeButton, genDislikeButton, genApproveButton, genDismissButton, isApprovable,
} from './handlUtils'
import VotingMessage from './VotingMessage'
import { processUrl } from './submissionTypes'

const isInRoleList = (member?: GuildMember, allowedIds?: string[]): boolean => {
  if (member && allowedIds && allowedIds.length > 0) {
    return member.roles.cache.some((r) => allowedIds.includes(r.id))
  }
  return false
}

class VoteInteractionHandler {
  private type: 'like' | 'dislike' | 'approve' | 'dismiss'

  constructor(private chConfig: ChSettingsData, private interaction: ButtonInteraction<CacheType>, private managers: Managers) {
    this.type = this.interaction.customId as 'like' | 'dislike'
  }

  private canApprove = (member?: GuildMember): boolean => {
    const { approver_roles, approver_users } = this.chConfig
    if (this.interaction.guildId && member) {
      if (approver_roles) {
        return isInRoleList(member, approver_roles)
      }
      if (approver_users && approver_users.length > 0) {
        return approver_users.includes(member.id)
      }
    }
    return false
  }

  private canVote = (member?: GuildMember): boolean => {
    const { allowed_to_vote_roles } = this.chConfig
    if (allowed_to_vote_roles) {
      if (this.interaction.guildId) {
        return isInRoleList(member, allowed_to_vote_roles)
      }
    }
    return true
  }

  private assignRole = async (voteNum: number, apprNum: number, innMessage: VotingMessage): Promise<void> => {
    const isAppr = isApprovable(this.chConfig)

    if (voteNum >= (this.chConfig.voting_threshold ?? 0) && (apprNum >= (this.chConfig.approval_threshold ?? 0) || !isAppr) && this.interaction.guildId) {
      const guild = await client.guilds.fetch(this.interaction.guildId)
      const id = innMessage.authorId
      const member = guild.members.cache.get(id)

      if (this.interaction.message.type === 'REPLY' && this.interaction.message.pinned) {
        await this.interaction.message.unpin()
      }
      if (member) {
        const link = innMessage.url
        const { type } = processUrl(new URL(link)) ?? {}
        if (link && type && this.interaction.message.type === 'REPLY') {
          const title = await fetchSubmTitle(this.interaction.message, type, link)
          await this.managers.documents.insert({
            user: {
              id: member.id, tag: member.user.tag,
            },
            link, channel_id: this.interaction.channelId,
            title,
            submission_type: type,
          })
        }
        await assignRoleById(guild, id, this.chConfig.awarded_role)
      }
    }
  }

  process = async (): Promise<string | MessagePayload | InteractionUpdateOptions | null> => { // eslint-disable-line complexity
    // let role = guild.roles.cache.find(r => console.log(r.id, r.name))
    const { message: msg, user, guildId } = this.interaction

    const member = guildId ? await fetchMember(guildId, user.id) : undefined
    const isAllowedToApprove = this.canApprove(member)

    if (this.type === 'dismiss' && isAllowedToApprove) {
      if (msg.type === 'REPLY' && msg.deletable) {
        await msg.delete()
      }
      return null
    }

    const isAllowedToVote = this.canVote(member)

    if (
      ((this.type === 'like' || this.type === 'dislike') && !isAllowedToVote)
      || ((this.type === 'approve') && !isAllowedToApprove)
    ) return null

    const message = msg as Message<boolean>
    const actionRow = message.components.at(0)

    if (actionRow?.type === 'ACTION_ROW') {
      await this.managers.votes.processVote({
        message_id: msg.id,
        user: {
          id: user.id,
          tag: user.tag,
        },
        in_favor: this.type === 'like' || this.type === 'approve',
        is_approval: this.type === 'approve',
      })
      const vts = await this.managers.votes.getVoteCountsByMessageId({ message_id: msg.id })
      const apprs = await this.managers.votes.getVoteCountsByMessageId({ message_id: msg.id, is_approval: true })

      const isAppr = isApprovable(this.chConfig)
      const innMessage = VotingMessage.from({
        oldMessage: message.content, inFavor: vts?.in_favor, against: vts?.against, inFavorApprovals: isAppr ? apprs?.in_favor ?? [] : undefined
      })
      if (innMessage) {
        const newActionRow = new MessageActionRow({
          components: [
            genLikeButton(vts?.in_favor_count ?? 0),
            genDislikeButton(vts?.against_count ?? 0),
            ...(isAppr ? [genApproveButton(this.chConfig.approval_threshold ?? 0, apprs?.in_favor_count ?? 0), genDismissButton()] : []),
          ]
        })
        if (this.type === 'like' || this.type === 'approve') {
          await this.assignRole((vts?.in_favor_count ?? 0) - (vts?.against_count ?? 0), apprs?.in_favor_count ?? 0, innMessage)
        }

        return { content: innMessage.toString(), components: [newActionRow] }
      }
    }
    return null
  }
}

export default VoteInteractionHandler
