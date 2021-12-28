import type { CommandInteractionOption, CacheType } from 'discord.js'

const normalizeKey = (name: string): string => name.replaceAll('-', '_')

const normalizeValue = (val: CommandInteractionOption<CacheType>): string | number | boolean | undefined => {
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

const normalizeGroup = (group?: GroupType): Record<string, string> => {
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
  const normGroup = normalizeGroup(group)
  return optionsData.reduce<Record<string, ValType>>((acc, val) => {
    const groupKey = normGroup[val.name]
    const normValue = normalizeValue(val)
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
    const normKey = normalizeKey(val.name)
    if (normValue) {
      acc[normKey] = normValue
    }
    return acc
  }, {})
}
