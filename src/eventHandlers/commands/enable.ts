import { SlashCommandBuilder } from '@discordjs/builders'
import type { CommandInteraction, CacheType } from 'discord.js'

import Managers from '../../db/managers'
import { ReportableError } from '../../db/managers/manUtils'
import { ChSettingsData } from '../../db/dbTypes'
import config from '../../config'
import { convertToDbType, enableOptions, genLinkToDocPage } from './commUtils'

export const enableCommand = new SlashCommandBuilder()
  .setDefaultPermission(false)
  .setName(config.commands.enable.name)
  .setDescription('Initialize/update the bot in this channel/thread.')
  .addRoleOption(enableOptions.awardedRole.bind(null, true))
  .addIntegerOption(enableOptions.votingThreshold.bind(null, true))
  .addRoleOption(enableOptions.allowedToVoteRole1.bind(null, false))
  .addRoleOption(enableOptions.allowedToVoteRole2.bind(null, false))
  .addStringOption((option) => option.setName('title')
    .setDescription('The page\'s title will be taken from channel/thread\'s name if not set.')
    .setRequired(false)
  )

const getChannelName = (interaction: CommandInteraction<CacheType>): string => {
  const channel = interaction.guild?.channels.cache.get(interaction.channelId)
  if (channel) {
    return channel.name
  }
  return ''
}

export const enableCommandHandler = async (managers: Managers, interaction: CommandInteraction<CacheType>): Promise<void> => {
  try {
    const dbSettingsData = convertToDbType({
      optionsData: interaction.options.data,
      group: ['allowed-to-vote-role'],
    })
    if (!dbSettingsData.title) {
      dbSettingsData.title = getChannelName(interaction)
    }
    const res = await managers.settings.upsert(interaction.channelId, dbSettingsData as unknown as ChSettingsData)
    const { commands: { enable: { messages } } } = config

    if (res?.inserted) {
      const newMsg = await interaction.channel?.send({
        content: messages.docLinkMsg(genLinkToDocPage(interaction.channelId)),
      })
      await newMsg?.pin()
    }
    await interaction.reply({ content: res?.inserted ? messages.enabled : messages.updated, ephemeral: true })
  } catch (e: unknown) {
    if (e instanceof ReportableError) {
      await interaction.reply({ content: e.message, ephemeral: true })
    } else {
      console.log(e)
    }
  }
}
