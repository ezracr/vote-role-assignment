import { MessageEmbed, MessageEmbedOptions } from 'discord.js'

import { convertIdToUserTag, convertIdsToUserTags } from '../discUtils'
import config from '../config'

type VotingMessageArg = {
  authorId: string;
  url: string;
  inFavor?: string[];
  against?: string[];
  inFavorApprovals?: string[];
  color?: string | number | null;
}

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
  color: number;

  constructor(arg: VotingMessageArg) {
    this.authorId = arg.authorId
    this.url = arg.url
    this.inFavor = arg.inFavor ?? []
    this.against = arg.against ?? []
    this.inFavorApprovals = arg.inFavorApprovals
    this.color = arg.color ? parseColor(arg.color) : 0xdfc600
  }

  toEmbed(): MessageEmbedOptions {
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
  static from({ oldEmbed, inFavor, against, inFavorApprovals }: { oldEmbed: MessageEmbed } & Pick<VotingMessageArg, 'inFavor' | 'against' | 'inFavorApprovals'>): VotingMessage | undefined {
    const usrIdLine = oldEmbed.description
    const url = oldEmbed.url
    if (url && usrIdLine) {
      const id = usrIdLine.slice(usrIdLine.indexOf('<') + 3, usrIdLine.indexOf('>'))
      return new VotingMessage({ authorId: id, url, inFavor, against, inFavorApprovals, color: oldEmbed.color })
    }
  }
}

export default VotingMessage
