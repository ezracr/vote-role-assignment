import { SlashCommandBuilder } from '@discordjs/builders'
import type { CommandInteraction, CacheType } from 'discord.js'

import Managers from '../../db/managers'
import { ReportableError } from '../../db/managers/manUtils'
import { ChSettingsData } from '../../db/dbTypes'
import config from '../../config'
import { convertToDbType, enableOptions } from './commUtils'

export const updateCommand = new SlashCommandBuilder()
  .setDefaultPermission(false)
  .setName(config.commands.update.name)
  .setDescription('Update individual fields of this channel/thread\'s config.')
  .addSubcommand((subcommand) =>
    subcommand
      .setName('set')
      .setDescription('Set new values')
      .addRoleOption(enableOptions.awardedRole.bind(null, false))
      .addIntegerOption(enableOptions.votingThreshold.bind(null, false))
      .addRoleOption(enableOptions.allowedToVoteRole1.bind(null, false))
      .addRoleOption(enableOptions.allowedToVoteRole2.bind(null, false))
      .addStringOption((option) => option.setName('title')
        .setDescription('The page\'s title.')
        .setRequired(false)
      )
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName('remove-allowed-to-vote')
      .setDescription('Remove the allowed to vote roles.')
  )

const handleCommand = async (managers: Managers, interaction: CommandInteraction<CacheType>): Promise<string> => {
  const { commands: { update: { messages } } } = config
  try {
    if (interaction.options.getSubcommand() === 'remove-allowed-to-vote') {
      const res = await managers.settings.updateAnySettingsFieldByChId(interaction.channelId, { allowed_to_vote_roles: [] })
      if (res) return '`allowed-to-vote-role`s have been cleared.'
      return config.messages.wasNotEnabled
    }
    const optionsData = interaction.options.data[0].options
    if (!optionsData || optionsData.length === 0) {
      return messages.noArgs
    }
    const dbType = convertToDbType({
      optionsData,
      group: ['allowed_to_vote_role'],
      rename: { 'remove-allowed-to-vote-roles': 'allowed_to_vote_roles' },
      valueOverrides: { 'remove-allowed-to-vote-roles': [] }
    })

    const res = await managers.settings.updateAnySettingsFieldByChId(interaction.channelId, dbType as unknown as ChSettingsData)
    if (res) return messages.done
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
