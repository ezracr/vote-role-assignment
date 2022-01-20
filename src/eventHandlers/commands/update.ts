import { SlashCommandBuilder } from '@discordjs/builders'
import type { CommandInteraction, CacheType } from 'discord.js'

import Managers from '../../db/managers'
import { ReportableError } from '../../db/managers/manUtils'
import { ChSettingsData } from '../../db/dbTypes'
import config from '../../config'
import { enableOptions, convertEnableToDbType as convertEnableDataToDbSettData } from './commUtils'

export const updateCommand = new SlashCommandBuilder()
  .setDefaultPermission(false)
  .setName(config.commands.update.name)
  .setDescription(config.commands.update.description)
  .addSubcommand((subcommand) =>
    subcommand
      .setName('set')
      .setDescription('Set new values.')
      .addRoleOption(enableOptions.awardedRole.bind(null, false))
      .addIntegerOption(enableOptions.votingThreshold.bind(null, false))
      .addRoleOption(enableOptions.allowedToVoteRole.bind(null, false))
      .addStringOption(enableOptions.submissionType.bind(null, false))
      .addIntegerOption(enableOptions.approvalThreshold.bind(null, false))
      .addRoleOption(enableOptions.allowedToApproveRoles.bind(null, false))
      .addUserOption(enableOptions.allowedToApproveUsers.bind(null, false))
      .addIntegerOption(enableOptions.submissionThreshold.bind(null, false))
      .addStringOption(enableOptions.messageColor.bind(null, false))
      .addRoleOption(enableOptions.submitterRoles.bind(null, false))
      .addStringOption((option) => option.setName('title')
        .setDescription('The page\'s title.')
        .setRequired(false)
      )
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName('add')
      .setDescription('Add new values to array params.')
      .addStringOption(enableOptions.submissionType.bind(null, false))
      .addRoleOption(enableOptions.allowedToVoteRole.bind(null, false))
      .addRoleOption(enableOptions.allowedToApproveRoles.bind(null, false))
      .addUserOption(enableOptions.allowedToApproveUsers.bind(null, false))
      .addRoleOption(enableOptions.submitterRoles.bind(null, false))
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName('del')
      .setDescription('Remove values from array params.')
      .addStringOption(enableOptions.submissionType.bind(null, false))
      .addRoleOption(enableOptions.allowedToVoteRole.bind(null, false))
      .addRoleOption(enableOptions.allowedToApproveRoles.bind(null, false))
      .addUserOption(enableOptions.allowedToApproveUsers.bind(null, false))
      .addRoleOption(enableOptions.submitterRoles.bind(null, false))
  )

const handleCommand = async (managers: Managers, interaction: CommandInteraction<CacheType>): Promise<string> => {
  const { commands: { update: { messages } } } = config
  try {
    const optionsData = interaction.options.data[0]?.options
    if (!optionsData || optionsData.length === 0) {
      return messages.noArgs
    }
    const dbSettData = convertEnableDataToDbSettData(optionsData)
    if (interaction.options.getSubcommand() === 'add') {
      const res = await managers.settings.patchDataArrayFields(interaction.channelId, dbSettData)
      if (res) return messages.done
    }
    if (interaction.options.getSubcommand() === 'del') {
      const res = await managers.settings.patchDataArrayFields(interaction.channelId, dbSettData, true)
      if (res) return messages.done
    }
    if (interaction.options.getSubcommand() === 'set') {
      const res = await managers.settings.patchDataByChId(interaction.channelId, dbSettData as unknown as ChSettingsData)
      if (res) return messages.done
    }
    return config.messages.wasNotEnabled
  } catch (e: unknown) {
    if (e instanceof ReportableError) {
      return e.message
    } else {
      console.log(e)
    }
  }
  return 'Failed to update'
}

export const updateCommandHandler = async (managers: Managers, interaction: CommandInteraction<CacheType>): Promise<void> => {
  const message = await handleCommand(managers, interaction)
  await interaction.reply({ content: message, ephemeral: true })
}
