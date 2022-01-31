import { SlashCommandBuilder } from '@discordjs/builders'
import type { CommandInteraction, CacheType } from 'discord.js'

import Managers from '../../db/managers'
import config from '../../config'

export const disableCommand = new SlashCommandBuilder()
  .setDefaultPermission(false)
  .setName(config.commands.disable.name)
  .setDescription(config.commands.disable.description)

export const disableCommandHandler = async (managers: Managers, interaction: CommandInteraction<CacheType>): Promise<void> => {
  try {
    const { commands: { disable: { messages } } } = config
    const res = await managers.settings.deleteByChId(interaction.channelId)
    if (res) {
      await interaction.reply({ content: messages.done, ephemeral: true })
    } else {
      await interaction.reply({ content: config.messages.wasNotEnabled, ephemeral: true })
    }
  } catch (e: unknown) {
    console.log(e) // eslint-disable-line no-console
  }
}
