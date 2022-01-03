import bld = require('@discordjs/builders')
import type { CommandInteraction, CacheType } from 'discord.js'

import Managers from '../../db/managers'
import { ReportableError } from '../../db/managers/manUtils'

import { replies } from './commUtils'

export const migrateCommand = new bld.SlashCommandBuilder()
  .setDefaultPermission(false)
  .setName('migrate')
  .setDescription('Migrate to a different channel/thread.')
  .addChannelOption(
    (option) => option.setName('channel')
      .setDescription('Channel/thread.')
      .setRequired(true)
  )

const handleCommand = async (managers: Managers, interaction: CommandInteraction<CacheType>): Promise<string> => {
  try {
    const inputArg = interaction.options.data[0]

    if (inputArg.channel) {
      const res = await managers.settings.updateChIdByChId(interaction.channelId, inputArg.channel.id)
      if (res) return 'Done.'
      return replies.wasNotEnabled
    }
  } catch (e: unknown) {
    if (e instanceof ReportableError) {
      return e.message
    } else {
      console.log(e)
    }
  }
  return 'Failed to migrate.'
}

export const migrateCommandHandler = async (managers: Managers, interaction: CommandInteraction<CacheType>): Promise<void> => {
  const message = await handleCommand(managers, interaction)
  await interaction.reply({ content: message, ephemeral: true })
}
