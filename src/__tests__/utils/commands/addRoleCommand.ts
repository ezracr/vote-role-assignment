import type { CommandInteraction, CacheType } from 'discord.js'

import config from '../../../config'
import { assignRoleByName } from '../../../discUtils'
import Managers from '../../../db/managers'

export const handleAddRoleCommand = async (managers: Managers, interaction: CommandInteraction<CacheType>): Promise<string> => {
  try {
    const { guildId, user: { id } } = interaction
    const roleName = interaction.options.getSubcommand() === 'add-role-1' ? config.testing.roleName1 : config.testing.roleName2
    if (guildId) {
      await assignRoleByName(guildId, id, roleName.slice(1))
      return 'Done'
    }
  } catch (e: unknown) {
    console.log(e)
  }
  return 'Failed'
}
