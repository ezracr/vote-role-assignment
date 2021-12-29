import bld = require('@discordjs/builders')
import type { CommandInteraction, CacheType } from 'discord.js'

import { SettingsData } from '../db/dbTypes'
import Managers from '../db/managers'

export const infoCommand = new bld.SlashCommandBuilder()
  .setDefaultPermission(false)
  .setName('info')
  .setDescription('Show the settings of this channel/thread.')

export const prepareSettingsForDisplay = (obj: SettingsData): string => (
  (Object.keys(obj) as (keyof SettingsData)[]).map((key) => {
    const normKey = key.replaceAll('_', '-')
    return `  ${normKey}: ${JSON.stringify(obj[key])}`
  }).join('\n')
)

export const infoCommandHandler = async (managers: Managers, interaction: CommandInteraction<CacheType>): Promise<void> => {
  try {
    const res = await managers.settings.getById(interaction.channelId)
    if (res) {
      await interaction.reply({ content: `Settings:\n${prepareSettingsForDisplay(res.data)}`, ephemeral: true })
    } else {
      await interaction.reply({ content: 'Couldn\'t fetch the data', ephemeral: true })
    }
  } catch (e: unknown) {
    console.log(e)
  }
}
