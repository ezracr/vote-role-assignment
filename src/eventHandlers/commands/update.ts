import bld = require('@discordjs/builders')
import type { CommandInteraction, CacheType } from 'discord.js'

import Managers from '../../db/managers'
import { ReportableError } from '../../db/managers/manUtils'

import { ChSettingsData } from '../../db/dbTypes'
import { convertToDbType, enableOptions, replies } from './commUtils'

export const updateCommand = new bld.SlashCommandBuilder()
  .setDefaultPermission(false)
  .setName('update')
  .setDescription('Update individual fields of this channel/thread\'s config.')
  .addRoleOption(enableOptions.awardedRole.bind(null, false))
  .addIntegerOption(enableOptions.votingThreshold.bind(null, false))
  .addRoleOption(enableOptions.allowedToVoteRole1.bind(null, false))
  .addRoleOption(enableOptions.allowedToVoteRole2.bind(null, false))
  .addStringOption((option) => option.setName('title')
    .setDescription('The page\'s title.')
    .setRequired(false)
  )

const handleCommand = async (managers: Managers, interaction: CommandInteraction<CacheType>): Promise<string> => {
  try {
    if (interaction.options.data.length === 0) {
      return 'At least one argument needed for this command'
    }
    const dbType = convertToDbType({
      optionsData: interaction.options.data,
      group: ['allowed_to_vote_role'],
    })
    const res = await managers.settings.updateAnySettingsFieldByChId(interaction.channelId, dbType as unknown as ChSettingsData)
    if (res) return 'Updated'
    return replies.wasNotEnabled
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
