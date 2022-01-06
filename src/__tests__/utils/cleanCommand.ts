import { SlashCommandBuilder } from '@discordjs/builders'
import type { CommandInteraction, CacheType } from 'discord.js'

import Managers from '../../db/managers'

export const cleanCommand = new SlashCommandBuilder()
  .setDefaultPermission(false)
  .setDescription('Removes the last 100 messages.')
  .setName('test-clean')

const handleCommand = async (managers: Managers, interaction: CommandInteraction<CacheType>): Promise<string> => {
  try {
    const msgs = await interaction.channel?.messages.fetch({ limit: 100 })
    if (msgs && interaction.channel?.type === 'GUILD_TEXT') {
      await interaction.channel.bulkDelete(msgs)
      return 'Done'
    }
  } catch (e: unknown) {}
  return 'Failed'
}

export const cleanCommandHandler = async (managers: Managers, interaction: CommandInteraction<CacheType>): Promise<void> => {
  const message = await handleCommand(managers, interaction)
  await interaction.reply({ content: message, ephemeral: true })
}
