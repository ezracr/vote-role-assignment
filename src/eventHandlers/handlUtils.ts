import { Message, MessageButton } from 'discord.js'
import axios from 'axios'

export const genLikeButton = (count = 0): MessageButton => new MessageButton({
  style: 'SECONDARY',
  customId: 'like',
  label: String(count),
  emoji: '✅',
})

export const genDislikeButton = (count = 0): MessageButton => new MessageButton({
  style: 'SECONDARY',
  customId: 'dislike',
  label: String(count),
  emoji: '❌',
})

export const genButton = (id: 'like' | 'dislike', count: number): MessageButton => id === 'like' ? genLikeButton(count) : genDislikeButton(count)

/**
 * Non published documents (File->Publish to the web) will have '- Google Docs/Sheets' attached in <title>.
 */
const normTitle = (title?: string): string => {
  if (title?.includes('- Google')) {
    return title.slice(0, title.lastIndexOf('-') - 1).trim()
  }
  return title ?? ''
}

/**
 * Fetches the title from embeds when possible (not be possible in `MessageCreateHandler`,
 * unless something like a 3 seconds timeout is added which is unreliable.)
 * If the embeds are empty, then proceeds to fetch the page and parse the `<title>` tag.
 */
export const fetchDocsTitle = async (msg: Message<boolean>, url: string): Promise<string> => {
  const msgLoaded = await msg.channel.messages.fetch(msg.id)
  if (msgLoaded.embeds[0]?.title) {
    return msgLoaded.embeds[0].title
  }
  const res = await axios.get(url, { timeout: 1000 })
  if (typeof res.data === 'string') {
    const matched = res.data.match(/<title>([^<]*)<\/title>/i)
    return normTitle(matched?.[1])
  }
  return ''
}
