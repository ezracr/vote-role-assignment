import pool from '../pool'

import { Document } from '../dbTypes'
import Users from './Users'

class Documents {
  users = new Users()

  async insert(data: Pick<Document, 'user' | 'link' | 'ch_sett_id'>): Promise<Document | undefined> {
    const user = await this.users.upsert(data.user)

    const { rows: [doc] } = await pool.query<Document>(`
      INSERT INTO documents ("user_id", "link", "ch_sett_id") VALUES ($1, $2, $3)
      ON CONFLICT DO NOTHING
      RETURNING *
    `, [data.user.id, data.link, data.ch_sett_id])

    if (doc && user) { // eslint-disable-line @typescript-eslint/no-unnecessary-condition
      doc.user = user
      return doc
    }
  }

  async getBySettingsId(id: string): Promise<Document[] | undefined> {
    const { rows } = await pool.query<Document>(`
      SELECT *
      FROM documents ds
      WHERE ds."ch_sett_id" = $1
      ORDER BY ds."created" DESC
    `, [id])
    return rows
  }
}

export default Documents
