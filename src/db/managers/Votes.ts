import { PoolClient } from 'pg'

import pool from '../pool'
import { Vote } from '../dbTypes'
import Users from './Users'

type VoteCountsRes = {
  in_favor_count: number;
  against_count: number;
  in_favor: string[];
  against: string[];
}

class Votes {
  users = new Users()

  private async upsert(data: Pick<Vote, 'message_id' | 'user' | 'in_favor'>, client?: PoolClient): Promise<Vote | undefined> {
    const user = await this.users.upsert(data.user, client)

    const { rows: [vote] } = await (client ?? pool).query<Vote>(`
      INSERT INTO votes ("message_id", "user_id", "in_favor") VALUES ($1, $2, $3)
      ON CONFLICT ("message_id", "user_id") DO UPDATE SET "in_favor" = EXCLUDED."in_favor"
      RETURNING *
    `, [data.message_id, data.user.id, data.in_favor])

    if (vote && user) {
      vote.user = user
      return vote
    }
  }

  async processVote(data: Pick<Vote, 'message_id' | 'user' | 'in_favor'>): Promise<Vote | undefined> {
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      const { rows } = await client.query<Vote>(`
        SELECT * FROM votes WHERE "user_id" = $1 AND "message_id" = $2 FOR UPDATE
      `, [data.user.id, data.message_id])
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
        count(*) filter (where vs."in_favor") in_favor_count,
        count(*) filter (where vs."in_favor" IS FALSE) against_count,
        COALESCE((ARRAY_AGG(vs."user"->>'tag') filter (where "in_favor")), '{}') in_favor,
        COALESCE((ARRAY_AGG(vs."user"->>'tag') filter (where "in_favor" IS FALSE)), '{}') against
      FROM votes_full vs
      WHERE vs."message_id" = $1
      GROUP BY "message_id"
  `, [message_id])

    return rows[0]
  }

  private async deleteByUserMessageId({ user, message_id }: Pick<Vote, 'user' | 'message_id'>, client?: PoolClient): Promise<string | undefined> {
    const { rows } = await (client ?? pool).query<Pick<Vote, 'id'>>(`
      DELETE FROM votes vs WHERE vs."user_id" = $1 AND vs."message_id" = $2 RETURNING "id"
    `, [user.id, message_id])
    return rows[0]?.id
  }
}

export default Votes
