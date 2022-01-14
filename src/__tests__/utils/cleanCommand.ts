import { SlashCommandBuilder } from '@discordjs/builders'
import type { CommandInteraction, CacheType } from 'discord.js'

import config from '../../config'
import client from '../../client'
import Managers from '../../db/managers'
import { removeRoleByName } from '../../discUtils'

export const cleanCommand = new SlashCommandBuilder()
  .setDefaultPermission(false)
  .setDescription('Removes the last 100 messages.')
  .setName('test-clean')

const removeFromChannelByChId = async (chId: string): Promise<void> => {
  const channel = await client.channels.fetch(chId)
  if (channel?.type === 'GUILD_TEXT') {
    const msgs = await channel.messages.fetch({ limit: 100 })
    await channel.bulkDelete(msgs)
  }
}

const handleCommand = async (managers: Managers, interaction: CommandInteraction<CacheType>): Promise<string> => {
  try {
    const { guildId, user: { id }, channel } = interaction
    if (guildId && channel?.type === 'GUILD_TEXT') {
      await removeFromChannelByChId(config.testing.testChannel1Id)
      await removeFromChannelByChId(config.testing.testChannel2Id)
      await removeRoleByName(guildId, id, config.testing.roleName1.slice(1))
      await removeRoleByName(guildId, id, config.testing.roleName2.slice(1))
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
