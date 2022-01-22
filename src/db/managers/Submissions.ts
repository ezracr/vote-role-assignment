import { PoolClient } from 'pg'

import pool from '../pool'
import { Submission, ChSetting } from '../dbTypes'
import Users from './Users'
import { helpers } from './manUtils'

type MessageIdReq = { message_id: NonNullable<Submission['message_id']> }

type InsertInput = Pick<Submission, 'user' | 'link' | 'title' | 'submission_type' | 'is_candidate'> & MessageIdReq & { channel_id: ChSetting['channel_id'] }
type InsertOuput = Submission & { old_message_id: string | undefined }

class Submissions {
  users = new Users()

  async upsert(data: InsertInput): Promise<InsertOuput | undefined> {
    const user = await this.users.upsert(data.user)

    const { rows: [doc] } = await pool.query<InsertOuput>(`
      INSERT INTO documents ("user_id", "link", "title", "submission_type", "is_candidate", "message_id", "ch_sett_id")
      VALUES ($1, $2, $4, $5, $6, $7, (SELECT css."id" FROM channel_settings css WHERE css."channel_id" = $3))
      ON CONFLICT ("link")
        DO UPDATE SET "is_candidate" = EXCLUDED."is_candidate", "title" = EXCLUDED."title", "message_id" = EXCLUDED."message_id"
      RETURNING *, (SELECT ds1."message_id" FROM documents ds1 WHERE ds1."link" = $2) "old_message_id"
    `, [data.user.id, data.link, data.channel_id, data.title, data.submission_type, data.is_candidate, data.message_id])

    if (doc && user) {
      doc.user = user
      return doc
    }
  }

  async patchByMsgId(messageId: string, payload: Partial<Omit<Submission, 'message_id'>>): Promise<Submission | undefined> {
    const setSt = helpers.sets(payload)
    const { rows: [row] } = await pool.query<Submission>(`
      UPDATE documents ds SET ${setSt}
      WHERE ds."message_id" = $1
      RETURNING *
    `, [messageId])
    return row
  }

  async updateManyChSettIdByChId(oldChId: string, newChSettId: string, client?: PoolClient): Promise<Submission[] | undefined> {
    const { rows } = await (client ?? pool).query<Submission>(`
      UPDATE documents ds SET "ch_sett_id" = $2
      WHERE ds."ch_sett_id" = (SELECT cs1."id" FROM channel_settings cs1 WHERE "channel_id" = $1)
      RETURNING *
    `, [oldChId, newChSettId])
    return rows
  }

  async getNumOfDocsPerChannel(input: { channel_id: ChSetting['channel_id'] } & Pick<Submission, 'is_candidate'>): Promise<{ total: number } | undefined> {
    const { rows: [row] } = await pool.query<{ total: number }>(`
      SELECT count(*) total
      FROM documents_full ds
      WHERE ds."ch_settings"->>'channel_id' = $1 AND ds."is_candidate" = $2
    `, [input.channel_id, input.is_candidate])
    return row
  }

  async getNumOfDocsPerUserId(input: { user_id: ChSetting['channel_id'] } & Pick<Submission, 'is_candidate'>): Promise<{ total: number } | undefined> {
    const { rows: [row] } = await pool.query<{ total: number }>(`
      SELECT count(*) total
      FROM documents_full ds
      WHERE ds."user_id" = $1 AND ds."is_candidate" = $2
    `, [input.user_id, input.is_candidate])
    return row
  }

  async getByChannelId(input: Pick<Submission, 'is_candidate'> & { channel_id: ChSetting['channel_id'] }): Promise<Submission[] | undefined> {
    const { rows } = await pool.query<Submission>(`
      SELECT *
      FROM documents_full ds
      WHERE ds."ch_settings"->>'channel_id' = $1 AND ds."is_candidate" = $2
      ORDER BY ds."created" DESC, ds."id"
    `, [input.channel_id, input.is_candidate])
    return rows
  }

  async deleteByMessageId({ message_id }: MessageIdReq): Promise<string | undefined> {
    const { rows: [row] } = await pool.query<Pick<Submission, 'id'>>(`
      DELETE FROM documents ds WHERE ds."message_id" = $1 RETURNING "id"
    `, [message_id])
    return row?.id
  }
}

export default Submissions
