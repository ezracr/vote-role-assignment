import { SlashCommandBuilder } from '@discordjs/builders'
import type { CommandInteraction, CacheType } from 'discord.js'

import Managers from '../../../db/managers'
import { ReportableError } from '../../../db/managers/manUtils'
// import { ChSettingsData } from '../../db/dbTypes'
import { handleCleanCommand } from './cleanCommand'
import { handleAddRoleCommand } from './addRoleCommand'
import { handleStatsCommand } from './testStatsCommand'

export const testCommand = new SlashCommandBuilder()
  .setDefaultPermission(false)
  .setName('test')
  .setDescription('Testing utils')
  .addSubcommand((subcommand) =>
    subcommand
      .setName('clean')
      .setDescription('Removes the last 100 messages.'),
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName('add-role-1')
      .setDescription('Assigns RoleName1'),
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName('add-role-2')
      .setDescription('Assigns RoleName2'),
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName('stats')
      .setDescription('Assigns RoleName2'),
  )

const handleCommand = async (managers: Managers, interaction: CommandInteraction<CacheType>): Promise<string> => {
  try {
    switch (true) { // eslint-disable-line default-case
      case (interaction.options.getSubcommand() === 'clean'):
        return await handleCleanCommand(managers, interaction)
      case (interaction.options.getSubcommand() === 'add-role-1' || interaction.options.getSubcommand() === 'add-role-2'):
        return await handleAddRoleCommand(managers, interaction)
      case (interaction.options.getSubcommand() === 'stats'):
        return await handleStatsCommand(managers, interaction)
    }
  } catch (e: unknown) {
    if (e instanceof ReportableError) {
      return e.message
    } else {
      console.log(e) // eslint-disable-line no-console
    }
  }
  return 'Failed.'
}

export const testCommandHandler = async (managers: Managers, interaction: CommandInteraction<CacheType>): Promise<void> => {
  const message = await handleCommand(managers, interaction)
  await interaction.reply({ content: message, ephemeral: true })
}
