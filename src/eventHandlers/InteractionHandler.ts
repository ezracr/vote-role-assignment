import dsc = require('discord.js')

import client from '../client'
import { Config } from './handlTypes'
import { genButton, updateMessageContent } from './handlUtils'

const normMessage = (message: dsc.Message<boolean>): string[] => message.content.split('\n')

const changeButtonCount = (actionRow: dsc.MessageActionRow, offset: number, id: 'like' | 'dislike'): number | undefined => {
  const index = id === 'like' ? 0 : 1
  const oldButton = actionRow.components.at(index)
  if (oldButton?.type === 'BUTTON') {
    const votes = Number.parseInt(oldButton.label ?? '0', 10) + offset
    actionRow.spliceComponents(index, 1, genButton(id, votes))
    return votes
  }
}

const extractVoters = (message: string[], type: 'like' | 'dislike'): Array<string> => { //todo
  const line = message[type === 'like' ? 2 : 3]
  if (line) {
    return line
      .slice(line.indexOf(':') + 1)
      .split(',')
      .map((val) => val.trim())
      .filter((val) => val !== '')
  }
  return []
}

class InteractionHandler {
  private type: 'like' | 'dislike'

  constructor(private config: Config, private interaction: dsc.ButtonInteraction<dsc.CacheType>) {  // eslint-disable-line @typescript-eslint/no-parameter-properties
    this.type = this.interaction.customId as 'like' | 'dislike'
  }

  private addRemoveVote = (voters: string[]): [offset: 1 | -1, voters: string[]] => {
    const { user } = this.interaction

    const userPos = voters.findIndex((val) => val === user.tag)
    if (userPos === -1) {
      return [1, [...voters, user.tag]]
    }
    return [-1, [...voters.slice(0, userPos), ...voters.slice(userPos + 1)]]
  }

  private canVote = async (): Promise<boolean | undefined> => {
    const guild = await client.guilds.fetch(this.interaction.guildId)
    const member = guild.members.cache.get(this.interaction.user.id)
    return member?.roles.cache.some((r) => this.config.allowedRoleIds.includes(r.id))
  }

  private assignRole = async (count: number, norMessage: string[]) => {
    if (count >= this.config.votesThreshold) {
      const guild = await client.guilds.fetch(this.interaction.guildId)
      const authorLine = norMessage[0]
      const id = authorLine.slice(authorLine.indexOf('<') + 2, authorLine.indexOf('>'))
      const member = guild.members.cache.get(id)
      if (this.interaction.message.type === 'REPLY' && this.interaction.message.pinned) {
        await this.interaction.message.unpin()
      }
      if (member) {
        await member.roles.add(this.config.awardedRoleId)
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

    if (actionRow?.type === 'ACTION_ROW') {
      const norMessage = normMessage(message)
      const inFavor = extractVoters(norMessage, 'like')
      const against = extractVoters(norMessage, 'dislike')
      const oldVoters = this.type === 'like' ? inFavor : against

      if (this.type === 'like' && against.includes(user.tag) || this.type === 'dislike' && inFavor.includes(user.tag)) {
        const [offsetInFavor, inFavorNew] = this.addRemoveVote(inFavor)
        const [offsetAgainst, againstNew] = this.addRemoveVote(against)
        const count = changeButtonCount(actionRow, offsetInFavor, 'like')
        await this.assignRole(count ?? 0, norMessage)
        changeButtonCount(actionRow, offsetAgainst, 'dislike')
        const newMessage = updateMessageContent(norMessage, inFavorNew, againstNew)
        return { messageContent: newMessage, actionRow }
      }
      const [offset, voters] = this.addRemoveVote(oldVoters)
      const newMessage = updateMessageContent(norMessage, this.type === 'like' ? voters : inFavor, this.type === 'dislike' ? voters : against)
      const count = changeButtonCount(actionRow, offset, this.type)
      if (this.type === 'like') {
        await this.assignRole(count ?? 0, norMessage)
      }
      return { messageContent: newMessage, actionRow }
    }
    return null
  }
}

export default InteractionHandler
