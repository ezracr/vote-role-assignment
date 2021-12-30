import pool from '../pool'

import { Vote } from '../dbTypes'

class Votes {
  async insert(data: Pick<Vote, 'message_id' | 'user_id' | 'user_tag'>): Promise<Vote | undefined> {
    const { rows } = await pool.query<Vote>(`
      INSERT INTO "votes" ("message_id", "user_id", "user_tag") VALUES ($1, $2, $3)
      ON CONFLICT DO NOTHING
      RETURNING *
    `, [data.message_id, data.user_id, data.user_tag])

    return rows[0]
  }

  async updateUserTag(input: Pick<Vote, 'message_id' | 'user_id' | 'user_tag'>): Promise<Vote | undefined> {
    const { rows } = await pool.query<Vote>(`
      UPDATE "votes" SET "user_tag" = $1
      WHERE "user_id" = $2 AND "message_id" = $3
      RETURNING *
    `, [input.user_tag, input.user_id, input.message_id])

    return rows[0]
  }

  async getByUserMessageId({ user_id, message_id }: Pick<Vote, 'user_id' | 'message_id'>): Promise<Vote | undefined> {
    const { rows } = await pool.query<Vote>(`
      SELECT *
      FROM "votes" vs
      WHERE vs."user_id" = $1 AND vs."message_id" = $2
    `, [user_id, message_id])
    return rows[0]
  }

  async deleteByUserMessageId({ user_id, message_id }: Pick<Vote, 'user_id' | 'message_id'>): Promise<string | undefined> {
    const { rows } = await pool.query<Pick<Vote, 'id'>>(`
      DELETE FROM "votes" vs WHERE vs."user_id" = $1 AND vs."message_id" = $2 RETURNING "id"
    `, [user_id, message_id])
    return rows[0]?.id
  }
}

export default Votes
