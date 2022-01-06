import pool from '../pool'

import { Document, ChSetting } from '../dbTypes'
import Users from './Users'

class Documents {
  users = new Users()

  async insert(data: Pick<Document, 'user' | 'link' | 'title'> & { channel_id: ChSetting['channel_id'] }): Promise<Document | undefined> {
    const user = await this.users.upsert(data.user)

    const { rows: [doc] } = await pool.query<Document>(`
      INSERT INTO documents ("user_id", "link", "title", "ch_sett_id")
      VALUES ($1, $2, $4, (SELECT css."id" FROM channel_settings css WHERE css."channel_id" = $3))
      ON CONFLICT DO NOTHING
      RETURNING *
    `, [data.user.id, data.link, data.channel_id, data.title])

    if (doc && user) { // eslint-disable-line @typescript-eslint/no-unnecessary-condition
      doc.user = user
      return doc
    }
  }

  async getNumOfDocsPerChannel(chId: string): Promise<{ total: number } | undefined> {
    const { rows: [row] } = await pool.query<{ total: number }>(`
      SELECT count(*) total
      FROM documents_full ds
      WHERE ds."ch_settings"->>'channel_id' = $1
    `, [chId])
    return row
  }

  async getByChannelId(chId: string): Promise<Document[] | undefined> {
    const { rows } = await pool.query<Document>(`
      SELECT *
      FROM documents_full ds
      WHERE ds."ch_settings"->>'channel_id' = $1
      ORDER BY ds."created" DESC
    `, [chId])
    return rows
  }
}

export default Documents
