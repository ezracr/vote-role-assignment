import { SlashCommandBuilder } from '@discordjs/builders'
import type { CommandInteraction, CacheType } from 'discord.js'

import Managers from '../../db/managers'
import { ReportableError } from '../../db/managers/manUtils'
import { ChSettingsData } from '../../db/dbTypes'
import config from '../../config'
import { enableOptions, convertEnableToDbType } from './commUtils'

export const enableCommand = new SlashCommandBuilder()
  .setDefaultPermission(false)
  .setName(config.commands.enable.name)
  .setDescription(config.commands.enable.description)
  .addRoleOption(enableOptions.awardedRole.bind(null, true))
  .addIntegerOption(enableOptions.votingThreshold.bind(null, false))
  .addIntegerOption(enableOptions.votingAgainstThreshold.bind(null, false))
  .addRoleOption(enableOptions.allowedToVoteRole.bind(null, false))
  .addStringOption(enableOptions.submissionType.bind(null, false))
  .addIntegerOption(enableOptions.approvalThreshold.bind(null, false))
  .addRoleOption(enableOptions.allowedToApproveRoles.bind(null, false))
  .addUserOption(enableOptions.allowedToApproveUsers.bind(null, false))
  .addIntegerOption(enableOptions.submissionThreshold.bind(null, false))
  .addStringOption(enableOptions.messageColor.bind(null, false))
  .addRoleOption(enableOptions.submitterRoles.bind(null, false))
  .addStringOption((option) => option.setName('title')
    .setDescription('The page\'s title will be taken from channel/thread\'s name if not set.')
    .setRequired(false),
  )

const getChannelName = (interaction: CommandInteraction<CacheType>): string => {
  const channel = interaction.guild?.channels.cache.get(interaction.channelId)
  if (channel) {
    return channel.name
  }
  return ''
}

export const enableCommandHandler = async (managers: Managers, interaction: CommandInteraction<CacheType>): Promise<void> => {
  try {
    const dbSettData = convertEnableToDbType(interaction.options.data)
    if (!dbSettData.title) {
      dbSettData.title = getChannelName(interaction)
    }
    const res = await managers.settings.upsert(interaction.channelId, dbSettData as unknown as ChSettingsData)
    const { commands: { enable: { messages } } } = config

    await interaction.reply({ content: res?.inserted ? messages.enabled : messages.updated, ephemeral: true })
  } catch (e: unknown) {
    if (e instanceof ReportableError) {
      await interaction.reply({ content: e.message, ephemeral: true })
    } else {
      console.log(e) // eslint-disable-line no-console
    }
  }
}
