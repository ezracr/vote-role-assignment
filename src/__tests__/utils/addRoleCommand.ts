import { SlashCommandBuilder } from '@discordjs/builders'
import type { CommandInteraction, CacheType } from 'discord.js'

import config from '../../config'
import { assignRoleByName } from '../../discUtils'
import Managers from '../../db/managers'

export const addRoleCommand = new SlashCommandBuilder()
  .setDefaultPermission(false)
  .setDescription('Assign a role to the user that called it.')
  .setName('test-add-role')
  .addSubcommand((subcommand) =>
    subcommand
      .setName('awarded-role-1')
      .setDescription('Assign awardedRoleName1')
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName('awarded-role-2')
      .setDescription('Assign awardedRoleName2')
  )

const handleCommand = async (managers: Managers, interaction: CommandInteraction<CacheType>): Promise<string> => {
  try {
    const { guildId, user: { id } } = interaction
    const roleName = interaction.options.getSubcommand() === 'awarded-role-1' ? config.testing.awardedRoleName1 : config.testing.awardedRoleName2
    if (guildId) {
      await assignRoleByName(guildId, id, roleName.slice(1))
      return 'Done'
    }
  } catch (e: unknown) {
    console.log(e)
  }
  return 'Failed'
}

export const addRoleCommandHandler = async (managers: Managers, interaction: CommandInteraction<CacheType>): Promise<void> => {
  const message = await handleCommand(managers, interaction)
  await interaction.reply({ content: message, ephemeral: true })
}
