import { SlashCommandBuilder } from '@discordjs/builders'
import type { CommandInteraction, CacheType } from 'discord.js'

import config from '../../config'
import Managers from '../../db/managers'
import { removeRoleByName } from '../../discUtils'

export const cleanCommand = new SlashCommandBuilder()
  .setDefaultPermission(false)
  .setDescription('Removes the last 100 messages.')
  .setName('test-clean')

const handleCommand = async (managers: Managers, interaction: CommandInteraction<CacheType>): Promise<string> => {
  try {
    const { guildId, user: { id }, channel } = interaction
    const msgs = await channel?.messages.fetch({ limit: 100 })
    if (guildId && msgs && channel?.type === 'GUILD_TEXT') {
      await channel.bulkDelete(msgs)
      await removeRoleByName(guildId, id, config.testing.awardedRoleName1.slice(1))
      await removeRoleByName(guildId, id, config.testing.awardedRoleName1.slice(1))
      return 'Done'
    }
  } catch (e: unknown) {
    console.log(e)
  }
  return 'Failed'
}

export const cleanCommandHandler = async (managers: Managers, interaction: CommandInteraction<CacheType>): Promise<void> => {
  const message = await handleCommand(managers, interaction)
  await interaction.reply({ content: message, ephemeral: true })
}
