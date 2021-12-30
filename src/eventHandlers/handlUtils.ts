import dsc = require('discord.js')

export const genLikeButton = (count = 0): dsc.MessageButton => new dsc.MessageButton({
  style: 'SECONDARY',
  customId: 'like',
  label: String(count),
  emoji: '✅',
})

export const genDislikeButton = (count = 0): dsc.MessageButton => new dsc.MessageButton({
  style: 'SECONDARY',
  customId: 'dislike',
  label: String(count),
  emoji: '❌',
})

export const genButton = (id: 'like' | 'dislike', count: number): dsc.MessageButton => id === 'like' ? genLikeButton(count) : genDislikeButton(count)

const genInFavorMessage = (inFavor = ''): string => `**Voted in favor**: ${inFavor}\n`
const genAgainstMessage = (against = ''): string => `**Voted against**: ${against}\n`

const genVotersString = (voters: string[]): string => voters.join(', ')

const extractVoters = (line: string): Array<string> => line
  .slice(line.indexOf(':') + 1)
  .split(',')
  .map((val) => val.trim())
  .filter((val) => val !== '')

export class InnerMessage {
  constructor(public authorId: string, public url: string, public inFavor: string[] = [], public against: string[] = []) { } // eslint-disable-line @typescript-eslint/no-parameter-properties

  toString(): string {
    return `**Author**: <@${this.authorId}>.
**Link**: ${this.url}.
${genInFavorMessage(genVotersString(this.inFavor))}${genAgainstMessage(genVotersString(this.against))}`
  }

  static from(message: string) {
    const msgSplit = message.split('\n')
    const usrIdLine = msgSplit[0]
    const urlLine = msgSplit[1]
    const inFavorLine = msgSplit[2]
    const againstLine = msgSplit[3]
    if (usrIdLine && urlLine && inFavorLine && againstLine) {
      const id = usrIdLine.slice(usrIdLine.indexOf('<') + 2, usrIdLine.indexOf('>'))
      const url = urlLine.slice(10, urlLine.length - 1)
      const inFavor = extractVoters(inFavorLine)
      const against = extractVoters(againstLine)
      return new InnerMessage(id, url, inFavor, against)
    }
  }
}
