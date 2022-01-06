import { SlashCommandBuilder } from '@discordjs/builders'
import type { CommandInteraction, CacheType } from 'discord.js'

import { ChSettingsData } from '../../db/dbTypes'
import Managers from '../../db/managers'
import { convertIdToGroupTag } from '../handlUtils'
import config from '../../config'
import { genLinkToDocPage } from './commUtils'

export const infoCommand = new SlashCommandBuilder()
  .setDefaultPermission(true)
  .setName(config.commands.info.name)
  .setDescription('Show the settings of this channel/thread.')

const prepareGroupIds = (groupId: string | string[]): string => {
  if (Array.isArray(groupId)) {
    return groupId.map((id) => convertIdToGroupTag(id)).join(', ')
  }
  return convertIdToGroupTag(groupId)
}

const prepareLine = (key: string, val: string) => `  ${key}: ${val}`

const prepareSettingsForDisplay = (obj: ChSettingsData): string => (
  (Object.keys(obj) as (keyof ChSettingsData)[]).map((key) => {
    const normKey = key.replaceAll('_', '-')
    if (key === 'allowed_to_vote_roles' || key === 'awarded_role') {
      return prepareLine(normKey, prepareGroupIds(obj[key] as string | string[]))
    }
    return prepareLine(normKey, JSON.stringify(obj[key]))
  }).join('\n')
)

export const infoCommandHandler = async (managers: Managers, interaction: CommandInteraction<CacheType>): Promise<void> => {
  try {
    const res = await managers.settings.getByChId(interaction.channelId)
    const totalRes = await managers.documents.getNumOfDocsPerChannel(interaction.channelId)
    if (res) {
      const { commands: { info: { messages } } } = config
      await interaction.reply({
        content: messages.main(prepareSettingsForDisplay(res.data), genLinkToDocPage(interaction.channelId), totalRes?.total ?? 0),
        ephemeral: true,
      })
    } else {
      await interaction.reply({ content: config.messages.wasNotEnabled, ephemeral: true })
    }
  } catch (e: unknown) {
    console.log(e)
  }
}
