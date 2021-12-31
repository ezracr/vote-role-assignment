import bld = require('@discordjs/builders')
import type { CommandInteraction, CacheType } from 'discord.js'

import Managers from '../../db/managers'

export const disableCommand = new bld.SlashCommandBuilder()
  .setDefaultPermission(false)
  .setName('disable')
  .setDescription('Disable the bot in this channel/thread.')

export const disableCommandHandler = async (managers: Managers, interaction: CommandInteraction<CacheType>): Promise<void> => {
  try {
    const res = await managers.settings.deleteById(interaction.channelId)
    if (res) {
      await interaction.reply({ content: 'Disabled', ephemeral: true })
    } else {
      await interaction.reply({ content: 'The bot was not enabled in this channel/thread', ephemeral: true })
    }
  } catch (e: unknown) {
    console.log(e)
  }
}
