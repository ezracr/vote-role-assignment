import { PoolClient } from 'pg'
import pool from '../pool'

import { Vote } from '../dbTypes'

type VoteCountsRes = {
  in_favor_count: number;
  against_count: number;
  in_favor: string[];
  against: string[];
}

class Votes {
  private async upsert(data: Pick<Vote, 'message_id' | 'user_id' | 'user_tag' | 'in_favor'>, client?: PoolClient): Promise<Vote | undefined> {
    const { rows } = await (client ?? pool).query<Vote>(`
      INSERT INTO "votes" ("message_id", "user_id", "user_tag", "in_favor") VALUES ($1, $2, $3, $4)
      ON CONFLICT ("message_id", "user_id") DO UPDATE SET "user_tag" = EXCLUDED."user_tag", "in_favor" = EXCLUDED."in_favor"
      RETURNING *
    `, [data.message_id, data.user_id, data.user_tag, data.in_favor])

    return rows[0]
  }

  async processVote(data: Pick<Vote, 'message_id' | 'user_id' | 'user_tag' | 'in_favor'>): Promise<Vote | undefined> {
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      const { rows } = await client.query<Vote>(`
        SELECT * FROM "votes" WHERE "user_id" = $1 AND "message_id" = $2 FOR UPDATE
      `, [data.user_id, data.message_id])
      let res: Vote | undefined
      if (!rows[0] || (rows[0] && rows[0].in_favor !== data.in_favor)) {
        res = await this.upsert(data, client)
      } else {
        await this.deleteByUserMessageId(data, client)
      }
      await client.query('COMMIT')
      return res
    } catch (e: unknown) {
      console.log(e)
      await client.query('ROLLBACK')
    } finally {
      client.release()
    }
  }

  async getVoteCountsByMessageId(message_id: Vote['message_id']): Promise<VoteCountsRes | undefined> {
    const { rows } = await pool.query<VoteCountsRes>(`
      SELECT
        count(*) filter (where "in_favor") in_favor_count,
        count(*) filter (where "in_favor" IS FALSE) against_count,
        COALESCE((ARRAY_AGG("user_tag") filter (where "in_favor")), '{}') in_favor,
        COALESCE((ARRAY_AGG("user_tag") filter (where "in_favor" IS FALSE)), '{}') against
      FROM "votes" vs
      WHERE vs."message_id" = $1
      GROUP BY "message_id"
  `, [message_id])

    return rows[0]
  }

  // async getByUserMessageId({ user_id, message_id }: Pick<Vote, 'user_id' | 'message_id'>): Promise<Vote | undefined> {
  //   const { rows } = await pool.query<Vote>(`
  //     SELECT *
  //     FROM "votes" vs
  //     WHERE vs."user_id" = $1 AND vs."message_id" = $2
  //   `, [user_id, message_id])
  //   return rows[0]
  // }

  private async deleteByUserMessageId({ user_id, message_id }: Pick<Vote, 'user_id' | 'message_id'>, client?: PoolClient): Promise<string | undefined> {
    const { rows } = await (client ?? pool).query<Pick<Vote, 'id'>>(`
      DELETE FROM "votes" vs WHERE vs."user_id" = $1 AND vs."message_id" = $2 RETURNING "id"
    `, [user_id, message_id])
    return rows[0]?.id
  }
}

export default Votes
