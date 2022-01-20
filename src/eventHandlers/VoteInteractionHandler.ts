import {
  Message, MessageActionRow, ButtonInteraction, CacheType, MessagePayload, InteractionUpdateOptions, GuildMember,
} from 'discord.js'

import client from '../client'
import { ChSettingsData } from '../db/dbTypes'
import Managers from '../db/managers'
import { fetchMember, assignRoleById, fetchMessageById } from '../discUtils'
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

  private isGraterThanVotThreshold = (votes: number): boolean => votes >= (this.chConfig.voting_threshold ?? 0)

  private isGraterThanApprThreshold = (approvals: number): boolean => (
    approvals >= (this.chConfig.approval_threshold ?? 0) || !isApprovable(this.chConfig)
  )

  private isEnoughSubmissions = async (): Promise<boolean> => {
    const threshold = this.chConfig.submission_threshold ?? 0
    if (threshold > 0) {
      const totalRes = await this.managers.documents.getNumOfDocsPerUserId({ user_id: this.interaction.user.id, is_candidate: false })
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
        const repliedToMsg = message.reference?.messageId ? await fetchMessageById(message, message.reference.messageId) : null
        const link = innMessage.url
        const { type } = processUrl(new URL(link)) ?? {}
        if (link && type && this.interaction.message.type === 'REPLY') {
          const title = await fetchSubmTitle(repliedToMsg, type, link)
          await this.managers.documents.updateTitleIsCandidate({
            message_id: this.interaction.message.id,
            title,
            is_candidate: false,
          })
        }
        const isEnoughSubmissions = await this.isEnoughSubmissions()
        if (isEnoughSubmissions) {
          await assignRoleById(guild, id, this.chConfig.awarded_role)
        }
      }
    }
  }

  process = async (): Promise<string | MessagePayload | InteractionUpdateOptions | null> => { // eslint-disable-line complexity
    try {
      const { message: msg, user, guildId } = this.interaction

      const member = guildId ? await fetchMember(guildId, user.id) : undefined
      const isAllowedToApprove = this.canApprove(member)

      if (this.type === 'dismiss' && isAllowedToApprove) {
        if (msg.type === 'REPLY' && msg.deletable) {
          await msg.delete()
          await this.managers.documents.deleteByMessageId({ message_id: msg.id })
        }
        return null
      }

      const isAllowedToVote = this.canVote(member)

      if (
        ((this.type === 'like' || this.type === 'dislike') && !isAllowedToVote)
        || ((this.type === 'approve') && !isAllowedToApprove)
      ) return null

      const message = msg as Message<boolean>

      if (message.embeds[0]) {
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
          oldEmbed: message.embeds[0],
          inFavor: vts?.in_favor,
          against: vts?.against,
          inFavorApprovals: isAppr ? apprs?.in_favor ?? [] : undefined,
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

          return { embeds: [innMessage.toEmbed()], components: [newActionRow] }
        }
      }
    } catch (e: unknown) {
      console.log(e)
    }
    return null
  }
}

export default VoteInteractionHandler
