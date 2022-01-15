import { Message, MessageButton } from 'discord.js'
import axios from 'axios'

import { ChSettingsData, SubmissionType } from '../db/dbTypes'

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

export const genApproveButton = (totalCount = 0, count = 0): MessageButton => new MessageButton({
  style: 'SECONDARY',
  customId: 'approve',
  label: `Approve (${totalCount > 0 ? `${count}/${totalCount}` : count})`,
  // emoji: '🔥',
})

export const genDismissButton = (): MessageButton => new MessageButton({
  style: 'SECONDARY',
  customId: 'dismiss',
  label: `Dismiss`,
})

export const isApprovable = (chSettData: ChSettingsData): boolean => (
  (chSettData.approver_roles?.length ?? 0) > 0 || (chSettData.approver_users?.length ?? 0) > 0
)

/**
 * Non published documents (File->Publish to the web) will have '- Google Docs/Sheets' attached in <title>.
 */
const normTitle = (type: SubmissionType, title?: string): string | null => {
  if ((type === 'gdoc' || type === 'gsheet') && title?.includes('- Google')) {
    return title.slice(0, title.lastIndexOf('-') - 1).trim()
  }
  return title ?? null
}

/**
 * Fetches the title from embeds when possible (not be possible in `MessageCreateHandler`,
 * unless something like a 3 seconds timeout is added which is unreliable.)
 * If the embeds are empty, then proceeds to fetch the page and parse the `<title>` tag.
 */
export const fetchSubmTitle = async (msg: Message<boolean>, type: SubmissionType, url: string): Promise<string | null> => {
  if (type === 'tweet') return null
  if (type === 'gsheet' || type === 'gdoc') {
    const msgLoaded = await msg.channel.messages.fetch(msg.id)
    if (msgLoaded.embeds[0]?.title) {
      return msgLoaded.embeds[0].title
    }
    const res = await axios.get(url, { timeout: 1000 })
    if (typeof res.data === 'string') {
      const matched = res.data.match(/<title>([^<]*)<\/title>/i)
      return normTitle(type, matched?.[1])
    }
  }
  if (type === 'ytvideo') {
    const res = await axios.get(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}`, { timeout: 1000 })
    return res.data.title ?? null // eslint-disable-line @typescript-eslint/no-unsafe-member-access
  }
  return null
}
