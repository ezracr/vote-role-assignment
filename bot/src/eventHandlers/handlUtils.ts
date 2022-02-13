import fs from 'fs/promises'
import path from 'path'
import { Message, MessageAttachment, MessageButton, PartialMessage } from 'discord.js'
import axios from 'axios'
import sharpPhash from 'sharp-phash'

import { ChSettingsData, SubmissionType } from '../db/dbTypes'
import config from '../config'

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

export const isDismissible = (chSettData: ChSettingsData): boolean => (
  (chSettData.approver_roles?.length ?? 0) > 0 || (chSettData.approver_users?.length ?? 0) > 0
)

export const isApprovable = (chSettData: ChSettingsData): boolean => (
  isDismissible(chSettData) && (chSettData.approval_threshold ?? 0) > 0
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

type TitleDesc = { title?: string, description?: string }

export const extractTitleDescFromFirstMsgEmbed = (msg: Message<boolean> | PartialMessage | null): TitleDesc => ({
  title: msg?.embeds[0]?.title ?? undefined,
  description: msg?.embeds[0]?.description ?? undefined,
})

/**
 * Fetches the title from embeds
 * Embeds are not available for published Google Docs and Sheets
 */
export const fetchSubmTitleDesc = async (msg: Message<boolean> | null, url: string, type?: SubmissionType): Promise<TitleDesc> => {
  try {
    if (type === 'audio') return {}
    const titleDesc = extractTitleDescFromFirstMsgEmbed(msg)
    if (titleDesc.title) {
      return titleDesc
    }
    if ((type === 'gsheet' || type === 'gdoc') && url.includes('/e/')) {
      if (msg) {
        const res = await axios.get(url, { timeout: 1000 })
        if (typeof res.data === 'string') {
          const matched = res.data.match(/<title>([^<]*)<\/title>/i)
          return { title: normTitle(type, matched?.[1]) ?? undefined }
        }
      }
    }
  } catch (e: unknown) {
    console.log(e) // eslint-disable-line no-console
  }
  return {}
}

type ProcessImageOut = {
  fileName: string;
  hash: string;
  buffer: Buffer;
}

export const processImage = async (attachment: MessageAttachment): Promise<ProcessImageOut> => {
  const request = await axios.get<Buffer>(attachment.url, { responseType: 'arraybuffer' })
  const hash = await sharpPhash(request.data)
  const fileName = `${attachment.id}-${attachment.name}`.toLowerCase()
  await fs.writeFile(path.join(config.uploadsDirPath, fileName), request.data, { encoding: 'binary' })

  return { fileName, hash, buffer: request.data }
}
