import type { CommandInteraction, CacheType } from 'discord.js'

import Managers from '../../../db/managers'
import { fetchMember } from '../../../discUtils'

const fetchStats = async (interaction: CommandInteraction<CacheType>) => {
  const { channel } = interaction
  const [pinned, member] = await Promise.all([
    channel?.messages.fetchPinned(), fetchMember(interaction.guildId!, interaction.user.id),
  ])

  return {
    'numOfPins': pinned?.size ?? 0,
    'roles': member?.roles.cache.map((role) => role.name) ?? []
  }
}

export const handleStatsCommand = async (managers: Managers, interaction: CommandInteraction<CacheType>): Promise<string> => {
  try {
    const { guildId, channel } = interaction
    if (guildId && channel?.type === 'GUILD_TEXT') {
      const res = await fetchStats(interaction)
      return JSON.stringify(res)
    }
  } catch (e: unknown) {
    console.log(e)
  }
  return 'Failed'
}
