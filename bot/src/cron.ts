import cron from 'node-cron'

import Managers from './db/managers'
import client from './client'

export default function cleanup(): void {
  cron.schedule('0 0 * * *', async () => {
    try {
      const managers = new Managers()
      const subms = await managers.submissions.getMany({ is_candidate: true, olderThanDays: 30 })
      if (subms.length > 0) {
        await Promise.all(subms.map((subm) => (
          client.channels
            .fetch(subm.ch_settings.channel_id)
            .catch((e: unknown) => console.log('Failed to fetch a channel in cron', e)) // eslint-disable-line no-console
        )))

        const result = subms.map(async (subm) => {
          const channel = client.channels.cache.get(subm.ch_settings.channel_id)
          if (channel && 'messages' in channel && subm.message_id) {
            try {
              const msg = await channel.messages.fetch(subm.message_id)
              await msg.unpin()
            } catch (e: unknown) { } // eslint-disable-line no-empty
          }
        })
        await Promise.all(result)
        const ids = subms.map((subm) => subm.id)
        await managers.submissions.deleteByFilter({ ids })
      }
    } catch (e: unknown) {
      console.log(e) // eslint-disable-line no-console
    }
  })
}
