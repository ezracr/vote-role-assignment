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

const genMention = (user: dsc.User): string => `<@${user.id}>`

const genInFavorMessage = (inFavor = ''): string => `**Voted in favor**: ${inFavor}\n`
const genAgainstMessage = (against = ''): string => `**Voted against**: ${against}\n`

const genVotersString = (voters: string[]): string => voters.join(', ')

export const updateMessageContent = (oldMessage: string[], inFavor: string[] = [], against: string[] = []): string => (
  `${oldMessage[0]}\n${oldMessage[1]}\n${genInFavorMessage(genVotersString(inFavor))}${genAgainstMessage(genVotersString(against))}`
)

export const genMessageContent = (user: dsc.User, url: string): string => (
  `**Author**: ${genMention(user)}.
**Link**: ${url}.
${genInFavorMessage()}${genAgainstMessage()}
`
)
