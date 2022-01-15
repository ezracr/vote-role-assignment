import type { CommandInteraction, CacheType } from 'discord.js'

import Managers from '../../../db/managers'

const fetchStats = async (interaction: CommandInteraction<CacheType>) => {
  const { channel } = interaction
  const [pinned] = await Promise.all([channel?.messages.fetchPinned()])
  return {
    'pinned-count': pinned?.size ?? 0,
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
