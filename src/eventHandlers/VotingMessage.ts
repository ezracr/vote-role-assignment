import { convertIdToUserTag } from '../discUtils'

type VotingMessageArg = {
  authorId: string;
  url: string;
  inFavor?: string[];
  against?: string[];
  inFavorApprovals?: string[];
}

const genInFavorMessage = (inFavor = ''): string => `**Voted in favor**: ${inFavor}`
const genInFavorApprovalsMessage = (inFavor = ''): string => `**Approved by**: ${inFavor}`
const genAgainstMessage = (against = ''): string => `**Voted against**: ${against}`
const genVotersString = (voters: string[]): string => voters.join(', ')

const findFirstSemicolonIndex = (txt: string): number => txt.indexOf(':')

/**
 * A class that can generate a message with an author tag, title, link, and in favor and against voters.
 */
class VotingMessage {
  authorId: VotingMessageArg['authorId']
  url: VotingMessageArg['url']
  inFavor: NonNullable<VotingMessageArg['inFavor']>
  against: NonNullable<VotingMessageArg['against']>
  inFavorApprovals: VotingMessageArg['inFavorApprovals']

  constructor(arg: VotingMessageArg) {
    this.authorId = arg.authorId
    this.url = arg.url
    this.inFavor = arg.inFavor ?? []
    this.against = arg.against ?? []
    this.inFavorApprovals = arg.inFavorApprovals
  }

  toString(): string {
    return `**Author**: ${convertIdToUserTag(this.authorId)}.
**Link**: ${this.url}.
${genInFavorMessage(genVotersString(this.inFavor))}
${genAgainstMessage(genVotersString(this.against))}
${this.inFavorApprovals ? genInFavorApprovalsMessage(genVotersString(this.inFavorApprovals)) : ''}
`
  }

  /**
   * Create a new object by parsing the old message in a form of a string.
   * @param oldMessage The previous message.
   * @param inFavor 'in favor' array will override the one from the message string if specified.
   * @param against 'against' array will override the one from the message string if specified.
   */
  static from({ oldMessage, inFavor, against, inFavorApprovals }: { oldMessage: string } & Pick<VotingMessageArg, 'inFavor' | 'against' | 'inFavorApprovals'>): VotingMessage | undefined {
    const msgSplit = oldMessage.split('\n')
    const usrIdLine = msgSplit[0]
    const urlLine = msgSplit[1]
    if (usrIdLine && urlLine) {
      const id = usrIdLine.slice(usrIdLine.indexOf('<') + 3, usrIdLine.indexOf('>'))
      const url = urlLine.slice(findFirstSemicolonIndex(urlLine) + 2, urlLine.length - 1)
      return new VotingMessage({ authorId: id, url, inFavor, against, inFavorApprovals })
    }
  }
}

export default VotingMessage
