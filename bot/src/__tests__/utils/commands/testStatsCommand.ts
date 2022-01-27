import type { CommandInteraction, CacheType } from 'discord.js'

import { ChSettingsData } from '../../../db/dbTypes'
import Managers from '../../../db/managers'
import { fetchMember, convertIdToRoleTag } from '../../../discUtils'


const convertIdsToRoleTagsArray = (userIds?: string[] | null): string[] => userIds?.map((id) => convertIdToRoleTag(id)) ?? []

const prepareChSettData = (data?: ChSettingsData) => { // eslint-disable-line @typescript-eslint/explicit-function-return-type
  if (data) {
    return {
      ...data,
      'submitter_roles': convertIdsToRoleTagsArray(data.submitter_roles),
      'awarded_role': convertIdToRoleTag(data.awarded_role),
    }
  }
}

const fetchStats = async (managers: Managers, interaction: CommandInteraction<CacheType>) => { // eslint-disable-line @typescript-eslint/explicit-function-return-type
  const { channel } = interaction
  const [pinned, member, chSett] = await Promise.all([
    channel?.messages.fetchPinned(), fetchMember(interaction.guildId!, interaction.user.id), // eslint-disable-line @typescript-eslint/no-non-null-assertion
    managers.settings.getByChId(interaction.channelId)
  ])

  return {
    numOfPins: pinned?.size ?? 0,
    roles: member?.roles.cache.map((role) => role.name) ?? [],
    chSett: prepareChSettData(chSett?.data),
  }
}

export const handleStatsCommand = async (managers: Managers, interaction: CommandInteraction<CacheType>): Promise<string> => {
  try {
    const { guildId, channel } = interaction
    if (guildId && channel?.type === 'GUILD_TEXT') {
      const res = await fetchStats(managers, interaction)
      return JSON.stringify(res)
    }
  } catch (e: unknown) {
    console.log(e)
  }
  return 'Failed'
}
