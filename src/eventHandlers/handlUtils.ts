import { Message, MessageButton, PartialMessage } from 'discord.js'
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

export const extractTitleFromFirstMsgEmbed = (msg: Message<boolean> | PartialMessage | null): string | null => (
  msg?.embeds[0]?.title ?? null
)

/**
 * Fetches the title from embeds
 * Embeds are not available for published Google Docs and Sheets
 */
export const fetchSubmTitle = async (msg: Message<boolean> | null, url: string, type?: SubmissionType): Promise<string | null> => {
  try {
    const title = extractTitleFromFirstMsgEmbed(msg)
    if (title) {
      return title
    }
    if ((type === 'gsheet' || type === 'gdoc') && url.includes('/e/')) {
      if (msg) {
        const res = await axios.get(url, { timeout: 1000 })
        if (typeof res.data === 'string') {
          const matched = res.data.match(/<title>([^<]*)<\/title>/i)
          return normTitle(type, matched?.[1])
        }
      }
    }
  } catch (e: unknown) {
    console.log(e)
  }
  return null
}
