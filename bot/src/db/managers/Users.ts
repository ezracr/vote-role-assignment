import { PoolClient } from 'pg'
import pool from '../pool'

import { User } from '../dbTypes'

class Users {
  async upsert(data: Pick<User, 'id' | 'tag'>, client?: PoolClient): Promise<User | undefined> {
    const { rows } = await (client ?? pool).query<User>(`
      INSERT INTO users ("id", "tag") VALUES ($1, $2)
      ON CONFLICT ("id") DO UPDATE SET "tag" = EXCLUDED."tag"
      RETURNING *
    `, [data.id, data.tag])

    return rows[0]
  }
}

export default Users
