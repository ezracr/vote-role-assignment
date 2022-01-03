import type { CommandInteractionOption, CacheType } from 'discord.js'
import bld = require('@discordjs/builders')

import config from '../../config'

const replaceHyphensInKey = (name: string): string => name.replaceAll('-', '_')

const isAppendId = (key: string, appIdKeys: AppendIdType): boolean => (
  appIdKeys.some((appIdKey) => key === appIdKey)
)

const findDbGroupPrefix = (key: string, group: GroupType): string | undefined => (
  group.find((grKey) => key.startsWith(grKey))
)

const normalizeToDbKey = (name: string, group?: GroupType, appendId?: AppendIdType): [name: string, isGroup: boolean] => {
  if (group) {
    const groupPrefix = findDbGroupPrefix(name, group)
    return [replaceHyphensInKey(`${groupPrefix}s`), true]
  }
  if (appendId && isAppendId(name, appendId)) {
    return [replaceHyphensInKey(`${name}_id`), false]
  }
  return [replaceHyphensInKey(name), false]
}

const normalizeToDbValue = (val: CommandInteractionOption<CacheType>): string | number | boolean | undefined => {
  if (val.type === 'ROLE') {
    return val.role!.id // eslint-disable-line @typescript-eslint/no-non-null-assertion
  }
  if (val.type === 'CHANNEL') {
    return val.channel!.id // eslint-disable-line @typescript-eslint/no-non-null-assertion
  }
  return val.value
}

type GroupType = string[]
type AppendIdType = string[]

type ConvertDbTypeInput = {
  optionsData: readonly CommandInteractionOption<CacheType>[];
  group?: GroupType;
  appendId?: AppendIdType;
}

type ValType = string | number | true | (string | number | true)[]

/**
 * Turns hyphens into underscores in object keys. Extracts role and channel ids from `optionsData` values.
 * Allows to
 * - Group several fields into one, e.g. if `group` is set to `option`,
 *   this object `{ option1: 1, options2: 2 }` will turn into `{ options: [1, 2] }`. 's' will be added automatically.
 * - Append ids to keys, e.g. `appendId: ['test']`, { test: 1 } => { test_id: 1 }
 *
 * @param param0
 *
 */
export const convertToDbType = ({ optionsData, group, appendId }: ConvertDbTypeInput): Record<string, ValType> => {
  return optionsData.reduce<Record<string, ValType>>((acc, val) => {
    const [normKey, isGroup] = normalizeToDbKey(val.name, group, appendId)
    const normValue = normalizeToDbValue(val)

    if (isGroup) {
      if (!acc[normKey]) acc[normKey] = []
      if (normValue) {
        const arr = acc[normKey]
        if (Array.isArray(arr)) {
          arr.push(normValue)
        }
      }
      return acc
    }

    if (normValue) {
      acc[normKey] = normValue
    }
    return acc
  }, {})
}

export const enableOptions = {
  awardedRole(isRequired: boolean, option: bld.SlashCommandRoleOption): bld.SlashCommandRoleOption {
    return option.setName('awarded-role')
      .setDescription('Awarded role')
      .setRequired(isRequired)
  },
  votingThreshold(isRequired: boolean, option: bld.SlashCommandIntegerOption): bld.SlashCommandIntegerOption {
    return option.setName('voting-threshold')
      .setDescription('How many votes required to award the role')
      .setRequired(isRequired)
  },
  allowedToVoteRole1(isRequired: boolean, option: bld.SlashCommandRoleOption): bld.SlashCommandRoleOption {
    return option.setName('allowed-to-vote-role1')
      .setDescription('If set, will allow only this role to vote')
      .setRequired(isRequired)
  },
  allowedToVoteRole2(isRequired: boolean, option: bld.SlashCommandRoleOption): bld.SlashCommandRoleOption {
    return option.setName('allowed-to-vote-role2')
      .setDescription('If set, will allow only this role to vote')
      .setRequired(isRequired)
  },
}

export const genLinkToDocPage = (channelId: string) => `${config.baseUrl}/docs/${channelId}`

export const replies = {
  wasNotEnabled: 'The bot was not enabled in this channel/thread',
}
