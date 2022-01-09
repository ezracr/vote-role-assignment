import { convertIdToUserTag } from '../discUtils'

type InnerMessageArg = {
  authorId: string;
  url: string;
  inFavor?: string[];
  against?: string[];
}

const genInFavorMessage = (inFavor = ''): string => `**Voted in favor**: ${inFavor}\n`
const genAgainstMessage = (against = ''): string => `**Voted against**: ${against}\n`
const genVotersString = (voters: string[]): string => voters.join(', ')

const findFirstSemicolonIndex = (txt: string): number => txt.indexOf(':')

/**
 * A class that can generate a message with an author tag, title, link, and in favor and against voters.
 */
class InnerMessage {
  authorId: InnerMessageArg['authorId']
  url: InnerMessageArg['url']
  inFavor: NonNullable<InnerMessageArg['inFavor']>
  against: NonNullable<InnerMessageArg['against']>

  constructor(arg: InnerMessageArg) {
    this.authorId = arg.authorId
    this.url = arg.url
    this.inFavor = arg.inFavor ?? []
    this.against = arg.against ?? []
  }

  toString(): string {
    return `**Author**: ${convertIdToUserTag(this.authorId)}.
**Link**: ${this.url}.
${genInFavorMessage(genVotersString(this.inFavor))}${genAgainstMessage(genVotersString(this.against))}`
  }

  /**
   * Create an `InnerMessage` object by parsing the old message in a form of a string.
   * @param oldMessage The previous message.
   * @param inFavor 'in favor' array will override the one from the message string if specified.
   * @param against 'against' array will override the one from the message string if specified.
   */
  static from({ oldMessage, inFavor, against }: { oldMessage: string } & Pick<InnerMessageArg, 'inFavor' | 'against'>): InnerMessage | undefined  {
    const msgSplit = oldMessage.split('\n')
    const usrIdLine = msgSplit[0]
    const urlLine = msgSplit[1]
    if (usrIdLine && urlLine) {
      const id = usrIdLine.slice(usrIdLine.indexOf('<') + 3, usrIdLine.indexOf('>'))
      const url = urlLine.slice(findFirstSemicolonIndex(urlLine) + 2, urlLine.length - 1)
      return new InnerMessage({ authorId: id, url, inFavor, against })
    }
  }
}

export default InnerMessage
