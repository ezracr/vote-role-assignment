import bld = require('@discordjs/builders')
import type { CommandInteraction, CacheType } from 'discord.js'

import Managers from '../db/managers'
import { ReportableError } from '../db/managers/manUtils'

import { SettingsData } from '../db/dbTypes'
import { convertToDbType, enableOptions } from './commUtils'

export const updateCommand = new bld.SlashCommandBuilder()
  .setName('update')
  .setDescription('Update individual fields of this channel/thread\'s config.')
  .addRoleOption(enableOptions.awardedRole.bind(null, false))
  .addIntegerOption(enableOptions.votingThreshold.bind(null, false))
  .addRoleOption(enableOptions.allowedToVoteRole1.bind(null, false))
  .addRoleOption(enableOptions.allowedToVoteRole2.bind(null, false))

const handleCommand = async (managers: Managers, interaction: CommandInteraction<CacheType>): Promise<string> => {
  try {
    if (interaction.options.data.length === 0) {
      return 'At least one argument needed for this command'
    }
    const dbType = convertToDbType({
      optionsData: interaction.options.data,
      group: [{ toKey: 'allowed_to_vote_roles', fromKeys: ['allowed-to-vote-role1', 'allowed-to-vote-role2'] }],
    })
    await managers.settings.updateAnyFieldById(interaction.channelId, dbType as unknown as SettingsData)
    return 'Updated'
  } catch (e: unknown) {
    if (e instanceof ReportableError) {
      return e.message
    } else {
      console.log(e)
    }
  }
  return 'Failed to update'
}

export const updateCommandHandler = async (managers: Managers, interaction: CommandInteraction<CacheType>) => {
  const message = await handleCommand(managers, interaction)
  await interaction.reply({ content: message, ephemeral: true })
}
