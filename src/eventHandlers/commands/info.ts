import { SlashCommandBuilder } from '@discordjs/builders'
import type { CommandInteraction, CacheType } from 'discord.js'

import { ChSettingsData } from '../../db/dbTypes'
import Managers from '../../db/managers'
import { convertIdToRoleTag, convertIdToUserTag } from '../../discUtils'
import config from '../../config'
import { stringifyTypes } from '../submissionTypes'
import { genLinkToDocPage } from './commUtils'

export const infoCommand = new SlashCommandBuilder()
  .setDefaultPermission(true)
  .setName(config.commands.info.name)
  .setDescription(config.commands.info.description)

const prepareGroupIds = (groupId?: string | string[]): string => {
  if (!groupId) return ''
  if (Array.isArray(groupId)) {
    return groupId.map((id) => convertIdToRoleTag(id)).join(', ')
  }
  return convertIdToRoleTag(groupId)
}
const prepareUserIds = (userId?: string | string[]): string => {
  if (!userId) return ''
  if (Array.isArray(userId)) {
    return userId.map((id) => convertIdToUserTag(id)).join(', ')
  }
  return convertIdToUserTag(userId)
}

const prepareLine = (key: string, val: string): string => `  ${key}: ${val}`

const prepareSettingsForDisplay = (sett: ChSettingsData): string => {
  return (Object.keys(sett) as (keyof ChSettingsData)[]).map((key) => {
    const normKey = key.replaceAll('_', '-')
    if (key === 'allowed_to_vote_roles' || key === 'awarded_role' || key === 'approver_roles' || key === 'submitter_roles') {
      return prepareLine(normKey, prepareGroupIds(sett[key]))
    }
    if (key === 'approver_users') {
      return prepareLine(normKey, prepareUserIds(sett[key]))
    }
    if (key === 'submission_types') {
      return prepareLine(normKey, stringifyTypes(sett[key]))
    }
    return prepareLine(normKey, sett[key] ? JSON.stringify(sett[key]) : '')
  }).join('\n')
}

export const infoCommandHandler = async (managers: Managers, interaction: CommandInteraction<CacheType>): Promise<void> => {
  try {
    const res = await managers.settings.getByChId(interaction.channelId)
    const totalRes = await managers.documents.getNumOfDocsPerChannel({ channel_id: interaction.channelId, is_candidate: false })
    const totalCand = await managers.documents.getNumOfDocsPerChannel({ channel_id: interaction.channelId, is_candidate: true })
    if (res) {
      const { commands: { info: { messages } } } = config
      await interaction.reply({
        content: messages.main(prepareSettingsForDisplay(res.data), genLinkToDocPage(interaction.channelId), totalRes?.total ?? 0, totalCand?.total ?? 0),
        ephemeral: true,
      })
    } else {
      await interaction.reply({ content: config.messages.wasNotEnabled, ephemeral: true })
    }
  } catch (e: unknown) {
    console.log(e)
  }
}
