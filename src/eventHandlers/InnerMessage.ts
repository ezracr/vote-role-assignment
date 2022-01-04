import { convertIdToUserTag } from './handlUtils'

type InnerMessageArg = {
  authorId: string;
  url: string;
  title: string;
  inFavor?: string[];
  against?: string[];
}

const genInFavorMessage = (inFavor = ''): string => `**Voted in favor**: ${inFavor}\n`
const genAgainstMessage = (against = ''): string => `**Voted against**: ${against}\n`
const genVotersString = (voters: string[]): string => voters.join(', ')

const findFirstSemicolonIndex = (txt: string) => txt.indexOf(':')

/**
 * A class that can generate a message with an author tag, title, link, and in favor and against voters.
 */
class InnerMessage {
  authorId: InnerMessageArg['authorId']
  url: InnerMessageArg['url']
  title: InnerMessageArg['title']
  inFavor: NonNullable<InnerMessageArg['inFavor']>
  against: NonNullable<InnerMessageArg['against']>

  constructor(arg: InnerMessageArg) {
    this.authorId = arg.authorId
    this.url = arg.url
    this.inFavor = arg.inFavor ?? []
    this.against = arg.against ?? []
    this.title = arg.title
  }

  toString(): string {
    return `**Author**: ${convertIdToUserTag(this.authorId)}.
**Title**: ${this.title}.
**Link**: ${this.url}.
${genInFavorMessage(genVotersString(this.inFavor))}${genAgainstMessage(genVotersString(this.against))}`
  }

  /**
   * Create an `InnerMessage` object by parsing the old message in a form of a string.
   * @param oldMessage The previous message.
   * @param inFavor 'in favor' array will override the one from the message string if specified.
   * @param against 'against' array will override the one from the message string if specified.
   */
  static from({ oldMessage, inFavor, against }: { oldMessage: string } & Pick<InnerMessageArg, 'inFavor' | 'against'>) {
    const msgSplit = oldMessage.split('\n')
    const usrIdLine = msgSplit[0]
    const titleLine = msgSplit[1]
    const urlLine = msgSplit[2]
    if (usrIdLine && urlLine) {
      const id = usrIdLine.slice(usrIdLine.indexOf('<') + 3, usrIdLine.indexOf('>'))
      const url = urlLine.slice(findFirstSemicolonIndex(urlLine) + 2, urlLine.length - 1)
      const title = titleLine.slice(findFirstSemicolonIndex(titleLine) + 2, titleLine.length - 1)
      return new InnerMessage({ authorId: id, url, inFavor, against, title })
    }
  }
}

export default InnerMessage
