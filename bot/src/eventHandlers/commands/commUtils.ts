import {
  SlashCommandIntegerOption, SlashCommandRoleOption, SlashCommandStringOption, SlashCommandUserOption,
} from '@discordjs/builders'
import type { CommandInteractionOption, CacheType } from 'discord.js'

import config from '../../config'
import { typeToTitleRecord } from '../submissionTypes'

export const replaceHyphensInKey = (name: string): string => name.replaceAll('-', '_')

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
 * Turns hyphens into underscores in object keys.
 *
 * @param optionsData Option's data from `interaction.options.data` or `interaction.options.data[ind].options` if it's a subcommand.
 * @param toArray Convert values of given keys to an array.
 */
export const convertToDbType = ({
  optionsData, toArray,
}: ConvertDbTypeInput): Record<string, ValType> => {
  return optionsData.reduce<Record<string, ValType>>((acc, val) => {
    const normKey = replaceHyphensInKey(val.name)
    const normValue = normalizeToDbValue(val)

    if (toArray?.includes(val.name)) {
      acc[normKey] = [normValue as any] // eslint-disable-line @typescript-eslint/no-explicit-any
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
      .setMinValue(1)
      .setRequired(isRequired)
  },
  votingAgainstThreshold(isRequired: boolean, option: SlashCommandIntegerOption): SlashCommandIntegerOption {
    return option.setName('voting-against-threshold')
      .setDescription('A number of downvotes required to reject a submission')
      .setRequired(isRequired)
  },
  allowedToVoteRole(isRequired: boolean, option: SlashCommandRoleOption): SlashCommandRoleOption {
    return option.setName('allowed-to-vote-roles')
      .setDescription('If set, will allow only this role to vote')
      .setRequired(isRequired)
  },
  submissionType(isRequired: boolean, option: SlashCommandStringOption): SlashCommandStringOption {
    const opt = option.setName('submission-types')
      .setDescription('Set or override allowed type to submit')
      .setRequired(isRequired);

    (Object.keys(typeToTitleRecord) as (keyof typeof typeToTitleRecord)[]).forEach((value) => {
      opt.addChoice(typeToTitleRecord[value], value)
    })
    return opt
  },
  approvalThreshold(isRequired: boolean, option: SlashCommandIntegerOption): SlashCommandIntegerOption {
    return option.setName('approval-threshold')
      .setDescription('How many approvals required to award the role')
      .setMinValue(1)
      .setRequired(isRequired)
  },
  allowedToApproveRoles(isRequired: boolean, option: SlashCommandRoleOption): SlashCommandRoleOption {
    return option.setName('approver-roles')
      .setDescription('If set, will allow only this role to approve/dismiss')
      .setRequired(isRequired)
  },
  allowedToApproveUsers(isRequired: boolean, option: SlashCommandUserOption): SlashCommandUserOption {
    return option.setName('approver-users')
      .setDescription('If set, will allow only users picked to approve/dismiss')
      .setRequired(isRequired)
  },
  submissionThreshold(isRequired: boolean, option: SlashCommandIntegerOption): SlashCommandIntegerOption {
    return option.setName('submission-threshold')
      .setDescription('Number of submissions required to award the role')
      .setMinValue(1)
      .setRequired(isRequired)
  },
  messageColor(isRequired: boolean, option: SlashCommandStringOption): SlashCommandStringOption {
    return option.setName('message-color')
      .setDescription('The color of the message\'s border, e.g. dfc600')
      .setRequired(isRequired)
  },
  submitterRoles(isRequired: boolean, option: SlashCommandRoleOption): SlashCommandRoleOption {
    return option.setName('submitter-roles')
      .setDescription('If set, will allow only the roles specified to send submissions')
      .setRequired(isRequired)
  },
}

export const convertEnableToDbType = (optionsData: readonly CommandInteractionOption<CacheType>[]): Record<string, ValType> => (
  convertToDbType({
    optionsData,
    toArray: ['allowed-to-vote-roles', 'submission-types', 'approver-roles', 'approver-users', 'submitter-roles'],
  })
)

export const genLinkToDocPage = (channelId: string): string => `${config.baseUrl}/${channelId}`
