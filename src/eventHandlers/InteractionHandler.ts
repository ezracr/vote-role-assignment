import dsc = require('discord.js')

import client from '../client'
import { ChSettingsData } from '../db/dbTypes'
import Managers from '../db/managers'
import { genButton, InnerMessage } from './handlUtils'

const changeButtonCount = (actionRow: dsc.MessageActionRow, offset: number, id: 'like' | 'dislike'): number | undefined => {
  const index = id === 'like' ? 0 : 1
  const oldButton = actionRow.components.at(index)
  if (oldButton?.type === 'BUTTON') {
    const votes = Number.parseInt(oldButton.label ?? '0', 10) + offset
    actionRow.spliceComponents(index, 1, genButton(id, votes))
    return votes
  }
}

class InteractionHandler {
  private type: 'like' | 'dislike'

  constructor(private config: ChSettingsData, private interaction: dsc.ButtonInteraction<dsc.CacheType>, private managers: Managers) {  // eslint-disable-line @typescript-eslint/no-parameter-properties
    this.type = this.interaction.customId as 'like' | 'dislike'
  }

  private addRemoveVote = (voters: string[], userTag?: string): [offset: 1 | -1, voters: string[]] => {
    const { user } = this.interaction

    const userPos = voters.findIndex((val) => val === userTag)
    if (userPos === -1) {
      return [1, [...voters, user.tag]]
    }

    return [-1, [...voters.slice(0, userPos), ...voters.slice(userPos + 1)]]
  }

  private canVote = async (): Promise<boolean | undefined> => {
    const { allowed_to_vote_roles } = this.config
    if (allowed_to_vote_roles && allowed_to_vote_roles.length > 0) {
      const guild = await client.guilds.fetch(this.interaction.guildId)
      const member = guild.members.cache.get(this.interaction.user.id)
      return member?.roles.cache.some((r) => allowed_to_vote_roles.includes(r.id))
    }
    return true
  }

  private assignRole = async (count: number, innMessage: InnerMessage): Promise<void> => {
    if (count >= this.config.voting_threshold) {
      const guild = await client.guilds.fetch(this.interaction.guildId)
      const id = innMessage.authorId
      const member = guild.members.cache.get(id)

      if (this.interaction.message.type === 'REPLY' && this.interaction.message.pinned) {
        await this.interaction.message.unpin()
      }
      if (member) {
        const link = innMessage.url
        if (link) {
          await this.managers.documents.insert({
            author_id: member.id, author_tag: member.user.tag, link, ch_sett_id: this.interaction.channelId,
          })
        }
        await member.roles.add(this.config.awarded_role)
      }
    }
  }

  process = async (): Promise<{ messageContent: string, actionRow: dsc.MessageActionRow } | null> => {
    // let role = guild.roles.cache.find(r => console.log(r.id, r.name))
    const isAllowedToVote = await this.canVote()

    if (!isAllowedToVote) return null

    const { message: msg, user } = this.interaction
    const message = msg as dsc.Message<boolean>
    const actionRow = message.components.at(0)

    const innMessage = InnerMessage.from(message.content)

    if (actionRow?.type === 'ACTION_ROW' && innMessage) {
      const inFavor = innMessage.inFavor
      const against = innMessage.against
      const oldVoters = this.type === 'like' ? inFavor : against

      const vote = await this.managers.votes.getByUserMessageId({ user_id: user.id, message_id: message.id })

      if (this.type === 'like' && against.includes(user.tag) || this.type === 'dislike' && inFavor.includes(user.tag)) {
        const [offsetInFavor, inFavorNew] = this.addRemoveVote(inFavor, vote?.user_tag)
        const [offsetAgainst, againstNew] = this.addRemoveVote(against, vote?.user_tag)
        if (user.tag !== vote?.user_tag) {
          await this.managers.votes.updateUserTag({ user_id: user.id, message_id: msg.id, user_tag: user.tag })
        }
        const count = changeButtonCount(actionRow, offsetInFavor, 'like')
        await this.assignRole(count ?? 0, innMessage)
        changeButtonCount(actionRow, offsetAgainst, 'dislike')
        innMessage.inFavor = inFavorNew
        innMessage.against = againstNew
        return { messageContent: innMessage.toString(), actionRow }
      }
      const [offset, voters] = this.addRemoveVote(oldVoters, vote?.user_tag)
      if (offset === -1) {
        await this.managers.votes.deleteByUserMessageId({ user_id: user.id, message_id: message.id })
      } else {
        await this.managers.votes.insert({ message_id: message.id, user_id: user.id, user_tag: user.tag })
      }
      innMessage[this.type === 'like' ? 'inFavor' : 'against'] = voters
      const count = changeButtonCount(actionRow, offset, this.type)
      if (this.type === 'like') {
        await this.assignRole(count ?? 0, innMessage)
      }
      return { messageContent: innMessage.toString(), actionRow }
    }
    return null
  }
}

export default InteractionHandler
