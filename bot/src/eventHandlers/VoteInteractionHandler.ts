import {
  MessageActionRow, ButtonInteraction, CacheType, MessagePayload, InteractionUpdateOptions,
} from 'discord.js'

import client from '../client'
import { ChSetting } from '../db/dbTypes'
import Managers from '../db/managers'
import { assignRoleById, hasSomeRoles } from '../discUtils'
import {
  genLikeButton, genDislikeButton, genApproveButton, genDismissButton, isApprovable, isDismissible,
} from './handlUtils'
import VotingMessage from './VotingMessage'
import { processUrl } from './submissionTypes'

class VoteInteractionHandler {
  private type: 'like' | 'dislike' | 'approve' | 'dismiss'

  constructor(private chConfig: ChSetting, private interaction: ButtonInteraction<CacheType>, private managers: Managers) {
    this.type = this.interaction.customId as 'like' | 'dislike'
  }

  private canApprove = async (): Promise<boolean> => {
    const { data: { approver_roles, approver_users } } = this.chConfig
    const { guildId, user } = this.interaction
    if (guildId) {
      if (approver_roles) {
        const hasRoles = await hasSomeRoles(guildId, user.id, approver_roles)
        return hasRoles
      }
      if (approver_users && approver_users.length > 0) {
        return approver_users.includes(user.id)
      }
    }
    return false
  }

  private canVote = async (): Promise<boolean> => {
    const { data: { allowed_to_vote_roles } } = this.chConfig
    const { guildId, user } = this.interaction
    if (allowed_to_vote_roles) {
      if (guildId) {
        return hasSomeRoles(guildId, user.id, allowed_to_vote_roles)
      }
    }
    return true
  }

  private isGraterThanVotThreshold = (votes: number): boolean => votes >= (this.chConfig.data.voting_threshold ?? 0)

  private isGraterThanApprThreshold = (approvals: number): boolean => (
    approvals >= (this.chConfig.data.approval_threshold ?? 0) || !isApprovable(this.chConfig.data)
  )

  private isEnoughSubmissions = async (): Promise<boolean> => {
    const threshold = this.chConfig.data.submission_threshold ?? 0
    if (threshold > 0) {
      const totalRes = await this.managers.submissions.getNumOfDocsPerUserId({ user_id: this.interaction.user.id, is_candidate: false })
      return (totalRes?.total ?? 0) >= threshold
    }
    return true
  }

  private assignRole = async (voteNum: number, apprNum: number, innMessage: VotingMessage): Promise<void> => {
    const { message, guildId } = this.interaction
    if (message.type === 'REPLY'
      && this.isGraterThanVotThreshold(voteNum)
      && this.isGraterThanApprThreshold(apprNum)
      && guildId
    ) {
      const guild = await client.guilds.fetch(guildId)
      const id = innMessage.authorId
      const member = guild.members.cache.get(id)

      if (message.pinned) {
        await message.unpin()
      }
      if (member) {
        const link = innMessage.url
        const { type } = await processUrl(new URL(link)) ?? {}
        if (link && type && this.interaction.message.type === 'REPLY') {
          await this.managers.submissions.patchByFilter({ message_id: this.interaction.message.id }, {
            is_candidate: false,
          })
        }
        const isEnoughSubmissions = await this.isEnoughSubmissions()
        if (isEnoughSubmissions) {
          await assignRoleById(guild, id, this.chConfig.data.awarded_role)
        }
      }
    }
  }

  process = async (): Promise<string | MessagePayload | InteractionUpdateOptions | null | false> => { // eslint-disable-line complexity
    try {
      const { message: msg, user, channelId } = this.interaction

      const isAllowedToApprove = await this.canApprove()

      if (this.type === 'dismiss' && isAllowedToApprove) {
        if (msg.type === 'REPLY' && msg.deletable) {
          await msg.delete()
          await this.managers.submissions.deleteByFilter({ message_id: msg.id })
          return false
        }
        return null
      }

      const isAllowedToVote = await this.canVote()

      if (
        ((this.type === 'like' || this.type === 'dislike') && !isAllowedToVote)
        || ((this.type === 'approve') && !isAllowedToApprove)
      ) return null

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
      const isAppr = isApprovable(this.chConfig.data)
      const subm = (await this.managers.submissions.getMany({ message_id: msg.id }))[0]

      if (subm) {
        const innMessage = new VotingMessage({
          inFavor: vts?.in_favor,
          against: vts?.against,
          inFavorApprovals: isAppr ? apprs?.in_favor ?? [] : undefined,
          chSettData: this.chConfig.data,
          channelId,
          authorId: subm.user.id,
          url: subm.link,
          color: this.chConfig.data.message_color,
          title: subm.title,
        })
        const newActionRow = new MessageActionRow({
          components: [
            genLikeButton(vts?.in_favor_count ?? 0),
            genDislikeButton(vts?.against_count ?? 0),
            ...(isAppr ? [genApproveButton(this.chConfig.data.approval_threshold ?? 0, apprs?.in_favor_count ?? 0)] : []),
            ...(isDismissible(this.chConfig.data) && (apprs?.in_favor_count ?? 0) <= 0 ? [genDismissButton()] : []),
          ],
        })
        if (this.type === 'like' || this.type === 'approve') {
          await this.assignRole((vts?.in_favor_count ?? 0) - (vts?.against_count ?? 0), apprs?.in_favor_count ?? 0, innMessage)
        }

        return { content: '\u200b', embeds: [innMessage.toEmbed()], components: [newActionRow] }
      }

    } catch (e: unknown) {
      console.log(e) // eslint-disable-line no-console
    }
    return null
  }
}

export default VoteInteractionHandler
