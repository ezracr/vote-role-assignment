import { SlashCommandBuilder } from '@discordjs/builders'
import { CommandInteraction, CacheType } from 'discord.js'

import Managers from '../../db/managers'
import { ReportableError } from '../../db/managers/manUtils'
import config from '../../config'

export const migrateCommand = new SlashCommandBuilder()
  .setDefaultPermission(false)
  .setName(config.commands.migrate.name)
  .setDescription(config.commands.migrate.description)
  .addChannelOption(
    (option) => option.setName('channel')
      .setDescription('Channel/thread.')
      .setRequired(true),
  )

const handleCommand = async (managers: Managers, interaction: CommandInteraction<CacheType>): Promise<string> => {
  const { commands: { migrate: { messages } } } = config
  try {
    const inputArg = interaction.options.data[0]

    if (inputArg?.channel) {
      const res = await managers.settings.mergeOneChSettingsIntoAnotherByChId(interaction.channelId, inputArg.channel.id)
      if (res) return messages.done
      return config.messages.wasNotEnabled
    }
  } catch (e: unknown) {
    if (e instanceof ReportableError) {
      return e.message
    } else {
      console.log(e) // eslint-disable-line no-console
    }
  }
  return messages.failed
}

export const migrateCommandHandler = async (managers: Managers, interaction: CommandInteraction<CacheType>): Promise<void> => {
  const message = await handleCommand(managers, interaction)
  await interaction.reply({ content: message, ephemeral: true })
}
