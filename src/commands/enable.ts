import bld = require('@discordjs/builders')
import type { CommandInteraction, CacheType } from 'discord.js'

import Managers from '../db/managers'
import { ReportableError } from '../db/managers/manUtils'

import { SettingsData } from '../db/dbTypes'
import { convertToDbType, enableOptions } from './commUtils'

export const enableCommand = new bld.SlashCommandBuilder()
  .setName('enable')
  .setDescription('Initialize/update the bot in this channel/thread.')
  .addRoleOption(enableOptions.awardedRole.bind(null, true))
  .addIntegerOption(enableOptions.votingThreshold.bind(null, true))
  .addRoleOption(enableOptions.allowedToVoteRole1.bind(null, false))
  .addRoleOption(enableOptions.allowedToVoteRole2.bind(null, false))

export const enableCommandHandler = async (managers: Managers, interaction: CommandInteraction<CacheType>) => {
  try {
    const dbType = convertToDbType({
      optionsData: interaction.options.data,
      group: [{ toKey: 'allowed_to_vote_roles', fromKeys: ['allowed-to-vote-role1', 'allowed-to-vote-role2'] }],
    })
    const res = await managers.settings.upsert(interaction.channelId, dbType as unknown as SettingsData)
    await interaction.reply({ content: res.inserted ? 'Enabled' : 'Updated', ephemeral: true })
  } catch (e: unknown) {
    if (e instanceof ReportableError) {
      await interaction.reply({ content: e.message, ephemeral: true })
    } else {
      console.log(e)
    }
  }
}
