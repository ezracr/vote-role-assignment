import { MessageEmbed, MessageEmbedOptions } from 'discord.js'

import { ChSettingsData } from '../db/dbTypes'
import { convertIdToUserTag, convertIdsToUserTags, convertIdsToRoleTags } from '../discUtils'
import config from '../config'
import { genLinkToDocPage } from './commands/commUtils'
import { stringifyTypes } from './submissionTypes'

type VotingMessageArg = {
  authorId: string;
  url: string;
  inFavor?: string[];
  against?: string[];
  inFavorApprovals?: string[];
  color?: string | number | null;
  chSettData: ChSettingsData;
  channelId: string;
}

type FromArg = { oldEmbed: MessageEmbed } & Pick<VotingMessageArg, 'inFavor' | 'against' | 'inFavorApprovals' | 'chSettData' | 'channelId'>

const replaceEmptyWithZeroWidthSpace = (txt?: string | null): string => (
  !txt || !txt.trim() ? '\u200b' : txt
)

const parseColor = (color: string | number): number => {
  if (typeof color === 'number') return color
  if (color.startsWith('#')) {
    return parseInt(color.slice(1), 16)
  }
  return parseInt(color, 16)
}

/**
 * A class that can generate a message with an author tag, title, link, and in favor and against voters.
 */
class VotingMessage {
  authorId: VotingMessageArg['authorId']
  url: VotingMessageArg['url']
  inFavor: NonNullable<VotingMessageArg['inFavor']>
  against: NonNullable<VotingMessageArg['against']>
  inFavorApprovals: VotingMessageArg['inFavorApprovals']
  color: number
  chSettData: ChSettingsData
  channelId: string

  constructor(arg: VotingMessageArg) {
    this.authorId = arg.authorId
    this.url = arg.url
    this.inFavor = arg.inFavor ?? []
    this.against = arg.against ?? []
    this.inFavorApprovals = arg.inFavorApprovals
    this.color = arg.color ? parseColor(arg.color) : 0xdfc600
    this.chSettData = arg.chSettData
    this.channelId = arg.channelId
  }

  private calcTotalVotes = (): string => (
    `${Math.max(this.inFavor.length - this.against.length, 0)}/${this.chSettData.voting_threshold ?? 0}`
  )

  toEmbed(): MessageEmbedOptions {
    const { allowed_to_vote_roles, submitter_roles, title, submission_types } = this.chSettData
    return {
      color: this.color,
      title: this.url,
      url: this.url,
      description: `by ${convertIdToUserTag(this.authorId)}`,
      fields: [
        {
          name: 'Voted in favor',
          value: replaceEmptyWithZeroWidthSpace(convertIdsToUserTags(this.inFavor)),
        },
        {
          name: 'Voted against',
          value: replaceEmptyWithZeroWidthSpace(convertIdsToUserTags(this.against)),
        },
        ...(this.inFavorApprovals ? [{
          name: 'Approved by',
          value: replaceEmptyWithZeroWidthSpace(convertIdsToUserTags(this.inFavorApprovals)),
        }] : []),
        // {
        //   name: '\u200b',
        //   value: '\u200b',
        //   inline: false,
        // },
        {
          name: 'Total votes',
          value: this.calcTotalVotes(),
          inline: true,
        },
        ...(((allowed_to_vote_roles?.length ?? 0) > 0) ? [{
          name: 'Voters',
          value: convertIdsToRoleTags(allowed_to_vote_roles!), // eslint-disable-line @typescript-eslint/no-non-null-assertion
          inline: true,
        }] : []),
        ...(((submitter_roles?.length ?? 0) > 0) ? [{
          name: 'Submitters',
          value: convertIdsToRoleTags(submitter_roles!), // eslint-disable-line @typescript-eslint/no-non-null-assertion
          inline: true,
        }] : []),
        ...(((submission_types?.length ?? 0) > 0) ? [{
          name: 'Submissions',
          value: stringifyTypes(submission_types),
          inline: true,
        }] : []),
        {
          name: 'Page',
          value: `[${title}](${genLinkToDocPage(this.channelId)})`,
          inline: true,
        },
      ],
      footer: config.messages.votingMessage.footer,
    }
  }

  /**
   * Create a new object by parsing the old message in a form of a string.
   * @param oldMessage The previous message.
   * @param inFavor 'in favor' array will override the one from the message string if specified.
   * @param against 'against' array will override the one from the message string if specified.
   */
  static fromEmbed({ oldEmbed, inFavor, against, inFavorApprovals, chSettData, channelId }: FromArg): VotingMessage | undefined {
    const usrIdLine = oldEmbed.description
    const url = oldEmbed.url
    if (url && usrIdLine) {
      const id = usrIdLine.slice(usrIdLine.indexOf('<') + 3, usrIdLine.indexOf('>'))
      return new VotingMessage({ authorId: id, url, inFavor, against, inFavorApprovals, color: oldEmbed.color, chSettData, channelId })
    }
  }
}

export default VotingMessage
