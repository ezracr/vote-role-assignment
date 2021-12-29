import { PoolClient } from 'pg'

import { Document } from '../dbTypes'

class Documents {
  public constructor(private db: PoolClient) { } // eslint-disable-line @typescript-eslint/no-parameter-properties

  async insert(data: Pick<Document, 'author_id' | 'author_tag' | 'link' | 'ch_sett_id'>): Promise<Document | undefined> {
    const { rows } = await this.db.query<Document>(`
      INSERT INTO "documents" ("author_id", "author_tag", "link", "ch_sett_id") VALUES ($1, $2, $3, $4)
      ON CONFLICT DO NOTHING
      RETURNING *
    `, [data.author_id, data.author_tag, data.link, data.ch_sett_id])

    return rows[0]
  }
}

export default Documents
