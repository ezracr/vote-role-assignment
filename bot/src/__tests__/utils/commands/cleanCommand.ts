import type { CommandInteraction, CacheType } from 'discord.js'
import cleanDb from '../dbUtils'

import config from '../../../config'
import client from '../../../client'
import Managers from '../../../db/managers'
import { removeRoleByName } from '../../../discUtils'

const removeFromChannelByChId = async (chId: string): Promise<void> => {
  const channel = await client.channels.fetch(chId)
  if (channel && 'bulkDelete' in channel) {
    const msgs = await channel.messages.fetch({ limit: 100 })
    await channel.bulkDelete(msgs)
  }
}

export const handleCleanCommand = async (managers: Managers, interaction: CommandInteraction<CacheType>): Promise<string> => {
  try {
    const { guildId } = interaction
    if (guildId) {
      await Promise.all([
        removeFromChannelByChId(config.testing.testChannel1Id),
        removeFromChannelByChId(config.testing.testChannel2Id),
        removeRoleByName(guildId, config.testing.user1Id, config.testing.roleName1.slice(1)),
        removeRoleByName(guildId, config.testing.user1Id, config.testing.roleName2.slice(1)),
        removeRoleByName(guildId, config.testing.user2Id, config.testing.roleName1.slice(1)),
        removeRoleByName(guildId, config.testing.user2Id, config.testing.roleName2.slice(1)),
        cleanDb(),
      ])
      return 'Done'
    }
  } catch (e: unknown) {
    console.log(e) // eslint-disable-line no-console
  }
  return 'Failed'
}
