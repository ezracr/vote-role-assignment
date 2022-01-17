import type { CommandInteraction, CacheType } from 'discord.js'
import cleanDb from '../dbUtils'

import config from '../../../config'
import client from '../../../client'
import Managers from '../../../db/managers'
import { removeRoleByName } from '../../../discUtils'

const removeFromChannelByChId = async (chId: string): Promise<void> => {
  const channel = await client.channels.fetch(chId)
  if (channel?.type === 'GUILD_TEXT') {
    const msgs = await channel.messages.fetch({ limit: 100 })
    await channel.bulkDelete(msgs)
  }
}

export const handleCleanCommand = async (managers: Managers, interaction: CommandInteraction<CacheType>): Promise<string> => {
  try {
    const { guildId, user: { id }, channel } = interaction
    if (guildId && channel?.type === 'GUILD_TEXT') {
      await Promise.all([
        removeFromChannelByChId(config.testing.testChannel1Id),
        removeFromChannelByChId(config.testing.testChannel2Id),
        removeRoleByName(guildId, id, config.testing.roleName1.slice(1)),
        removeRoleByName(guildId, id, config.testing.roleName2.slice(1)),
        cleanDb(),
      ])
      return 'Done'
    }
  } catch (e: unknown) {
    console.log(e)
  }
  return 'Failed'
}
