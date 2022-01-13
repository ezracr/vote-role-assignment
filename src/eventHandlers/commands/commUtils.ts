import {
  SlashCommandIntegerOption, SlashCommandRoleOption, SlashCommandStringOption,
} from '@discordjs/builders'
import type { CommandInteractionOption, CacheType } from 'discord.js'

import config from '../../config'

const replaceHyphensInKey = (name: string): string => name.replaceAll('-', '_')

const isAppendId = (key: string, appIdKeys: AppendIdType): boolean => (
  appIdKeys.some((appIdKey) => key === appIdKey)
)

const findDbGroupPrefix = (key: string, group: GroupType): string | undefined => (
  group.find((grKey) => key.startsWith(grKey))
)

const normalizeToDbKey = (name: string, group?: GroupType, appendId?: AppendIdType, rename?: RenameType): [name: string, isGroup: boolean] => {
  if (group) {
    const groupPrefix = findDbGroupPrefix(name, group)
    if (groupPrefix) {
      return [replaceHyphensInKey(`${groupPrefix}s`), true]
    }
  }
  if (rename?.[name]) {
    return [replaceHyphensInKey(rename[name]!), false] // eslint-disable-line @typescript-eslint/no-non-null-assertion
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
type RenameType = Record<string, string>
type ValueOverridesType = Record<string, ValType>
type ToArray = string[]

type ConvertDbTypeInput = {
  optionsData: readonly CommandInteractionOption<CacheType>[];
  group?: GroupType;
  appendId?: AppendIdType;
  rename?: RenameType;
  valueOverrides?: ValueOverridesType;
  toArray?: ToArray;
}

type ValType = string | number | true | (string | number | true)[]
export type ConvertToDbTypeRet = Record<string, ValType>

/**
 * Turns hyphens into underscores in object keys. Extracts role and channel ids from `optionsData` values.
 *
 * @param optionsData Option's data from `interaction.options.data` or `interaction.options.data[ind].options` if it's a subcommand.
 * @param group Group several fields into one, e.g. if `group` is set to `option`,
 * this object `{ option1: 1, options2: 2 }` will turn into `{ options: [1, 2] }`. 's' will be added automatically.
 * @param appendId Append '_id' to keys, e.g. `appendId: ['test']`, { test: 1 } => { test_id: 1 }.
 * @param rename Rename one key name to another.
 * @param valueOverrides Override value for a given key.
 */
export const convertToDbType = ({ optionsData, group, appendId, rename, valueOverrides, toArray }: ConvertDbTypeInput): Record<string, ValType> => {
  return optionsData.reduce<Record<string, ValType>>((acc, val) => {
    const [normKey, isGroup] = normalizeToDbKey(val.name, group, appendId, rename)
    const normValue = normalizeToDbValue(val)

    if (valueOverrides?.[val.name]) {
      acc[normKey] = valueOverrides[val.name]! // eslint-disable-line @typescript-eslint/no-non-null-assertion
      return acc
    }

    if (toArray && toArray.includes(val.name)) {
      acc[normKey] = [normValue as any]
      return acc
    }

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
  awardedRole(isRequired: boolean, option: SlashCommandRoleOption): SlashCommandRoleOption {
    return option.setName('awarded-role')
      .setDescription('Awarded role')
      .setRequired(isRequired)
  },
  votingThreshold(isRequired: boolean, option: SlashCommandIntegerOption): SlashCommandIntegerOption {
    return option.setName('voting-threshold')
      .setDescription('How many votes required to award the role')
      .setRequired(isRequired)
  },
  allowedToVoteRole(isRequired: boolean, option: SlashCommandRoleOption): SlashCommandRoleOption {
    return option.setName('allowed-to-vote-roles')
      .setDescription('If set, will allow only this role to vote')
      .setRequired(isRequired)
  },
  submissionType(isRequired: boolean, option: SlashCommandStringOption): SlashCommandStringOption {
    return option.setName('submission-types')
      .setDescription('Set or override allowed type to submit')
      .addChoice('Google Sheet', 'gsheet')
      .addChoice('Google Doc', 'gdoc')
      .addChoice('Tweet', 'tweet')
      .addChoice('YouTube video', 'ytvideo')
      .setRequired(isRequired)
  },
}

export const genLinkToDocPage = (channelId: string): string => `${config.baseUrl}/docs/${channelId}`
