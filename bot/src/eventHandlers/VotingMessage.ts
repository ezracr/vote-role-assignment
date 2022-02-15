import { MessageEmbed, MessageEmbedOptions } from 'discord.js'
import { APIEmbed } from 'discord-api-types'

import { ChSettingsData, Submission } from '../db/dbTypes'
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
  title?: string | null;
  similar?: Submission[] | string;
  image?: MessageEmbedOptions['thumbnail'] | null;
  isRejected?: boolean;
}

type FromArg = { oldEmbed: MessageEmbed | APIEmbed } & VotingMessageArg

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
  title: VotingMessageArg['title']
  similar?: Submission[] | string
  image?: MessageEmbedOptions['thumbnail'] | null
  isRejected?: boolean

  constructor(arg: VotingMessageArg) {
    this.authorId = arg.authorId
    this.url = arg.url
    this.inFavor = arg.inFavor ?? []
    this.against = arg.against ?? []
    this.inFavorApprovals = arg.inFavorApprovals
    this.color = arg.color ? parseColor(arg.color) : 0xdfc600
    this.chSettData = arg.chSettData
    this.channelId = arg.channelId
    this.title = arg.title
    this.similar = arg.similar
    this.image = arg.image
    this.isRejected = arg.isRejected
  }

  private calcTotalVotes = (): string => (
    `${Math.max(this.inFavor.length - this.against.length, 0)}/${this.chSettData.voting_threshold ?? 0}`
  )

  toEmbed(): MessageEmbedOptions {
    const { allowed_to_vote_roles, submitter_roles, title, submission_types } = this.chSettData
    return {
      color: this.color,
      title: this.image ? undefined : this.title ?? this.url,
      url: this.image ? undefined : this.url,
      description: `by ${convertIdToUserTag(this.authorId)}`,
      ...(this.image ? { thumbnail: this.image } : {}),
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
          value: this.isRejected ? 'Rejected' : this.calcTotalVotes(),
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
        ...(this.similar && this.similar.length > 0 ? [{
          name: 'Similar entries from',
          value: Array.isArray(this.similar)
            ? this.similar.map((subm) => `[${subm.user.tag}](${config.baseUrl}${config.uploadsUrl}/${subm.link})`).join(', ')
            : this.similar,
        }] : []),
      ],
      footer: config.messages.votingMessage.footer,
    }
  }

  /**
   * Create a new object by parsing the old message in a form of a string.
   * @param oldEmbed The previous embed.
   */
  static fromEmbed({ oldEmbed, ...inputArg }: FromArg): VotingMessage {
    const similar = oldEmbed.fields?.find(({ name }) => name === 'Similar entries from')?.value
    const image = oldEmbed.thumbnail
    return new VotingMessage({ ...inputArg, similar, image })
  }
}

export default VotingMessage
