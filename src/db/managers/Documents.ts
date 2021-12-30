import pool from '../pool'

import { Document } from '../dbTypes'

class Documents {
  async insert(data: Pick<Document, 'author_id' | 'author_tag' | 'link' | 'ch_sett_id'>): Promise<Document | undefined> {
    const { rows } = await pool.query<Document>(`
      INSERT INTO "documents" ("author_id", "author_tag", "link", "ch_sett_id") VALUES ($1, $2, $3, $4)
      ON CONFLICT DO NOTHING
      RETURNING *
    `, [data.author_id, data.author_tag, data.link, data.ch_sett_id])

    return rows[0]
  }

  async getBySettingsId(id: string): Promise<Document[] | undefined> {
    const { rows } = await pool.query<Document>(`
      SELECT *
      FROM "documents" ds
      WHERE ds."ch_sett_id" = $1
      ORDER BY created DESC
    `, [id])
    return rows
  }
}

export default Documents
