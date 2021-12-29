import type { CommandInteractionOption, CacheType } from 'discord.js'
import bld = require('@discordjs/builders')

const normalizeToDbKey = (name: string): string => name.replaceAll('-', '_')

const normalizeToDbValue = (val: CommandInteractionOption<CacheType>): string | number | boolean | undefined => {
  if (val.type === 'ROLE') {
    return val.role!.id // eslint-disable-line @typescript-eslint/no-non-null-assertion
  }
  return val.value
}

type GroupType = { fromKeys: string[]; toKey: string; }[]

type ConvertDbTypeInput = {
  optionsData: readonly CommandInteractionOption<CacheType>[];
  group?: GroupType;
}

const normalizeToDbGroup = (group?: GroupType): Record<string, string> => {
  if (group) {
    return group.reduce<Record<string, string>>((acc, val) => {
      val.fromKeys.forEach((fromKey) => {
        acc[fromKey] = val.toKey
      })
      return acc
    }, {})
  }
  return {}
}

type ValType = string | number | true | (string | number | true)[]

export const convertToDbType = ({ optionsData, group }: ConvertDbTypeInput): Record<string, ValType> => {
  const normGroup = normalizeToDbGroup(group)
  return optionsData.reduce<Record<string, ValType>>((acc, val) => {
    const groupKey = normGroup[val.name]
    const normValue = normalizeToDbValue(val)
    if (groupKey) {
      if (!acc[groupKey]) acc[groupKey] = []
      if (normValue) {
        const arr = acc[groupKey]
        if (Array.isArray(arr)) {
          arr.push(normValue)
        }
      }
      return acc
    }
    const normKey = normalizeToDbKey(val.name)
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
