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
    channel?.messages.fetchPinned(), fetchMember(interaction.guild!, interaction.user.id), // eslint-disable-line @typescript-eslint/no-non-null-assertion
    managers.settings.getMany({ channel_id: interaction.channelId }),
  ])

  return {
    numOfPins: pinned?.size ?? 0,
    roles: member?.roles.cache.map((role) => role.name) ?? [],
    chSett: prepareChSettData(chSett[0]?.data),
  }
}

export const handleStatsCommand = async (managers: Managers, interaction: CommandInteraction<CacheType>): Promise<string> => {
  try {
    const { guildId, channel } = interaction
    if (guildId && channel && 'messages' in channel) {
      const res = await fetchStats(managers, interaction)
      return JSON.stringify(res)
    }
  } catch (e: unknown) {
    console.log(e) // eslint-disable-line no-console
  }
  return 'Failed'
}
